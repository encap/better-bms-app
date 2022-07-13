export type Units = {
  volts: number;
  amps: number;
  watts: number;
  degreesCelsius: number;
  ohms: number;
  ampHours: number;
  percentage: number;
  miliseconds: number;
  kmh: number;
};

export type CellChemistry = 'Li-ion' | 'LFP' | 'Li-po';

export type CellCount = number;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ArrayOfLength<T, N extends number> = T[];

export type HexString = string;

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
