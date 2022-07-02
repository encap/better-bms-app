const CMD_ACTIVATE = '01 00';
const CMD_DEVICE_INFO =
  'aa 55 90 eb 97 00 00 00 00 00 00 00 00 00 00 00 00 00 00 11';
const CMD_CELL_DATA =
  'aa 55 90 eb 96 00 00 00 00 00 00 00 00 00 00 00 00 00 00 10';

const SERVICE = 0xffe0;
const CHARACTERISTIC = 0xffe1;

const wait = (duration: number): Promise<void> =>
  new Promise((r) => setTimeout(r, duration));

function hex2Buf(hexString: string): ArrayBuffer {
  return new Int8Array(hexString.split(' ').map((h) => parseInt(h, 16))).buffer;
}

function buf2hex(buffer: ArrayBuffer | undefined): string {
  if (!buffer) {
    return '';
  }

  return Array.from(new Uint8Array(buffer))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join(' ');
}

export default async function main(setVoltage: (v: number) => void) {
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      {
        services: [SERVICE],
      },
    ],
  });
  console.log({ device });

  const server = await device.gatt?.connect();
  console.log({ server });

  const service = await server?.getPrimaryService(SERVICE);
  console.log({ service });

  const charateristic = await service?.getCharacteristic(CHARACTERISTIC);
  console.log({ charateristic });

  await charateristic?.startNotifications();

  await wait(200);

  const activateBuffer = hex2Buf(CMD_ACTIVATE);
  const activateResp = await charateristic?.writeValueWithResponse(
    activateBuffer
  );
  console.log({ activateBuffer, activateResp });

  await wait(200);

  const getInfoBuffer = hex2Buf(CMD_DEVICE_INFO);
  const getInfoResp = await charateristic?.writeValueWithResponse(
    getInfoBuffer
  );
  console.log({ getInfoBuffer, getInfoResp });

  await wait(400);

  const getDataBuffer = hex2Buf(CMD_CELL_DATA);
  const getDataResp = await charateristic?.writeValue(getDataBuffer);
  console.log({ getDataBuffer, getDataResp });

  let responseAcc = new Uint8Array();

  charateristic?.addEventListener(
    'characteristicvaluechanged',
    async (event) => {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;

      if (value) {
        console.log(
          `received ${value.byteLength} bytes`,
          `total: ${responseAcc.byteLength + value.byteLength}`,
          `header: ${buf2hex(value.buffer).slice(0, 12)}`
        );
        responseAcc = new Uint8Array([
          ...responseAcc,
          ...new Uint8Array(value.buffer),
        ]);
      }

      if (responseAcc.byteLength >= 600) {
        processData(responseAcc, setVoltage);
        charateristic.stopNotifications();
        device?.gatt?.disconnect();
        server?.disconnect();
      }
    }
  );
}

export function processData(
  data: Uint8Array,
  handleVoltage: (v: number) => void
) {
  console.log(buf2hex(data.buffer));
  console.log(data);
  const candidates = Array.from(Array(30))
    .map(
      (_, i) =>
        new DataView(data.buffer).getUint32(
          Math.min(300 + 125 + i, data.buffer.byteLength - 4),
          true
        ) / 1000
    )
    .filter((v) => v > 50 && v < 85);

  console.log('Voltage: ', ...candidates);

  handleVoltage(candidates[0]);
}
