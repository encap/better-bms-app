import { GlobalLog } from './logger';

export async function wait(duration: number): Promise<void> {
  GlobalLog.info(`Wait ${duration} ms`);
  return new Promise((resolve) =>
    setTimeout(() => {
      GlobalLog.info(`Wait ${duration} ms elapsed`);
      resolve();
    }, duration)
  );
}
