import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import * as L from 'leaflet';
(window as any).L = L;

import { NotificationService } from './services/NotificationService';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Background initialization
const initPlugins = async () => {
  try {
    await NotificationService.initialize();
    // Pre-load map plugins non-blocking
    import('leaflet-rotate').catch(e => console.warn('Leaflet rotate plugin failed to load', e));
    import('leaflet.markercluster').catch(e => console.warn('Leaflet markercluster plugin failed to load', e));
  } catch (error) {
    console.error("Plugin initialization failed:", error);
  }
};

initPlugins();
