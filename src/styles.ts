import styled from 'styled-components';

export const TwoColumnGrid = styled.div`
  margin: 16px 0;
  display: grid;
  grid-template-columns: auto 50px auto 50px;
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

  .highest {
    color: rgb(26, 181, 203);
  }
  .lowest {
    color: rgb(236, 77, 76);
  }
`;
