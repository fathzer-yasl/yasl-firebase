// confirm.js
// Reusable confirmation modal logic for remove-modal

/**
 * Shows a confirmation dialog using the existing remove-modal.
 * @param {string} question - The question to display in the modal
 * @param {string} confirmLabel - The label for the confirm button
 * @param {Function} onConfirm - The callback to execute if confirmed
 */
export function showConfirmDialog(question, confirmLabel, onConfirm) {
  const modal = document.getElementById('remove-modal');
  const title = modal.querySelector('.remove-modal-title');
  const confirmBtn = document.getElementById('remove-confirm-btn');
  const cancelBtn = document.getElementById('remove-cancel-btn');
  if (!modal || !title || !confirmBtn || !cancelBtn) {
    alert('Confirmation modal not found!');
    return;
  }
  title.textContent = question;
  confirmBtn.textContent = confirmLabel;
  modal.style.display = 'flex';

  // Remove previous listeners to avoid stacking
  confirmBtn.onclick = null;
  cancelBtn.onclick = null;
  modal.onclick = null;

  confirmBtn.onclick = (e) => {
    e.stopPropagation();
    modal.style.display = 'none';
    if (typeof onConfirm === 'function') onConfirm();
  };
  cancelBtn.onclick = (e) => {
    e.stopPropagation();
    modal.style.display = 'none';
  };
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}
