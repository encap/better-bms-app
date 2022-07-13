import classNames from 'classnames';
import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { liveDataUIConfig } from 'config/uiConfig';
import { LiveData } from 'interfaces/data';
import { formatValue } from 'utils/formatValue';
import LineChart from 'components/molecules/LineChart';
import { CellsGrid, DetailsContainer, InfoGrid } from './styles';

type DetailsProps = {
  liveData: LiveData;
};

const Details = ({ liveData }: DetailsProps) => {
  const lowestVol = useMemo(
    () => (liveData.voltages ? Math.min(...liveData.voltages.filter((v) => v !== 0)) : 0),
    [liveData]
  );
  const highestVol = useMemo(
    () => (liveData.voltages ? Math.max(...liveData.voltages) : 0),
    [liveData]
  );

  return (
    <DetailsContainer>
      <ErrorBoundary fallback={<div />}>
        <LineChart duration={1000 * 60 * 30} frameRate={1} showXAxisLabels showGridLines />
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

      <CellsGrid>
        {liveData.resistances?.map((resistance, i) => (
          <span key={i}>
            {`${String(i + 1).padStart(2, '0')}: ${
              resistance ? resistance.toFixed(3) : '\xa0-\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0'
            }`}
          </span>
        ))}
      </CellsGrid>
    </DetailsContainer>
  );
};

export default memo(Details);
