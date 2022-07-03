import { DeepRequired } from 'ts-essentials';
import { ProtocolDefinition } from '../../interfaces/protocol';

export enum JKBMS_COMMANDS {
  GET_DEVICE_INFO = 'GET_DEVICE_INFO',
  GET_CELL_DATA = 'GET_CELL_DATA',
}

// export const JKBMS_COMMANDS: Record<Commands, HexString> = {
//   getDeviceInfo: 'aa 55 90 eb 97 00 00 00 00 00 00 00 00 00 00 00 00 00 00 11',
//   getCellData: 'aa 55 90 eb 96 00 00 00 00 00 00 00 00 00 00 00 00 00 00 10',
// };

export const JKBMS_PROTOCOL: DeepRequired<ProtocolDefinition<JKBMS_COMMANDS>> =
  {
    name: 'JK-BMS-02',
    serviceUuid: 0xffe0,
    characteristicUuid: 0xffe1,
    connectPreviousTimeout: 3000,
    segmentHeader: new Uint8Array([0x55, 0xaa, 0xeb, 0x90]),
    commandHeader: new Uint8Array([0xaa, 0x55, 0x90, 0xeb]),
    commandLength: 20,
    commands: [
      {
        name: JKBMS_COMMANDS.GET_DEVICE_INFO,
        payload: new Uint8Array([0x97]),
        responseSignature: new Uint8Array([0x03]),
        response: [],
        timeout: 1000,
        wait: 400,
      },
      {
        name: JKBMS_COMMANDS.GET_CELL_DATA,
        payload: new Uint8Array([0x96]),
        responseSignature: new Uint8Array([0x02]),
        response: [],
        timeout: 1000,
        wait: 400,
      },
    ],
  };
