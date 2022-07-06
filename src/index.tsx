import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import reportWebVitals from './reportWebVitals';
import { setupLogger } from './utils/logger';
import DeviceProvider from './components/organisms/providers/DeviceProvider';
import App from './components/organisms/App';
import { CssBaseline, GeistProvider } from '@geist-ui/core';

setupLogger();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <React.StrictMode>
  <GeistProvider themeType={'dark'}>
    <CssBaseline />
    <DeviceProvider>
      <App />
    </DeviceProvider>
  </GeistProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
