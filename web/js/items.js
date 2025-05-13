import { getAuth, getFirestore } from './auth.js';

let currentListDocRef = null;
let unsubscribeSnapshot = null;

// Expose a global function to clear currentListDocRef and unsubscribe
window.clearCurrentListDocRef = function() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  currentListDocRef = null;
  const appTitleElem = document.querySelector('.app-title');
  if (appTitleElem) appTitleElem.textContent = 'YASL';
};

export function setupItems(appState) {
  const db = getFirestore();
  const stringListElem = document.getElementById('string-list');
  const addItemForm = document.getElementById('add-item-form');
  const addItemInput = document.getElementById('add-item');
  const appTitleElem = document.querySelector('.app-title');
  const mainListView = document.getElementById('main-list-view');

  // Listen to AppState for list selection
  appState.addEventListener('listref-changed', (e) => {
    const docRef = e.detail.listRef;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    currentListDocRef = docRef;
    if (!currentListDocRef) {
      if (appTitleElem) appTitleElem.textContent = 'YASL';
      if (mainListView) mainListView.style.display = 'none'; // Hide the whole items panel
      return;
    }
    if (mainListView) mainListView.style.display = ''; // Show the whole items panel
    unsubscribeSnapshot = currentListDocRef.onSnapshot(doc => {
      const data = doc.data();
      // Set the app title to the list name if available
      if (appTitleElem) {
        appTitleElem.textContent = (data?.name) ? data.name : 'YASL';
      }
      if (data && Array.isArray(data.list)) {
        renderList(data.list);
      } else if (stringListElem) {
        stringListElem.innerHTML = '';
      }
    });
  });

  // Unsubscribe from snapshot on sign out or when main-list-view is hidden
  const auth = getAuth();
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (!user && unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
        currentListDocRef = null;
        // Do not call renderList([]); let the main app show the lists-panel
        if (appTitleElem) appTitleElem.textContent = 'YASL';
      }
    });
  }

  // Observe visibility changes to main-list-view only
  const observer = new MutationObserver(() => {
    if (mainListView && mainListView.style.display === 'none') {
      if (appTitleElem) appTitleElem.textContent = 'YASL';
    }
  });
  if (mainListView) {
    observer.observe(mainListView, { attributes: true, attributeFilter: ['style'] });
  }

  // Add item form handler
  if (addItemForm) {
    addItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert('Please sign in first.');
        return;
      }
      const newStr = addItemInput.value.trim();
      if (!newStr || !currentListDocRef) return;
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(currentListDocRef);
        let currentList = [];
        if (doc.exists && Array.isArray(doc.data().list)) {
          currentList = doc.data().list;
        }
        const newItem = { name: newStr, checked: false, urgent: false };
        transaction.set(currentListDocRef, { ...doc.data(), list: [...currentList, newItem] });
      });
      addItemInput.value = '';
    });
  }

  // Render the list of items (restored original interactive version)
  function renderList(items) {
    stringListElem.innerHTML = '';
    // Split into groups
    const unchecked = items
      .map((item, idx) => ({ ...item, _idx: idx }))
      .filter(item => !item.checked);
    const checked = items
      .map((item, idx) => ({ ...item, _idx: idx }))
      .filter(item => item.checked);
    // Sort: urgent first, then alphabetically
    const sortFn = (a, b) => {
      if (a.urgent !== b.urgent) return b.urgent - a.urgent;
      return a.name.localeCompare(b.name);
    };
    unchecked.sort(sortFn);
    checked.sort(sortFn);

    // Render unchecked group
    const uncheckedGroup = document.createElement('div');
    uncheckedGroup.className = 'group-box';
    unchecked.forEach(item => renderListItem(item, uncheckedGroup, items));
    stringListElem.appendChild(uncheckedGroup);

    // Render checked group with collapse/expand
    const checkedHeader = document.createElement('div');
    checkedHeader.style.display = 'flex';
    checkedHeader.style.alignItems = 'center';
    checkedHeader.style.gap = '0.5em';
    checkedHeader.style.margin = '1em 0 0.2em 0';
    // Collapse/expand icon
    let checkedGroupCollapsed = false;
    const toggleBtn = document.createElement('button');
    toggleBtn.setAttribute('aria-label', checkedGroupCollapsed ? 'Expand completed' : 'Collapse completed');
    toggleBtn.style.padding = '0 0.25em';
    toggleBtn.innerHTML = checkedGroupCollapsed
      ? `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="6,8 10,12 14,8" stroke="#1976d2" stroke-width="2" fill="none"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="6,12 10,8 14,12" stroke="#1976d2" stroke-width="2" fill="none"/></svg>`;
    toggleBtn.onclick = () => {
      checkedGroupCollapsed = !checkedGroupCollapsed;
      renderList(items);
    };
    checkedHeader.appendChild(toggleBtn);
    stringListElem.appendChild(checkedHeader);
    if (!checkedGroupCollapsed) {
      const checkedGroup = document.createElement('div');
      checkedGroup.className = 'group-box';
      checked.forEach(item => renderListItem(item, checkedGroup, items));
      stringListElem.appendChild(checkedGroup);
    }
  }

  function renderListItem(item, parentElem, items) {
    const idx = item._idx;
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '0.5em';

    // Checkbox for 'checked'
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!item.checked;
    checkbox.style.marginRight = '0.5em';
    checkbox.onclick = async () => {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(currentListDocRef);
        let currentList = [];
        if (doc.exists && Array.isArray(doc.data().list)) {
          currentList = doc.data().list;
        }
        const newList = currentList.map((it, i) => {
          if (i !== idx) return it;
          const newChecked = !it.checked;
          return {
            ...it,
            checked: newChecked,
            urgent: newChecked ? false : it.urgent // if checked, urgent is false
          };
        });
        transaction.set(currentListDocRef, { ...doc.data(), list: newList });
      });
    };
    li.appendChild(checkbox);

    // Name
    const span = document.createElement('span');
    span.textContent = item.name;
    li.appendChild(span);

    // Flash icon for 'urgent'
    const flashBtn = document.createElement('button');
    flashBtn.setAttribute('aria-label', 'Toggle urgent');
    flashBtn.className = 'flash-btn';
    flashBtn.style.padding = '0 0.25em';
    flashBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle"><path d="M7 2L17 13H10L13 22L3 11H10L7 2Z" fill="${item.urgent ? '#d32f2f' : '#bbb'}"/></svg>`;
    flashBtn.onclick = async () => {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(currentListDocRef);
        let currentList = [];
        if (doc.exists && Array.isArray(doc.data().list)) {
          currentList = doc.data().list;
        }
        // Flip urgent and set checked to false
        const newList = currentList.map((it, i) =>
          i === idx ? { ...it, urgent: !it.urgent, checked: false } : it
        );
        transaction.set(currentListDocRef, { ...doc.data(), list: newList });
      });
    };

    // Remove button
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Remove');
    btn.className = 'remove-btn';
    btn.style.marginLeft = '0.25em';
    btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ff0000" style="vertical-align:middle">
      <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg> `;
    btn.onclick = async () => {
      // Simple remove without modal for now
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(currentListDocRef);
        let currentList = [];
        if (doc.exists && Array.isArray(doc.data().list)) {
          currentList = doc.data().list;
        }
        const newList = currentList.filter((_, i) => i !== idx);
        transaction.set(currentListDocRef, { ...doc.data(), list: newList });
      });
    };

    // Right-side button group
    const rightGroup = document.createElement('div');
    rightGroup.className = 'list-actions';
    rightGroup.appendChild(flashBtn);
    rightGroup.appendChild(btn);
    li.appendChild(rightGroup);
    parentElem.appendChild(li);
  }
}