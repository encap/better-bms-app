import { ResponseDataTypes } from 'interfaces/data';
import {
  PackedItemDescription,
  GetterFunction,
  PackedProtocolSpecification,
} from 'interfaces/protocol';
import { DecodeLog, GlobalLog } from 'utils/logger';

export enum JKBMS_COMMANDS {
  GET_DEVICE_INFO = 'GET_DEVICE_INFO',
  GET_SETTINGS = 'GET_SETTINGS',
  TOGGLE_CHARGING = 'TOGGLE_CHARGING',
  TOGGLE_DISCHARGING = 'TOGGLE_DISCHARGING',
}

const responseHeaderWithTypeAndCounter: PackedItemDescription<ResponseDataTypes>[] = [
  [4, 'header', 'hex'],
  [1, 'signature', 'hex'],
  [1, 'frameNumber', ['Int8']],
];

const uptimeDecoder: GetterFunction = () => {
  DecodeLog.debug('Decode uptime');
  return 1000 * 60 * 60 * 24;
};

const CELL_COUNT = 24;

export const JKBMS_PROTOCOL: PackedProtocolSpecification<JKBMS_COMMANDS> = {
  name: 'JK-BMS-02',
  serviceUuid: 0xffe0,
  characteristicUuid: 0xffe1,
  connectPreviousTimeout: 3000,
  inactivityTimeout: 3000,
  segmentHeader: new Uint8Array([0x55, 0xaa, 0xeb, 0x90]),
  commandHeader: new Uint8Array([0xaa, 0x55, 0x90, 0xeb]),
  commandLength: 20,
  commands: [
    {
      name: JKBMS_COMMANDS.GET_DEVICE_INFO,
      code: new Uint8Array([0x97]),
      responseName: 'DEVICE_INFO',
      timeout: 1000,
      wait: 400,
    },
    {
      name: JKBMS_COMMANDS.GET_SETTINGS,
      code: new Uint8Array([0x96]),
      responseName: 'SETTINGS',
      timeout: 1000,
      wait: 400,
    },
    {
      name: JKBMS_COMMANDS.TOGGLE_CHARGING,
      code: new Uint8Array([0x1d, 0x04]),
      timeout: 1000,
      wait: 1000,
    },
    {
      name: JKBMS_COMMANDS.TOGGLE_DISCHARGING,
      code: new Uint8Array([0x1e, 0x04]),
      timeout: 1000,
      wait: 1000,
    },
  ],
  responses: [
    {
      name: 'DEVICE_INFO',
      dataType: 'DEVICE_INFO',
      command: JKBMS_COMMANDS.GET_DEVICE_INFO,
      signature: new Uint8Array([0x03]),
      length: 300,
      items: [
        ...responseHeaderWithTypeAndCounter,
        [16, 'model', 'ASCII'],
        [8, 'hardwareVersion', 'ASCII'],
        [8, 'firmwareVersion', 'ASCII'],
        // Should be 3 bytes and 1 unknown?
        [4, 'upTime', 'raw', uptimeDecoder],
        [4, 'powerOnTimes', ['Int32', 'bigEndian']],
        [16, 'name', 'ASCII'],
        [16, 'password', 'ASCII'],
        [8, 'manufacturingDate', 'ASCII'],
        [11, 'serialNumber', 'ASCII'],
        [5, 'passcode', 'ASCII'],
        [16, 'userData', 'ASCII'],
        [16, 'settingsPassword', 'ASCII'],
        [166, 'unknownSegments', 'raw', null],
      ],
    },
    {
      name: 'LIVE_DATA',
      dataType: 'LIVE_DATA',
      signature: new Uint8Array([0x02]),
      length: 300,
      items: [
        ...responseHeaderWithTypeAndCounter,
        ...Array.from(Array(CELL_COUNT)).map<PackedItemDescription<'LIVE_DATA'>>(() => [
          2,
          'voltages',
          ['Int16', 'littleEndian', 0.001, 3],
        ]),
        [4, 'unknownSegments', 'raw', null],
        [2, 'averageCellVoltage', ['Int16', 'littleEndian', 0.001, 3]],
        [2, 'cellVoltageDelta', ['Int16', 'littleEndian', 0.001, 3]],
        [2, 'balanceCurrent', ['Int16', 'littleEndian', 0.001, 3]],
        ...Array.from(Array(CELL_COUNT)).map<PackedItemDescription<'LIVE_DATA'>>(() => [
          2,
          'resistances',
          ['Int16', 'littleEndian', 0.001, 3],
        ]),
        [6, 'unknownSegments', 'raw', null],
        [4, 'voltage', ['Uint32', 'littleEndian', 0.001, 2]],
        [4, 'power', ['Uint32', 'littleEndian', 0.001, 0]],
        [4, 'current', ['Int32', 'littleEndian', 0.001, 2]],
        // [8, 'unknownSegments', 'raw', null],
        [2, 'temperatureProbes', ['Int16', 'littleEndian', 0.1, 1]],
        [2, 'temperatureProbes', ['Int16', 'littleEndian', 0.1, 1]],
        [2, 'mosTemperature', ['Int16', 'littleEndian', 0.1, 1]],
        [4, 'unknownSegments', 'raw', null],
        [1, 'unknownSegments', 'raw', null],
        [1, 'percentage', ['Int8']],
        [4, 'remainingCapacity', ['Uint32', 'littleEndian', 0.001, 1]],
        [4, 'nominalCapacity', ['Uint32', 'littleEndian', 0.001, 1]],
        [4, 'cycleCount', ['Uint32', 'littleEndian', 1, 1]],
        // [2, 'unknownSegments', 'raw', null],
        // [2, 'unknownSegments', 'raw', null],
        [4, 'cycledCapacity', ['Uint32', 'littleEndian', 0.001, 0]],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [3, 'upTime', 'raw', uptimeDecoder],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [12, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        // Current_Charge?
        [2, 'unknownSegments', 'raw', null],
        // Current_Discharge?
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [2, 'unknownSegments', 'raw', null],
        [93, 'unknownSegments', 'raw', null],
      ],
    },
    {
      name: 'SETTINGS',
      dataType: 'SETTINGS',
      signature: new Uint8Array([0x01]),
      length: 300,
      items: [
        ...responseHeaderWithTypeAndCounter,
        [2, 'unknownSegments', 'raw', null],
        [110, 'unknownSegments', 'raw', null],
        [1, 'charge', 'boolean'],
        [3, 'unknownSegments', 'raw', null],
        [1, 'discharge', 'boolean'],
        [3, 'unknownSegments', 'raw', null],
        [1, 'balance', 'boolean'],
        [173, 'unknownSegments', 'raw', null],
      ],
    },
  ],
};

GlobalLog.info(`Registered protocol: ${JKBMS_PROTOCOL.name}
  commands: ${JKBMS_PROTOCOL.commands.map(({ name }) => name).join(', ')}
  responses: ${JKBMS_PROTOCOL.responses.map(({ name }) => name).join(', ')}
`);
