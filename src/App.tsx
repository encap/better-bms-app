import { useEffect, useState } from 'react';
import './App.css';
import LogViewer from './components/molecules/LogViewer';
import { ResponseDecoder } from './decoders/responseDecoder';
import { JKBMS } from './devices/jkbms';
import { JKBMS_PROTOCOL } from './devices/jkbms/config';
import { mockCellDataResponse } from './devices/jkbms/mocks';
import { Data } from './interfaces/data';
import { Device, DeviceIdentificator, DeviceStatus } from './interfaces/device';
import { UILog } from './utils/logger';
import { unpackCommand } from './utils/unpackProtocol';

function App() {
  const [status, setStatus] = useState<DeviceStatus>('disconnected');
  const [data, setData] = useState<Data | null>(null);
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    UILog.info('App rendered');

    setDevice(
      new JKBMS({
        onDataChange(newData) {
          setData(newData);
        },
        onStatusChange(newStatus) {
          setStatus(newStatus);
        },
        onConnected(deviceIdentificator) {
          window.localStorage.setItem('previousDevice', JSON.stringify(deviceIdentificator));
        },
        onError(error) {
          console.error(error);
        },
        onRequestDeviceError(error) {
          console.error(error);
        },
        onPreviousUnaviable() {
          window.localStorage.removeItem('previousDevice');
        },
      })
    );
  }, []);

  useEffect(() => {
    const decoder = new ResponseDecoder(JKBMS_PROTOCOL);

    decoder.decode(unpackCommand(JKBMS_PROTOCOL.commands[1]), mockCellDataResponse);
  }, []);

  return (
    <div
      className='App'
      onClick={() => {
        if (status === 'disconnected') {
          device?.connect({
            previous:
              JSON.parse(window.localStorage.getItem('previousDevice') || 'null') ??
              (undefined as DeviceIdentificator | undefined),
          });
        } else {
          device?.disconnect();
        }
      }}
    >
      <h2>{status === 'disconnected' ? `Click to connect` : status}</h2>

      {data && data.batteryData && (
        <>
          <h1>
            {String(data.batteryData.voltage?.toFixed(5))?.slice(0, 6)}
            {'V'}
            <br />
            {String(data.batteryData.current?.toFixed(5))?.slice(0, 6)}
            {'A'}
            <br />
            {String(data.batteryData.power?.toFixed(5))?.slice(0, 6)}
            {'W'}
          </h1>
        </>
      )}

      <LogViewer />
    </div>
  );
}

export default App;
