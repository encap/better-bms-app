import styled from 'styled-components';

export const BottomNavigationContainer = styled.nav`
  width: 100%;
  padding: 0 16px 8px;

  .tabs {
    .highlight {
      display: none;
    }

    .scroll-container {
      padding: 0 16px;
      border-top: 1px solid #333;
      border-bottom: none;
      display: flex;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      justify-items: stretch;
    }
    .content {
      display: none;
    }

    .tab {
      text-align: center;
      justify-content: center;

      &::after {
        top: -1px;
        bottom: unset;
      }
    }
  }
`;
