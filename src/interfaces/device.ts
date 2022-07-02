import { DeepReadonly } from 'ts-essentials';
import { Data } from './data';
import { Decoder } from './decoder';

export type DeviceIdentificator = DeepReadonly<{
  id: string;
  name: string;
}>;

export type DeviceStatus =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'paused';

export type DeviceCallbacks = {
  onPreviousUnaviable?(device: BluetoothDevice): void;
  onRequestDeviceError?(error: Error): void;
  onStatusChange?(status: DeviceStatus): void;
  onConnected?(deviceIdentificator: DeviceIdentificator): void;
  onError?(error: Error): void;
  onDataChange(data: Data): void;
};

export type ConnectOptions = {
  previous?: DeviceIdentificator;
};

export interface Device {
  status: DeviceStatus;
  deviceIdenticator: DeviceIdentificator;
  callbacks: DeviceCallbacks;
  data: Data;
  decoder: Decoder<string>;

  new (callbacks: DeviceCallbacks): this;

  connect(options?: ConnectOptions): Promise<DeviceIdentificator>;

  disconnect(): DeviceIdentificator;

  pause(): void;
}
