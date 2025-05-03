import { getAuth, getFirestore } from './auth.js';

let onListSelectedCallback = null;

export function onListSelected(cb) {
  onListSelectedCallback = cb;
}

// Select a list by its Firestore doc id and trigger the callback
export function selectListById(listId) {
  const db = getFirestore();
  if (!listId || !db) return;
  const docRef = db.collection('stringList').doc(listId);
  if (typeof onListSelectedCallback === 'function') {
    onListSelectedCallback(docRef);
  }
}

export function setupLists() {
  const appTitleElem = document.querySelector('.app-title');

  window.renderUserLists = async function(selectListId = null) {
    const db = getFirestore();
    if (!db) return; // Prevent error if called before Firebase is initialized

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
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    // Query lists where user is in 'users' or in 'guests'
    const [usersSnap, guestsSnap] = await Promise.all([
      db.collection('stringList').where('users', 'array-contains', user.email).get(),
      db.collection('stringList').where('guests', 'array-contains', user.email).get()
    ]);
    // Merge results, avoiding duplicates
    const seen = new Set();
    const allDocs = [];
    usersSnap.forEach(doc => {
      seen.add(doc.id);
      allDocs.push(doc);
    });
    guestsSnap.forEach(doc => {
      if (!seen.has(doc.id)) {
        allDocs.push(doc);
      }
    });

    allDocs.forEach(doc => {
      const data = doc.data();
      const usersArr = Array.isArray(data.users) ? data.users : [];
      const guestsArr = Array.isArray(data.guests) ? data.guests : [];
      const isOwner = usersArr.includes(user.email);
      const isGuest = !isOwner && guestsArr.includes(user.email);

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
      } else if (isGuest) {
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
          const docRef = db.collection('stringList').doc(doc.id);
          setLastListId(doc.id);
          clearShowListsPanelFlag();
          if (typeof onListSelectedCallback === 'function') {
            onListSelectedCallback(docRef);
          }
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

    // If selectListId was provided and found, select it
    if (selectListId && foundListToSelect) {
      selectListById(selectListId);
    }
  };

  // Add new list (form submit event)
  const addListForm = document.getElementById('add-list-form');
  const newListNameInput = document.getElementById('new-list-name');
  if (addListForm && newListNameInput) {
    addListForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const auth = getAuth();
      const user = auth.currentUser;
      const name = newListNameInput.value.trim();
      if (!user || !name) return;
      const db = getFirestore();
      if (!db) return;
      // Create a new document with a generated id
      const docRef = await db.collection('stringList').add({
        name,
        users: [user.email],
        guests: [],
        list: []
      });
      newListNameInput.value = '';
      setLastListId(docRef.id);
      window.renderUserLists(docRef.id);
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
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        localStorage.setItem('yasl-show-lists-panel-' + user.uid, '1');
      }
      if (appTitleElem) appTitleElem.textContent = "YASL"; // Ensure title is reset
      window.renderUserLists();
    });
  }

  // When a list is selected, clear the flag so reload goes to the list
  function clearShowListsPanelFlag() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      localStorage.removeItem('yasl-show-lists-panel-' + user.uid);
    }
  }

  // Helper: set last list id in localStorage
  function setLastListId(listId) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && listId) {
      localStorage.setItem('yasl-last-list-' + user.uid, listId);
    }
  }

  // Hide lists-panel on sign out
  const auth = getAuth();
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (!user) {
        const listsPanel = document.getElementById('lists-panel');
        if (listsPanel) listsPanel.style.display = 'none';
      }
    });
  }
}