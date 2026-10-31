import { showConfirmDialog } from './confirm.js';

/**
 * Opens the list edition dialog (rename, urgent flag, users management, deletion).
 * Guests get a restricted, read-only version of the dialog with a "leave list" action.
 * The dialog is built dynamically and removed from the DOM when closed.
 * @param {Object} list - The list document data ({id, name, users, guests, urgentEnabled, ...})
 * @param {AppState} appState - The application state (current user, selected list)
 */
export function openEditListDialog(list, appState) {
  const me = appState.user.email;
  const data = {
    id: list.id,
    name: list.name || '',
    users: Array.isArray(list.users) ? [...list.users] : [],
    guests: Array.isArray(list.guests) ? [...list.guests] : [],
    urgentEnabled: list.urgentEnabled !== false
  };
  const admins = () => data.users.filter(u => !data.guests.includes(u));
  const isAdmin = !data.guests.includes(me);

  const update = (fields) => window.db.updateList({ id: data.id, ...fields });

  // --- Build the dialog (reuses the settings modal styles) ---
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  // Keep the dialog below remove-modal (z-index 1000) so confirm dialogs stay on top
  modal.style.zIndex = '999';
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  const content = document.createElement('div');
  content.className = 'settings-modal-content';
  modal.appendChild(content);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'settings-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = close;
  content.appendChild(closeBtn);

  function close() {
    modal.remove();
  }

  function card(title) {
    const c = document.createElement('div');
    c.className = 'settings-card';
    const t = document.createElement('div');
    t.className = 'settings-card-title';
    t.textContent = title;
    c.appendChild(t);
    return c;
  }

  function userRow(email, actions) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:0.4em;padding:0.15em 0;';
    const span = document.createElement('span');
    span.textContent = email;
    span.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.93em;';
    row.appendChild(span);
    actions.forEach(a => row.appendChild(a));
    return row;
  }

  function smallBtn(label, onClick) {
    const b = document.createElement('button');
    b.className = 'text-btn';
    b.style.cssText = 'min-width:0;padding:0.15em 0.5em;font-size:0.8em;';
    b.textContent = label;
    b.onclick = onClick;
    return b;
  }

  function sectionTitle(text) {
    const t = document.createElement('div');
    t.className = 'lists-title';
    t.style.fontSize = '0.9em';
    t.textContent = text;
    return t;
  }

  // --- List card: rename form + urgent toggle (read-only for guests) ---
  const listCard = card('List');
  const renameForm = document.createElement('form');
  renameForm.style.marginBottom = '0.8em';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = data.name;
  nameInput.required = true;
  nameInput.disabled = !isAdmin;
  const renameBtn = document.createElement('button');
  renameBtn.type = 'submit';
  renameBtn.textContent = 'Rename';
  renameBtn.disabled = !isAdmin;
  renameForm.append(nameInput, renameBtn);
  renameForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name || name === data.name) return;
    await update({ name });
    data.name = name;
  };
  listCard.appendChild(renameForm);

  const urgentLabel = document.createElement('label');
  urgentLabel.style.cssText = 'display:flex;align-items:center;gap:0.5em;cursor:pointer;font-size:0.97em;';
  const urgentChk = document.createElement('input');
  urgentChk.type = 'checkbox';
  urgentChk.checked = data.urgentEnabled;
  urgentChk.disabled = !isAdmin;
  urgentChk.onchange = async () => {
    await update({ urgentEnabled: urgentChk.checked });
    data.urgentEnabled = urgentChk.checked;
  };
  urgentLabel.append(urgentChk, document.createTextNode('Items can be marked urgent'));
  listCard.appendChild(urgentLabel);
  content.appendChild(listCard);

  // --- Users card: administrators always, guests management for admins only ---
  const usersCard = card(isAdmin ? 'Users' : 'Administrators');
  const adminsDiv = document.createElement('div');
  const guestsDiv = document.createElement('div');
  usersCard.appendChild(adminsDiv);

  function renderAdmins() {
    adminsDiv.innerHTML = '';
    if (isAdmin) adminsDiv.appendChild(sectionTitle('Administrators'));
    admins().forEach(email => {
      const actions = isAdmin && email === me ? [smallBtn('Demote', demoteSelf)] : [];
      adminsDiv.appendChild(userRow(email, actions));
    });
  }

  async function updateGuest(email, action) {
    if (action === 'promote') {
      // Promotion to administrator only removes the user from the guests array
      data.guests = data.guests.filter(g => g !== email);
      await update({ guests: data.guests });
    } else {
      data.users = data.users.filter(u => u !== email);
      data.guests = data.guests.filter(g => g !== email);
      await update({ users: data.users, guests: data.guests });
    }
    renderAdmins();
    renderGuests();
  }

  function demoteSelf() {
    if (admins().length === 1) {
      showConfirmDialog(
        'You are the last administrator of this list. Removing yourself will delete the list.',
        'Delete list',
        async () => {
          await window.db.deleteList(data.id);
          close();
          appState.setListId(null);
        }
      );
    } else {
      // Losing the administrator role closes the dialog
      data.guests = [...data.guests, me];
      update({ guests: data.guests }).then(close);
    }
  }
  function renderGuests() {
    guestsDiv.innerHTML = '';
    guestsDiv.appendChild(sectionTitle('Guests'));
    if (data.guests.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#888;font-size:0.9em;';
      empty.textContent = 'No guests.';
      guestsDiv.appendChild(empty);
    }
    data.guests.forEach(email => {
      guestsDiv.appendChild(userRow(email, [
        smallBtn('Promote', () => updateGuest(email, 'promote')),
        smallBtn('Remove', () => updateGuest(email, 'remove'))
      ]));
    });
  }

  renderAdmins();

  if (isAdmin) {
    usersCard.appendChild(guestsDiv);
    renderGuests();

    const addForm = document.createElement('form');
    addForm.style.marginTop = '0.7em';
    const guestInput = document.createElement('input');
    guestInput.type = 'email';
    guestInput.placeholder = 'Guest email...';
    guestInput.required = true;
    guestInput.style.flex = '1';
    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.textContent = 'Add';
    addForm.append(guestInput, addBtn);
    addForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = guestInput.value.trim().toLowerCase();
      guestInput.value = '';
      if (!email || data.users.includes(email)) return;
      data.users = [...data.users, email];
      data.guests = [...data.guests, email];
      await update({ users: data.users, guests: data.guests });
      renderAdmins();
      renderGuests();
    };
    usersCard.appendChild(addForm);
  }
  content.appendChild(usersCard);

  // --- Danger zone: delete the list for admins, leave it for guests ---
  const dangerCard = card('Danger zone');
  if (isAdmin) {
    const delBtn = document.createElement('button');
    delBtn.className = 'text-btn';
    delBtn.style.background = '#d32f2f';
    delBtn.textContent = 'Delete list';
    delBtn.onclick = () => {
      showConfirmDialog(
        `Are you sure you want to delete the list "${data.name || data.id}"? This cannot be undone.`,
        'Delete',
        async () => {
          await window.db.deleteList(data.id);
          close();
          appState.setListId(null);
        }
      );
    };
    dangerCard.appendChild(delBtn);
  } else {
    // Leaving the list removes the guest from both users and guests arrays
    const leaveBtn = document.createElement('button');
    leaveBtn.className = 'text-btn';
    leaveBtn.style.background = '#d32f2f';
    leaveBtn.textContent = 'Leave list';
    leaveBtn.onclick = () => {
      showConfirmDialog(
        `Are you sure you want to leave the list "${data.name || data.id}"? An administrator will have to add you back.`,
        'Leave',
        async () => {
          data.users = data.users.filter(u => u !== me);
          data.guests = data.guests.filter(g => g !== me);
          await update({ users: data.users, guests: data.guests });
          close();
          appState.setListId(null);
        }
      );
    };
    dangerCard.appendChild(leaveBtn);
  }
  content.appendChild(dangerCard);

  document.body.appendChild(modal);
}
