import { useCallback, useEffect, useRef } from 'react';
import { Data } from '../../../interfaces/data';
import { useDevice } from '../../organisms/providers/DeviceProvider';
import {
  DeviceStatusText as DeviceStatusTitle,
  PingContainer,
  PingDot,
  SmallText,
  ToolbarContainer as TopBarContainer,
} from './styles';

type TopBarProps = {
  data: Data | null;
};

const TopBar = ({ data }: TopBarProps) => {
  const heartbeatToggle = useRef(false);

  const { device, status } = useDevice();

  useEffect(() => {
    heartbeatToggle.current = !heartbeatToggle.current;
  }, [data]);

  const handleStatusClick = useCallback(() => {
    if (status !== 'disconnected') {
      device?.disconnect();
    }
  }, [device, status]);

  return (
    <TopBarContainer>
      {status === 'connected' && data?.deviceInfo?.firmwareVersion && (
        <SmallText>{data.deviceInfo.firmwareVersion}</SmallText>
      )}
      <DeviceStatusTitle onClick={handleStatusClick}>
        {status === 'disconnected' ? `Click anywhere to connect` : status}
      </DeviceStatusTitle>
      {status === 'connected' && data?.timeSinceLastOne && (
        <PingContainer>
          <SmallText>{`${String(data?.timeSinceLastOne)}ms`}</SmallText>
          <PingDot heartbeat={heartbeatToggle.current} />
        </PingContainer>
      )}
    </TopBarContainer>
  );
};

export default TopBar;
