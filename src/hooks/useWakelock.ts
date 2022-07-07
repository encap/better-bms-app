import { useCallback, useMemo, useRef } from 'react';
import { GlobalLog } from 'utils/logger';

export function useWakelock() {
  const wakelokRef = useRef<WakeLockSentinel>();

  const acquireWakelock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakelokRef.current = await navigator.wakeLock.request('screen');
      } else {
        throw new Error('WakeLock not suppoerted');
      }
    } catch (error) {
      GlobalLog.warn(`Failed to acquire wakeLock`, { error });
    }
  }, []);

  const releaseWakelock = useCallback(async () => {
    if (wakelokRef.current) {
      GlobalLog.info(`Releasing wakelock`, { wakelokRef });
      await wakelokRef.current.release();
    }
  }, []);

  return useMemo(
    () => ({ wakelokRef, acquireWakelock, releaseWakelock }),
    [wakelokRef, acquireWakelock, releaseWakelock]
  );
}
