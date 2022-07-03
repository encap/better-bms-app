import { Data, InternalData } from './data';
import { CommandDefinition, ProtocolDefinition } from './protocol';

export type DecodedResponseData = Pick<Data, 'batteryData' | 'deviceInfo'> & {
  internalData: InternalData;
};

export interface Decoder<T extends string> {
  protocol: ProtocolDefinition<T>;

  decode(
    commnand: CommandDefinition<T>,
    responseBuffer: Uint8Array
  ): DecodedResponseData;
}
