import { DeepPartial, DeepReadonly } from 'ts-essentials';
import { ResponseDataTypes, ResponseDataTypeRecord } from './data';
import { Decoder } from './decoder';

export type DeviceIdentificator = DeepReadonly<{
  id: string;
  name: string;
}>;

export type DeviceStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'paused';

export type DisconnectReasons = 'inactivity' | 'error' | 'reset' | 'external' | 'user';

export type DeviceCallbacks = {
  onPreviousUnavailable?(device: BluetoothDevice | null): void;
  onRequestDeviceError?(error: Error): void;
  onStatusChange?(status: DeviceStatus): void;
  onConnected?(deviceIdentificator: DeviceIdentificator): void;
  onDisconnected?(reason: DisconnectReasons): void;
  onError?(error: Error): void;
  onDataReceived<T extends ResponseDataTypes>(dataType: T, data: ResponseDataTypeRecord[T]): void;
};

export type ConnectOptions = {
  previous?: DeviceIdentificator;
};

export interface Device {
  status: DeviceStatus;
  deviceIdenticator: DeviceIdentificator | null;
  callbacks: DeviceCallbacks;
  cache: DeepPartial<ResponseDataTypeRecord>;
  decoder: Decoder<string> | null;

  connect(options?: ConnectOptions): Promise<DeviceIdentificator | null>;

  disconnect(reason: DisconnectReasons): Promise<void>;

  pause(): Promise<void>;

  toggleCharging(value: boolean): Promise<void>;
  toggleDischarging(value: boolean): Promise<void>;
}
