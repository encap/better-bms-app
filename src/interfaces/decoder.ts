import { StrictExtract } from 'ts-essentials';
import { Data } from './data';

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
export type Group = StrictExtract<keyof Data, 'batteryData' | 'deviceInfo'>;
export type Name = keyof Exclude<Data['batteryData'], undefined>;
export type GroupAndName = [Group, Name];
export type GetterFunction = (itemData: {
  itemBuffer: ArrayBufferLike;
  length: ByteLength;
  byteOffset: ByteLength;
  buffer: ArrayBuffer;
}) => any;

export type DataItemDescription =
  | [ByteLength, GroupAndName, NumericValueProperties]
  | [ByteLength, GroupAndName, TextValueTypes]
  | [ByteLength, GroupAndName, RawValueType, GetterFunction | undefined];

export type ProtocolDefinition<T extends string> = Record<
  T,
  DataItemDescription[]
>;

export interface Decoder<T extends string> {
  protocol: ProtocolDefinition<T>;

  new (protocol: ProtocolDefinition<T>): this;

  decode(
    commnad: T,
    buffer: ArrayBufferLike
  ): Pick<Data, 'batteryData' | 'deviceInfo'>;
}
