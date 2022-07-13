import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { liveDataUIConfig } from 'config/uiConfig';
import { LiveData } from 'interfaces/data';
import { formatValue } from 'utils/formatValue';
import {
  SummaryContainer,
  MiddleContainer,
  MainInfo,
  MainInfoUnit,
  MainInfoContainer,
} from './styles';
import LineChart from 'components/molecules/LineChart';
import { usePrevious } from 'react-use';
import { InfoGrid } from '../Details/styles';
import BarGauge from 'components/molecules/BarGauge';
import { useTheme } from 'styled-components';
import chroma from 'chroma-js';
import { Units } from 'interfaces/index';

type SummaryProps = {
  liveData: LiveData;
  speed: Units['kmh'] | null;
};

const Summary = ({ liveData, speed }: SummaryProps) => {
  const theme = useTheme();
  const previousLiveData = usePrevious(liveData);

  const powerGradient = useMemo(() => {
    // Nicer gradient interpolation using LinearRGB method
    const scale = chroma.scale([theme.success, theme.error]).mode('lrgb').colors(10);

    return `linear-gradient(to top, ${scale.join(', ')} 80%)`;
  }, [theme]);

  const mileage = useMemo(() => {
    if (speed && speed > 1.5 && liveData.power >= 100) {
      const avgPower = (previousLiveData?.power ?? liveData.power) + liveData.power / 2;

      return avgPower / speed;
    }

    return null;
  }, [liveData]);

  const remainingRange = useMemo(() => {
    if (mileage && mileage > 1) {
      const remainingEnergy =
        liveData.remainingCapacity * (liveData.nominalVoltage || Math.min(72, liveData.voltage));

      const range = remainingEnergy / mileage;

      return Math.round(range * 0.9);
    }

    return null;
  }, [mileage]);

  return (
    <SummaryContainer>
      <MainInfoContainer>
        <BarGauge
          value={liveData.percentage || 0}
          max={100}
          duration={liveData.timeSinceLastOne}
          background='white'
        />
        <MiddleContainer>
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
        </MiddleContainer>
        <BarGauge
          value={liveData.power > 10 ? liveData.power : 0}
          max={3500}
          duration={liveData.timeSinceLastOne}
          background={powerGradient}
        />
      </MainInfoContainer>

      <ErrorBoundary fallback={<div />}>
        <LineChart duration={1000 * 60 * 3} frameRate={5} />
      </ErrorBoundary>

      <InfoGrid>
        <>
          <label>{'Speed: '}</label>
          <span>{speed === null ? `-` : `${(speed > 2 ? speed : 0).toFixed(1)}km/h`}</span>

          <label>{'Mileage: '}</label>
          <span>{mileage === null ? `-` : `${mileage.toFixed(0)}wh/km`}</span>
        </>

        {formatValue(liveData, 'temperatureProbes', liveData.temperatureProbes?.[0], 'T control')}
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
