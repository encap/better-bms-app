import { ChalkInstance, Chalk } from 'chalk';
import dayjs from 'dayjs';
import Logger, { ILogHandler } from 'js-logger';

export const chalk = new Chalk({
  level: 1,
});

export enum LOG_SCOPES {
  GLOBAL = 'global',
  DEVICE = 'device',
  DECODE = 'decode',
  UI = '  ui  ',
}

export const SCOPES_COLOR_MAP: Record<
  LOG_SCOPES,
  [keyof ChalkInstance, keyof ChalkInstance['reset']]
> = {
  [LOG_SCOPES.GLOBAL]: ['bgBlack', 'white'],
  [LOG_SCOPES.DEVICE]: ['bgCyanBright', 'black'],
  [LOG_SCOPES.DECODE]: ['bgMagentaBright', 'black'],
  [LOG_SCOPES.UI]: ['bgYellow', 'black'],
};

export const consoleHandler = (
  originalMessages: Parameters<ILogHandler>[0],
  context: Parameters<ILogHandler>[1]
) => {
  const messages = Array.from(originalMessages);

  const date = dayjs().format('HH:mm:ss:SSS');
  const coloredDate = chalk.gray.bold(date);

  const scope = (context.name as LOG_SCOPES) || LOG_SCOPES.GLOBAL;
  const [bg, color] = SCOPES_COLOR_MAP[scope];
  // @ts-ignore
  const coloredScope = chalk.reset[bg][color](`\u2009${scope}\u2009`) as string;
  const prefix = `${coloredDate} ${coloredScope}`;

  if (typeof messages[0] === 'string') {
    // White to remove debug color in chrome
    messages[0] = `${prefix} ${chalk.white(messages[0])}`;
  } else {
    messages.unshift(prefix);
  }

  // Browsers have their own icon for warn and error (and sometimes for others too)
  const level = context.level.name.toLowerCase();

  // @ts-ignore
  console[level](...messages);

  return {
    date,
    coloredDate,
    scope,
    coloredScope,
    prefix,
    messages,
  };
};

const GlobalLog = Logger.get(LOG_SCOPES.GLOBAL);
const DeviceLog = Logger.get(LOG_SCOPES.DEVICE);
const DecodeLog = Logger.get(LOG_SCOPES.DECODE);
const UILog = Logger.get(LOG_SCOPES.UI);

export { DeviceLog, DecodeLog, UILog, GlobalLog };

export function setupLogger() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  Logger.useDefaults();

  Logger.setHandler(consoleHandler);

  DeviceLog.setLevel(Logger.INFO);
  DecodeLog.setLevel(Logger.WARN);

  Logger.info('Logger ready');
}
