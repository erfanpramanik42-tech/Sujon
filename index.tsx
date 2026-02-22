import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const loadScript = (src: string, integrity?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = "";
    }
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    const target = document.head || document.body || document.documentElement;
    target.appendChild(script);
  });
};

const init = async () => {
  try {
    // Sequentially load Leaflet then the Rotation plugin
    // Check if scripts are already available (offline support)
    if (!(window as any).L) {
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=");
      await loadScript("https://unpkg.com/leaflet-rotate@0.2.8/dist/leaflet-rotate.js");
    }

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