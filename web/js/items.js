import { showConfirmDialog } from './confirm.js';

let currentList = null;
let unsubscribeSnapshot = null;
let checkedGroupCollapsed = false;

// Expose a global function to clear currentList and unsubscribe
//TODO This function is probably useless
window.clearCurrentListDocRef = function() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  currentList = null;
  const appTitleElem = document.querySelector('.app-title');
  if (appTitleElem) appTitleElem.textContent = 'YASL';
};

// Helper to update the list in a transaction
async function updateListWith(updater) {
  const newList = updater(currentList.list);
  currentList.list = newList;
  await window.db.updateList(currentList);
}

export function setupItems(appState) {
  const stringListElem = document.getElementById('item-list');
  const addItemForm = document.getElementById('add-item-form');
  const addItemInput = document.getElementById('add-item');
  const appTitleElem = document.querySelector('.app-title');
  const mainListView = document.getElementById('main-list-view');

  // Listen to AppState for list selection
  appState.addEventListener('listid-changed', (e) => {
    const docRef = e.detail.listId;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    if (!docRef) {
      if (appTitleElem) appTitleElem.textContent = 'YASL';
      if (mainListView) mainListView.style.display = 'none'; // Hide the whole items panel
      return;
    }
    if (mainListView) mainListView.style.display = ''; // Show the whole items panel
    window.db.getList(docRef).then(x => {
      unsubscribeSnapshot = x.onSnapshot(doc => {
          const data = doc;
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
        currentList = x;
      });
    });

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
      const newStr = addItemInput.value.trim();
      if (!newStr || !currentList) return;
      await updateListWith((currentList) => {
        const newItem = { name: newStr, checked: false, urgent: false };
        return [...currentList, newItem];
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
    const toggleBtn = document.createElement('button');
    toggleBtn.setAttribute('id', 'toggle-checked');
    toggleBtn.setAttribute('aria-label', checkedGroupCollapsed ? 'Expand completed' : 'Collapse completed');
    toggleBtn.style.padding = '0 0.25em';
    toggleBtn.innerHTML = checkedGroupCollapsed
      ? `<span class="expand-icon"></span>`
      : `<span class="collapse-icon"></span>`;
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
      await updateListWith((currentList) =>
        currentList.map((it, i) => {
          if (i !== idx) return it;
          const newChecked = !it.checked;
          return {
            ...it,
            checked: newChecked,
            urgent: newChecked ? false : it.urgent // if checked, urgent is false
          };
        })
      );
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
    flashBtn.innerHTML = `<span class="flash-icon ${item.urgent ? 'urgent' : 'not-urgent'}"></span>`;
    flashBtn.onclick = async () => {
      await updateListWith((currentList) =>
        currentList.map((it, i) =>
          i === idx ? { ...it, urgent: !it.urgent, checked: false } : it
        )
      );
    };

    // Remove button
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Remove');
    btn.className = 'remove-btn';
    btn.style.marginLeft = '0.25em';
    btn.innerHTML = `<span class="remove-icon"></span>`;
    btn.onclick = () => {
      showConfirmDialog(
        'Delete this item?',
        'Delete',
        async () => {
          await updateListWith((currentList) =>
            currentList.filter((_, i) => i !== idx)
          );
        }
      );
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