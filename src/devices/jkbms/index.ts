/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DeepRequired } from 'ts-essentials';
import { ResponseDecoder } from 'decoders/responseDecoder';
import {
  DeviceInfoData,
  InternalData,
  INTERNAL_KEYS,
  LiveData,
  ResponseDataTypeRecord,
  ResponseDataTypes,
} from 'interfaces/data';
import { DecodedResponseData } from 'interfaces/decoder';
import {
  ConnectOptions,
  Device,
  DeviceCallbacks,
  DeviceIdentificator,
  DeviceStatus,
  DisconnectReasons,
} from 'interfaces/device';
import { CommandDefinition, ProtocolSpecification, ResponseDefinition } from 'interfaces/protocol';
import { wait } from 'utils/index';
import { bufferToHexString, intToHexString } from 'utils/binary';
import { DeviceLog } from 'utils/logger';
import { JKBMS_COMMANDS, JKBMS_PROTOCOL } from './config';

export class JKBMS implements Device {
  protocol!: DeepRequired<ProtocolSpecification<JKBMS_COMMANDS>>;
  status!: DeviceStatus;
  deviceIdenticator!: DeviceIdentificator | null;
  callbacks: DeviceCallbacks;
  decoder!: ResponseDecoder<JKBMS_COMMANDS>;
  responseBuffer!: Uint8Array;
  characteristic!: BluetoothRemoteGATTCharacteristic | null;
  bluetoothDevice!: BluetoothDevice | null;
  inactivityTimeout: ReturnType<typeof setTimeout> | null | undefined;
  cache!: Partial<ResponseDataTypeRecord>;

  constructor(callbacks: DeviceCallbacks) {
    DeviceLog.info(`JK BMS initializing`, { callbacks });

    this.decoder = new ResponseDecoder<JKBMS_COMMANDS>(JKBMS_PROTOCOL);
    // @ts-ignore
    this.protocol = this.decoder.getUnpackedProtocol();

    DeviceLog.info(
      `Using protocol ${this.protocol.name}
    commands: [
        ${Object.values(this.protocol.commands)
          .map(({ name }) => name)
          .join(', ')}
    ]
    responses: [
        ${Object.values(this.protocol.responses)
          .map(({ name }) => name)
          .join(', ')}
    ]
`,
      {
        protocol: this.protocol,
      }
    );

    this.callbacks = callbacks;

    this.reset();

    DeviceLog.log(`Device initialized`, this);
  }

  private reset(): void {
    DeviceLog.log(`Resetting device`, this);
    this.setStatus('disconnected');
    this.deviceIdenticator = null;
    this.cache = {};

    this.characteristic = null;
    this.bluetoothDevice = null;

    clearTimeout(this.inactivityTimeout ?? undefined);
    this.inactivityTimeout = null;

    this.flushResponseBuffer();
  }

  private setStatus(newStatus: DeviceStatus): void {
    DeviceLog.log(`Status changed: ${this.status} -> ${newStatus}`, {
      newStatus,
      oldStatus: this.status,
    });
    this.status = newStatus;
    this.callbacks.onStatusChange?.(newStatus);
  }

