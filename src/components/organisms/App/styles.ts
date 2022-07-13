import styled from 'styled-components';

export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
  width: 100%;
  height: 100%;
`;

export const ContentContainer = styled.main`
  width: 100%;
  flex-grow: 1;
  overflow-y: auto;
  max-height: 100%;
  flex-basis: 0;
  margin: 16px 0 0;
  padding: 0 16px 4px;
  position: relative;
  display: flex;
  flex-direction: column;
`;
