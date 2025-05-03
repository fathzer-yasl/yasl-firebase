import { firebaseConfig } from './firebaseConfig.js';

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

export function setupAuth() {
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
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        if (mainListView) mainListView.style.display = '';
        if (signInBtn) signInBtn.style.display = 'none';
      } else {
        if (mainListView) mainListView.style.display = 'none';
        if (signInBtn) signInBtn.style.display = 'inline-block';
      }
    });
  }
}
