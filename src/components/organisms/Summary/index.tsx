import classNames from 'classnames';
import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { DeepRequired } from 'ts-essentials';
import { Data } from '../../../interfaces/data';
import { formatValue } from '../../../utils/formatValue';
import { LineChart } from '../../molecules/LineChart';
import {
  CellsGrid,
  SummaryContainer,
  InfoGrid,
  MainInfoContainer,
  MainInfo,
  MainInfoUnit,
} from './styles';

type SummaryProps = {
  data: DeepRequired<Data>;
};

const Summary = ({ data }: SummaryProps) => {
  const lowestVol = useMemo(
    () =>
      data.batteryData.voltages ? Math.min(...data.batteryData.voltages.filter((v) => v !== 0)) : 0,
    [data]
  );
  const highestVol = useMemo(
    () => (data.batteryData.voltages ? Math.max(...data.batteryData.voltages) : 0),
    [data]
  );

  return (
    <SummaryContainer>
      <MainInfoContainer>
        <MainInfo>
          {String(data.batteryData.voltage.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'V'}</MainInfoUnit>
        </MainInfo>
        <MainInfo>
          {String(data.batteryData.current.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'A'}</MainInfoUnit>
        </MainInfo>
        <MainInfo>
          {String(data.batteryData.power.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'W'}</MainInfoUnit>
        </MainInfo>
        <MainInfo>
          {String(data.batteryData.remainingCapacity.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'Ah'}</MainInfoUnit>
        </MainInfo>
      </MainInfoContainer>

      <ErrorBoundary fallback={<div />}>
        <LineChart currentData={data} />
      </ErrorBoundary>

      <InfoGrid>
        {formatValue(
          data.batteryData,
          'temperatureProbes',
          data.batteryData.temperatureProbes?.[0],
          'T controller'
        )}
        {formatValue(
          data.batteryData,
          'temperatureProbes',
          data.batteryData.temperatureProbes?.[1],
          'T positive'
        )}

        {Object.entries(data.batteryData || {})
          .filter(([, value]) => typeof value === 'number')
          // @ts-ignore
          .map(([name, value]: [string, number]) => (
            <React.Fragment key={name}>
              {
                // @ts-ignore
                formatValue(data.batteryData, name, value)
              }
            </React.Fragment>
          ))}
      </InfoGrid>

      <CellsGrid>
        {data.batteryData.voltages?.map((voltage, i) => (
          <span
            key={i}
            className={classNames(
              data.batteryData.cellVoltageDelta > 0.004 &&
                voltage !== 0 &&
                (voltage === lowestVol ? 'lowest' : voltage === highestVol ? 'highest' : '')
            )}
          >{`${String(i + 1).padStart(2, '0')}: ${
            voltage === 0 ? '----- ' : voltage.toFixed(3)
          }`}</span>
        ))}
      </CellsGrid>
    </SummaryContainer>
  );
};

export default Summary;