  async connect(options: ConnectOptions = {}): Promise<DeviceIdentificator | null> {
    DeviceLog.log(`Connect procedure started`, { options });
    this.setStatus('scanning');

    let device: BluetoothDevice | null = null;

    try {
      if (options?.previous && navigator.platform !== 'Linux x86_64') {
        DeviceLog.debug(`Previous device option set ${options.previous.name}`, {
          previous: options.previous,
        });
        const previousDevice = await this.tryGetPreviousDevice(options.previous);

        if (previousDevice) {
          DeviceLog.info(`Using previous device ${previousDevice.name}`, {
            previousDevice,
            options,
          });
          device = previousDevice;
        } else {
          // We can't call requestBluetoothDevice without second user interaction.
          // https:/developer.chrome.com/blog/user-activation/
          DeviceLog.info(`Disconnecting to allow other devices`, {
            previousDevice,
          });
          this.setStatus('disconnected');
          return null;
        }
      } else {
        DeviceLog.info(`Reqesting new device`, { options });
        const userSelectedDevice = await this.requestBluetoothDevice();
        DeviceLog.info(`Using user selected device ${userSelectedDevice.name}`, {
          userSelectedDevice,
        });
        device = userSelectedDevice;
      }
    } catch (error) {
      console.error(error);
      // @ts-ignore
      DeviceLog.error(`Request device failed. ${error?.message}`, {
        options,
        device,
      });
      this.setStatus('disconnected');
      this.callbacks.onRequestDeviceError?.(error as Error);

      return null;
    }

    try {
      DeviceLog.info(`Connecting to device ${device.name}`, { device });
      this.setStatus('connecting');
      const server = await device.gatt?.connect().catch((error) => {
        console.error(error);
        throw new Error(`Can't connect to GAAT Server of ${device?.name}`);
      });
      DeviceLog.log(`Connected to ${device.name}`, { device, server });

      device.addEventListener('gattserverdisconnected', () => this.disconnect('external'));
      this.registerActivity();

      if (!server) {
        throw new Error(`Can't connect to GAAT Server of ${device.name}`);
      }

      DeviceLog.info(`Getting service ${intToHexString(this.protocol.serviceUuid, '0x')}`, {
        server,
      });
      const service = await server?.getPrimaryService(this.protocol.serviceUuid).catch((error) => {
        console.error(error);
        throw new Error(
          `Can't get primary service ${intToHexString(this.protocol.serviceUuid, '0x')}`
        );
      });

      if (!service) {
        throw new Error(`Service ${intToHexString(this.protocol.serviceUuid, '0x')} not found`);
      }

      DeviceLog.info(
        `Getting characteristic ${intToHexString(this.protocol.characteristicUuid, '0x')}`,
        { service }
      );
      const charateristic = await service
        ?.getCharacteristic(this.protocol.characteristicUuid)
        .catch((error) => {
          console.error(error);
          throw new Error(`Can't get characteristic ${this.protocol.characteristicUuid}`);
        });

      if (!charateristic) {
        throw new Error(`Service ${this.protocol.characteristicUuid} not found`);
      }

      this.characteristic = charateristic;
      this.bluetoothDevice = device;
      this.setStatus('connected');

      DeviceLog.log(`Device ${device.name} ready for commands`, {
        device,
        charateristic,
      });

      this.subscribeToDataNotifications();

      this.deviceIdenticator = {
        id: device.id,
        name: device.name || device.id,
      };

      DeviceLog.debug(
        `Returning device identificator ${device.name} ${this.deviceIdenticator.id}`,
        {
          deviceIdentificator: this.deviceIdenticator,
        }
      );

      this.callbacks.onConnected?.(this.deviceIdenticator);

      return this.deviceIdenticator;
    } catch (error) {
      DeviceLog.error(
        // @ts-ignore
        error?.message || `Error connecting and initializing device ${device.name}`,
        { device, error }
      );
      this.disconnect('error');
      this.callbacks.onRequestDeviceError?.(error as Error);
      return null;
    }
  }

  async disconnect(reason: DisconnectReasons): Promise<void> {
    if (this.status === 'disconnected' || !this.bluetoothDevice) {
      DeviceLog.warn(`Device already disconnected`, this);

      // return;
    }

    try {
      DeviceLog.log(
        `Trying to disconnet device ${this.bluetoothDevice?.name}. Reason: ${reason}`,
        this
      );

      if (reason !== 'external') {
        await this.characteristic?.stopNotifications().catch((error) => {
          console.warn(error);
        });
        await wait(100);
        this.bluetoothDevice?.gatt?.disconnect();
        await wait(100);
      }

      this.callbacks?.onDisconnected?.(reason);

      this.reset();
    } catch (error) {
      DeviceLog.warn(`Disconnect failed, reloading`);
      document.location.reload();
    }
  }

