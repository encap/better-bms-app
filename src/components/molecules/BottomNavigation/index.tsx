import { Tabs } from '@geist-ui/core';
import { Screens } from '../../organisms/App';
import { useDevice } from '../../organisms/providers/DeviceProvider';
import { BottomNavigationContainer } from './styles';

type BottomNavigationProps = {
  selectedScreen: Screens;
  setSelectedScreen: (newScreen: Screens) => void;
};

const BottomNavigation = ({ selectedScreen, setSelectedScreen }: BottomNavigationProps) => {
  const { status } = useDevice();

  return (
    <BottomNavigationContainer>
      <Tabs value={selectedScreen} onChange={(value) => setSelectedScreen(value as Screens)}>
        <Tabs.Item label='Logs' value='Logs' />
        <Tabs.Item label='Summary' value='Summary' disabled={status !== 'connected'} />
        <Tabs.Item label='Details' value='Details' disabled={status !== 'connected'} />
        <Tabs.Item label='Settings' value='Settings' disabled={status !== 'connected'} />
      </Tabs>
    </BottomNavigationContainer>
  );
};

export default BottomNavigation;
