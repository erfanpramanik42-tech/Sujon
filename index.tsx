import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const init = () => {
  console.log("FieldPro: Initialization started...");
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("FieldPro: Could not find root element to mount to");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log("FieldPro: Rendering App...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("FieldPro: Render call complete.");
  } catch (err) {
    console.error("FieldPro: Render failed:", err);
  }
};

init();
