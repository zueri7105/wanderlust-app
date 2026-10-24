import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { startWorldGeoLoad } from './utils/worldGeo';
import { AppErrorBoundary } from './utils/errorBoundary.tsx';

// ── Fresh-platform reset ─────────────────────────────────────────────────
// One-time migration: wipe any previously stored demo data (trips, itineraries,
// memories, expenses, chats, profile) so every visitor starts on a brand-new
// account. Preferences (theme, language, settings) are kept.
if (!localStorage.getItem('wanderlust_fresh_v1')) {
  const keep = new Set(['wanderlust_app_settings', 'wanderlust_app_lang', 'wanderlust_galaxy_v1']);
  Object.keys(localStorage).forEach((key) => {
    if (keep.has(key)) return;
    if (key.startsWith('roamtogether_') || key.startsWith('wanderlust_')) {
      localStorage.removeItem(key);
    }
  });
  localStorage.setItem('wanderlust_fresh_v1', '1');
}

// World gazetteer (all countries, provinces/states/regions, 236k cities) —
// downloads in the background AFTER the UI mounts, so the 12 MB fetch can never
// delay or blank the first paint. The app is fully interactive before it lands.
createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
requestIdleCallback
  ? requestIdleCallback(() => void startWorldGeoLoad())
  : setTimeout(() => void startWorldGeoLoad(), 800);
