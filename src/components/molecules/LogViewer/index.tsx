import Logger, { ILogLevel } from 'js-logger';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { consoleHandler, GlobalLog, UILog } from '../../../utils/logger';
import LogItem from './LogItem';
import { LogCount, LogViewerContainer, ScrollContainer } from './styles';

export type LogType = [number, ILogLevel['name'], string];

const LogViewer = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const [logs, setLogs] = useState<LogType[]>(() => []);

  const addLog = useCallback(
    (level: string, message: string) => {
      setLogs((current) => {
        const key = (current[current.length - 1]?.[0] || 0) + 1;
        const log = [key, level, message] as LogType;

        if (current.length > 10000) {
          try {
            GlobalLog.info(`Clearing browser console to allow garbage collection`, { current });

            console.clear();
          } catch (e) {
            //
          }
        }

        if (current.length > 500) {
          UILog.info(`For performance reasons flushing ${500 - 100} oldest logs`, { current });
          return [...current, log].slice(-400);
        }

        return [...current, log];
      });
    },
    [setLogs, scrollContainerRef]
  );

  useLayoutEffect(() => {
    GlobalLog.log('Initializing Log viewer');

    Logger.setHandler((originalMessages, context) => {
      const { messages } = consoleHandler(originalMessages, context);

      addLog(context.level.name.toLowerCase(), messages[0]);
    });

    GlobalLog.log('Log Viewer initialized');
  }, []);

  useLayoutEffect(() => {
    if (shouldScrollRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, scrollContainerRef.current.scrollHeight);
    }
  }, [logs]);

  return (
    <LogViewerContainer>
      <LogCount>{`Logs: ${logs.length}`}</LogCount>
      <ScrollContainer
        ref={scrollContainerRef}
        onTouchStart={() => (shouldScrollRef.current = false)}
        onTouchEnd={() => setTimeout(() => (shouldScrollRef.current = true), 2000)}
        onMouseDown={() => (shouldScrollRef.current = false)}
        onMouseUp={() => setTimeout(() => (shouldScrollRef.current = true), 2000)}
      >
        {logs.map((log) => (
          <LogItem log={log} key={log[0]} />
        ))}
      </ScrollContainer>
    </LogViewerContainer>
  );
};

export default LogViewer;
