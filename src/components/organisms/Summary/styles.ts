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
  font-size: 70px;
`;

export const MainInfoUnit = styled.span`
  font-size: 30px;
  max-width: 1ch;
  display: inline-block;
  overflow: visible;
`;

export const InfoGrid = styled.div`
  margin: 16px 0;
  display: grid;
  grid-template-columns: 1fr 50px 1fr 50px;
  grid-gap: 6px 5px;
  max-width: 100%;
  font-size: 16px;

  label {
    text-align: right;
    overflow-x: auto;
    font-family: sans-serif;
  }
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
    color: rgb(26, 181, 203);
  }
  .lowest {
    color: rgb(236, 77, 76);
  }
`;
