let auth = null;
let db = null;

export function getAuth() {
  return auth;
}

export function getFirestore() {
  return db;
}

export async function setupAuth(appState) {
  auth = firebase.auth();
  db = firebase.firestore();

  const signInBtn = document.getElementById('sign-in-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const userNameElem = document.getElementById('user-name');
  const userEmailElem = document.getElementById('user-email');

  window.db.register(appState);

  signInBtn?.addEventListener('click', () => {
    window.db.signIn();
  });
  signOutBtn?.addEventListener('click', () => {
    window.db.signout();
  });

  appState.addEventListener('auth-changed', (e) => {
    console.log('auth-changed', e.detail);
    const user = e.detail.user;
    if (user) {
      signInBtn.style.display = 'none';
      signOutBtn.style.display = 'inline-block';
      userNameElem.textContent = user.displayName || '';
      userEmailElem.textContent = user.email || '';
    } else {
      signInBtn.style.display = 'inline-block';
      signOutBtn.style.display = 'none';
      userNameElem.textContent = '';
      userEmailElem.textContent = '';
      appState.clearListRef(); // Ensure no list is selected on sign out
    }
  });
}
