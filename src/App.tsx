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
import { formatValue } from './utils/formatValue';
import { UILog } from './utils/logger';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { PREVIOUS_DEVICE_LOCAL_STORAGE_KEY } from './config';

function App() {
  const [previousDevice, setPreviousDevice] = useLocalStorage<DeviceIdentificator | null>(
    PREVIOUS_DEVICE_LOCAL_STORAGE_KEY,
    null
  );

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
          setPreviousDevice(deviceIdentificator);
        },
        onDisconnected() {
          setData(null);
        },
        onError(error) {
          console.error(error);
        },
        onRequestDeviceError(error) {
          console.error(error);
        },
        onPreviousUnaviable() {
          setPreviousDevice(null);
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
            previous: previousDevice ?? undefined,
          });
        }
      }}
    >
      <h2
        onClick={() => {
          if (status !== 'disconnected') {
            device?.disconnect();
          }
        }}
      >
        {status === 'disconnected' ? `Click anywhere to connect` : status}
        {status === 'connected' &&
          data?.timeSinceLastOne &&
          `\xa0\xa0${String(data?.timeSinceLastOne).padStart(3, '\xa0')}ms`}
      </h2>

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
            {formatValue(
              data.batteryData,
              'temperatureProbes',
              data?.batteryData?.temperatureProbes?.[0],
              'T controller'
            )}
            {formatValue(
              data.batteryData,
              'temperatureProbes',
              data?.batteryData?.temperatureProbes?.[1],
              'T positive'
            )}

            {Object.entries(data?.batteryData || {})
              .filter(([, value]) => typeof value === 'number')
              // @ts-ignore
              .map(([name, value]: [string, number]) => (
                <React.Fragment key={name}>
                  {
                    // @ts-ignore
                    formatValue(data.batteryData, name, value)
                  }
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