  async pause(): Promise<void> {
    DeviceLog.log(`Pause notifications for device ${this.characteristic?.service.device.name}`, {
      characteristic: this.characteristic,
    });
    //
  }

  private async tryGetPreviousDevice(
    deviceIdenticator: DeviceIdentificator
  ): Promise<BluetoothDevice | null> {
    DeviceLog.info(`Requesting paired devices for ${location.origin}`, {
      location,
    });
    const pairedDevicesForThisOrigin = await navigator.bluetooth.getDevices();
    DeviceLog.info(`Found ${pairedDevicesForThisOrigin.length} paired devices`, {
      pairedDevicesForThisOrigin,
    });
    const matchedDevice = pairedDevicesForThisOrigin?.find(
      (device) => device.id === deviceIdenticator.id
    );

    if (matchedDevice) {
      DeviceLog.info(`Connecting to previous device ${matchedDevice.name}`, {
        matchedDevice,
      });
      const abortController = new AbortController();

      // Wait for connection.
      await matchedDevice.watchAdvertisements({
        signal: abortController.signal,
      });

      DeviceLog.info(`Watching for advertisments`, {
        matchedDevice,
        abortController,
      });

      const isMatchedDeviceInRange = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          DeviceLog.warn(
            `No advertisement received within ${this.protocol.connectPreviousTimeout}ms`
          );
          resolve(false);
        }, this.protocol.connectPreviousTimeout);

        const advertisementReceivedCallback = (event: BluetoothAdvertisingEvent) => {
          DeviceLog.info(`Previous devices in range ${event.rssi}rssi`, {
            event,
          });
          clearTimeout(timeout);
          resolve(true);
        };

