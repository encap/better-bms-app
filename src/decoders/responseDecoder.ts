import { DeepPartial } from 'ts-essentials';
import { DecodedResponseData, Decoder } from '../interfaces/decoder';
import {
  CommandDefinition,
  PackedProtocolSpecification,
  ProtocolSpecification,
} from '../interfaces/protocol';
import { bufferToHexString, intToHexString } from '../utils/binary';
import { DecodeLog, DeviceLog } from '../utils/logger';
import { unpackProtocol } from '../utils/unpackProtocol';

export class ResponseDecoder<T extends string> implements Decoder<T> {
  protocol: ProtocolSpecification<T>;
  utf8Decoder: TextDecoder;

  constructor(packedProtocol: PackedProtocolSpecification<T>) {
    DecodeLog.log(`Initializing Response Decoder for protocol ${packedProtocol.name}`, {
      packedProtocol,
    });
    const protocol = unpackProtocol(packedProtocol);

    const isValid = this.validateProtocol(protocol);

    if (!isValid) {
      const msg = `Protocol ${protocol.name} invalid!`;
      DecodeLog.error(msg, { protocol });
      throw new Error(msg);
    }

    this.utf8Decoder = new TextDecoder('utf-8');
    this.protocol = protocol;

    DecodeLog.log(`${protocol.name} decoder initialized`, this);
  }

  getUnpackedProtocol(): ProtocolSpecification<T> {
    return this.protocol;
  }

  validateProtocol(protocol: ProtocolSpecification<T>): boolean {
    DecodeLog.info(`Validating protocol ${protocol.name}`, { protocol });

    let isValid = false;
    try {
      isValid = true;

      const areCommandsResponseLengthsCorrect = protocol.commands.every((command) => {
        const calculatedLength = command.response.reduce(
          (byteSum, itemDescription) => (byteSum += itemDescription.byteLength),
          0
        );

        if (calculatedLength === command.responseLength) {
          return true;
        } else {
          DecodeLog.warn(
            `Command ${command.name} calculated response length ${calculatedLength} does not match ${command.responseLength} bytes`,
            { command }
          );
          return false;
        }
      });

      if (!areCommandsResponseLengthsCorrect) {
        DeviceLog.error(`Commands response lengths of ${protocol.name} don't match`, { protocol });
        isValid = false;
      }
    } catch (error) {
      isValid = false;
      // @ts-ignore
      errors.push(error?.message || 'unkown error');
      console.error(error);
      DecodeLog.error(`Unknown error in protocol validation. Protocol definition corrupted`, {
        protocol,
        error,
      });
    }

    return isValid;
  }

