import Convert from 'ansi-to-html';
import React, { useMemo } from 'react';
import { LogType } from '..';
import { LevelIconMap } from '../../../../utils/logger';
import { ansiColorPalette, LogItemWrapper } from './styles';

const ConvertInstance = new Convert({
  colors: ansiColorPalette,
});

const ansiToHtml = ConvertInstance.toHtml.bind(ConvertInstance);

type LogItemProps = {
  log: LogType;
};

const LogItem = ({ log }: LogItemProps) => {
  const html = useMemo(
    () => `<span>${LevelIconMap[log[1]]}</span>&nbsp;${ansiToHtml(log[2])}`,
    [log]
  );

  return (
    <LogItemWrapper
      dangerouslySetInnerHTML={{
        __html: html,
      }}
      className={log[1]}
    ></LogItemWrapper>
  );
};

export default React.memo(LogItem);
