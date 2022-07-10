import styled from 'styled-components';

export type GagueStyleProps = {
  background: string;
};

export const BarGaugeContainer = styled.div<GagueStyleProps>`
  @keyframes ripple {
    50% {
      opacity: 0.4;
      transform: scale(2.1);
    }
    100% {
      opacity: 0.1;
      transform: scale(1);
    }
  }
  width: 14px;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: ${({ background }) => background};
`;

export const RippleContainer = styled.div`
  position: absolute;
  height: 200%;
  width: 100%;
  top: 100%;
  border-radius: 100px;
  background-color: white;
  background: radial-gradient(white, white 25%, rgba(255, 255, 255, 0.8) 100%);
  transform: scale(0);
  opacity: 0;
`;

export const GaugeValue = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.background};
  transform: translate3d(0, -100%, 0);
  transition: transform cubic-bezier(0.18, 0, 0.68, 1) 500ms;
`;
