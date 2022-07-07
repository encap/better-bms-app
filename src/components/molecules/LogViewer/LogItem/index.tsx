import { Tag } from '@geist-ui/core';
import { ILogLevel } from 'js-logger';
import React, { ComponentProps } from 'react';
import { DefaultTheme, useTheme } from 'styled-components';
import { LogType } from '..';
import { LOG_SCOPES } from 'utils/logger';
import { Date, LogItemWrapper, Message, StyledBadge, StyledTag } from './styles';

const levelToTypeMap: Record<ILogLevel['name'], ComponentProps<typeof Tag>['type']> = {
  error: 'error',
  warn: 'warning',
  info: 'success',
  debug: 'secondary',
};

const scopeToThemeMap: Record<LOG_SCOPES, keyof DefaultTheme> = {
  [LOG_SCOPES.GLOBAL]: 'secondary',
  [LOG_SCOPES.DEVICE]: 'cyanLight',
  [LOG_SCOPES.DECODE]: 'selection',
  [LOG_SCOPES.UI]: 'warningLight',
};

type LogItemProps = {
  log: LogType;
};

const LogItem = ({ log: [, date, level, scope, message] }: LogItemProps) => {
  const theme = useTheme();

  return (
    <LogItemWrapper>
      <Date>{date}</Date>
      <StyledTag invert type={levelToTypeMap[level]}>
        {level}
      </StyledTag>
      <StyledBadge style={{ backgroundColor: theme[scopeToThemeMap[scope]] }}>{scope}</StyledBadge>
      <Message
        dangerouslySetInnerHTML={{
          __html: message,
        }}
      />
    </LogItemWrapper>
  );
};

export default React.memo(LogItem);
