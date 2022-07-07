import { HexString } from 'interfaces/index';

type HexPrefixes = '0x' | '\\x' | '' | null | undefined;

type HexSeparators = ' ' | '' | null | undefined;

export function intToHexString(number: number, prefix: HexPrefixes = ''): HexString {
  return (prefix ?? '') + number.toString(16).padStart(2, '0');
}

export function hexStringToBuffer(
  hexString: HexString,
  separator: HexSeparators = ' '
): Uint8Array {
  return new Uint8Array(hexString.split(separator ?? '').map((h) => parseInt(h, 16)));
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
