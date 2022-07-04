import { Data, InternalData } from './data';
import { CommandDefinition, ProtocolSpecification } from './protocol';

export type DecodedResponseData = Pick<Data, 'batteryData' | 'deviceInfo'> & {
  internalData: InternalData;
};

export interface Decoder<T extends string> {
  protocol: ProtocolSpecification<T>;

  decode(commnand: CommandDefinition<T>, responseBuffer: Uint8Array): DecodedResponseData;
  getUnpackedProtocol(): ProtocolSpecification<T>;
}
