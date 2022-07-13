import { useDevice } from 'components/providers/DeviceProvider';
import { Units } from 'interfaces';
import { useEffect, useRef, useState } from 'react';
import { useFirstMountState } from 'react-use';
import { GlobalLog } from 'utils/logger';

export default function useWatchSpeed({
  onChange,
}: {
  onChange: (speed: Units['kmh'] | null) => void;
}) {
  const { status } = useDevice();
  const geolocationWatcherRef = useRef<number | null>(null);
  const isFirstMount = useFirstMountState();
  const [speed, setSpeed] = useState<Units['kmh'] | null>(null);

  useEffect(() => {
    if (status === 'connected' && navigator.geolocation?.watchPosition) {
      geolocationWatcherRef.current = navigator.geolocation?.watchPosition(
        (position) => {
          const kmh = position?.coords?.speed === null ? null : position.coords.speed * 3.6;

          if (kmh !== null && position.coords?.accuracy < 35) {
            setSpeed(kmh);
          } else {
            setSpeed(null);
          }
        },
        null,
        {
          maximumAge: 1000,
          timeout: 2000,
          enableHighAccuracy: true,
        }
      );
    } else {
      if (geolocationWatcherRef.current) {
        navigator.geolocation.clearWatch(geolocationWatcherRef.current);
      }
    }
  }, [status]);

  useEffect(() => {
    if (!isFirstMount) {
      if (speed === null) {
        GlobalLog.info(`Tracking speed (${speed} km/h)`, {
          speed,
        });
      } else {
        GlobalLog.info(`Not tracking speed. Milage not available`);
      }
    }
  }, [speed === null]);

  useEffect(() => {
    onChange(speed);
  }, [speed]);
}
