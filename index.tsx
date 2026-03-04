import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const init = () => {
  console.log("FieldPro: Initialization started...");
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("FieldPro: Root element not found!");
    return;
  }

  // Check if Leaflet is loaded
  if (!(window as any).L) {
    console.warn("FieldPro: Leaflet (L) not found on window. Retrying in 500ms...");
    setTimeout(init, 500);
    return;
  }

  try {
    console.log("FieldPro: Creating React root...");
    const root = ReactDOM.createRoot(rootElement);
    
    console.log("FieldPro: Rendering App...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Remove the initial loader manually if React fails to replace it quickly
    // (Though React usually handles this by replacing the content of #root)
    console.log("FieldPro: Render call successful.");
  } catch (err) {
    console.error("FieldPro: Critical render error:", err);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #e11d48; font-family: sans-serif;">
        <h2 style="font-weight: bold;">লোড হতে সমস্যা হয়েছে</h2>
        <p style="font-size: 14px;">অনুগ্রহ করে পেজটি রিফ্রেশ করুন।</p>
        <pre style="font-size: 10px; background: #f1f5f9; padding: 10px; border-radius: 8px; text-align: left; overflow: auto;">${err}</pre>
      </div>
    `;
  }
};

// Start initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  window.addEventListener('DOMContentLoaded', init);
}
