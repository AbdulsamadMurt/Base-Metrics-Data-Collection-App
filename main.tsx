import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for offline caching and background support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Base Metrics: New version available');
  },
  onOfflineReady() {
    console.log('Base Metrics: Ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
