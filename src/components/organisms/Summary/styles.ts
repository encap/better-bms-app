import styled from 'styled-components';
import { InfoGrid } from '../Details/styles';

export const SummaryContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  ${InfoGrid} {
    align-items: end;
    grid-template-columns: 1fr 85px 1fr 85px;

    span {
      font-size: 22px;
      line-height: 1.25;
    }
  }
`;

export const MainInfoContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  justify-content: space-between;
  position: relative;
  width: 100%;
  padding: 0px 3px 16px;
`;

export const MiddleContainer = styled.div`
  display: grid;
  gap: 25px;
  grid-column: 2;
`;

export const MainInfo = styled.h3`
  text-align: center;
  font-size: 80px;
  font-weight: 500;
  margin: 0;
  line-height: 90%;
  line-height: 0.7;
  padding-top: 0.05em;
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
