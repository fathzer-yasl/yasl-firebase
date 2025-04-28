// ==== FIREBASE CONFIGURATION ====
// Import firebaseConfig from a separate file. Swap firebaseConfig.js for each environment (production, staging, etc).
import { firebaseConfig } from './firebaseConfig.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==== AUTHENTICATION ====
const provider = new firebase.auth.GoogleAuthProvider();
const auth = firebase.auth();

const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const userInfo = document.getElementById('settings-user-info');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const stringListElem = document.getElementById('string-list');
const addForm = document.getElementById('add-form');
const addItemInput = document.getElementById('add-item');

const listRef = db.collection('stringList').doc('sharedList');
let unsubscribeSnapshot = null;

// Render list
let checkedGroupCollapsed = false;

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
  const toggleBtn = document.createElement('button');
  toggleBtn.setAttribute('aria-label', checkedGroupCollapsed ? 'Expand completed' : 'Collapse completed');
  toggleBtn.style.background = 'none';
  toggleBtn.style.border = 'none';
  toggleBtn.style.cursor = 'pointer';
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
      const doc = await transaction.get(listRef);
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
      transaction.set(listRef, { list: newList });
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
  flashBtn.style.background = 'none';
  flashBtn.style.border = 'none';
  flashBtn.style.cursor = 'pointer';
  flashBtn.style.padding = '0 0.25em';
  flashBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle"><path d="M7 2L17 13H10L13 22L3 11H10L7 2Z" fill="${item.urgent ? '#d32f2f' : '#bbb'}"/></svg>`;
  flashBtn.onclick = async () => {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(listRef);
      let currentList = [];
      if (doc.exists && Array.isArray(doc.data().list)) {
        currentList = doc.data().list;
      }
      // Flip urgent and set checked to false
      const newList = currentList.map((it, i) =>
        i === idx ? { ...it, urgent: !it.urgent, checked: false } : it
      );
      transaction.set(listRef, { list: newList });
    });
  };

  // Remove button
  const btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Remove');
  btn.className = 'remove-btn';
  btn.style.marginLeft = '0.25em';
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle"><rect x="4" y="9" width="12" height="2" fill="#c00"/></svg>`;
  btn.onclick = async () => {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(listRef);
      let currentList = [];
      if (doc.exists && Array.isArray(doc.data().list)) {
        currentList = doc.data().list;
      }
      const newList = currentList.filter((_, i) => i !== idx);
      transaction.set(listRef, { list: newList });
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

// Show/hide UI and handle Firestore subscription based on auth state
function setUIForUser(user) {
  if (user) {
    signInBtn.style.display = 'none'; // Hide sign-in button
    addForm.style.display = '';
    stringListElem.style.display = '';
    signOutBtn.style.display = ''; // Show sign-out button
    // Subscribe to Firestore updates
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeSnapshot = listRef.onSnapshot(doc => {
      const data = doc.data();
      if (data && Array.isArray(data.list)) {
        renderList(data.list);
      } else {
        renderList([]);
      }
    });
  } else {
    // Remove any inline style first, then set to inline-block to override CSS !important
    signInBtn.style.removeProperty('display');
    signInBtn.offsetHeight; // force reflow
    signInBtn.style.display = 'inline-block'; // Use inline-block for button
    userName.textContent = '';
    userEmail.textContent = '';
    addForm.style.display = 'none';
    stringListElem.style.display = 'none';
    signOutBtn.style.display = 'none'; // Hide sign-out button
    renderList([]);
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  }
}

// Settings modal logic
const darkModeCSS = document.getElementById('dark-mode-css');
const darkModeToggle = document.getElementById('dark-mode-toggle');

function setDarkMode(enabled) {
  if (enabled) {
    darkModeCSS.removeAttribute('disabled');
    localStorage.setItem('yasl-darkmode', '1');
  } else {
    darkModeCSS.setAttribute('disabled', '');
    localStorage.setItem('yasl-darkmode', '0');
  }
}

// On page load, apply saved dark mode preference
(function() {
  const saved = localStorage.getItem('yasl-darkmode');
  if (saved === '1') {
    setDarkMode(true);
    if (darkModeToggle) darkModeToggle.checked = true;
  } else {
    setDarkMode(false);
    if (darkModeToggle) darkModeToggle.checked = false;
  }
})();

if (darkModeToggle) {
  darkModeToggle.addEventListener('change', (e) => {
    setDarkMode(e.target.checked);
  });
}

// Set app name and version in settings modal
fetch('package.json')
  .then(res => res.json())
  .then(pkg => {
    const infoDiv = document.getElementById('app-version-info');
    if (infoDiv && pkg.name && pkg.version) {
      infoDiv.textContent = `${pkg.name} v${pkg.version}`;
    }
  })
  .catch(() => {
    const infoDiv = document.getElementById('app-version-info');
    if (infoDiv) infoDiv.textContent = '';
  });

settingsBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  if (user) {
    userName.textContent = user.displayName || user.email;
    userEmail.textContent = user.email || '';
    userInfo.style.display = '';
  } else {
    userName.textContent = '';
    userEmail.textContent = '';
    userInfo.style.display = 'none';
  }
  // Sync checkbox to current mode when modal opens
  if (darkModeToggle) {
    darkModeToggle.checked = !darkModeCSS.hasAttribute('disabled');
  }
  settingsModal.style.display = 'flex';
});
settingsClose.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) settingsModal.style.display = 'none';
});

// Sign in and sign out button handlers
signInBtn.addEventListener('click', () => {
  auth.signInWithPopup(provider).catch(err => {
    alert('Sign-in failed: ' + err.message);
  });
});
signOutBtn.addEventListener('click', () => {
  auth.signOut();
});

// Listen for auth state changes
auth.onAuthStateChanged(user => {
  setUIForUser(user);
});

// Add new item (only if signed in)
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    alert('Please sign in first.');
    return;
  }
  const newStr = addItemInput.value.trim();
  if (!newStr) return;
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(listRef);
    let currentList = [];
    if (doc.exists && Array.isArray(doc.data().list)) {
      currentList = doc.data().list;
    }
    // Add as an object with name/checked/urgent
    const newItem = { name: newStr, checked: false, urgent: false };
    transaction.set(listRef, { list: [...currentList, newItem] });
  });
  addItemInput.value = ''; // Clear the input after submit
});

// On load, hide add form and list until auth state is known
addForm.style.display = 'none';
stringListElem.style.display = 'none';
userInfo.style.display = 'none';
signOutBtn.style.display = 'none'; // Hide sign-out button initially
