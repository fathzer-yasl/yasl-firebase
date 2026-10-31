export async function setupAuth(appState) {
  const signInBtn = document.getElementById('sign-in-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const userNameElem = document.getElementById('user-name');
  const userEmailElem = document.getElementById('user-email');

  window.db.register(appState);

  // Use the backend-provided sign-in label when available
  // (the generic data-i18n label is the fallback)
  if (signInBtn && window.db.signInLabel) {
    signInBtn.textContent = window.db.signInLabel;
  }

  signInBtn?.addEventListener('click', () => {
    window.db.signIn();
  });
  signOutBtn?.addEventListener('click', () => {
    window.db.signout();
  });

  appState.addEventListener(appState.event(), (e) => {
    const user = e.detail.state.user;
    if (user) {
      signInBtn.style.display = 'none';
      signOutBtn.style.display = 'inline-block';
      userNameElem.textContent = user.displayName || user.email || '';
      userEmailElem.textContent = user.email || '';
    } else {
      signInBtn.style.display = 'inline-block';
      signOutBtn.style.display = 'none';
      userNameElem.textContent = '';
      userEmailElem.textContent = '';
    }
  });
}
