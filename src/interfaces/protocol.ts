import { StrictExtract, StrictOmit } from 'ts-essentials';
import { ResponseDataTypeKeys, ResponseDataTypes } from './data';

export type NumberTypes =
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
export type Precision = number | null | undefined;
export type PackedNumericValueProperties =
  | [NumberTypes, Endiannes, Multiplayer, Precision]
  | [NumberTypes, Endiannes]
  | [StrictExtract<NumberTypes, 'Int8' | 'Uint8'>];
export type TextValueTypes = 'ASCII' | 'UTF-8' | 'hex';
export type RawValueType = 'raw';
export type ByteLength = number;
export type BooleanType = 'boolean';

export type GetterFunction = (itemData: {
  itemBuffer: ArrayBuffer;
  byteLength: ByteLength;
  offset: ByteLength;
  responseBuffer: ArrayBuffer;
}) => any;

export type DataItemTypes = 'numeric' | 'text' | 'raw' | 'boolean';

export const PackedItemDescriptionIndexes = {
  byteLength: 0,
  key: 1,
  valueType: 2,
  getterFunction: 3,
};

export type PackedItemDescription<T extends ResponseDataTypes> =
  | [ByteLength, ResponseDataTypeKeys<T>, PackedNumericValueProperties]
  | [ByteLength, ResponseDataTypeKeys<T>, TextValueTypes]
  | [ByteLength, ResponseDataTypeKeys<T>, BooleanType]
  | [ByteLength, ResponseDataTypeKeys<T>, RawValueType, GetterFunction | undefined | null];

export type ItemDescription<T extends ResponseDataTypes> = {
  byteLength: ByteLength;
  offset: ByteLength;
  key: ResponseDataTypeKeys<T>;
} & ItemProperties;

export type ItemProperties =
  | {
      type: StrictExtract<DataItemTypes, 'numeric'>;
      numberType: NumberTypes;
      endiannes?: Endiannes;
      options: {
        multiplayer?: Multiplayer;
        precision?: Precision;
      };
    }
  | {
      type: StrictExtract<DataItemTypes, 'text'>;
      textEncoding: TextValueTypes;
    }
  | {
      type: StrictExtract<DataItemTypes, 'boolean'>;
    }
  | {
      type: StrictExtract<DataItemTypes, 'raw'>;
      getterFunction: GetterFunction | undefined | null;
    };

type ValueOf<T> = T[keyof T];

export type GenericResponseDefinition<T extends ResponseDataTypes> = {
  name: T | string;
  dataType: T;
  length: ByteLength;
  command?: string;
  signature?: Uint8Array;
  items: ItemDescription<T>[];
};

export type PackedGenericResponseDefinition<T extends ResponseDataTypes> = StrictOmit<
  GenericResponseDefinition<T>,
  'items'
> & {
  items: PackedItemDescription<T>[];
};

export type ResponseDefinition = ValueOf<{
  [T in ResponseDataTypes]: GenericResponseDefinition<T>;
}>;

export type PackedResponseDefinition = ValueOf<{
  [T in ResponseDataTypes]: PackedGenericResponseDefinition<T>;
}>;

export type CommandDefinition<T extends string = string> = {
  name: T;
  code: Uint8Array;
  timeout?: number;
  wait?: number;
  responseName?: ResponseDefinition['name'];
};

export interface ProtocolSpecification<T extends string> {
  name: string;
  segmentHeader?: Uint8Array;
  commandHeader?: Uint8Array;
  commandLength?: number;
  serviceUuid?: number;
  characteristicUuid?: number;
  connectPreviousTimeout?: number;
  inactivityTimeout?: number;
  commands: CommandDefinition<T>[];
  responses: ResponseDefinition[];
  getCommandByName(commandName: T): CommandDefinition<T>;
  getResponseBySignature<T extends ResponseDataTypes>(
    responseSignature: ResponseDefinition['signature']
  ): GenericResponseDefinition<T> | null;
  getResponseByName<T extends ResponseDataTypes>(
    responseName: ResponseDefinition['name']
  ): GenericResponseDefinition<T> | null;
}

export type PackedProtocolSpecification<T extends string> = StrictOmit<
  ProtocolSpecification<T>,
  'getCommandByName' | 'getResponseByName' | 'getResponseBySignature' | 'responses'
> & {
  responses: PackedResponseDefinition[];
};
