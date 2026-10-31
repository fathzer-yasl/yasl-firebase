import { setupAuth } from './auth.js';
import { setupLists } from './lists.js';
import { setupItems } from './items.js';
import { setupSettings } from './settings.js';
import { AppState } from './app-state.js';
import { applyStaticStrings } from './i18n.js';

// Register the service worker (PWA installability + asset caching)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

document.addEventListener('DOMContentLoaded', async () => {

  applyStaticStrings();

  const appState = new AppState();

  await window.dbReady;
  setupAuth(appState); // Pass appState here
  setupSettings(appState);
  setupLists(appState);
  setupItems(appState);
});

