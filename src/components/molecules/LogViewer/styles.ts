import styled from 'styled-components';

export const LogViewerContainer = styled.div`
  text-align: left;
  width: 100%;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

export const LogCount = styled.h6`
  width: 100%;
`;

export const ScrollContainer = styled.div`
  width: 100%;
  overflow-y: scroll;
  flex-grow: 1;
  flex-basis: 0;
`;
