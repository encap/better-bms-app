import styled from 'styled-components';

export const QuickTogglesContainer = styled.div`
  width: 100%;
  padding: 4px 16px;
  display: flex;
  justify-content: space-evenly;
  gap: 30px;
`;

export const ToggleLabel = styled.label`
  width: 75px;
  text-align: right;
`;

export const ToggleWithLabel = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  label:last-child {
    height: auto !important;
  }

  &:nth-child(2n) {
    flex-direction: row-reverse;

    ${ToggleLabel} {
      text-align: left;
    }
  }
`;
