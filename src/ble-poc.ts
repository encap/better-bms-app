const BMS_NAME = 'JK-B1A24S15P';
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

export default async function main(
  setData: (data: { voltage: number; current: number; power: number }) => void
) {
  const pairedDevices = await navigator.bluetooth.getDevices();

  const previousBms = pairedDevices?.find((device) => device.name === BMS_NAME);

  const device =
    previousBms ||
    (await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [SERVICE],
        },
      ],
    }));

  console.log({ pairedDevices, previousBms, device });

  if (previousBms) {
    const abortController = new AbortController();
    await device.watchAdvertisements({ signal: abortController.signal });
    await new Promise((resolve) =>
      device.addEventListener('advertisementreceived', (event) => {
        console.log('Advertisement received.');
        console.log('  Device Name: ' + event.device.name);
        console.log('  Device ID: ' + event.device.id);
        console.log('  RSSI: ' + event.rssi);
        console.log('  TX Power: ' + event.txPower);
        console.log('  UUIDs: ' + event.uuids);

        resolve(true);
      })
    );
  }

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

      if (responseAcc.byteLength >= 300) {
        processData(responseAcc, setData);
        responseAcc = new Uint8Array();
        // charateristic.stopNotifications();
        // device?.gatt?.disconnect();
        // server?.disconnect();
      }
    }
  );
}

export function processData(data: Uint8Array, handleData: (data: any) => void) {
  console.log(buf2hex(data.buffer));
  console.log(data);
  const dataView = new DataView(data.buffer);

  const temp = Array.from(Array(50)).map(
    (_, i) =>
      dataView.getUint32(Math.min(110 + i, data.buffer.byteLength - 4), true) /
      1000
  );

  const voltageIndex = 110 + temp.findIndex((v) => v > 79 && v < 84);
  const voltage = dataView.getUint32(voltageIndex, true) / 1000;
  const power = dataView.getUint32(voltageIndex + 4, true) / 1000;
  const current = dataView.getInt32(voltageIndex + 8, true) / 1000;

  console.log({ voltage, power, current });

  handleData({ voltage, power, current });
}
