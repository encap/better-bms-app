import { HexString } from '../interfaces';

export function hexStringToBuffer(hexString: HexString): ArrayBuffer {
  return new Int8Array(hexString.split(' ').map((h) => parseInt(h, 16))).buffer;
}

export function bufferToHexString(buffer: ArrayBuffer | undefined): HexString {
  if (!buffer) {
    return '';
  }

  return Array.from(new Uint8Array(buffer))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join(' ');
}
