import styled, { css } from 'styled-components';

export const ToolbarContainer = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 3fr minmax(0, 1fr);
  padding: 8px 16px 0px;
  align-items: center;
  position: relative;
`;

export const DeviceStatusText = styled.h2`
  grid-column: 2;
  text-align: center;
  font-size: 20px;
  white-space: nowrap;
  font-weight: 500;
  margin: 0;
`;

export const SmallText = styled.span`
  font-size: 16px;
`;

export const PingContainer = styled.div`
  justify-self: end;
  grid-column: 3;
  text-align: right;
  display: flex;
  align-items: center;
  gap: 4px;

  ${SmallText} {
    min-width: 55px;
  }
`;

const blinkKeyframes = `
  0% {
    background-color: white;
  }
  100% {
    background-color: transparent;
  }
`;

export const PingDot = styled.div<{ heartbeat: boolean }>`
  @keyframes blink {
    ${blinkKeyframes}
  }

  @keyframes blink2 {
    ${blinkKeyframes}
  }

  --size: 5px;
  width: var(--size);
  height: var(--size);
  border-radius: 100%;
  animation-duration: 250ms;
  animation-timing-function: ease-out;

  ${({ heartbeat }) =>
    heartbeat
      ? css`
          animation-name: blink;
        `
      : css`
          animation-name: blink2;
        `}
`;
