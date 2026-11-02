import "@/lib/logger";
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CloudGate } from './components/CloudGate';
import './index.css';
import { startWorldGeoLoad } from './utils/worldGeo';
import { AppErrorBoundary } from './utils/errorBoundary.tsx';
import { TRPCProvider } from '@/providers/trpc';

// Do not erase locally saved trips during authentication upgrades. Existing
// browser data is preserved until the user explicitly imports it.
// World gazetteer (all countries, provinces/states/regions, 236k cities) —
// downloads in the background AFTER the UI mounts, so the 12 MB fetch can never
// delay or blank the first paint. The app is fully interactive before it lands.
createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <TRPCProvider>
      <CloudGate><App /></CloudGate>
    </TRPCProvider>
  </AppErrorBoundary>
);
(typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : null)
  ? requestIdleCallback(() => void startWorldGeoLoad())
  : setTimeout(() => void startWorldGeoLoad(), 800);
