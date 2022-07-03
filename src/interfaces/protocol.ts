import { StrictExtract } from 'ts-essentials';
import { Data, InternalData } from './data';

export type NumericValueTypes =
  | 'Int8'
  | 'Uint8'
  | 'Int16'
  | 'Uint16'
  | 'Int32'
  | 'Uint32'
  | 'Float32'
  | 'Float64';
export type Endiannes = 'bigEndian' | 'littleEndian';
export type Multiplayer = number;
export type NumericValueProperties = [
  NumericValueTypes,
  Endiannes,
  Multiplayer
];
export type TextValueTypes = 'ASCII' | 'UTF-8' | 'Hex';
export type RawValueType = 'raw';
export type ByteLength = number;
export type DataGroup =
  | StrictExtract<keyof Data, 'batteryData' | 'deviceInfo'>
  | 'internalData';
export type Name =
  | keyof Exclude<Data['deviceInfo'], undefined>
  | keyof Exclude<Data['batteryData'], undefined>
  | keyof Exclude<InternalData, undefined>;
export type GroupAndName = [DataGroup, Name];
export type GetterFunction = (itemData: {
  itemBuffer: ArrayBuffer;
  length: ByteLength;
  byteOffset: ByteLength;
  buffer: ArrayBuffer;
}) => any;

export type DataItemDescription =
  | [ByteLength, GroupAndName, NumericValueProperties]
  | [ByteLength, GroupAndName, TextValueTypes]
  | [ByteLength, GroupAndName, RawValueType, GetterFunction | undefined];

export type ResponseDataDefinition = DataItemDescription[];

export type CommandDefinition<T extends string = string> = {
  name: T;
  payload?: Uint8Array;
  responseSignature?: Uint8Array;
  timeout?: number;
  wait?: number;
  response: ResponseDataDefinition;
};

export interface ProtocolDefinition<T extends string> {
  name: string;
  segmentHeader?: Uint8Array;
  commandHeader?: Uint8Array;
  commandLength?: number;
  serviceUuid?: number;
  characteristicUuid?: number;
  connectPreviousTimeout?: number;
  commands: CommandDefinition<T>[];
}