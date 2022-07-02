import { ResponseDecoder } from '../../decoders/responseDecoder';
import { HexString } from '../../interfaces';
import { Data } from '../../interfaces/data';
import { Decoder } from '../../interfaces/decoder';
import {
  ConnectOptions,
  Device,
  DeviceCallbacks,
  DeviceIdentificator,
  DeviceStatus,
} from '../../interfaces/device';
import { wait } from '../../utils';
import { bufferToHexString, hexStringToBuffer } from '../../utils/binary';
import {
  CHARACTERISTIC_UUID,
  JKBMS_COMMANDS,
  JKBMS_PROTOCOL,
  SERVICE_UUID,
  TIMEOUTS,
  WRITE_CHARACTERISTIC_DELAY,
} from './config';

export class JKBMS implements Device {
  status!: DeviceStatus;
  deviceIdenticator: DeviceIdentificator | null;
  callbacks: DeviceCallbacks;
  data: Data | null;
  decoder: Decoder<string> | null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null;
  private bluetoothDevice: BluetoothDevice | null;

  constructor(callbacks: DeviceCallbacks) {
    this.callbacks = callbacks;
    this.setStatus('disconnected');
    this.deviceIdenticator = null;
    this.data = null;
    this.decoder = new ResponseDecoder(JKBMS_PROTOCOL);

    this.characteristic = null;
    this.bluetoothDevice = null;
  }

  private async setStatus(newStatus: DeviceStatus) {
    this.status = newStatus;
    this.callbacks.onStatusChange?.(newStatus);
  }

  async connect(
    options: ConnectOptions = {}
  ): Promise<DeviceIdentificator | null> {
    this.setStatus('scanning');

    let device: BluetoothDevice | null = null;

    try {
      if (options?.previous) {
        const previousDevice = await this.tryGetPreviousDevice(
          options.previous
        );

        if (previousDevice) {
          device = previousDevice;
        } else {
          // We can't call requestBluetoothDevice without second user interaction.
          // https://developer.chrome.com/blog/user-activation/
          this.setStatus('disconnected');
          return null;
        }
      } else {
        const userSelectedDevice = await this.requestBluetoothDevice();

        device = userSelectedDevice;
      }
    } catch (error) {
      this.setStatus('disconnected');
      this.callbacks.onRequestDeviceError?.(error as Error);

      return null;
    }

    try {
      const server = await device.gatt?.connect();

      if (!server) {
        throw new Error(`Can't connect to GAAT Server`);
      }

      const service = await server?.getPrimaryService(SERVICE_UUID);

      if (!service) {
        throw new Error(`Service ${SERVICE_UUID} not found`);
      }

      const charateristic = await service?.getCharacteristic(
        CHARACTERISTIC_UUID
      );

      if (!charateristic) {
        throw new Error(`Service ${CHARACTERISTIC_UUID} not found`);
      }

      this.characteristic = charateristic;

      this.subscribeToDataNotifications();

      this.setStatus('connected');

      const deviceIdenticator: DeviceIdentificator = {
        id: device.id,
        name: device.name || device.id,
      };

      this.callbacks.onConnected?.(deviceIdenticator);

      return deviceIdenticator;
    } catch (error) {
      this.callbacks.onRequestDeviceError?.(error as Error);
      return null;
    }
  }

  async disconnect(): Promise<DeviceIdentificator | null> {
    if (this.status === 'disconnected') {
      throw new Error('Device already disconnected');
    }
    return this.deviceIdenticator;
  }

  async pause(): Promise<void> {
    //
  }

  private async tryGetPreviousDevice(
    deviceIdenticator: DeviceIdentificator
  ): Promise<BluetoothDevice | null> {
    const pairedDevicesForThisOrigin = await navigator.bluetooth.getDevices();
    const matchedDevice = pairedDevicesForThisOrigin?.find(
      (device) => device.id === deviceIdenticator.id
    );

    if (matchedDevice) {
      const abortController = new AbortController();

      // Wait for connection.
      await matchedDevice.watchAdvertisements({
        signal: abortController.signal,
      });

      const isMatchedDeviceInRange = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, TIMEOUTS.connectPreviousDevice);

        const advertisementReceivedCallback = () => {
          console.log('Previous in range');
          clearTimeout(timeout);
          resolve(true);
        };

        // FIXME: remove listener after first advertismenet
        matchedDevice.addEventListener(
          'advertisementreceived',
          advertisementReceivedCallback
        );
      });

      // unwatchAdvertisements hangs, use abort instead
      // matchedDevice.unwatchAdvertisements();
      abortController.abort();

      if (!isMatchedDeviceInRange) {
        this.callbacks.onPreviousUnaviable?.(matchedDevice);

        return null;
      }

      return matchedDevice;
    }

    this.callbacks.onPreviousUnaviable?.(null);

    return null;
  }

  private async requestBluetoothDevice(): Promise<BluetoothDevice> {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [SERVICE_UUID],
        },
      ],
    });

    return device;
  }

  private async subscribeToDataNotifications(): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Device must be connected to init and listen');
    }

    try {
      await this.characteristic.startNotifications();
      await wait(200);
      await this.sendBluetoothCommand('activate');
      await this.sendBluetoothCommand('getDeviceInfo');
      await this.sendBluetoothCommand('getCellData');

      let responseAcc = new Uint8Array();

      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        async (event) => {
          const value = (event.target as BluetoothRemoteGATTCharacteristic)
            .value;

          if (value) {
            console.log(
              `received ${value.byteLength} bytes`,
              `total: ${responseAcc.byteLength + value.byteLength}`,
              `header: ${bufferToHexString(value.buffer).slice(0, 12)}`
            );
            responseAcc = new Uint8Array([
              ...responseAcc,
              ...new Uint8Array(value.buffer),
            ]);
          }

          if (responseAcc.byteLength >= 300) {
            try {
              const data = this.decoder?.decode(
                'getCellData',
                responseAcc.buffer
              );
              if (data) {
                // @ts-ignore
                this.callbacks.onDataChange(data);
              }
            } catch (e) {
              //
            }

            responseAcc = new Uint8Array();
          }
        }
      );
    } catch (error) {
      console.warn('disconnect');
      this.disconnect();
      this.callbacks.onError?.(error as Error);
    }
  }

  private async sendBluetoothCommand(
    commandName: keyof typeof JKBMS_COMMANDS
  ): Promise<void> {
    if (!this.characteristic) {
      throw new Error(
        `Device must be connected to send a ${commandName} command`
      );
    }

    const command: HexString = JKBMS_COMMANDS[commandName];

    const payloadBuffer = hexStringToBuffer(command);

    const timeout = setTimeout(() => {
      throw new Error(`Send command ${command} timeout`);
    }, TIMEOUTS.writeCharacteristicValue);

    await this.characteristic.writeValueWithoutResponse(payloadBuffer);

    clearTimeout(timeout);

    await wait(WRITE_CHARACTERISTIC_DELAY);
  }
}
