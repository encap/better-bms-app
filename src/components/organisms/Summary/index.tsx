import React, { memo, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { liveDataUIConfig } from 'config/uiConfig';
import { LiveData } from 'interfaces/data';
import { formatValue } from 'utils/formatValue';
import { SummaryContainer, MainInfoContainer, MainInfo, MainInfoUnit } from './styles';
import LineChart from 'components/molecules/LineChart';
import { GlobalLog } from 'utils/logger';
import { useFirstMountState, usePrevious } from 'react-use';
import { InfoGrid } from '../Details/styles';

type SummaryProps = {
  liveData: LiveData;
};

const Summary = ({ liveData }: SummaryProps) => {
  const [speed, setSpeed] = useState<number | null>(null);
  const previousLiveData = usePrevious(liveData);
  const isFirstMount = useFirstMountState();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        if (position.coords?.accuracy > 25) {
          setSpeed(position?.coords?.speed ?? null);
        } else {
          setSpeed(null);
        }
      },
      null,
      {
        maximumAge: 1000,
        timeout: 2000,
      }
    );
  }, [liveData]);

  const mileage = useMemo(() => {
    if (speed && speed > 1.5 && liveData.power > 50) {
      const avgPower = (previousLiveData?.power ?? liveData.power) + liveData.power / 2;

      return avgPower / speed;
    }

    return null;
  }, [liveData]);

  const remainingRange = useMemo(() => {
    if (mileage) {
      const remainingEnergy =
        liveData.remainingCapacity * (liveData.nominalVoltage || Math.min(72, liveData.voltage));

      const range = remainingEnergy / mileage;

      return Math.round(range * 0.9);
    }

    return null;
  }, [mileage]);

  useEffect(() => {
    if (!isFirstMount) {
      if (speed === null) {
        GlobalLog.info(`Tracking speed end estimating milage`);
      } else {
        GlobalLog.info(`Not tracking speed. Milage not available`);
      }
    }
  }, [speed === null]);

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
        {remainingRange === null ? (
          <>
            <MainInfo>
              {String(liveData.remainingCapacity.toFixed(5)).slice(0, 5)}
              <MainInfoUnit>{'Ah'}</MainInfoUnit>
            </MainInfo>
          </>
        ) : (
          <>
            <MainInfo>
              {String(remainingRange.toFixed(5)).slice(0, 5)}
              <MainInfoUnit>{'Km'}</MainInfoUnit>
            </MainInfo>
          </>
        )}
      </MainInfoContainer>

      <ErrorBoundary fallback={<div />}>
        <LineChart duration={1000 * 60 * 2} frameRate={5} />
      </ErrorBoundary>

      <InfoGrid>
        {mileage !== null && (
          <>
            <label>{'Speed: '}</label>
            <span>{`${speed?.toFixed(1)}km/h`}</span>

            <label>{'Mileage: '}</label>
            <span>{`${mileage?.toFixed(1)}wh/km`}</span>
          </>
        )}

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
