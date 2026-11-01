import { getLanguagePref, setLanguagePref } from './i18n.js';

const THEME_KEY = 'yasl-theme';
const LEGACY_THEME_KEY = 'yasl-darkmode';
// Page background colors, used as the browser theme color (status/navigation bars)
const LIGHT_BACKGROUND = '#f6f8fa';
const DARK_BACKGROUND = '#181a1b';
const ITEM_EDIT_MODE_KEY = 'yasl-item-edit-mode';
export const ITEM_EDIT_MODE_EVENT = 'item-edit-mode-changed';
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Returns how list items are edited: 'button' (default) or 'longpress'
export function getItemEditMode() {
  return localStorage.getItem(ITEM_EDIT_MODE_KEY) || 'button';
}

function setItemEditMode(mode) {
  localStorage.setItem(ITEM_EDIT_MODE_KEY, mode);
  window.dispatchEvent(new Event(ITEM_EDIT_MODE_EVENT));
}

function getTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  // Migrate the legacy boolean preference if present
  const legacy = localStorage.getItem(LEGACY_THEME_KEY);
  if (legacy !== null) {
    const mode = legacy === '1' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, mode);
    localStorage.removeItem(LEGACY_THEME_KEY);
    return mode;
  }
  return 'system';
}

export function setupSettings(appState) {
  const darkModeCSS = document.getElementById('dark-mode-css');
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close');

  function applyTheme(mode) {
    const dark = mode === 'dark' || (mode === 'system' && systemThemeQuery.matches);
    // Keep the system bars in sync with the chosen theme, whatever the OS preference is
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = dark ? DARK_BACKGROUND : LIGHT_BACKGROUND;
    });
    if (dark) {
      darkModeCSS.removeAttribute('disabled');
    } else {
      darkModeCSS.setAttribute('disabled', '');
    }
  }

  function setTheme(mode) {
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  }

  // On page load, apply saved theme preference and check the matching radio
  const currentTheme = getTheme();
  applyTheme(currentTheme);
  themeRadios.forEach(radio => {
    radio.checked = radio.value === currentTheme;
    radio.addEventListener('change', () => {
      if (radio.checked) setTheme(radio.value);
    });
  });

  // Re-apply when the OS theme changes (effective only in 'system' mode)
  systemThemeQuery.addEventListener('change', () => applyTheme(getTheme()));

  // Language preference: check the matching radio, reload on change
  const langPref = getLanguagePref();
  document.querySelectorAll('input[name="language"]').forEach(radio => {
    radio.checked = radio.value === langPref;
    radio.addEventListener('change', () => {
      if (radio.checked) setLanguagePref(radio.value);
    });
  });

  // Item edit mode preference: check the matching radio, re-render items on change
  const itemEditMode = getItemEditMode();
  document.querySelectorAll('input[name="item-edit-mode"]').forEach(radio => {
    radio.checked = radio.value === itemEditMode;
    radio.addEventListener('change', () => {
      if (radio.checked) setItemEditMode(radio.value);
    });
  });

  // Set app name and version in settings modal
  // __APP_RELEASE__ is a build-time constant injected by vite.config.js
  const infoDiv = document.getElementById('app-version-info');
  if (infoDiv) {
    infoDiv.textContent = `YASL v${__APP_RELEASE__}`;
  }

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
    });
  }

  if (settingsClose && settingsModal) {
    settingsClose.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) settingsModal.style.display = 'none';
    });
  }
}
