import { useCallback, useEffect, useState } from 'react';
import { Freeze } from 'react-freeze';
import { useLocalStorage } from 'react-use';
import { DeepRequired } from 'ts-essentials';
import { PREVIOUS_DEVICE_LOCAL_STORAGE_KEY } from '../../../config';
import { JKBMS } from '../../../devices/jkbms';
import { useWakelock } from '../../../hooks/useWakelock';
import { Data } from '../../../interfaces/data';
import { DeviceIdentificator } from '../../../interfaces/device';
import { UILog } from '../../../utils/logger';
import LogViewer from '../../molecules/LogViewer';
import TopBar from '../../molecules/TopBar';
import { useDevice } from '../providers/DeviceProvider';
import Summary from '../Summary';
import { AppContainer } from './styles';

type Screen = 'Summary' | 'Logs' | 'Settings' | 'Charts';

const App = () => {
  const [previousDevice, setPreviousDevice] = useLocalStorage<DeviceIdentificator | null>(
    PREVIOUS_DEVICE_LOCAL_STORAGE_KEY,
    null
  );

  const { device, status, setDevice, setStatus } = useDevice();
  const { acquireWakelock, releaseWakelock } = useWakelock();

  const [data, setData] = useState<Data | null>(null);

  const [screen, setScreen] = useState<Screen>('Logs');

  useEffect(() => {
    UILog.info('App rendered');

    const newDevice = new JKBMS({
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
      async onConnected(deviceIdentificator) {
        setPreviousDevice(deviceIdentificator);
        acquireWakelock();
        setScreen('Summary');
      },
      onDisconnected() {
        // setData(null);
        releaseWakelock();
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
    });

    setDevice(newDevice);

    return () => {
      newDevice.disconnect();
    };
  }, []);

  const handleClickAnywhere = useCallback(() => {
    if (status === 'disconnected') {
      device?.connect({
        previous: previousDevice ?? undefined,
      });
    }
  }, [status, device]);

  return (
    <AppContainer onClick={handleClickAnywhere}>
      <>
        <TopBar data={data} />

        <Freeze freeze={screen !== 'Logs'}>
          <LogViewer />
        </Freeze>

        {(() => {
          switch (screen) {
            case 'Summary': {
              if (data?.batteryData?.voltage) {
                return <Summary data={data as DeepRequired<Data>} />;
              }
            }
          }
        })()}
      </>
    </AppContainer>
  );
};

export default App;
