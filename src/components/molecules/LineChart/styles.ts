import styled from 'styled-components';

export const ChartContainer = styled.div`
  position: relative;
  width: 100%;
  height: auto;
`;

export const ChartClickArea = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 50vw;
  height: 80%;
  transform: translate(-50%, -50%);
  z-index: 10;
  border-radius: 50%;
  pointer-events: all;
`;

export const PauseIndicator = styled.div`
  position: absolute;
  right: 20px;
  top: -2px;
  font-size: 16px;
  color: rgb(236, 77, 76);
`;
