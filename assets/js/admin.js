// assets/js/admin.js
// Admin panel logic: login, view/delete notes, view/dismiss complaints
// Place this file at: assets/js/admin.js
// Works with pages/admin.html

(() => {
  const ADMIN_USER = 'Admin';
  const ADMIN_PASS = 'Admin1010';
  const NOTES_KEY = 'notes_vault_v1';
  const COMPLAINTS_KEY = 'notes_complaints_v1';

  // DOM
  const loginArea = document.getElementById('login-area');
  const adminControls = document.getElementById('admin-controls');
  const loginBtn = document.getElementById('admin-login-btn');
  const usernameInput = document.getElementById('admin-username');
  const passwordInput = document.getElementById('admin-password');
  const logoutBtn = document.getElementById('admin-logout');

  const adminNotesList = document.getElementById('admin-notes-list');
  const complaintsList = document.getElementById('complaints-list');

  let notes = [];
  let complaints = [];
  let isAdmin = false;

  // Helpers
  function loadData() {
    try {
      notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
    } catch (e) {
      notes = [];
    }
    try {
      complaints = JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
    } catch (e) {
      complaints = [];
    }
  }

  function saveNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function saveComplaints() {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]);
    });
  }

  // Render admin UI
  function renderAdmin() {
    loadData();

    if (!isAdmin) {
      loginArea.classList.remove('hidden');
      adminControls.classList.add('hidden');
      return;
    }

    loginArea.classList.add('hidden');
    adminControls.classList.remove('hidden');

    // Render notes
    adminNotesList.innerHTML = '';
    if (!notes.length) {
      adminNotesList.innerHTML = '<div class="text-sm text-gray-500">No notes available</div>';
    } else {
      notes.forEach(n => {
        const row = document.createElement('div');
        row.className = 'admin-note-row';
        row.innerHTML = `
          <div style="min-width:0">
            <div class="font-medium">${escapeHtml(n.topic)}</div>
            <div class="text-sm text-gray-500">${escapeHtml(n.subCode)} • ${escapeHtml(n.subName)} • ${new Date(n.createdAt).toLocaleString()}</div>
            <div class="text-sm text-gray-700 mt-1">Notes: <a href="${escapeHtml(n.notesLink)}" target="_blank" rel="noopener" class="underline">${escapeHtml(n.notesName)}</a></div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <a href="${escapeHtml(n.notesLink)}" target="_blank" class="text-sm text-blue-600">Open</a>
            <button class="delete-note text-sm text-red-600" data-id="${n.id}">Delete</button>
          </div>
        `;
        adminNotesList.appendChild(row);
      });
    }

    // Render complaints
    complaintsList.innerHTML = '';
    if (!complaints.length) {
      complaintsList.innerHTML = '<div class="text-sm text-gray-500">No complaints</div>';
    } else {
      complaints.forEach(c => {
        const note = notes.find(n => n.id === c.noteId);
        const item = document.createElement('div');
        item.className = 'complaint-item';
        item.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:12px">
            <div style="min-width:0">
              <div class="text-sm text-gray-700"><strong>Note:</strong> ${note ? escapeHtml(note.topic) : '<em>deleted</em>'}</div>
              <div class="text-sm text-gray-500">By: ${escapeHtml(c.name || 'Anonymous')} • ${new Date(c.createdAt).toLocaleString()}</div>
              <div class="mt-2 text-sm">${escapeHtml(c.reason)}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
              ${note ? `<button class="delete-note text-sm text-red-600" data-id="${note.id}">Delete Note</button>` : ''}
              <button class="dismiss-complaint text-sm text-gray-600" data-id="${c.id}">Dismiss</button>
            </div>
          </div>
        `;
        complaintsList.appendChild(item);
      });
    }

    attachHandlers();
  }

  // Attach handlers for dynamic buttons
  function attachHandlers() {
    // Delete note buttons
    const deleteBtns = document.querySelectorAll('.delete-note');
    deleteBtns.forEach(btn => {
      btn.removeEventListener('click', onDeleteNote);
      btn.addEventListener('click', onDeleteNote);
    });

    // Dismiss complaint buttons
    const dismissBtns = document.querySelectorAll('.dismiss-complaint');
    dismissBtns.forEach(btn => {
      btn.removeEventListener('click', onDismissComplaint);
      btn.addEventListener('click', onDismissComplaint);
    });
  }

  function onDeleteNote(e) {
    const id = e.currentTarget.getAttribute('data-id');
    if (!id) return;
    if (!confirm('Delete this note permanently?')) return;
    // remove note
    notes = notes.filter(n => n.id !== id);
    // remove related complaints
    complaints = complaints.filter(c => c.noteId !== id);
    saveNotes();
    saveComplaints();
    renderAdmin();
    alert('Note deleted.');
  }

  function onDismissComplaint(e) {
    const id = e.currentTarget.getAttribute('data-id');
    if (!id) return;
    complaints = complaints.filter(c => c.id !== id);
    saveComplaints();
    renderAdmin();
  }

  // Login
  loginBtn.addEventListener('click', () => {
    const u = (usernameInput.value || '').trim();
    const p = passwordInput.value || '';
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      isAdmin = true;
      usernameInput.value = '';
      passwordInput.value = '';
      renderAdmin();
      alert('Admin logged in');
    } else {
      alert('Invalid credentials');
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    if (!confirm('Logout admin?')) return;
    isAdmin = false;
    renderAdmin();
  });

  // Initialize
  function init() {
    loadData();
    renderAdmin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
