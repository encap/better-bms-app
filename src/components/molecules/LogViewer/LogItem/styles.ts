import styled from 'styled-components';

export const LogItemWrapper = styled.p`
  width: 100%;
  position: relative;
  font-size: 14px;
  white-space: pre-wrap;
  margin: 4px 0;

  span {
    border-radius: 4px;
  }

  &.error {
    background: rgba(255, 0, 0, 0.2);
  }

  &.warn {
    background: rgba(244, 189, 18, 0.2);
  }
`;

export const ansiColorPalette = {
  0: 'rgb(17, 17, 17)',
  1: 'rgb(236, 77, 76)',
  2: 'rgb(30, 200, 18)',
  3: 'rgb(210, 192, 89)',
  4: '#00A',
  5: '#A0A',
  6: '#0AA',
  7: '#AAA',
  8: '#555',
  9: '#F55',
  10: '#5F5',
  11: '#FF5',
  12: '#55F',
  13: '#F5F',
  14: '#5FF',
  15: '#FFF',
};
