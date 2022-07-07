import classNames from 'classnames';
import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { liveDataUIConfig } from 'config/uiConfig';
import { LiveData } from 'interfaces/data';
import { formatValue } from 'utils/formatValue';
import { LineChart } from 'components/molecules/LineChart';
import {
  CellsGrid,
  SummaryContainer,
  InfoGrid,
  MainInfoContainer,
  MainInfo,
  MainInfoUnit,
} from './styles';

type SummaryProps = {
  liveData: LiveData;
};

const Summary = ({ liveData }: SummaryProps) => {
  const lowestVol = useMemo(
    () => (liveData.voltages ? Math.min(...liveData.voltages.filter((v) => v !== 0)) : 0),
    [liveData]
  );
  const highestVol = useMemo(
    () => (liveData.voltages ? Math.max(...liveData.voltages) : 0),
    [liveData]
  );

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
        <LineChart liveData={liveData} />
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

      <CellsGrid>
        {liveData.voltages?.map((voltage, i) => (
          <span
            key={i}
            className={classNames(
              liveData.cellVoltageDelta > 0.004 &&
                voltage !== 0 &&
                (voltage === lowestVol ? 'lowest' : voltage === highestVol ? 'highest' : '')
            )}
          >
            {`${String(i + 1).padStart(2, '0')}: ${
              voltage ? voltage.toFixed(3) : '\xa0-\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0'
            }`}
          </span>
        ))}
      </CellsGrid>
    </SummaryContainer>
  );
};

export default Summary;
