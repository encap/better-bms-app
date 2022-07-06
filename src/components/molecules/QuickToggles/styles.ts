import { Toggle } from '@geist-ui/core';
import styled from 'styled-components';

export const QuickTogglesContainer = styled.div`
  width: 100%;
  padding: 4px 16px;
  display: flex;
  justify-content: space-evenly;
  gap: 10px;
`;

export const ToggleWithLabel = styled(Toggle)`
  height: auto !important;
  position: relative;

  &::before {
    content: attr(data-label);
    position: absolute;
    left: 100%;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    padding-left: 10px;
    font-size: 18px;
  }

  &:first-child {
    margin-left: 50px;

    &::before {
      right: 100%;
      left: unset;
      padding-right: 10px;
    }
  }

  &:last-child {
    margin-right: 50px;

    .toggle {
      transform: scale(-1);
    }
  }
`;
