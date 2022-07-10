import styled from 'styled-components';

export type GagueStyleProps = {
  background: string;
};

export const BarGaugeContainer = styled.div<GagueStyleProps>`
  width: 14px;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: ${({ background }) => background};
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
