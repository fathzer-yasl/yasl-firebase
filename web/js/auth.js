import { auth, provider } from '../public/firebase-init.js';
import { onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

let readyResolve;
export const ready = new Promise(resolve => { readyResolve = resolve; });

export async function setupAuth(appState) {
  const signInBtn = document.getElementById('sign-in-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const userNameElem = document.getElementById('user-name');
  const userEmailElem = document.getElementById('user-email');

  signInBtn?.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => {
      alert('Sign-in failed: ' + err.message);
    });
  });
  signOutBtn?.addEventListener('click', () => {
    signOut(auth);
  });

  onAuthStateChanged(auth, user => {
  console.debug('[auth] onAuthStateChanged', user);
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

  if (readyResolve) readyResolve();
}
