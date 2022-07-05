import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import './App.css';
import { LineChart } from './components/molecules/LineChart';
import LogViewer from './components/molecules/LogViewer';
import { JKBMS } from './devices/jkbms';
import { Data } from './interfaces/data';
import { Device, DeviceIdentificator, DeviceStatus } from './interfaces/device';
import { CellsGrid, TwoColumnGrid } from './styles';
import { UILog } from './utils/logger';

function App() {
  const [status, setStatus] = useState<DeviceStatus>('disconnected');
  const [data, setData] = useState<Data | null>(null);
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    UILog.info('App rendered');

    setDevice(
      new JKBMS({
        onDataChange(newData) {
          // @ts-ingore
          setData(
            (current) =>
              ({
                ...current,
                ...newData,
                batteryData: {
                  ...current?.batteryData,
                  ...newData.batteryData,
                },
                deviceInfo: {
                  ...current?.deviceInfo,
                  ...newData.deviceInfo,
                },
              } as Data)
          );
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

  const lowestVol = useMemo(
    () =>
      data?.batteryData?.voltages
        ? Math.min(...data.batteryData.voltages.filter((v) => v !== 0))
        : 0,
    [data]
  );
  const highestVol = useMemo(
    () => (data?.batteryData?.voltages ? Math.max(...data.batteryData.voltages) : 0),
    [data]
  );

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

      {data && data.batteryData && data.batteryData.voltage && (
        <>
          <h2>
            {data.deviceInfo?.model && (
              <>
                {data.deviceInfo?.model} {'hw'}
                {data.deviceInfo?.hardwareVersion}
              </>
            )}
          </h2>

          <h1>
            {String(data.batteryData.voltage?.toFixed(5))?.slice(0, 6)}
            {'V'}
            <br />
            {String(data.batteryData.current?.toFixed(5))?.slice(0, 6)}
            {'A'}
            <br />
            {String(data.batteryData.power?.toFixed(5))?.slice(0, 6)}
            {'W'}
            <br />
            {String(data.batteryData.remainingCapacity?.toFixed(2))?.slice(0, 5)}
            {'Ah'}
          </h1>

          <ErrorBoundary fallback={<div />}>
            <LineChart currentData={data} />
          </ErrorBoundary>

          <TwoColumnGrid>
            <label>
              {'tempControll'}
              {': '}
            </label>
            <span>{data?.batteryData?.temperatureProbes?.[0] ?? '-'}</span>
            <label>
              {'tempPositive'}
              {': '}
            </label>
            <span>{data?.batteryData?.temperatureProbes?.[1] ?? '-'}</span>

            {Object.entries(data?.batteryData || {})
              .filter(([, value]) => typeof value === 'number')
              // @ts-ignore
              .map(([name, value]: [string, number]) => (
                <React.Fragment key={name}>
                  <label>
                    {name.slice(0, 14)}
                    {': '}
                  </label>
                  <span>{value ?? '-'}</span>
                </React.Fragment>
              ))}
          </TwoColumnGrid>

          <CellsGrid>
            {data.batteryData?.voltages?.map((voltage, i) => (
              <span
                key={i}
                className={classNames(
                  Math.abs(lowestVol - highestVol) > 0.004 &&
                    voltage !== 0 &&
                    (voltage === lowestVol ? 'lowest' : voltage === highestVol ? 'highest' : '')
                )}
              >{`${String(i + 1).padStart(2, '0')}: ${
                voltage === 0 ? '----- ' : voltage.toFixed(3)
              }`}</span>
            ))}
          </CellsGrid>
        </>
      )}

      <LogViewer />
    </div>
  );
}

export default App;
