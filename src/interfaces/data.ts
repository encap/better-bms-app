import { DeepReadonly } from 'ts-essentials';
import { ArrayOfLength, CellChemistry, CellCount, HexString, Units } from '.';

export type UnknowDataSegment = DeepReadonly<{
  offset: number;
  length: number;
  buffer: ArrayBuffer;
}>;

export type Data = DeepReadonly<{
  timestamp: Units['miliseconds'];
  timeSinceLastOne: Units['miliseconds'] | null;
  // null if no check
  checksumCorrect?: boolean | null;
  deviceInfo?: {
    id: string;
    name: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    manufacturingDate?: string;
    hardwareVersion?: string;
    firmwareVersion?: string;
    upTime?: Units['miliseconds'];
    powerOnTimes?: number;
    // Used to pair/connect
    password?: string;
    // Used to unlock settings
    settingsPassword?: string;
    unknownSegments?: UnknowDataSegment[];
  };
  batteryData?: {
    cellChemistry?: CellChemistry;
    voltage: Units['volts'];
    nominalVoltage?: Units['volts'];
    power: Units['watts'];
    // Negative = discharge
    current: Units['amps'];
    cellCount: CellCount;
    voltages: ArrayOfLength<Units['volts'], CellCount>;
    averageCellVoltage: Units['volts'];
    minVoltage: Units['volts'];
    maxVoltage: Units['volts'];
    cellVoltageDelta: Units['volts'];
    remainingCapacity?: Units['ampHours'];
    nominalCapacity?: Units['ampHours'];
    // Total energy used (fractional cycleCount * nominalCapacity)
    cycledCapacity?: Units['ampHours'];
    percentage?: Units['percentage'];
    cycleCount?: number;
    resistances?: ArrayOfLength<Units['ohms'], CellCount>;
    avarageCellResistance?: Units['ohms'];
    //  Negative = discharge
    balanceCurrent?: Units['amps'];
    // External probes placed near the cells
    temperatureProbes?: Units['degreesCelsius'][];
    avarageTemperature?: Units['degreesCelsius'];
    minTemperature?: Units['degreesCelsius'];
    maxTemperature?: Units['degreesCelsius'];
    // Highest Mosfet temp if multiple sensors are present
    mosTemperature?: Units['degreesCelsius'];
    // e.g board sensors
    internalTemperatureProbes?: Units['degreesCelsius'][];
    unknownSegments?: UnknowDataSegment[];
  };
}>;

export type InternalData = Record<string, number | string | ArrayBuffer | Uint8Array> & {
  header?: Uint8Array | HexString;
  responseSignature?: Uint8Array | HexString;
  frameNumber?: number;
};
