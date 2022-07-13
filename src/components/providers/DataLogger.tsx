import dayjs from 'dayjs';
import { Units } from 'interfaces';
import { LiveData } from 'interfaces/data';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { GlobalLog } from 'utils/logger';
import { useDevice } from './DeviceProvider';

const LOG_LIMIT = 10000;

export type AdditionalData = Partial<{
  speed: Units['kmh'] | null;
}>;

export type LiveDataDatum =
  | (Pick<
      LiveData,
      | 'timestamp'
      | 'timeSinceLastOne'
      | 'voltage'
      | 'current'
      | 'cellVoltageDelta'
      | 'remainingCapacity'
      | 'percentage'
      | 'temperatureProbes'
      | 'balanceCurrent'
    > &
      AdditionalData & {
        // Paused time excluded
        correctedTimestamp: Units['miliseconds'];
      })
  | null;

export type DataLoggerContextType = {
  liveDataLog: LiveDataDatum[];
  // null = not started since last reset
  isPaused: boolean | null;
  stop: () => void;
  start: () => void;
  reset: () => void;
};

const emptyLiveDataLog: LiveDataDatum[] = [];

// @ts-expect-error
const DataLoggerContext = createContext<DataLoggerContextType>({
  liveDataLog: emptyLiveDataLog,
  isPaused: null,
});

export function useDataLogger() {
  return useContext(DataLoggerContext);
}

type DataLoggerProviderProps = {
  children: ReactNode;
  liveData: LiveData | null;
  additionalData?: AdditionalData;
};

const DataLoggerProvider = ({
  children,
  liveData,
  additionalData = {},
}: DataLoggerProviderProps) => {
  const { status } = useDevice();

  const [liveDataLog, setLiveDataLog] =
    useState<DataLoggerContextType['liveDataLog']>(emptyLiveDataLog);
  const [pauseTimestamp, setPauseTimestamp] = useState<Units['miliseconds'] | null>(null);

  const reset = useCallback(() => {
    setLiveDataLog(emptyLiveDataLog);
    setPauseTimestamp(null);
  }, [setLiveDataLog]);

  const stop = useCallback(() => {
    setPauseTimestamp((current) => {
      if (current !== null) {
        GlobalLog.warn(`Data Logger already stopped.`, { current });
        return current;
      } else {
        const now = dayjs().valueOf();
        GlobalLog.info(`Stopping Data Logger`, { now });
        return now;
      }
    });
  }, [setPauseTimestamp]);

  const start = useCallback(() => {
    let lastPauseTimestamp;

    setPauseTimestamp((current) => {
      lastPauseTimestamp = current;
      if (current === null) {
        GlobalLog.warn(`Data Logger already started.`, { current });
        return current;
      } else {
        return null;
      }
    });

    if (lastPauseTimestamp) {
      const timeDifference = dayjs().valueOf() - lastPauseTimestamp;
      GlobalLog.debug(`Correcting Data Log timestamps by pause time ${timeDifference}ms`, {
        timeDifference,
        lastPauseTimestamp,
      });

      setLiveDataLog((current) =>
        current.map((datum) => {
          if (datum === null) {
            return datum;
          }
          // 3000 to create a small gap
          datum.correctedTimestamp = datum.correctedTimestamp + timeDifference - 3000;
          return datum;
        })
      );
    }
  }, [setPauseTimestamp, setLiveDataLog]);

  const contextValue = useMemo(
    () => ({
      liveDataLog,
      isPaused: liveDataLog.length ? pauseTimestamp !== null : null,
      stop,
      reset,
      start,
    }),
    [liveDataLog, pauseTimestamp, stop, reset, start]
  );

  useEffect(() => {
    if (liveData && pauseTimestamp === null) {
      const datum: LiveDataDatum = {
        timestamp: liveData.timestamp,
        correctedTimestamp: liveData.timestamp,
        timeSinceLastOne: liveData.timeSinceLastOne,
        voltage: liveData.voltage,
        current: Math.abs(liveData.current),
        cellVoltageDelta: liveData.cellVoltageDelta,
        remainingCapacity: liveData.remainingCapacity,
        percentage: liveData.percentage,
        temperatureProbes: liveData.temperatureProbes,
        balanceCurrent: liveData.balanceCurrent,
        speed: additionalData?.speed && additionalData?.speed > 1 ? additionalData.speed : null,
      };

      setLiveDataLog((current) => {
        if (current.length > LOG_LIMIT) {
          GlobalLog.warn(`For perfomnce reasons flushing old data logs.`);

          return [...current, datum].slice(-LOG_LIMIT + LOG_LIMIT / 4);
        } else {
          return [...current, datum];
        }
      });
    }
  }, [liveData, pauseTimestamp]);

  useEffect(() => {
    if (status === 'disconnected') {
      if (liveDataLog.length && pauseTimestamp === null) {
        stop();
      }
    } else if (status === 'connected') {
      if (pauseTimestamp !== null) {
        start();
      }
    }
  }, [status]);

  useEffect(() => {
    if (liveDataLog.length && pauseTimestamp) {
      setLiveDataLog((current) => [...current, null]);
    }
  }, [pauseTimestamp]);

  return <DataLoggerContext.Provider value={contextValue}>{children}</DataLoggerContext.Provider>;
};

export default DataLoggerProvider;
