import { HexString } from '../interfaces';

type HexPrefixes = '0x' | '\\x' | '' | null | undefined;

type HexSeparators = ' ' | '' | null | undefined;

export function intToHexString(
  number: number,
  prefix: HexPrefixes = ''
): HexString {
  return (prefix ?? '') + number.toString(16).padStart(2, '0');
}

export function hexStringToBuffer(
  hexString: HexString,
  separator: HexSeparators = ' '
): ArrayBuffer {
  return new Int8Array(
    hexString.split(separator ?? '').map((h) => parseInt(h, 16))
  ).buffer;
}

export function bufferToHexString(
  buffer: Uint8Array | undefined,
  separator: HexSeparators = ' ',
  prefixes: HexPrefixes = '',
  prefix: HexPrefixes = ''
): HexString {
  if (!buffer) {
    return '';
  }

  return (
    prefix +
    Array.from(buffer)
      .map((uInt8) => intToHexString(uInt8, prefixes))
      .join(separator ?? '')
  );
}
