import Logger, { ILogLevel } from 'js-logger';
import { useCallback, useEffect, useState } from 'react';
import { consoleHandler, GlobalLog } from '../../../utils/logger';
import LogItem from './LogItem';
import { LogCount, LogViewerContainer, ScrollContainer } from './styles';

export type LogType = [number, ILogLevel['name'], string];

const LogViewer = () => {
  const [logs, setLogs] = useState<LogType[]>(() => []);

  const addLog = useCallback(
    (level: string, message: string) => {
      setLogs((current) => {
        const key = (current[current.length - 1]?.[0] || 0) + 1;
        const log = [key, level, message] as LogType;

        if (current.length > 500) {
          return [...current, log].slice(-450);
        }

        return [...current, log];
      });
    },
    [setLogs]
  );

  useEffect(() => {
    Logger.setHandler((originalMessages, context) => {
      const { messages } = consoleHandler(originalMessages, context);

      addLog(context.level.name.toLowerCase(), messages[0]);
    });

    GlobalLog.log('Log Viewer initialized');
  }, []);

  return (
    <LogViewerContainer>
      <LogCount>{`Logs: ${logs.length}`}</LogCount>
      <ScrollContainer>
        {logs.map((log) => (
          <LogItem log={log} key={log[0]} />
        ))}
      </ScrollContainer>
    </LogViewerContainer>
  );
};

export default LogViewer;