        // @FIXME: remove listener after first advertismenet
        matchedDevice.addEventListener('advertisementreceived', advertisementReceivedCallback);
      });

      // unwatchAdvertisements hangs, use abort instead
      // matchedDevice.unwatchAdvertisements();
      abortController.abort();
      DeviceLog.debug(`Stopped watching for advertisements`, {
        abortController,
        matchedDevice,
        isMatchedDeviceInRange,
      });

      if (!isMatchedDeviceInRange) {
        DeviceLog.warn(`Previous device  ${matchedDevice.name} unavailable`, {
          matchedDevice,
          isMatchedDeviceInRange,
        });
        this.callbacks.onPreviousUnavailable?.(matchedDevice);

        return null;
      }

      DeviceLog.log(`Previous device ${matchedDevice.name} ready for connection`, {
        matchedDevice,
        isMatchedDeviceInRange,
      });

      return matchedDevice;
    }

    DeviceLog.warn(`Previous device ${deviceIdenticator.name} not paired with this origin`, {
      deviceIdenticator,
      matchedDevice,
    });

    this.callbacks.onPreviousUnavailable?.(null);

    return null;
  }

  private async requestBluetoothDevice(): Promise<BluetoothDevice> {
    DeviceLog.info(
      `Scanning for devices with ${intToHexString(this.protocol.serviceUuid, '0x')} uuid`,
      {
        serviceUuid: this.protocol.serviceUuid,
      }
    );
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [this.protocol.serviceUuid],
        },
      ],
    });

    DeviceLog.debug(`Got premission to use device ${device.name}`, { device });

    return device;
  }

  private registerActivity(): ReturnType<typeof setTimeout> {
    if (this.inactivityTimeout !== null) {
      clearTimeout(this.inactivityTimeout);
    }
    this.inactivityTimeout = setTimeout(() => {
      DeviceLog.warn(`Disconnecting ${this.deviceIdenticator?.name} due to inactivity`);
      this.disconnect('inactivity');
    }, this.protocol.inactivityTimeout);

    return this.inactivityTimeout;
  }

  private async subscribeToDataNotifications(): Promise<void> {
    if (!this.characteristic) {
      DeviceLog.error(`Can't subscribe. Device must be connected first.`);
      return;
    }

    try {
      DeviceLog.log(`Subscribing for notifications`, {
        characteristic: this.characteristic,
      });
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleNotification.bind(this)
      );

      await this.characteristic.startNotifications();
      await wait(200);
      // Sending these two commands start live data notifications
      await this.sendCommand(JKBMS_COMMANDS.GET_SETTINGS);
      await this.sendCommand(JKBMS_COMMANDS.GET_DEVICE_INFO);
      DeviceLog.info(`Listening for cell data notifications`);
    } catch (error) {
      // @ts-ignore
      DeviceLog.error(error.message);
      DeviceLog.error(`Can't start notifications and/or send commands`, {
        error,
      });
      this.disconnect('error');
      this.callbacks.onError?.(error as Error);
    }
  }

  private async sendCommand(commandName: JKBMS_COMMANDS, payload?: Uint8Array): Promise<void> {
    DeviceLog.info(`Preparing to send command ${commandName}`, this);
    if (!this.characteristic) {
      throw new Error(`Device must be connected to send a command`);
    }

    const command = this.protocol.getCommandByName(commandName) as DeepRequired<
      CommandDefinition<JKBMS_COMMANDS>
    >;

    if (!command) {
      const msg = `Command ${commandName} does not exist for ${this.protocol.name}`;
      DeviceLog.error(msg, { commandName, command, protocol: this.protocol });

      throw new Error(msg);
    }

    const timeout = setTimeout(() => {
      throw new Error(`Send command ${commandName} took longer than ${command.timeout}ms`);
    }, command.timeout);

    const preparedCommand = this.constructCommandPayload(command, payload);

    try {
      DeviceLog.log(
        `===== Sending command ${commandName} ${
          payload ? `with payload ${bufferToHexString(payload, '', '', '0x')}` : ''
        } to ${this.characteristic.service.device.name} =====`,
        { command, preparedCommand }
      );
      if (payload) {
        await this.characteristic.writeValueWithResponse(preparedCommand.buffer);
      } else {
        await this.characteristic.writeValueWithoutResponse(preparedCommand.buffer);
      }
    } catch (error) {
      console.error(error);
      const msg = `Sending command ${commandName} failed`;
      DeviceLog.error(msg, { error, command });
      throw new Error(msg);
    }

    clearTimeout(timeout);

    if (command.wait) {
      DeviceLog.debug(`Waiting ${command.wait}ms before ready for next command`, {
        command,
      });
      await wait(command.wait);
    }
  }

  private constructCommandPayload(
    command: Required<CommandDefinition>,
    payload: Uint8Array = new Uint8Array([])
  ): Uint8Array {
    DeviceLog.debug(`Constructing payload for ${command.name}`, { command });
    const template = new Uint8Array(this.protocol.commandLength);
    const tempBuffer = new Uint8Array([
      ...this.protocol.commandHeader,
      ...command.code,
      ...payload,
    ]);

    if (this.protocol.commandLength && tempBuffer.byteLength > this.protocol.commandLength) {
      const msg = `Command ${command.name} payload ${tempBuffer.byteLength} B exceeds protocol limit ${this.protocol.commandLength} B`;
      DeviceLog.error(msg, { command, tempBuffer, payload });

      throw new Error(msg);
    }

    const commandBuffer = new Uint8Array([...tempBuffer, ...template]).slice(
      0,
      this.protocol.commandLength
    );
    DeviceLog.debug(`Command pre checksum: ${bufferToHexString(commandBuffer)}`, { commandBuffer });
    const checksum = this.calculateChecksum(commandBuffer.slice(0, -1));

    commandBuffer[commandBuffer.length - 1] = checksum;
    DeviceLog.debug(`Command with checksum: ${bufferToHexString(commandBuffer)}`, {
      commandBuffer,
      checksum,
    });

    return commandBuffer;
  }

  async toggleCharging(value: boolean): Promise<void> {
    try {
      await this.sendCommand(JKBMS_COMMANDS.TOGGLE_CHARGING, new Uint8Array([value ? 0x01 : 0x00]));
      DeviceLog.info(`Toggle charging ${value} success. Refetching settings`);
    } finally {
      await this.sendCommand(JKBMS_COMMANDS.GET_SETTINGS);
    }
  }

  async toggleDischarging(value: boolean): Promise<void> {
    try {
      await this.sendCommand(
        JKBMS_COMMANDS.TOGGLE_DISCHARGING,
        new Uint8Array([value ? 0x01 : 0x00])
      );
      DeviceLog.info(`Toggle discharging ${value} success. Refetching settings`);
    } finally {
      await this.sendCommand(JKBMS_COMMANDS.GET_SETTINGS);
    }
  }

  private handleNotification(event: Event): void {
    this.registerActivity();
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;

    if (!value?.byteLength) {
      DeviceLog.warn(`Received empty notification. Ignoring`, { value, event });
      return;
    }

    const valueArray = new Uint8Array(value.buffer);

    DeviceLog.debug(
      // @ts-ignore
      `===== Received notification from ${event.target?.service?.device?.name} (${value.byteLength} bytes) =====`,
      { event, value, responseBuffer: this.responseBuffer, it: this }
    );

    try {
      if (this.doesStartWithSegmentHeader(valueArray)) {
        DeviceLog.debug(`Segment header detected`);
        this.flushResponseBuffer();
        this.responseBuffer = valueArray;
      } else {
        // responseBuffer should always start with segment header or have 0 length
        if (this.doesStartWithSegmentHeader(this.responseBuffer)) {
          DeviceLog.debug(
            `Appending frame to previous segment. Total length ${
              this.responseBuffer.byteLength + valueArray.byteLength
            }`,
            { responseBuffer: this.responseBuffer, valueArray }
          );

          this.responseBuffer = new Uint8Array([...this.responseBuffer, ...valueArray]);
        } else {
          DeviceLog.warn(`Segment header must come first in the response. Ignoring frame`, {
            responseBuffer: this.responseBuffer,
            valueArray,
          });
          return;
        }
      }

      const segmentType = this.getSegmentType(this.responseBuffer);

      const expectedSegments = this.protocol.responses.map(
        (responseDefinition) => responseDefinition.signature[0]
      );

      if (!expectedSegments.includes(segmentType)) {
        DeviceLog.warn(`Unexpected segment type ${intToHexString(segmentType, '0x')}`);

        return;
      }

      const responseDefinition = this.protocol.getResponseBySignature(
        new Uint8Array([segmentType])
      )!;

      if (this.isSegmentComplete(this.responseBuffer, responseDefinition)) {
        if (!this.isChecksumCorrect(this.responseBuffer)) {
          DeviceLog.warn(`Segment corrupted. Flushing ${responseDefinition.name}`, {
            responseBuffer: this.responseBuffer,
          });
          this.flushResponseBuffer();
          return;
        }

        try {
          DeviceLog.debug(`Segment complete and valid. Decoding ${responseDefinition.name}`, {
            responseBuffer: this.responseBuffer,
          });

          const decodedData = this.decoder!.decode(
            responseDefinition.dataType,
            new Uint8Array([segmentType]),
            this.responseBuffer
          );

          this.handleDecodedData(responseDefinition.dataType, decodedData);

          this.flushResponseBuffer();
        } catch (error) {
          console.error(error);
          DeviceLog.error(`${responseDefinition.name} data decode or handle failed`, {
            error,
          });
          return;
        }
      } else {
        DeviceLog.debug(`Segment not complete. Waiting for more data`);
      }
    } catch (error) {
      console.error(error);
      DeviceLog.error('Unkown Error in handle notification', { error });
      this.flushResponseBuffer();
    }

    DeviceLog.debug(`Notification handle end`);
  }

  private doesStartWithSegmentHeader(buffer: Uint8Array): boolean {
    DeviceLog.debug(
      `Checking for segment header ${bufferToHexString(this.protocol.segmentHeader)}`,
      { buffer, header: this.protocol.segmentHeader }
    );
    return (
      buffer.byteLength > this.protocol.segmentHeader.byteLength &&
      this.protocol.segmentHeader.every((value, i) => value === buffer[i])
    );
  }

  private isSegmentComplete(segment: Uint8Array, responseDefinition: ResponseDefinition): boolean {
    DeviceLog.debug(`Checking if segment is complete`, { segment, responseDefinition });

    if (!this.doesStartWithSegmentHeader(segment)) {
      // This shouldn't happen
      DeviceLog.warn(`Segment can't be complete without its header`, {
        segment,
      });
      return false;
    }

    if (segment.length === responseDefinition.length) {
      DeviceLog.debug(`Segment has expected length ${responseDefinition.length} bytes`, {
        segment,
        responseDefinition,
      });
      return true;
    } else if (segment.length > responseDefinition.length) {
      DeviceLog.warn(
        `Segment is longer than expected length by ${
          segment.length - responseDefinition.length
        }. Proceed with caution`,
        { segment, responseDefinition }
      );

      return true;
    }

    DeviceLog.debug(
      `Segment needs ${responseDefinition.length - segment.length} more bytes to be complete`,
      { segment, responseDefinition }
    );
    return false;
  }

  private isChecksumCorrect(segment: Uint8Array): boolean {
    const checksum = segment.at(-1);

    const calculatedChecksum = this.calculateChecksum(segment.slice(0, -1));

    if (checksum === calculatedChecksum) {
      DeviceLog.debug(`Checksum correct ${intToHexString(checksum, '0x')}`);
      return true;
    }

    DeviceLog.warn(
      `Checksum ${intToHexString(calculatedChecksum, '0x')} invalid expected ${intToHexString(
        checksum!,
        '0x'
      )}`
    );

    return false;
  }

  private getSegmentType(segment: Uint8Array): number {
    const segmentType = segment[this.protocol.segmentHeader.length];

    DeviceLog.debug(`Detected segment type ${intToHexString(segmentType, '0x')}`);

    return segmentType;
  }

  private calculateChecksum(byteArray: Uint8Array): number {
    DeviceLog.debug(`Calculating checksum for ${byteArray.byteLength} bytes`, {
      byteArray,
    });
    const sum = byteArray.reduce((acc, byte) => (acc += byte), 0);

    const checksum = sum & 0xff;

    console.assert(checksum <= 255);
    DeviceLog.debug(`Calculated checksum: ${intToHexString(checksum, '0x')}`, {
      byteArray,
      checksum,
    });

    return checksum;
  }

  private flushResponseBuffer(): void {
    DeviceLog.debug(`Flushing response buffer ${this.responseBuffer?.byteLength ?? 0} bytes`, {
      responseBuffer: this.responseBuffer,
    });
    this.responseBuffer = new Uint8Array([]);
  }

  private handleDecodedData<T extends ResponseDataTypes>(
    dataType: T,
    decodedData: DecodedResponseData<T>
  ): void {
    const timestamp = new Date().valueOf();
    const lastData = this.cache[dataType];
    const timeSinceLastOne = lastData?.timestamp ? timestamp - lastData.timestamp : null;

    DeviceLog.debug(`Preparing public data`, {
      decodedData,
      timeSinceLastOne,
      timestamp: new Date(timestamp),
    });

    const internalData: Partial<InternalData> = {};

    const publicData = {
      timestamp,
      timeSinceLastOne,
      ...decodedData,
    } as ResponseDataTypeRecord[T];

    Object.keys(publicData).forEach((key) => {
      // @ts-ignore
      if (INTERNAL_KEYS.includes(key)) {
        // @ts-ignore
        internalData[key] = publicData[key];
        // @ts-ignore
        delete publicData[key];
      }
    });

    if (dataType === 'LIVE_DATA') {
      DeviceLog.debug(
        `${dataType} arrived ${(publicData as LiveData)?.voltage}V Ping: ${
          publicData.timeSinceLastOne
        }ms`,
        { publicData, decodedData, internalData }
      );
    } else {
      DeviceLog.info(`===== ${dataType} data ready. ${Object.keys(publicData).length} items =====`);
    }

    this.cache[dataType] = publicData;

    this.callbacks.onDataReceived(dataType, publicData);
  }
}
