import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import * as L from 'leaflet';
(window as any).L = L;

import { NotificationService } from './services/NotificationService';

const init = async () => {
  try {
    await NotificationService.initialize();
    await import('leaflet-rotate');
    await import('leaflet.markercluster');

    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Initialization failed:", error);
    // If offline and scripts fail, still try to mount to see cached UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    }
  }
};

init();