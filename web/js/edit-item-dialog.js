import { showConfirmDialog } from './confirm.js';

/**
 * Opens the item edition dialog (rename or delete the item).
 * The dialog is built dynamically and removed from the DOM when closed.
 * @param {string} itemName - The current item label
 * @param {Object} actions
 * @param {(newName: string) => Promise<void>} actions.onRename - Called with the new label
 * @param {() => Promise<void>} actions.onDelete - Called when the deletion is confirmed
 */
export function openEditItemDialog(itemName, { onRename, onDelete }) {
  // Reuses the settings modal styles, stays below remove-modal (z-index 1000)
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
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

  const form = document.createElement('form');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = itemName;
  input.required = true;
  const renameBtn = document.createElement('button');
  renameBtn.type = 'submit';
  renameBtn.textContent = 'Rename';
  form.append(input, renameBtn);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (name && name !== itemName) {
      await onRename(name);
    }
    close();
  };
  content.appendChild(form);

  const delBtn = document.createElement('button');
  delBtn.className = 'text-btn';
  delBtn.style.background = '#d32f2f';
  delBtn.style.alignSelf = 'flex-end';
  delBtn.textContent = 'Delete item';
  delBtn.onclick = () => {
    showConfirmDialog('Delete this item?', 'Delete', async () => {
      await onDelete();
      close();
    });
  };
  content.appendChild(delBtn);

  document.body.appendChild(modal);
  input.focus();
  input.select();
}
