import { addLongPressListener } from './utils.js';
import { showConfirmDialog } from './confirm.js';

export function setupLists(appState) {
  const appTitleElem = document.querySelector('.app-title');

  window.renderUserLists = async function(selectListId = null) {
    const ownedListsDiv = document.getElementById('user-owned-lists');
    const sharedListsDiv = document.getElementById('user-shared-lists');
    const ownedSection = document.getElementById('user-owned-lists-section');
    const sharedSection = document.getElementById('user-shared-lists-section');
    const separator = document.getElementById('user-lists-separator');
    const userListsContainer = document.getElementById('user-lists-container');
    if (!ownedListsDiv || !sharedListsDiv || !ownedSection || !sharedSection) return;
    userListsContainer.style.display = 'none';
    if (appTitleElem) appTitleElem.textContent = "YASL";

    ownedListsDiv.innerHTML = '';
    sharedListsDiv.innerHTML = '';
    separator.style.display = 'none';
    let hasOwned = false, hasShared = false;
    let foundListToSelect = false;

    const user = appState.user;
    if (!user) return;

    // Query lists where user is in 'users' using FireDB abstraction
    const allDocs = await window.db.getUserLists(user);

    allDocs.forEach(doc => {
      const data = doc.data();
      const guestsArr = Array.isArray(data.guests) ? data.guests : data.users;
      const isOwner = !guestsArr.includes(user.email);

      // --- Begin new list rendering ---
      const div = document.createElement('div');
      div.className = 'user-list-row';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.padding = '0.3em 0';

      // First line: list name
      const { nameLine, nameSpan } = buildListFirstLine();
      // Second line: progress bar (left, fills space) + progress text (right)
      const secondLine = buildListProgress();
      div.appendChild(nameLine);
      div.appendChild(secondLine);
	  // Add long-press listener to the whole row
      addLongPressListener(div, () => showConfirmDialog("Are you ok?","Ok, go!", () =>{}));
      // --- End new list rendering ---

      if (isOwner) {
        hasOwned = true;
        ownedListsDiv.appendChild(div);
      } else {
        hasShared = true;
        sharedListsDiv.appendChild(div);
      }
      // Auto-select last list if needed
      if (selectListId && doc.id === selectListId && !foundListToSelect) {
        foundListToSelect = true;
        setTimeout(() => {
          nameSpan.click();
        }, 0);
      }

      function buildListFirstLine() {
        const nameLine = document.createElement('div');
        nameLine.style.display = 'flex';
        nameLine.style.alignItems = 'center';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = data.name || doc.id;
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.color = '#1976d2';
        nameSpan.style.textDecoration = 'underline';
        nameSpan.onclick = () => {
          const listsPanel = document.getElementById('lists-panel');
          const mainListView = document.getElementById('main-list-view');
          listsPanel.style.display = 'none';
          mainListView.style.display = '';
          const docRef = window.db.firestore.collection('stringList').doc(doc.id);
          setLastListId(doc.id);
          onListSelected(docRef);
        };
        nameLine.appendChild(nameSpan);
        return { nameLine, nameSpan };
      }

      function buildListProgress() {
        const secondLine = document.createElement('div');
        secondLine.style.display = 'flex';
        secondLine.style.alignItems = 'center';
        secondLine.style.marginTop = '0.1em';

        // Progress calculation
        let checked = 0, total = 0;
        if (Array.isArray(data.list)) {
          total = data.list.length;
          checked = data.list.filter(item => item.checked).length;
        }
        const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

        // Progress bar (fills remaining space)
        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.flex = '1';
        progressBarContainer.style.height = '0.7em';
        progressBarContainer.style.background = '#e0e0e0';
        progressBarContainer.style.borderRadius = '6px';
        progressBarContainer.style.overflow = 'hidden';
        progressBarContainer.style.marginRight = '0.7em';

        const progressBar = document.createElement('div');
        progressBar.style.height = '100%';
        progressBar.style.width = percent + '%';
        progressBar.style.background = '#43a047';
        progressBar.style.transition = 'width 0.3s';
        progressBarContainer.appendChild(progressBar);

        // Progress text (right)
        const progressSpan = document.createElement('span');
        progressSpan.textContent = `${checked} / ${total}`;
        progressSpan.style.color = '#1976d2';
        progressSpan.style.fontSize = '0.97em';
        progressSpan.style.marginLeft = 'auto';
        progressSpan.style.whiteSpace = 'nowrap';

        secondLine.appendChild(progressBarContainer);
        secondLine.appendChild(progressSpan);
        return secondLine;
      }
    });
    ownedSection.style.display = hasOwned ? '' : 'none';
    sharedSection.style.display = hasShared ? '' : 'none';
    if (!hasOwned && !hasShared) {
      ownedListsDiv.innerHTML = '<div style="color:#888;font-size:0.95em;">No lists found.</div>';
      ownedSection.style.display = '';
      sharedSection.style.display = 'none';
    }
    if (hasOwned && hasShared) {
      separator.style.display = 'block';
    }
    // If selectListId was provided but not found, show lists panel
    if (selectListId && !foundListToSelect) {
      const listsPanel = document.getElementById('lists-panel');
      const mainListView = document.getElementById('main-list-view');
      listsPanel.style.display = 'block';
      mainListView.style.display = 'none';
    }
    userListsContainer.style.display = 'block';
  };

  // Add new list (form submit event)
  const addListForm = document.getElementById('add-list-form');
  const newListNameInput = document.getElementById('new-list-name');
  if (addListForm && newListNameInput) {
    addListForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = newListNameInput.value.trim();
      newListNameInput.value = '';
      if (!appState.user || !name) return;
      const id = await window.db.createList(name);
      setLastListId(id);
      window.renderUserLists(id);
    });
  }

  // Show/hide main-list-view and lists-panel when lists button is clicked
  const listsBtn = document.getElementById('lists-btn');
  const listsPanel = document.getElementById('lists-panel');
  const mainListView = document.getElementById('main-list-view');
  if (listsBtn && listsPanel && mainListView) {
    listsBtn.addEventListener('click', () => {
      listsPanel.style.display = 'block';
      mainListView.style.display = 'none';
      // Set flag so reload stays on lists-panel
      const user = appState.user;
      if (user) {
        // --- Clear last-list and currentListDocRef when leaving main-list-view ---
        localStorage.removeItem('yasl-last-list-' + user.uid); //TODO Probably at a better place elsewhere
      }
      // Also clear currentListDocRef in items.js
      if (window.clearCurrentListDocRef) window.clearCurrentListDocRef();
      if (appTitleElem) appTitleElem.textContent = "YASL"; // Ensure title is reset
      window.renderUserLists();
      onListSelected(null);
    });
  }

  // Helper: set last list id in localStorage
  function setLastListId(listId) {
    const user = appState.user;
    if (user && listId) {
      localStorage.setItem('yasl-last-list-' + user.uid, listId);
    }
  }

  // When a list is selected (replace your current selection logic):
  function onListSelected(docRef) {
    if (docRef) {
      appState.setListRef(docRef);
    } else {
      appState.clearListRef();
    }
  }
}