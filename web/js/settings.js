import { appRelease } from './release.js';

const THEME_KEY = 'yasl-theme';
const LEGACY_THEME_KEY = 'yasl-darkmode';
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function setupSettings(appState) {
  const darkModeCSS = document.getElementById('dark-mode-css');
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close');

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

  function applyTheme(mode) {
    const dark = mode === 'dark' || (mode === 'system' && systemThemeQuery.matches);
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

  // Set app name and version in settings modal
  const infoDiv = document.getElementById('app-version-info');
  if (infoDiv) {
    infoDiv.textContent = `YASL v${appRelease}`;
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
