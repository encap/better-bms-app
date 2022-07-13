import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
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
import { GlobalLog } from 'utils/logger';
import { useFirstMountState, usePrevious } from 'react-use';
import { InfoGrid } from '../Details/styles';
import BarGauge from 'components/molecules/BarGauge';
import { useTheme } from 'styled-components';
import chroma from 'chroma-js';
import { useDevice } from 'components/providers/DeviceProvider';

type SummaryProps = {
  liveData: LiveData;
};

const Summary = ({ liveData }: SummaryProps) => {
  const theme = useTheme();
  const [speed, setSpeed] = useState<number | null>(null);
  const previousLiveData = usePrevious(liveData);
  const isFirstMount = useFirstMountState();
  const geolocationWatcherRef = useRef<number | null>(null);
  const { status } = useDevice();

  const powerGradient = useMemo(() => {
    // Nicer gradient interpolation using LinearRGB method
    const scale = chroma.scale([theme.success, theme.error]).mode('lrgb').colors(10);

    return `linear-gradient(to top, ${scale.join(', ')} 80%)`;
  }, [theme]);

  useEffect(() => {
    if (status === 'connected') {
      navigator.geolocation?.watchPosition(
        (position) => {
          GlobalLog.info(
            `Speed: ${position?.coords?.speed === null ? null : position.coords.speed * 3.6} acc: ${
              position.coords.accuracy
            } power: ${liveData.power}`
          );
          if (position.coords?.accuracy < 100) {
            setSpeed(position?.coords?.speed === null ? null : position.coords.speed * 3.6);
          } else {
            setSpeed(null);
          }
        },
        null,
        {
          maximumAge: 0,
          timeout: 2000,
          enableHighAccuracy: true,
        }
      );
    } else {
      if (geolocationWatcherRef.current) {
        navigator.geolocation.clearWatch(geolocationWatcherRef.current);
      }
    }
  }, [status, setSpeed]);

  const mileage = useMemo(() => {
    if (speed && speed > 1.5 && liveData.power > 50) {
      const avgPower = (previousLiveData?.power ?? liveData.power) + liveData.power / 2;

      return avgPower / speed;
    }

    return null;
  }, [liveData, speed]);

  const remainingRange = useMemo(() => {
    if (mileage && mileage > 1) {
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
          <span>{speed === null ? `-` : `${(speed || 0).toFixed(1)}km/h`}</span>

          <label>{'Mileage: '}</label>
          <span>{mileage === null ? `-` : `${(mileage || 0).toFixed(0)}wh/km`}</span>
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
