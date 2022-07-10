import styled from 'styled-components';

export const SummaryContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const MainInfoContainer = styled.div`
  display: grid;
  gap: 0px;
`;

export const MainInfo = styled.h3`
  text-align: center;
  font-size: 80px;
  font-weight: 500;
  margin: 0;
  line-height: 90%;
`;

export const MainInfoUnit = styled.span`
  font-size: 30px;
  max-width: 1ch;
  display: inline-block;
  overflow: visible;
  font-weight: 600;
`;

export const CellsGrid = styled.div`
  margin: 12px 0 20px;
  font-size: 16px;
  width: 100%;

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: space-evenly;
  text-align: center;
  gap: 5px 5px;
  grid-auto-flow: column;
  grid-template-rows: repeat(8, auto);

  .highest {
    color: ${({ theme }) => theme.error};
  }
  .lowest {
    color: ${({ theme }) => theme.success};
  }
`;
