import { LiveData } from 'interfaces/data';

export type DataItemUIOptions = {
  label?: string;
  unit?: 'V' | 'W' | 'A' | 'Ah' | 'Wh' | 'R' | '%' | '°C';
  decimals?: number;
};
export const liveDataUIConfig: Partial<Record<keyof LiveData, DataItemUIOptions>> = {
  voltage: {
    label: 'Voltage',
    unit: 'V',
    decimals: 2,
  },
  nominalVoltage: {
    label: 'Nominal Vol',
    unit: 'V',
  },
  power: {
    label: 'Power',
    unit: 'W',
    decimals: 0,
  },
  current: {
    label: 'Current',
    unit: 'A',
    decimals: 2,
  },
  cellCount: {
    label: 'Cell Count',
  },
  voltages: {
    unit: 'V',
    decimals: 3,
  },
  averageCellVoltage: {
    label: 'Avg cell',
    unit: 'V',
    decimals: 3,
  },
  minVoltage: {
    label: 'Min cell',
    unit: 'V',
    decimals: 3,
  },
  maxVoltage: {
    label: 'High cell',
    unit: 'V',
    decimals: 3,
  },
  cellVoltageDelta: {
    label: 'Cell delta',
    unit: 'V',
    decimals: 3,
  },
  remainingCapacity: {
    label: 'Remaining cap',
    unit: 'Ah',
    decimals: 1,
  },
  nominalCapacity: {
    label: 'Nom. cap',
    unit: 'Ah',
    decimals: 1,
  },
  // Total energy used (fractional cycleCount * nominalCapacity)
  cycledCapacity: {
    label: 'Cycled cap',
    unit: 'Ah',
    decimals: 0,
  },
  percentage: {
    label: 'Level',
    unit: '%',
    decimals: 0,
  },
  cycleCount: {
    label: 'Cycle count',
    decimals: 0,
  },
  resistances: {
    unit: 'R',
  },
  avarageCellResistance: {
    label: 'Avg resistance',
    unit: 'R',
    decimals: 4,
  },
  //  Negative = discharge
  balanceCurrent: {
    label: 'Balance',
    unit: 'A',
    decimals: 3,
  },
  // External probes placed near the cells
  temperatureProbes: {
    label: 'T',
    unit: '°C',
    decimals: 1,
  },
  avarageTemperature: {
    label: 'Avg temp',
    unit: '°C',
  },
  minTemperature: {
    label: 'Min temp',
    unit: '°C',
    decimals: 1,
  },
  maxTemperature: {
    label: 'Max temp',
    unit: '°C',
    decimals: 1,
  },
  // Highest Mosfet temp if multiple sensors are present
  mosTemperature: {
    label: 'MOS temp',
    unit: '°C',
    decimals: 1,
  },
  // e.g board sensors
  internalTemperatureProbes: {
    label: 'IT',
    unit: '°C',
    decimals: 1,
  },
};
