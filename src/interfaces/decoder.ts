import { InternalData, ResponseDataTypeRecord, ResponseDataTypes } from './data';
import { ProtocolSpecification } from './protocol';

export type DecodedResponseData<T extends ResponseDataTypes> = Partial<ResponseDataTypeRecord[T]> &
  Partial<InternalData>;
export interface Decoder<T extends string> {
  protocol: ProtocolSpecification<T>;

  decode<T extends ResponseDataTypes>(
    responseType: T,
    responseSignature: Uint8Array,
    responseBuffer: Uint8Array
  ): DecodedResponseData<T>;
  getUnpackedProtocol(): ProtocolSpecification<T>;
}
