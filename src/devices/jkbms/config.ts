import { StrictExtract } from 'ts-essentials';
import { HexString } from '../../interfaces';
import { ProtocolDefinition } from '../../interfaces/decoder';

type Commands = 'getDeviceInfo' | 'getCellData' | 'activate';

export const SERVICE_UUID = 0xffe0;
export const CHARACTERISTIC_UUID = 0xffe1;

export const JKBMS_COMMANDS: Record<Commands, HexString> = {
  getDeviceInfo: 'aa 55 90 eb 97 00 00 00 00 00 00 00 00 00 00 00 00 00 00 11',
  getCellData: 'aa 55 90 eb 96 00 00 00 00 00 00 00 00 00 00 00 00 00 00 10',
  activate: '01 00',
};

export const JKBMS_PROTOCOL: ProtocolDefinition<
  StrictExtract<Commands, 'getDeviceInfo' | 'getCellData'>
> = {
  getDeviceInfo: [],
  getCellData: [],
};

export const TIMEOUTS = {
  connectPreviousDevice: 3000,
  writeCharacteristicValue: 500,
};

export const WRITE_CHARACTERISTIC_DELAY = 200;
