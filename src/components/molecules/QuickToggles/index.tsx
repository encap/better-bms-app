import { memo } from 'react';
import { SettingsData } from 'interfaces/data';
import { useDevice } from 'components/providers/DeviceProvider';
import { QuickTogglesContainer, ToggleWithLabel } from './styles';

type QuickTogglesProps = {
  settingsData: SettingsData | null;
};

const QuickToggles = ({ settingsData }: QuickTogglesProps) => {
  const { status } = useDevice();

  const isDisabled = !settingsData || status !== 'connected';

  return (
    <QuickTogglesContainer>
      <ToggleWithLabel initialChecked scale={3} data-label='Charge' disabled={isDisabled} />
      <ToggleWithLabel
        initialChecked
        scale={3}
        type='error'
        data-label='Discharge'
        disabled={isDisabled}
      />
    </QuickTogglesContainer>
  );
};

export default memo(QuickToggles);
