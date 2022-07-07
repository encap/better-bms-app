import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import reportWebVitals from './reportWebVitals';
import { setupLogger } from 'utils/logger';
import DeviceProvider from 'components/providers/DeviceProvider';
import App from 'components/organisms/App';
import { CssBaseline, GeistProvider, Themes } from '@geist-ui/core';
import { ThemeProvider } from 'styled-components';

const customDarkTheme = Themes.createFromDark({
  type: 'customDark',
});

export const darkTheme = () => customDarkTheme.palette;

const geistThemes = [customDarkTheme];

setupLogger();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <React.StrictMode>
  <ThemeProvider theme={customDarkTheme.palette}>
    <GeistProvider themeType={'customDark'} themes={geistThemes}>
      <CssBaseline />
      <DeviceProvider>
        <App />
      </DeviceProvider>
    </GeistProvider>
  </ThemeProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https:/bit.ly/CRA-vitals
reportWebVitals();
