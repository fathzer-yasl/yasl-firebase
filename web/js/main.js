import { setupAuth } from './auth.js';
import { setupLists } from './lists.js';
import { setupItems } from './items.js';
import { setupSettings } from './settings.js';

if (!firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
}

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupSettings();
  setupLists();
  setupItems();

  // After login, restore last selected list
  const auth = firebase.auth();
  auth.onAuthStateChanged(user => {
    if (user) {
      const lastListId = localStorage.getItem('yasl-last-list-' + user.uid);
      if (lastListId) {
        window.renderUserLists(lastListId);
      } else {
        window.renderUserLists();
      }
    }
  });
});

// Hide lists-btn when lists-panel is visible (and main-list-view is hidden)
function setupListsBtnVisibility() {
  const listsBtn = document.getElementById('lists-btn');
  const listsPanel = document.getElementById('lists-panel');
  const mainListView = document.getElementById('main-list-view');
  if (!listsBtn || !listsPanel || !mainListView) return;

  function updateListsBtnVisibility() {
    const user = firebase.auth().currentUser;
    if (!user) {
      listsBtn.style.display = 'none';
      return;
    }
    if (listsPanel.style.display !== 'none' && mainListView.style.display === 'none') {
      listsBtn.style.display = 'none';
    } else {
      listsBtn.style.display = '';
    }
  }

  const observer = new MutationObserver(updateListsBtnVisibility);
  observer.observe(listsPanel, { attributes: true, attributeFilter: ['style'] });
  observer.observe(mainListView, { attributes: true, attributeFilter: ['style'] });

  // Listen for auth state changes to hide/show button
  firebase.auth().onAuthStateChanged(updateListsBtnVisibility);

  updateListsBtnVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupListsBtnVisibility);
} else {
  setupListsBtnVisibility();
}
