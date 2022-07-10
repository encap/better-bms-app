import styled from 'styled-components';

export const DetailsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const MainInfoContainer = styled.div`
  display: grid;
  gap: 0px;
`;

export const InfoGrid = styled.div`
  width: 100%;
  padding: 0 8px;
  margin: 16px 0;
  display: grid;
  grid-template-columns: 1fr 70px 1fr 70px;
  grid-gap: 6px 5px;
  max-width: 100%;
  font-size: 16px;

  label {
    text-align: right;
    overflow-x: auto;
    white-space: nowrap;
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
    color: ${({ theme }) => theme.error};
  }
  .lowest {
    color: ${({ theme }) => theme.success};
  }
`;
