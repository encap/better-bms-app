import { Grid, Loading, useToasts } from '@geist-ui/core';
import { useCallback, useEffect, useState } from 'react';
import { Freeze } from 'react-freeze';
import { useLocalStorage } from 'react-use';
import { PREVIOUS_DEVICE_LOCAL_STORAGE_KEY } from '../../../config';
import { JKBMS } from '../../../devices/jkbms';
import { useWakelock } from '../../../hooks/useWakelock';
import { DeviceInfoData, LiveData, SettingsData } from '../../../interfaces/data';
import { DeviceIdentificator } from '../../../interfaces/device';
import { UILog } from '../../../utils/logger';
import BottomNavigation from '../../molecules/BottomNavigation';
import LogViewer from '../../molecules/LogViewer';
import QuickToggles from '../../molecules/QuickToggles';
import TopBar from '../../molecules/TopBar';
import { useDevice } from '../providers/DeviceProvider';
import Summary from '../Summary';
import { AppContainer, ContentContainer } from './styles';

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

        // setData(null);
        releaseWakelock();
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

      <ContentContainer>
        <Freeze freeze={selectedScreen !== 'Logs'}>
          <LogViewer />
        </Freeze>

        {(() => {
          if (liveData?.voltage) {
            switch (selectedScreen) {
              case 'Summary': {
                return <Summary liveData={liveData} />;
              }
            }
          } else {
            <Grid.Container gap={2.5}>
              <Grid xs={24}>
                <Loading type='success' spaceRatio={2} />
              </Grid>
              <Grid xs={24}>
                <Loading type='secondary' spaceRatio={2} />
              </Grid>
              <Grid xs={24}>
                <Loading type='warning' spaceRatio={2} />
              </Grid>
              <Grid xs={24}>
                <Loading type='error' spaceRatio={2} />
              </Grid>
            </Grid.Container>;
          }
        })()}
      </ContentContainer>

      <BottomNavigation selectedScreen={selectedScreen} setSelectedScreen={setSelectedScreen} />
    </AppContainer>
  );
};

export default App;
