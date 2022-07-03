import { useState } from 'react';
import './App.css';
import LogViewer from './components/molecules/LogViewer';
import { JKBMS } from './devices/jkbms';
import { useRefFn } from './hooks/useRefFn';
import { Data } from './interfaces/data';
import { DeviceIdentificator, DeviceStatus } from './interfaces/device';

function App() {
  const [status, setStatus] = useState<DeviceStatus>('disconnected');
  const [data, setData] = useState<Data | null>(null);
  const { current: device } = useRefFn(
    () =>
      new JKBMS({
        onDataChange(newData) {
          setData(newData);
        },
        onStatusChange(newStatus) {
          setStatus(newStatus);
        },
        onConnected(deviceIdentificator) {
          window.localStorage.setItem(
            'previousDevice',
            JSON.stringify(deviceIdentificator)
          );
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

  return (
    <div
      className='App'
      onClick={() => {
        device.connect({
          previous:
            JSON.parse(
              window.localStorage.getItem('previousDevice') || 'null'
            ) ?? (undefined as DeviceIdentificator | undefined),
        });
      }}
    >
      <h2>{status === 'disconnected' ? `Click to connect` : status}</h2>

      {data && data.batteryData && (
        <>
          <h1>
            {String(data.batteryData.voltage.toFixed(5)).slice(0, 6)}
            {'V'}
            <br />
            {String(data.batteryData.current.toFixed(5)).slice(0, 6)}
            {'A'}
            <br />
            {String(data.batteryData.power.toFixed(5)).slice(0, 6)}
            {'W'}
          </h1>
        </>
      )}

      <LogViewer />
    </div>
  );
}

export default App;
