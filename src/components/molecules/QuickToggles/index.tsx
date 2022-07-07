import { memo, useState } from 'react';
import { SettingsData } from 'interfaces/data';
import { useDevice } from 'components/providers/DeviceProvider';
import { QuickTogglesContainer, ToggleWithLabel } from './styles';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { ToggleProps } from '@geist-ui/core';
import { ToggleEvent } from '@geist-ui/core/esm/toggle';

type QuickTogglesProps = {
  settingsData: SettingsData | null;
};

const QuickToggles = ({ settingsData }: QuickTogglesProps) => {
  const { status } = useDevice();

  const [charge, setCharge] = useState(false);
  const [discharge, setDischarge] = useState(false);

  const isDisabled = !settingsData || status !== 'connected';

  useEffect(() => {
    if (settingsData) {
      setCharge(settingsData.charge);
      setDischarge(settingsData.discharge);
    }
  }, [settingsData]);

  const handleChargeToggle = useCallback((event: ToggleEvent) => {
    setCharge(event.target.checked);
  }, []);

  const handleDischargeToggle = useCallback((event: ToggleEvent) => {
    setDischarge(event.target.checked);
  }, []);

  return (
    <QuickTogglesContainer>
      <ToggleWithLabel
        checked={charge}
        onChange={handleChargeToggle}
        scale={3}
        data-label='Charge'
        disabled={isDisabled}
      />
      <ToggleWithLabel
        checked={discharge}
        onChange={handleDischargeToggle}
        scale={3}
        type='error'
        data-label='Discharge'
        disabled={isDisabled}
      />
    </QuickTogglesContainer>
  );
};

export default memo(QuickToggles);
