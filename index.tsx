import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import 'leaflet';
import 'leaflet-rotate';
import 'leaflet.markercluster';

const init = async () => {
  try {
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
      root.render(<App />);
    }
  }
};

init();