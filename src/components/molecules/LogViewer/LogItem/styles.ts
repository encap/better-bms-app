import { Badge, Tag } from '@geist-ui/core';
import styled from 'styled-components';

export const LogItemWrapper = styled.p`
  width: 100%;
  position: relative;
  font-size: 14px;
  margin: 4px 0;
  display: flex;
  gap: 0 10px;
  align-items: baseline;
  flex-wrap: wrap;
`;

export const StyledTag = styled(Tag)`
  padding: 2px 10px !important;
  min-width: 70px;
  text-align: center;
  height: auto !important;
  color: white !important;
`;

export const StyledBadge = styled(Badge)`
  padding: 4px 10px !important;
  min-width: 70px;
  text-align: center;
`;

export const Date = styled.span`
  color: ${({ theme }) => theme.accents_4};
  width: 90px;
`;

export const Message = styled.span`
  white-space: pre-wrap;
  display: block;
  width: 100%;
  line-height: 1.15;
`;
