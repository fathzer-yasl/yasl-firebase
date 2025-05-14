import { getAuth } from './auth.js';
import { appRelease } from './release.js';

export function setupSettings() {
  const darkModeCSS = document.getElementById('dark-mode-css');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close');
  const userInfo = document.getElementById('settings-user-info');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const signOutBtn = document.getElementById('sign-out-btn');
  const userInfoRow = userInfo?.parentElement?.parentElement; // The flex row containing user-info and sign-out-btn
  const settingsModalContent = settingsModal?.querySelector('.settings-modal-content');

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

  function updateUserInfoDisplay() {
    const auth = getAuth();
    const user = auth && auth.currentUser;
    if (user) {
      if (userName) userName.textContent = user.displayName || user.email || '';
      if (userEmail) userEmail.textContent = user.email || '';
      if (userInfo) userInfo.style.display = '';
      if (userInfoRow) userInfoRow.style.display = 'flex';
      if (signOutBtn) signOutBtn.style.display = '';
      if (settingsModalContent) settingsModalContent.style.display = '';
    } else {
      if (userName) userName.textContent = '';
      if (userEmail) userEmail.textContent = '';
      if (userInfo) userInfo.style.display = 'none';
      if (userInfoRow) userInfoRow.style.display = 'none';
      if (signOutBtn) signOutBtn.style.display = 'none';
      if (settingsModalContent) settingsModalContent.style.display = '';
    }
  }

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      updateUserInfoDisplay();
      settingsModal.style.display = 'flex';
      if (settingsModalContent) settingsModalContent.style.display = '';
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      const auth = getAuth();
      if (auth) auth.signOut();
      // Do not hide modal or user info row here; let auth state change handle UI
    });
  }

  // Listen for auth state changes to update the dialog UI if open
  const auth = getAuth();
  if (auth) {
    auth.onAuthStateChanged(() => {
      // Only update if modal is open
      if (settingsModal && settingsModal.style.display === 'flex') {
        updateUserInfoDisplay();
      }
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