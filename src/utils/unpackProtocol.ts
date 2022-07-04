/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DistributiveOmit } from '../interfaces';
import {
  CommandDefinition,
  DataItemTypes,
  GetterFunction,
  ItemDescription,
  ItemProperties,
  PackedCommandDefinition,
  PackedGroupAndName,
  PackedItemDescription,
  PackedItemDescriptionIndexes,
  PackedNumericValueProperties,
  PackedProtocolSpecification,
  ProtocolSpecification,
  TextValueTypes,
} from '../interfaces/protocol';
import { DecodeLog } from './logger';

export function unpackProtocol<T extends string>(
  packedProtocol: PackedProtocolSpecification<T>
): ProtocolSpecification<T> {
  DecodeLog.info(`Unpacking protocol`, { packedProtocol });

  const unpackedCommands = packedProtocol.commands.map(unpackCommand);

  const unpackedProtocol = {
    ...packedProtocol,
    commands: unpackedCommands,
    getCommand(commandName: T): CommandDefinition<T> {
      return this.commands.find((command) => command.name === commandName)!;
    },
  };

  DecodeLog.info(`Successfully unpacked protocol ${unpackedProtocol.name}`, { unpackedProtocol });

  // @ts-ingore
  return unpackedProtocol;
}

export function unpackCommand<T extends string = string>(
  packedCommand: PackedCommandDefinition<T>
): CommandDefinition<T> {
  return {
    ...packedCommand,
    response: unpackCommandResponseDefinition(packedCommand.response),
  };
}

export function unpackDataItemDescription(packedItem: PackedItemDescription): ItemDescription {
  const indexes = PackedItemDescriptionIndexes;
  const type: DataItemTypes =
    packedItem[indexes.valueType] === 'raw'
      ? 'raw'
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
      const [numberType, endiannes, multiplayer] = packedItem[
        indexes.valueType
      ] as PackedNumericValueProperties;
      properties = {
        numberType,
        endiannes: endiannes ?? undefined,
        options: {
          multiplayer: multiplayer ?? 1,
        },
      };
      break;
    }
  }

  const [group, name] = packedItem[indexes.groupAndName] as PackedGroupAndName;

  // @ts-ignore
  return {
    byteLength: packedItem[indexes.byteLength] as number,
    type,
    group,
    name,
    ...properties,
  };
}

export function unpackCommandResponseDefinition(
  packedResponseDefinition: PackedItemDescription[]
): ItemDescription[] {
  return packedResponseDefinition.map(unpackDataItemDescription);
}
