import { memo, useCallback, useEffect, useRef } from 'react';
import { DeviceInfoData, LiveData } from 'interfaces/data';
import { useDevice } from 'components/providers/DeviceProvider';
import {
  DeviceStatusText as DeviceStatusTitle,
  PingContainer,
  PingDot,
  SmallText,
  ToolbarContainer as TopBarContainer,
} from './styles';
import { useLongPress } from 'use-long-press';

type TopBarProps = {
  deviceInfoData: DeviceInfoData | null;
  liveData: LiveData | null;
};

const TopBar = ({ deviceInfoData, liveData }: TopBarProps) => {
  const heartbeatToggle = useRef(false);

  const { device, status } = useDevice();

  useEffect(() => {
    heartbeatToggle.current = !heartbeatToggle.current;
  }, [liveData]);

  const handleStatusClick = useCallback(() => {
    if (status !== 'disconnected') {
      device?.disconnect('user');
    }
  }, [device, status]);

  const bindLongPress = useLongPress(handleStatusClick, {
    threshold: 1000,
  });

  return (
    <>
      <TopBarContainer>
        {status === 'connected' && deviceInfoData?.firmwareVersion && (
          <SmallText>{deviceInfoData.firmwareVersion}</SmallText>
        )}
        <DeviceStatusTitle {...bindLongPress()}>
          {status === 'disconnected' ? `Click anywhere to connect` : status}
        </DeviceStatusTitle>
        {status === 'connected' && liveData?.timeSinceLastOne && (
          <PingContainer>
            <SmallText>{`${String(liveData?.timeSinceLastOne)}ms`}</SmallText>
            <PingDot heartbeat={heartbeatToggle.current} />
          </PingContainer>
        )}
      </TopBarContainer>
    </>
  );
};

export default memo(TopBar);
