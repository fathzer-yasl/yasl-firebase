import { setupAuth } from './auth.js';
import { setupLists } from './lists.js';
import { setupItems } from './items.js';
import { setupSettings } from './settings.js';
import { AppState } from './app-state.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Hide both panels initially
  const listsPanel = document.getElementById('lists-panel');
  const listsBtn = document.getElementById('lists-btn');
  const editBtn = document.getElementById('edit-btn');
  listsPanel.style.display = 'none';

  const appState = new AppState();

  await window.dbReady;
  setupAuth(appState); // Pass appState here
  setupSettings(appState);
  setupLists(appState);
  setupItems(appState);

  // Listen to state changes and show/hide panels
  appState.addEventListener('listid-changed', (e) => {
    const listId = e.detail.listId;
    if (listId) {
      listsPanel.style.display = 'none';
      listsBtn.style.display = '';
    } else {
      listsBtn.style.display = 'none';
      editBtn.style.display = 'none';
      editBtn.onclick = null;
      if (appState.signedIn) listsPanel.style.display = '';
    }
  });

  // Listen to auth state changes to hide lists-panel on sign out
  appState.addEventListener('user-changed', (e) => {
    const user = e.detail.user;
    if (user) {
      const lastListId = localStorage.getItem('yasl-last-list-' + user.uid);
      if (lastListId) {
        window.renderUserLists(lastListId);
        listsPanel.style.display = 'none';
      } else {
        window.renderUserLists();
        listsPanel.style.display = '';
      }
    } else {
      listsPanel.style.display = 'none';
      listsBtn.style.display = 'none';
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListsBtnVisibility);
  }
});

