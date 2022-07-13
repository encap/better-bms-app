import { memo, MouseEventHandler, useState } from 'react';
import { SettingsData } from 'interfaces/data';
import { useDevice } from 'components/providers/DeviceProvider';
import { QuickTogglesContainer, ToggleLabel, ToggleWithLabel } from './styles';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { Toggle } from '@geist-ui/core';
import { useRef } from 'react';
import { UILog } from 'utils/logger';
import { ToggleEvent } from '@geist-ui/core/esm/toggle';

type QuickTogglesProps = {
  settingsData: SettingsData | null;
};

const QuickToggles = ({ settingsData }: QuickTogglesProps) => {
  const { status, device } = useDevice();

  const [charge, setCharge] = useState(false);
  const [discharge, setDischarge] = useState(false);
  const isLoading = useRef(true);

  const isDisabled = !settingsData || status !== 'connected';

  useEffect(() => {
    if (settingsData) {
      setCharge(settingsData.charge);
      setDischarge(settingsData.discharge);

      isLoading.current = false;
    }
  }, [settingsData]);

  const handleChargeToggle = useCallback(
    async (event: ToggleEvent) => {
      if (device) {
        isLoading.current = true;
        const value = event.target.checked;
        UILog.info(`Toggle charge ${value}`);
        setCharge(value);

        try {
          await device?.toggleCharging(value);
        } catch {
          setCharge(!value);
        }
      } else {
        UILog.warn(`Device not ready for toggle`);
      }
    },
    [device]
  );

  const handleDischargeToggle = useCallback(
    async (event: ToggleEvent) => {
      if (device) {
        isLoading.current = true;
        const value = event.target.checked;
        UILog.info(`Toggle discharge ${value}`);
        setDischarge(value);

        try {
          await device?.toggleDischarging(value);
        } catch {
          setDischarge(!value);
        }
      } else {
        UILog.warn(`Device not ready for toggle`);
      }
    },
    [device]
  );

  const blockInputIfLoading = useCallback<MouseEventHandler>((ev) => {
    // I don't want to use disabled attribute for that because it makes toggle gray
    if (isLoading.current) {
      ev.preventDefault();
      UILog.warn(`Toggle blocked while loading`);
    }
  }, []);

  return (
    <QuickTogglesContainer>
      <ToggleWithLabel>
        <ToggleLabel>{'Charge'}</ToggleLabel>
        <Toggle
          checked={charge}
          onChange={handleChargeToggle}
          onClick={blockInputIfLoading}
          scale={3}
          disabled={isDisabled}
          type='success'
        />
      </ToggleWithLabel>
      <ToggleWithLabel>
        <ToggleLabel>{'Discharge'}</ToggleLabel>
        <Toggle
          checked={discharge}
          onChange={handleDischargeToggle}
          onClick={blockInputIfLoading}
          scale={3}
          disabled={isDisabled}
          type='error'
        />
      </ToggleWithLabel>
    </QuickTogglesContainer>
  );
};

export default memo(QuickToggles);
