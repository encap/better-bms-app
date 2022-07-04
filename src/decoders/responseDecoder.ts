import { DecodedResponseData, Decoder } from '../interfaces/decoder';
import { CommandDefinition, ProtocolDefinition } from '../interfaces/protocol';
import { bufferToHexString } from '../utils/binary';
import { DecodeLog, DeviceLog } from '../utils/logger';

export class ResponseDecoder<T extends string> implements Decoder<T> {
  protocol: ProtocolDefinition<T>;

  constructor(protocol: ProtocolDefinition<T>) {
    const isValid = this.validateProtocol(protocol);

    if (!isValid) {
      const msg = `Protocol ${protocol.name} invalid!`;
      DecodeLog.error(msg, { protocol });
      throw new Error(msg);
    }

    DecodeLog.log(`${protocol.name} decoder initialized`, this);

    this.protocol = protocol;
  }

  validateProtocol(protocol: ProtocolDefinition<T>): boolean {
    DecodeLog.info(`Validating protocol ${protocol.name}`, { protocol });

    let isValid = false;
    try {
      isValid = true;

      const areCommandsResponseLengthsCorrect = protocol.commands.every((command) => {
        const calculatedLength = command.response.reduce(
          (byteSum, itemDescription) => (byteSum += itemDescription[0]),
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
    DecodeLog.log(`Decoding ${command.name} data (${responseBuffer.byteLength} bytes)`, {
      command,
      responseBuffer,
    });
    DecodeLog.debug(bufferToHexString(responseBuffer));

    const dataView = new DataView(responseBuffer.buffer);

    const temp = Array.from(Array(50)).map(
      (_, i) =>
        dataView.getUint32(Math.min(110 + i, responseBuffer.buffer.byteLength - 4), true) / 1000
    );

    const voltageIndex = 110 + temp.findIndex((v) => v > 60 && v < 84);
    const voltage = dataView.getUint32(voltageIndex, true) / 1000;
    const power = dataView.getUint32(voltageIndex + 4, true) / 1000;
    const current = dataView.getInt32(voltageIndex + 8, true) / 1000;

    const decodedData: DecodedResponseData = {
      // @ts-ignore
      batteryData: {
        voltage,
        power,
        current,
      },
    };

    DecodeLog.log(
      `Decoding ${command.name} successful. V: ${voltage} SW: ${decodedData.deviceInfo?.firmwareVersion}`,
      { decodedData }
    );

    return decodedData;
  }
}
