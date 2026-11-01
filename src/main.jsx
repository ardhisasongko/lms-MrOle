import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './i18n';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service worker PWA (produksi saja): network-first, cache hanya cadangan
// offline — lihat public/sw.js. Kegagalan registrasi tidak mengganggu app.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Browser menolak registrasi (mis. mode privat) — abaikan diam-diam.
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
