import { useToasts } from '@geist-ui/core';
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
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
import DataLoggerProvider from 'components/providers/DataLogger';
import Details from '../Details';

const SCREENSAVER_TIMEOUT = 1000 * 60 * 5;

export type Screens = 'Logs' | 'Summary' | 'Settings' | 'Details';

const App = () => {
  const [previousDevice, setPreviousDevice] = useLocalStorage<DeviceIdentificator | null>(
    PREVIOUS_DEVICE_LOCAL_STORAGE_KEY,
    null
  );

  const [isScreensaver, setIsScreensaver] = useState(false);
  const screensaverTimeout = useRef<NodeJS.Timer | null>(null);

  const { device, status, setDevice, setStatus } = useDevice();
  const { acquireWakelock, releaseWakelock } = useWakelock();

  const { setToast } = useToasts();

  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [deviceInfoData, setDeviceInfoData] = useState<DeviceInfoData | null>(null);
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);

  const [selectedScreen, setSelectedScreen] = useState<Screens>('Logs');

  const scheduleScreensaver = useCallback(() => {
    if (!isScreensaver) {
      if (screensaverTimeout.current) {
        clearTimeout(screensaverTimeout.current);
      }
      UILog.info(
        `After ${
          SCREENSAVER_TIMEOUT / 1000 / 60
        }min of inactivity screen will be dimmed to prevent burn in`
      );
      screensaverTimeout.current = setTimeout(() => setIsScreensaver(true), SCREENSAVER_TIMEOUT);
    }
  }, [isScreensaver]);

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
        scheduleScreensaver();

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
  }, [setStatus, setDevice]);

  const handleClickAnywhere = useCallback<MouseEventHandler>(
    (ev) => {
      setIsScreensaver(false);
      scheduleScreensaver();

      if (status === 'disconnected') {
        ev.stopPropagation();
        device?.connect({
          previous: previousDevice ?? undefined,
        });
      }
    },
    [status, device]
  );

  useEffect(() => {
    if (isScreensaver && liveData && liveData.current < -0.2) {
      setIsScreensaver(false);
    }
    if (!screensaverTimeout.current && liveData && liveData.current >= 0) {
      scheduleScreensaver();
    }
  }, [liveData]);

  useEffect(() => {
    if (isScreensaver) {
      UILog.info(`Dimming the screen to prevent burn in`);
      // Prevent OLED burn in
      releaseWakelock();
      document.body.style.opacity = '0.2';
      if (screensaverTimeout.current) {
        clearTimeout(screensaverTimeout.current);
      }
    } else {
      acquireWakelock();
      document.body.style.opacity = '1';
      scheduleScreensaver();
    }
  }, [isScreensaver]);

  return (
    <DataLoggerProvider liveData={liveData}>
      <AppContainer onClick={handleClickAnywhere}>
        <TopBar deviceInfoData={deviceInfoData} liveData={liveData} />
        {status === 'connected' && <QuickToggles settingsData={settingsData} />}

        <ContentContainer>
          <Freeze freeze={selectedScreen !== 'Logs'}>
            <LogViewer />
          </Freeze>

          {liveData ? (
            <>
              <Freeze freeze={selectedScreen !== 'Summary'}>
                <Summary liveData={liveData} />
              </Freeze>
              <Freeze freeze={selectedScreen !== 'Details'}>
                <Details liveData={liveData} />
              </Freeze>
            </>
          ) : (
            selectedScreen !== 'Logs' && <PageLoader />
          )}
        </ContentContainer>

        <BottomNavigation selectedScreen={selectedScreen} setSelectedScreen={setSelectedScreen} />
      </AppContainer>
    </DataLoggerProvider>
  );
};

export default App;
