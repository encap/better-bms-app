import { ReactNode } from 'react';
import { batteryDataUIConfig } from '../config/uiConfig';
import { Data } from '../interfaces/data';

export function formatValue<T extends keyof Data = 'batteryData'>(
  // @ts-ignore
  dataSource: Exclude<Exclude<Data[T], undefined>, undefined | never>,
  name: keyof Exclude<Data[T], undefined>,
  overrideValue?: number | string | null | undefined,
  overrideLabel?: string
): ReactNode {
  // @ts-ignore;
  const options = batteryDataUIConfig[name];

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
}
