let app = null;
let auth = null;
let provider = null;
let db = null;

let readyResolve;
export const ready = new Promise(resolve => { readyResolve = resolve; });

export function getAuth() {
  return auth;
}

export function getFirestore() {
  return db;
}

// Load firebaseConfig.js dynamically at runtime
function loadFirebaseConfig() {
  return new Promise((resolve, reject) => {
    if (window.firebaseConfig) {
      resolve(window.firebaseConfig);
      return;
    }
    const script = document.createElement('script');
    script.src = 'config/firebaseConfig.js';
    script.onload = () => {
      if (window.firebaseConfig) {
        resolve(window.firebaseConfig);
      } else {
        reject(new Error('firebaseConfig.js loaded but window.firebaseConfig is not defined'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load firebaseConfig.js'));
    document.head.appendChild(script);
  });
}

export async function setupAuth(appState) {
  const firebaseConfig = await loadFirebaseConfig();
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  auth = firebase.auth();
  provider = new firebase.auth.GoogleAuthProvider();
  db = firebase.firestore();

  const signInBtn = document.getElementById('sign-in-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const userNameElem = document.getElementById('user-name');
  const userEmailElem = document.getElementById('user-email');

  signInBtn?.addEventListener('click', () => {
    auth.signInWithPopup(provider).catch(err => {
      alert('Sign-in failed: ' + err.message);
    });
  });
  signOutBtn?.addEventListener('click', () => {
    auth.signOut();
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
