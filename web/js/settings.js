import { appRelease } from './release.js';

export function setupSettings(appState) {
  const darkModeCSS = document.getElementById('dark-mode-css');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close');

  function setDarkMode(enabled) {
    if (enabled) {
      darkModeCSS.removeAttribute('disabled');
      localStorage.setItem('yasl-darkmode', '1');
    } else {
      darkModeCSS.setAttribute('disabled', '');
      localStorage.setItem('yasl-darkmode', '0');
    }
  }

  // On page load, apply saved dark mode preference
  (function() {
    const saved = localStorage.getItem('yasl-darkmode');
    if (saved === '1') {
      setDarkMode(true);
      if (darkModeToggle) darkModeToggle.checked = true;
    } else {
      setDarkMode(false);
      if (darkModeToggle) darkModeToggle.checked = false;
    }
  })();

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
      setDarkMode(e.target.checked);
    });
  }

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