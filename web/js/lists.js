import { AppState } from "./app-state";

/**
 * Registers the lists panel and its functionality.
 * @param {AppState} appState 
 */
export function setupLists(appState) {
  const listsPanel = document.getElementById('lists-panel');
  const listsBtn = document.getElementById('lists-btn');
  const ownedListsDiv = document.getElementById('user-owned-lists');
  const sharedListsDiv = document.getElementById('user-shared-lists');

  // Listen to AppState for list selection
  appState.addEventListener(appState.event(), (e) => {
    const listId = appState.listId;
    listsBtn.style.display = listId ? '' : 'none'; // Hide the lists button
    if (appState.user && !listId) {
      renderUserLists();
    } else {
      showListsPanel(false);
    }
  });

  function showListsPanel(visible) {
    listsPanel.style.display = visible ? '' : 'none';
    if (!visible) {
      clearUsersLists();
    }
  }

  function clearUsersLists() {
    ownedListsDiv.innerHTML = '';
    sharedListsDiv.innerHTML = '';
  }

  async function renderUserLists() {
    const ownedSection = document.getElementById('user-owned-lists-section');
    const sharedSection = document.getElementById('user-shared-lists-section');
    const separator = document.getElementById('user-lists-separator');
    const userListsContainer = document.getElementById('user-lists-container');
    if (!ownedListsDiv || !sharedListsDiv || !ownedSection || !sharedSection) return;

    userListsContainer.style.display = 'none';
    let hasOwned = false, hasShared = false;
    const user = appState.user;

    // Query lists where user is in 'users' using FireDB abstraction
    const allLists = await window.db.getUserLists(user);

    clearUsersLists();
    allLists.forEach(list => {
      const guestsArr = Array.isArray(list.guests) ? list.guests : list.users;
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
      // --- End new list rendering ---

      if (isOwner) {
        hasOwned = true;
        ownedListsDiv.appendChild(div);
      } else {
        hasShared = true;
        sharedListsDiv.appendChild(div);
      }

      function buildListFirstLine() {
        const nameLine = document.createElement('div');
        nameLine.style.display = 'flex';
        nameLine.style.alignItems = 'center';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = list.name || list.id;
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.color = '#1976d2';
        nameSpan.style.textDecoration = 'underline';
        nameSpan.onclick = () => {
          const listsPanel = document.getElementById('lists-panel');
          const mainListView = document.getElementById('main-list-view');
          listsPanel.style.display = 'none';
          mainListView.style.display = '';
          onListSelected(list.id);
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
        if (Array.isArray(list.list)) {
          total = list.list.length;
          checked = list.list.filter(item => item.checked).length;
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
    separator.style.display = hasOwned && hasShared ? 'block':'none';
    userListsContainer.style.display = 'block';
    showListsPanel(true);
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
      onListSelected(id);
    });
  }

  // Show/hide main-list-view and lists-panel when lists button is clicked
  const mainListView = document.getElementById('main-list-view');
  if (listsBtn && listsPanel && mainListView) {
    listsBtn.addEventListener('click', () => {
      onListSelected(null);
    });
  }

  // When a list is selected (replace your current selection logic):
  function onListSelected(listId) {
     appState.setListId(listId);
  }
}