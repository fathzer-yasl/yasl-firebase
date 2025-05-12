let app = null;
let auth = null;
let provider = null;
let db = null;

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

export async function setupAuth() {
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

  signInBtn?.addEventListener('click', () => {
    auth.signInWithPopup(provider).catch(err => {
      alert('Sign-in failed: ' + err.message);
    });
  });
  signOutBtn?.addEventListener('click', () => {
    auth.signOut();
  });

  // Add UI show/hide logic for main-list-view and sign-in button
  const mainListView = document.getElementById('main-list-view');
  const listsBtn = document.getElementById('lists-btn'); // <-- add this line
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        if (mainListView) mainListView.style.display = '';
        if (signInBtn) signInBtn.style.display = 'none';
        if (listsBtn) listsBtn.style.display = ''; // <-- show lists-btn when signed in
      } else {
        if (mainListView) mainListView.style.display = 'none';
        if (signInBtn) signInBtn.style.display = 'inline-block';
        if (listsBtn) listsBtn.style.display = 'none'; // <-- hide lists-btn when signed out
      }
    });
  }
}
