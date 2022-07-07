import { DeepReadonly, StrictOmit } from 'ts-essentials';
import { ArrayOfLength, CellChemistry, CellCount, HexString, Units } from '.';

export type ResponseDataTypes = 'DEVICE_INFO' | 'LIVE_DATA' | 'SETTINGS';

export type UnknowDataSegment = DeepReadonly<{
  offset: number;
  length: number;
  buffer: ArrayBuffer;
}>;

export type CommonData = {
  timestamp: Units['miliseconds'];
  timeSinceLastOne: Units['miliseconds'];
  unknownSegments?: UnknowDataSegment[];
};

export type DeviceInfoData = CommonData & {
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
  // No idea
  passcode?: string;
  userData?: string;
};

export type LiveData = CommonData & {
  timeSinceLastOne: Units['miliseconds'] | null;
  upTime?: Units['miliseconds'];
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
  remainingCapacity: Units['ampHours'];
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

export type SettingsData = CommonData & {
  charge: boolean;
  discharge: boolean;
  balance?: boolean;
  ovp: Units['volts'];
  ovpr?: Units['volts'];
  uvp: Units['volts'];
  uvpr: Units['volts'];
  bmsShutdown?: Units['volts'];
  cellCount: CellCount;
  capacity: Units['ampHours'];
  balanceMinDelta?: Units['volts'];
  ocp: Units['amps'];
  ocpr?: Units['miliseconds'];
  cocp: Units['amps'];
  copcr?: Units['miliseconds'];
  otp?: Units['degreesCelsius'];
  otpr?: Units['degreesCelsius'];
  cotp?: Units['degreesCelsius'];
  cotpr?: Units['degreesCelsius'];
};

export type Data = DeviceInfoData | LiveData | SettingsData | InternalData;
// | Record<string, number | string | ArrayBuffer | Uint8Array>;

export type ResponseDataTypeRecord = {
  DEVICE_INFO: DeviceInfoData;
  LIVE_DATA: LiveData;
  SETTINGS: SettingsData;
};

export type ResponseDataTypeKeys<T extends ResponseDataTypes> =
  | keyof StrictOmit<ResponseDataTypeRecord[T], 'timestamp'>
  | keyof InternalData;

export const INTERNAL_KEYS = ['header', 'signature', 'frameNumber'] as const;

export type InternalData = {
  header?: Uint8Array | HexString;
  signature?: Uint8Array | HexString;
  frameNumber?: number;
};