  decode(command: CommandDefinition, responseBuffer: Uint8Array): DecodedResponseData {
    let currentDataItem = null;

    try {
      DecodeLog.log(`Decoding ${command.name} data (${responseBuffer.byteLength} bytes)`, {
        command,
        responseBuffer,
      });

      DecodeLog.debug(bufferToHexString(responseBuffer));
      const decodedDataAcc: Required<DeepPartial<DecodedResponseData>> = {
        batteryData: {},
        deviceInfo: {},
        internalData: {},
      };

      for (const dataItem of command.response) {
        currentDataItem = dataItem;
        const buffer = responseBuffer.slice(dataItem.offset, dataItem.offset + dataItem.byteLength);

        DecodeLog.debug(
          `Decoding ${dataItem.type} item ${dataItem.group}.${dataItem.name} at offset ${dataItem.offset}`,
          { dataItem, accumulator: decodedDataAcc, responseBuffer, buffer }
        );

        let value;

        switch (dataItem.type) {
          case 'raw': {
            if (dataItem.getterFunction) {
              const processedValue = dataItem.getterFunction({
                itemBuffer: buffer,
                byteLength: dataItem.byteLength,
                offset: dataItem.offset,
                responseBuffer,
              });

              DecodeLog.debug(`Decoded processed raw value ${processedValue.toString}`, {
                processedValue,
                dataItem,
                buffer,
              });

              value = processedValue;
            } else {
              DecodeLog.debug(`Decoded raw value ${buffer.byteLength} bytes`, { dataItem, buffer });

              value = buffer;
            }

            break;
          }
          case 'text': {
            switch (dataItem.textEncoding) {
              case 'hex': {
                const hexString = bufferToHexString(buffer, ' ', '');

                DecodeLog.debug(`Decoded HexString ${buffer.byteLength} bytes \n${hexString}`, {
                  hexString,
                  buffer,
                  dataItem,
                });

                value = hexString;

                break;
              }
              case 'UTF-8':
              case 'ASCII': {
                const encodedString = this.utf8Decoder.decode(buffer).replaceAll('\u0000', '');

                DecodeLog.debug(
                  `Decoded utf-8 or ascii text ${encodedString.length} ch \n${encodedString}`,
                  { encodedString, buffer, dataItem }
                );

                value = encodedString;

                break;
              }
            }

            break;
          }
          case 'numeric': {
            const view = new DataView(buffer.buffer);
            const isLittleEndian: boolean | undefined =
              dataItem.numberType === 'Int8' || dataItem.numberType === 'Uint8'
                ? undefined
                : dataItem.endiannes === 'littleEndian'
                ? true
                : false;

            const getter = `get${dataItem.numberType}`;

            DecodeLog.debug(
              `Decoding ${dataItem.endiannes ?? ''} ${dataItem.numberType} (${
                buffer.byteLength * 8
              } bits)`,
              { view, isLittleEndian, dataItem, buffer }
            );

            // @ts-ignore
            const decodedValue = view[getter](0, isLittleEndian) as number;

            let processedValue = decodedValue;
            if (dataItem.options.multiplayer !== undefined) {
              processedValue = processedValue * dataItem.options.multiplayer;
            }
            if (dataItem.options.precision !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              processedValue = Number(processedValue.toFixed(dataItem.options.precision ?? 5))!;
            }

            DecodeLog.debug(
              `Decoded ${dataItem.endiannes ?? ''} ${
                dataItem.numberType
              } = ${processedValue} ${intToHexString(decodedValue, '0x')}`,
              {
                view,
                isLittleEndian,
                dataItem,
                buffer,
                decodedValue,
              }
            );
            value = processedValue;

            break;
          }
        }

        currentDataItem = null;

        const doesValueAlreadyExist = Object.hasOwn(decodedDataAcc[dataItem.group], dataItem.name);

        if (doesValueAlreadyExist) {
          // @ts-ignore
          const existingValue = decodedDataAcc[dataItem.group][dataItem.name];

          if (
            (typeof existingValue === 'object' && typeof existingValue.length === 'undefined') ||
            typeof existingValue !== 'object'
          ) {
            DecodeLog.info(`${dataItem.group}.${dataItem.name} already exists. Creating an array`, {
              existingValue,
              dataItem,
              accumulator: decodedDataAcc,
            });

            value = [existingValue, value];
          } else {
            value = [...existingValue, value];
            DecodeLog.debug(
              `Appending another value to ${dataItem.group}.${dataItem.name}. Total length ${value.length}`,
              { existingValue, dataItem, accumulator: decodedDataAcc }
            );
          }
        }

        // @ts-ignore
        decodedDataAcc[dataItem.group][dataItem.name] = value;
      }

      DecodeLog.log(
        `Decoding ${command.name} successful. V: ${decodedDataAcc.batteryData.voltage} SW: ${decodedDataAcc.deviceInfo?.firmwareVersion}`,
        { decodedDataAcc, command, responseBuffer },
        decodedDataAcc
      );

      return decodedDataAcc as DecodedResponseData;
    } catch (error) {
      console.log(error);
      DecodeLog.error(
        `Decoding ${command.name} failed in ${
          currentDataItem ? `${currentDataItem.group}.${currentDataItem.name}` : 'null'
        } at ${currentDataItem?.offset}`,
        { error, command, responseBuffer }
      );
      throw error;
    }
  }
}
