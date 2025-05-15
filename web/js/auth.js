let app = null;
let auth = null;
let db = null;

let readyResolve;
export const ready = new Promise(resolve => { readyResolve = resolve; });

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

  signInBtn?.addEventListener('click', () => {
    window.db.signIn();
  });
  signOutBtn?.addEventListener('click', () => {
    window.db.signout();
  });

  if (auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'inline-block';
        if (userNameElem) userNameElem.textContent = user.displayName || '';
        if (userEmailElem) userEmailElem.textContent = user.email || '';
        if (appState) appState.setUser(user);
      } else {
        if (signInBtn) signInBtn.style.display = 'inline-block';
        if (signOutBtn) signOutBtn.style.display = 'none';
        if (userNameElem) userNameElem.textContent = '';
        if (userEmailElem) userEmailElem.textContent = '';
        if (appState) {
          appState.setUser(null);
          appState.clearListRef(); // Ensure no list is selected on sign out
        }
      }
    });
  }

  if (readyResolve) readyResolve();
}
