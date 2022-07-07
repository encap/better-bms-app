import { ReactNode } from 'react';
import { liveDataUIConfig } from 'config/uiConfig';
import { DeviceInfoData, LiveData, SettingsData } from 'interfaces/data';
import { GlobalLog } from './logger';

export function formatValue<T extends LiveData>(
  dataSource: LiveData,
  name: keyof Exclude<T, undefined>,
  overrideValue?: number | string | null | undefined,
  overrideLabel?: string
): ReactNode {
  const options = liveDataUIConfig[name as keyof typeof liveDataUIConfig];

  if (!options) {
    GlobalLog.error(`Missing UIConfig options for ${String(name)}`),
      { dataSource, name, overrideLabel, overrideValue };
    return 'error';
  }

  try {
    // @ts-ignore;
    const value = overrideValue ?? (dataSource[name] as number | string);

    const text = typeof value === 'string' ? value : value?.toFixed(options.decimals);

    const formattedValue =
      value === null || value === undefined ? '-' : `${text}${options.unit || ''}`;

    if (options.label || overrideLabel !== null) {
      return (
        <>
          <label>
            {overrideLabel ?? options.label}
            {': '}
          </label>
          <span>{formattedValue}</span>
        </>
      );
    }

    return formattedValue;
  } catch (error) {
    GlobalLog.error(`Failed to format ${String(name)}`, {
      dataSource,
      name,
      overrideLabel,
      overrideValue,
    });
    return 'error';
  }
}
