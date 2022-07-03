/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ResponseDecoder } from '../../decoders/responseDecoder';
import { Data } from '../../interfaces/data';
import { DecodedResponseData, Decoder } from '../../interfaces/decoder';
import {
  ConnectOptions,
  Device,
  DeviceCallbacks,
  DeviceIdentificator,
  DeviceStatus,
} from '../../interfaces/device';
import { CommandDefinition } from '../../interfaces/protocol';
import { wait } from '../../utils';
import { JKBMS_COMMANDS, JKBMS_PROTOCOL } from './config';

export class JKBMS implements Device {
  protocol: typeof JKBMS_PROTOCOL;
  status!: DeviceStatus;
  deviceIdenticator: DeviceIdentificator | null;
  callbacks: DeviceCallbacks;
  lastPublicData: Data | null;
  decoder: Decoder<string>;
  responseBuffer!: Uint8Array;
  private characteristic: BluetoothRemoteGATTCharacteristic | null;

  constructor(callbacks: DeviceCallbacks) {
    this.protocol = JKBMS_PROTOCOL;
    this.callbacks = callbacks;
    this.setStatus('disconnected');
    this.deviceIdenticator = null;
    this.lastPublicData = null;
    this.decoder = new ResponseDecoder(this.protocol);

    this.characteristic = null;

    this.flushResponseBuffer();
  }

  private setStatus(newStatus: DeviceStatus): void {
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

      const service = await server?.getPrimaryService(
        this.protocol.serviceUuid
      );

      if (!service) {
        throw new Error(`Service ${this.protocol.serviceUuid} not found`);
      }

      const charateristic = await service?.getCharacteristic(
        this.protocol.characteristicUuid
      );

      if (!charateristic) {
        throw new Error(
          `Service ${this.protocol.characteristicUuid} not found`
        );
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
        }, this.protocol.connectPreviousTimeout);

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
          services: [this.protocol.serviceUuid],
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
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleNotification.bind(this)
      );

      await this.characteristic.startNotifications();
      await wait(200);
      await this.sendCommand(JKBMS_COMMANDS.GET_DEVICE_INFO);
      await this.sendCommand(JKBMS_COMMANDS.GET_CELL_DATA);
    } catch (error) {
      console.warn('disconnect');
      this.disconnect();
      this.callbacks.onError?.(error as Error);
    }
  }

  private async sendCommand(commandName: JKBMS_COMMANDS): Promise<void> {
    if (!this.characteristic) {
      throw new Error(
        `Device must be connected to send a ${commandName} command`
      );
    }

    const command = this.protocol.commands.find(
      ({ name }) => name === commandName
    )!;

    const timeout = setTimeout(() => {
      throw new Error(`Send command ${command} timeout`);
    }, command.timeout);

    const commandPayload = this.constructCommandPayload(command);
    console.log('send command', command, commandPayload);

    await this.characteristic.writeValueWithoutResponse(commandPayload.buffer);

    clearTimeout(timeout);

    await wait(command.wait);
  }

  private constructCommandPayload(
    command: Required<CommandDefinition>
  ): Uint8Array {
    const template = new Uint8Array(20);
    const commandBuffer = new Uint8Array([
      ...this.protocol.commandHeader,
      ...command.payload,
      ...template,
    ]).slice(0, template.length);

    const checksum = this.calculateChecksum(commandBuffer);

    console.assert(checksum <= 255);

    commandBuffer[commandBuffer.length - 1] = checksum;

    return commandBuffer;
  }

  private handleNotification(event: Event): void {
    console.log('handle notification', event);
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;

    if (!value) {
      return;
    }

    const valueArray = new Uint8Array(value.buffer);
    console.log(`received ${value.byteLength} bytes`);

    try {
      if (this.doesStartWithSegmentHeader(valueArray)) {
        this.responseBuffer = valueArray;
      } else {
        if (this.doesStartWithSegmentHeader(this.responseBuffer)) {
          this.responseBuffer = new Uint8Array([
            ...this.responseBuffer,
            ...valueArray,
          ]);
        } else {
          // throw new Error('Segment header must come first');
          return;
        }
      }

      const segmentType = this.getSegmentType(this.responseBuffer);

      if (!segmentType) {
        throw new Error('No segment type');
      }

      const expectedSegments = this.protocol.commands.map(
        (command) => command.responseSignature[0]
      );

      if (!expectedSegments.includes(segmentType)) {
        throw new Error(`segment type ${segmentType} not expected`);
      }

      const command = this.protocol.commands.find(
        (command) => command.responseSignature[0] === segmentType
      )!;

      if (this.isSegmentComplete(this.responseBuffer, command)) {
        if (!this.isChecksumCorrect(this.responseBuffer)) {
          // throw new Error('Checksum does not match');
        }

        try {
          const decodedData = this.decoder!.decode(
            command,
            this.responseBuffer
          );

          console.log(decodedData);

          this.handleDecodedData(decodedData);
        } catch (e) {
          throw new Error('Response data decode failed');
        }
      }
    } catch (e) {
      console.error(e);
      this.flushResponseBuffer();
      return;
    }
  }

  private doesStartWithSegmentHeader(segment: Uint8Array): boolean {
    return (
      segment.byteLength > this.protocol.segmentHeader.byteLength &&
      this.protocol.segmentHeader.every((value, i) => value === segment[i])
    );
  }

  private isSegmentComplete(
    segment: Uint8Array,
    command: CommandDefinition
  ): boolean {
    if (!this.doesStartWithSegmentHeader(segment)) {
      return false;
    }

    const commandResponseLength = command.response.reduce(
      (sum, dataItem) => (sum += dataItem[0]),
      0
    );

    if (segment.length === commandResponseLength) {
      return false;
    }

    return true;
  }

  private isChecksumCorrect(segment: Uint8Array): boolean {
    const checksum = segment.at(-1);

    const calculatedChecksum = this.calculateChecksum(segment.slice(0, -1));

    if (checksum === calculatedChecksum) {
      return true;
    }

    return false;
  }

  private getSegmentType(segment: Uint8Array): number | null {
    const segmentType = segment[this.protocol.segmentHeader.length];

    return segmentType ?? null;
  }

  private calculateChecksum(byteArray: Uint8Array): number {
    const sum = byteArray.reduce((acc, byte) => (acc += byte), 0);

    const checksum = sum & 0xff;

    return checksum;
  }

  private flushResponseBuffer(): void {
    console.log('flushed response buffer');
    this.responseBuffer = new Uint8Array([]);
  }

  private handleDecodedData(decodedData: DecodedResponseData): void {
    const timestamp = new Date().valueOf();
    const timeSinceLastOne = this.lastPublicData?.timestamp
      ? timestamp - this.lastPublicData.timestamp
      : null;

    const publicData: Data = {
      timestamp,
      timeSinceLastOne,
      checksumCorrect: true,
      deviceInfo: decodedData.deviceInfo,
      batteryData: decodedData.batteryData,
    };

    this.lastPublicData = publicData;

    console.log('public data', publicData);

    this.callbacks.onDataChange(publicData);
  }
}
