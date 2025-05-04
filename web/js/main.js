import { setupAuth } from './auth.js';
import { setupLists, selectListById } from './lists.js';
import { setupItems } from './items.js';
import { setupSettings } from './settings.js';

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
