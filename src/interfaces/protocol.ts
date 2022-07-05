import { StrictExtract, StrictOmit } from 'ts-essentials';
import { Data, InternalData } from './data';

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

export type DataGroup = StrictExtract<keyof Data, 'batteryData' | 'deviceInfo'> | 'internalData';
export type PackedGroupAndName =
  | [StrictExtract<DataGroup, 'deviceInfo'>, keyof Exclude<Data['deviceInfo'], undefined>]
  | [StrictExtract<DataGroup, 'batteryData'>, keyof Exclude<Data['batteryData'], undefined>]
  | [StrictExtract<DataGroup, 'internalData'>, keyof Exclude<InternalData, undefined>];

export type GetterFunction = (itemData: {
  itemBuffer: ArrayBuffer;
  byteLength: ByteLength;
  offset: ByteLength;
  responseBuffer: ArrayBuffer;
}) => any;

export type DataItemTypes = 'numeric' | 'text' | 'raw';

export const PackedItemDescriptionIndexes = {
  byteLength: 0,
  groupAndName: 1,
  valueType: 2,
  getterFunction: 3,
};

export type PackedItemDescription =
  | [ByteLength, PackedGroupAndName, PackedNumericValueProperties]
  | [ByteLength, PackedGroupAndName, TextValueTypes]
  | [ByteLength, PackedGroupAndName, RawValueType, GetterFunction | undefined | null];

export type GroupAndName =
  | {
      group: StrictExtract<DataGroup, 'deviceInfo'>;
      name: keyof Exclude<Data['deviceInfo'], undefined>;
    }
  | {
      group: StrictExtract<DataGroup, 'batteryData'>;
      name: keyof Exclude<Data['batteryData'], undefined>;
    }
  | {
      group: StrictExtract<DataGroup, 'internalData'>;
      name: keyof Exclude<InternalData, undefined>;
    };

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
      type: StrictExtract<DataItemTypes, 'raw'>;
      getterFunction: GetterFunction | undefined | null;
    };

export type ItemDescription = {
  byteLength: ByteLength;
  offset: ByteLength;
} & GroupAndName &
  ItemProperties;

export type CommandDefinition<T extends string = string> = {
  name: T;
  payload?: Uint8Array;
  responseSignature?: Uint8Array;
  timeout?: number;
  wait?: number;
  responseLength: number;
  response: ItemDescription[];
};

export type PackedCommandDefinition<T extends string = string> = Omit<
  CommandDefinition<T>,
  'response'
> & {
  response: PackedItemDescription[];
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
  getCommand(commandName: T): CommandDefinition<T>;
}

export type PackedProtocolSpecification<T extends string> = StrictOmit<
  ProtocolSpecification<T>,
  'getCommand' | 'commands'
> & {
  commands: PackedCommandDefinition<T>[];
};
