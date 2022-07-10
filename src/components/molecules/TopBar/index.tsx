import { memo, MouseEventHandler, useCallback, useEffect, useRef } from 'react';
import { DeviceInfoData, LiveData } from 'interfaces/data';
import { useDevice } from 'components/providers/DeviceProvider';
import {
  DeviceStatusText as DeviceStatusTitle,
  PingContainer,
  PingDot,
  SmallText,
  ToolbarContainer as TopBarContainer,
} from './styles';

type TopBarProps = {
  deviceInfoData: DeviceInfoData | null;
  liveData: LiveData | null;
  onClick?: MouseEventHandler;
};

const TopBar = ({ deviceInfoData, liveData, onClick }: TopBarProps) => {
  const heartbeatToggle = useRef(false);

  const { device, status } = useDevice();

  useEffect(() => {
    heartbeatToggle.current = !heartbeatToggle.current;
  }, [liveData]);

  const handleStatusClick = useCallback<MouseEventHandler>(
    (event) => {
      if (status !== 'disconnected') {
        device?.disconnect('user');
      } else {
        onClick?.(event);
      }
    },
    [device, status, onClick]
  );

  return (
    <>
      <TopBarContainer>
        {status === 'connected' && deviceInfoData?.firmwareVersion && (
          <SmallText>{deviceInfoData.firmwareVersion}</SmallText>
        )}
        <DeviceStatusTitle onClick={handleStatusClick}>
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
