import { useToasts } from '@geist-ui/core';
import { useCallback, useEffect, useState } from 'react';
import { Freeze } from 'react-freeze';
import { useLocalStorage } from 'react-use';
import { PREVIOUS_DEVICE_LOCAL_STORAGE_KEY } from 'config/index';
import { JKBMS } from 'devices/jkbms';
import { useWakelock } from 'hooks/useWakelock';
import { DeviceInfoData, LiveData, SettingsData } from 'interfaces/data';
import { DeviceIdentificator } from 'interfaces/device';
import { UILog } from 'utils/logger';
import BottomNavigation from 'components/molecules/BottomNavigation';
import LogViewer from 'components/molecules/LogViewer';
import QuickToggles from 'components/molecules/QuickToggles';
import TopBar from 'components/molecules/TopBar';
import { useDevice } from 'components/providers/DeviceProvider';
import Summary from 'components/organisms/Summary';
import { AppContainer, ContentContainer } from './styles';
import PageLoader from 'components/atoms/PageLoader';

export type Screens = 'Logs' | 'Summary' | 'Settings' | 'Details';

const App = () => {
  const [previousDevice, setPreviousDevice] = useLocalStorage<DeviceIdentificator | null>(
    PREVIOUS_DEVICE_LOCAL_STORAGE_KEY,
    null
  );

  const { device, status, setDevice, setStatus } = useDevice();
  const { acquireWakelock, releaseWakelock } = useWakelock();

  const { setToast } = useToasts();

  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [deviceInfoData, setDeviceInfoData] = useState<DeviceInfoData | null>(null);
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);

  const [selectedScreen, setSelectedScreen] = useState<Screens>('Logs');

  useEffect(() => {
    UILog.info('App rendered');

    const newDevice = new JKBMS({
      onDataReceived(dataType, newData) {
        switch (dataType) {
          case 'LIVE_DATA': {
            setLiveData(newData as LiveData);
            break;
          }
          case 'DEVICE_INFO': {
            setDeviceInfoData(newData as DeviceInfoData);
            break;
          }
          case 'SETTINGS': {
            setSettingsData(newData as SettingsData);
          }
        }
      },
      onStatusChange(newStatus) {
        setStatus(newStatus);
        if (newStatus === 'connecting') {
          setLiveData(null);
          setDeviceInfoData(null);
          setSettingsData(null);
          setSelectedScreen('Summary');
        }
      },
      async onConnected(deviceIdentificator) {
        setPreviousDevice(deviceIdentificator);
        acquireWakelock();
        setSelectedScreen('Summary');
      },
      onDisconnected(reason) {
        if (reason === 'inactivity') {
          setToast({
            type: 'warning',
            text: `Disconnected, Reason: ${reason}`,
            delay: 2000,
          });
        }

        releaseWakelock();

        if (!liveData) {
          setSelectedScreen('Logs');
        }
      },
      onError(error) {
        console.error(error);
        setToast({
          type: 'error',
          text: error?.message,
          delay: 2000,
        });
      },
      onRequestDeviceError(error) {
        console.error(error);
        // setToast({
        //   type: 'error',
        //   text: error?.message,
        //   delay: 2000,
        // });
      },
      onPreviousUnavailable() {
        setPreviousDevice(null);
        setToast({
          type: 'warning',
          text: `Previous device unavailable. Tap again.`,
          delay: 3000,
        });
      },
    });

    setDevice(newDevice);

    return () => {
      newDevice.disconnect('reset');
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
      <TopBar deviceInfoData={deviceInfoData} liveData={liveData} />
      {status === 'connected' && <QuickToggles settingsData={settingsData} />}

      <ContentContainer onClick={handleClickAnywhere}>
        <Freeze freeze={selectedScreen !== 'Logs'}>
          <LogViewer />
        </Freeze>

        {liveData ? (
          <>
            <Freeze freeze={selectedScreen !== 'Summary'}>
              <Summary liveData={liveData} />
            </Freeze>
          </>
        ) : (
          selectedScreen !== 'Logs' && <PageLoader />
        )}
      </ContentContainer>

      <BottomNavigation selectedScreen={selectedScreen} setSelectedScreen={setSelectedScreen} />
    </AppContainer>
  );
};

export default App;
