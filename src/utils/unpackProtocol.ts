/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DistributiveOmit } from 'interfaces/index';
import { ResponseDataTypeKeys, ResponseDataTypes } from 'interfaces/data';
import {
  ByteLength,
  CommandDefinition,
  DataItemTypes,
  GenericResponseDefinition,
  GetterFunction,
  ItemDescription,
  ItemProperties,
  PackedGenericResponseDefinition,
  PackedItemDescription,
  PackedItemDescriptionIndexes,
  PackedNumericValueProperties,
  PackedProtocolSpecification,
  ProtocolSpecification,
  ResponseDefinition,
  TextValueTypes,
} from 'interfaces/protocol';
import { DecodeLog } from './logger';

export function unpackProtocol<T extends string>(
  packedProtocol: PackedProtocolSpecification<T>
): ProtocolSpecification<T> {
  DecodeLog.info(`Unpacking protocol`, { packedProtocol });

  // @ts-ignore
  const unpackedResponses = packedProtocol.responses.map(unpackResponse);

  const unpackedProtocol: ProtocolSpecification<T> = {
    ...packedProtocol,
    // @ts-ignore
    responses: unpackedResponses,
    getCommandByName(commandName: T): CommandDefinition<T> {
      return this.commands.find((command) => command.name === commandName)!;
    },
    getResponseByName<T extends ResponseDataTypes>(
      responseName: ResponseDefinition['name']
    ): GenericResponseDefinition<T> | null {
      return this.responses.find(
        (response) => response.name === responseName
      ) as GenericResponseDefinition<T> | null;
    },
    getResponseBySignature<T extends ResponseDataTypes>(
      responseSignature: Exclude<ResponseDefinition['signature'], undefined>
    ): GenericResponseDefinition<T> | null {
      return this.responses.find(
        (response) =>
          responseSignature.byteLength === response.signature?.byteLength &&
          response.signature!.every((value, i) => value === responseSignature[i])
      ) as GenericResponseDefinition<T> | null;
    },
  };

  DecodeLog.info(`Successfully unpacked protocol ${unpackedProtocol.name}`, { unpackedProtocol });

  // @ts-ingore
  return unpackedProtocol;
}

export function unpackResponse<T extends ResponseDataTypes>(
  packedResponse: PackedGenericResponseDefinition<T>
): GenericResponseDefinition<T> {
  return {
    ...packedResponse,
    items: unpackResponseItems(packedResponse.items),
  };
}

export function unpackDataItemDescription<T extends ResponseDataTypes>(
  packedItem: PackedItemDescription<T>,
  offset: ByteLength = 0
): ItemDescription<T> {
  const indexes = PackedItemDescriptionIndexes;
  const type: DataItemTypes =
    packedItem[indexes.valueType] === 'raw'
      ? 'raw'
      : packedItem[indexes.valueType] === 'boolean'
      ? 'boolean'
      : typeof packedItem[indexes.valueType] === 'string'
      ? 'text'
      : 'numeric';

  let properties: DistributiveOmit<ItemProperties, 'type'>;

  switch (type) {
    case 'raw': {
      properties = {
        getterFunction: packedItem[indexes.getterFunction] as GetterFunction,
      };
      break;
    }
    case 'text': {
      properties = {
        textEncoding: packedItem[indexes.valueType] as TextValueTypes,
      };
      break;
    }
    case 'numeric': {
      const [numberType, endiannes, multiplayer, precision] = packedItem[
        indexes.valueType
      ] as PackedNumericValueProperties;
      properties = {
        numberType,
        endiannes: endiannes ?? undefined,
        options: {
          multiplayer: multiplayer ?? 1,
          precision: precision ?? 5,
        },
      };
      break;
    }
    case 'boolean': {
      properties = {};
    }
  }

  const key = packedItem[indexes.key] as ResponseDataTypeKeys<T>;

  // @ts-ignore
  return {
    byteLength: packedItem[indexes.byteLength] as number,
    offset,
    type,
    key,
    ...properties,
  };
}

export function unpackResponseItems<T extends ResponseDataTypes>(
  packedResponseDefinition: PackedItemDescription<T>[]
): ItemDescription<T>[] {
  return packedResponseDefinition.reduce(
    (acc: ItemDescription<T>[], packedItem: PackedItemDescription<T>) => {
      const previousItem = acc[acc.length - 1];

      return [
        ...acc,
        unpackDataItemDescription(
          // @ts-ignore
          packedItem,
          previousItem ? previousItem.offset + previousItem.byteLength : 0
        ),
      ];
    },
    [] as ItemDescription<T>[]
  );
}
