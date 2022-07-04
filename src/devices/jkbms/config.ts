import { DeepRequired } from 'ts-essentials';
import { DataItemDescription, GetterFunction, ProtocolDefinition } from '../../interfaces/protocol';
import { DecodeLog, GlobalLog } from '../../utils/logger';

export enum JKBMS_COMMANDS {
  GET_DEVICE_INFO = 'GET_DEVICE_INFO',
  GET_CELL_DATA = 'GET_CELL_DATA',
}

const responseHeaderWithTypeAndCounter: DataItemDescription[] = [
  [4, ['internalData', 'header'], 'hex'],
  [1, ['internalData', 'responseSignature'], 'hex'],
  [1, ['internalData', 'frameNumber'], ['Int8']],
];

const uptimeDecoder: GetterFunction = () => {
  DecodeLog.info('Decode uptime');
  return 1000 * 60 * 60 * 24;
};

export const JKBMS_PROTOCOL: DeepRequired<ProtocolDefinition<JKBMS_COMMANDS>> = {
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
      responseLength: 300,
      response: [
        ...responseHeaderWithTypeAndCounter,
        ...Array.from(Array(24)).map<DataItemDescription>(() => [
          2,
          ['batteryData', 'voltages'],
          ['Int16', 'littleEndian', 0.001],
        ]),
        [4, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'averageCellVoltage'], ['Int16', 'littleEndian', 0.001]],
        [2, ['batteryData', 'cellVoltageDelta'], ['Int16', 'littleEndian', 0.001]],
        [2, ['batteryData', 'balanceCurrent'], ['Int16', 'littleEndian', 0.001]],
        ...Array.from(Array(24)).map<DataItemDescription>(() => [
          2,
          ['batteryData', 'resistances'],
          ['Int16', 'littleEndian', 0.001],
        ]),
        [6, ['batteryData', 'unknownSegments'], 'raw', null],
        [4, ['batteryData', 'voltage'], ['Uint32', 'littleEndian', 0.001]],
        [4, ['batteryData', 'power'], ['Uint32', 'littleEndian']],
        [4, ['batteryData', 'power'], ['Int32', 'littleEndian', 0.001]],
        // [8, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'temperatureProbes'], ['Int16', 'littleEndian', 0.1]],
        [2, ['batteryData', 'temperatureProbes'], ['Int16', 'littleEndian', 0.1]],
        [2, ['batteryData', 'mosTemperature'], ['Int16', 'littleEndian', 0.1]],
        [4, ['batteryData', 'unknownSegments'], 'raw', null],
        [1, ['batteryData', 'unknownSegments'], 'raw', null],
        [1, ['batteryData', 'percentage'], ['Int8']],
        [4, ['batteryData', 'remainingCapacity'], ['Uint32', 'littleEndian', 0.001]],
        [4, ['batteryData', 'nominalCapacity'], ['Uint32', 'littleEndian', 0.001]],
        [4, ['batteryData', 'cycleCount'], ['Uint32', 'littleEndian']],
        // [2, ['batteryData', 'unknownSegments'], 'raw', null],
        // [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [4, ['batteryData', 'cycledCapacity'], ['Uint32', 'littleEndian', 0.001]],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [3, ['deviceInfo', 'upTime'], 'raw', uptimeDecoder],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [12, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        // Current_Charge?
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        // Current_Discharge?
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [2, ['batteryData', 'unknownSegments'], 'raw', null],
        [93, ['batteryData', 'unknownSegments'], 'raw', null],
      ],
      timeout: 1000,
      wait: 400,
    },
    {
      name: JKBMS_COMMANDS.GET_CELL_DATA,
      payload: new Uint8Array([0x96]),
      responseSignature: new Uint8Array([0x02]),
      responseLength: 300,
      response: [
        ...responseHeaderWithTypeAndCounter,
        [16, ['deviceInfo', 'model'], 'ASCII'],
        [8, ['deviceInfo', 'hardwareVersion'], 'ASCII'],
        [8, ['deviceInfo', 'firmwareVersion'], 'ASCII'],
        // Should be 3 bytes and 1 unknown?
        [4, ['deviceInfo', 'upTime'], 'raw', uptimeDecoder],
        [4, ['deviceInfo', 'powerOnTimes'], ['Int32', 'bigEndian']],
        [16, ['deviceInfo', 'name'], 'ASCII'],
        [16, ['deviceInfo', 'password'], 'ASCII'],
        [8, ['deviceInfo', 'manufacturingDate'], 'ASCII'],
        [11, ['deviceInfo', 'serialNumber'], 'ASCII'],
        [5, ['internalData', 'passcode'], 'ASCII'],
        [16, ['internalData', 'userData'], 'ASCII'],
        [16, ['deviceInfo', 'settingsPassword'], 'ASCII'],
        [166, ['deviceInfo', 'unknownSegments'], 'raw', null],
      ],
      timeout: 1000,
      wait: 400,
    },
  ],
};

GlobalLog.info(`Registered protocol: ${JKBMS_PROTOCOL.name}
  commands: ${JKBMS_PROTOCOL.commands.map(({ name }) => name).join(', ')}
`);
