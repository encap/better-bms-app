import { DeepReadonly } from 'ts-essentials';
import { Data } from './data';
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
  onDataChange(data: Data): void;
};

export type ConnectOptions = {
  previous?: DeviceIdentificator;
};

export interface Device {
  status: DeviceStatus;
  deviceIdenticator: DeviceIdentificator | null;
  callbacks: DeviceCallbacks;
  lastPublicData: Data | null;
  decoder: Decoder<string> | null;

  connect(options?: ConnectOptions): Promise<DeviceIdentificator | null>;

  disconnect(reason: DisconnectReasons): Promise<void>;

  pause(): Promise<void>;
}
