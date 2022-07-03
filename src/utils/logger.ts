import chalk, { ChalkInstance } from 'chalk';
import dayjs from 'dayjs';
import Logger, { ILogHandler } from 'js-logger';

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
  [LOG_SCOPES.DEVICE]: ['bgCyan', 'black'],
  [LOG_SCOPES.DECODE]: ['bgGreen', 'black'],
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
    messages[0] = `${prefix} ${messages[0]}`;
  } else {
    messages.unshift(prefix);
  }

  // @ts-ignore
  console[context.level.name.toLowerCase()](...messages);

  return {
    date,
    coloredDate,
    scope,
    coloredScope,
    prefix,
    messages,
  };
};

export function setupLogger() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  Logger.useDefaults();

  Logger.setHandler(consoleHandler);

  Logger.info('Logger ready');
}

const GlobalLog = Logger.get(LOG_SCOPES.GLOBAL);
const DeviceLog = Logger.get(LOG_SCOPES.DEVICE);
const DecodeLog = Logger.get(LOG_SCOPES.DECODE);
const UILog = Logger.get(LOG_SCOPES.UI);

export { DeviceLog, DecodeLog as DecoderLog, UILog, GlobalLog };
