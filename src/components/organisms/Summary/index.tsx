import React, { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { liveDataUIConfig } from 'config/uiConfig';
import { LiveData } from 'interfaces/data';
import { formatValue } from 'utils/formatValue';
import { SummaryContainer, InfoGrid, MainInfoContainer, MainInfo, MainInfoUnit } from './styles';
import LineChart from 'components/molecules/LineChart';

type SummaryProps = {
  liveData: LiveData;
};

const Summary = ({ liveData }: SummaryProps) => {
  return (
    <SummaryContainer>
      <MainInfoContainer>
        <MainInfo>
          {String(liveData.voltage.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'V'}</MainInfoUnit>
        </MainInfo>
        <MainInfo>
          {String(liveData.current.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'A'}</MainInfoUnit>
        </MainInfo>
        <MainInfo>
          {String(liveData.power.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'W'}</MainInfoUnit>
        </MainInfo>
        <MainInfo>
          {String(liveData.remainingCapacity.toFixed(5)).slice(0, 5)}
          <MainInfoUnit>{'Ah'}</MainInfoUnit>
        </MainInfo>
      </MainInfoContainer>

      <ErrorBoundary fallback={<div />}>
        <LineChart duration={1000 * 60 * 2} frameRate={5} />
      </ErrorBoundary>

      <InfoGrid>
        {formatValue(
          liveData,
          'temperatureProbes',
          liveData.temperatureProbes?.[0],
          'T controller'
        )}
        {formatValue(liveData, 'temperatureProbes', liveData.temperatureProbes?.[1], 'T positive')}

        {Object.entries(liveData || {})
          .filter(([key, name]) => Object.hasOwn(liveDataUIConfig, key) && typeof name !== 'object')
          .filter(([key]) =>
            (['cellVoltageDelta', 'balanceCurrent'] as (keyof LiveData)[]).includes(
              key as keyof LiveData
            )
          )
          // @ts-ignore
          .map(([name, value]: [string, number]) => (
            <React.Fragment key={name}>
              {
                // @ts-ignore
                formatValue(liveData, name, value)
              }
            </React.Fragment>
          ))}
      </InfoGrid>
    </SummaryContainer>
  );
};

export default memo(Summary);
