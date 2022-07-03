import { DecodedResponseData, Decoder } from '../interfaces/decoder';
import { CommandDefinition, ProtocolDefinition } from '../interfaces/protocol';
import { bufferToHexString } from '../utils/binary';

export class ResponseDecoder<T extends string> implements Decoder<T> {
  protocol: ProtocolDefinition<T>;

  constructor(protocol: ProtocolDefinition<T>) {
    this.protocol = protocol;
  }

  decode(
    command: CommandDefinition,
    responseBuffer: Uint8Array
  ): DecodedResponseData {
    console.log(bufferToHexString(responseBuffer.buffer));
    const dataView = new DataView(responseBuffer.buffer);

    const temp = Array.from(Array(50)).map(
      (_, i) =>
        dataView.getUint32(
          Math.min(110 + i, responseBuffer.buffer.byteLength - 4),
          true
        ) / 1000
    );

    const voltageIndex = 110 + temp.findIndex((v) => v > 75 && v < 84);
    const voltage = dataView.getUint32(voltageIndex, true) / 1000;
    const power = dataView.getUint32(voltageIndex + 4, true) / 1000;
    const current = dataView.getInt32(voltageIndex + 8, true) / 1000;

    console.log({ voltage, power, current });

    return {
      // @ts-ignore
      batteryData: {
        voltage,
        power,
        current,
      },
    };
  }
}
