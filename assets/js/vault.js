// assets/js/vault.js
// Notes Vault logic: upload, list, search, pagination, complaints
// Place this file at: assets/js/vault.js
// Works with pages/vault.html

(() => {
  const NOTES_KEY = 'notes_vault_v1';
  const COMPLAINTS_KEY = 'notes_complaints_v1';
  const PAGE_SIZE = 6; // notes per page

  // DOM elements
  const searchInput = document.getElementById('search');
  const subjectFilter = document.getElementById('subjectFilter');
  const notesContainer = document.getElementById('notes-container');
  const totalCountEl = document.getElementById('total-count');
  const openUploadBtn = document.getElementById('open-upload');
  const uploadModal = document.getElementById('upload-modal');
  const uploadForm = document.getElementById('upload-form');
  const cancelUploadBtns = [
    document.getElementById('cancel-upload'),
    document.getElementById('cancel-upload-2')
  ].filter(Boolean);

  const complaintModal = document.getElementById('complaint-modal');
  const complaintForm = document.getElementById('complaint-form');
  const cancelComplaintBtns = [
    document.getElementById('cancel-complaint'),
    document.getElementById('cancel-complaint-2')
  ].filter(Boolean);

  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const currentPageEl = document.getElementById('current-page');
  const totalPagesEl = document.getElementById('total-pages');

  // internal state
  let notes = [];
  let complaints = [];
  let currentPage = 1;
  let filteredNotes = [];

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

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]);
    });
  }

  // UI helpers for modals
  function showModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
  }
  function hideModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    modalEl.classList.remove('flex');
  }

  // Build subject filter options
  function buildSubjectOptions() {
    const subs = Array.from(new Set(notes.map(n => n.subName))).sort();
    subjectFilter.innerHTML = '<option value="">All Subjects</option>';
    subs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      subjectFilter.appendChild(opt);
    });
  }

  // Apply search and subject filter
  function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const subj = subjectFilter.value;
    filteredNotes = notes.filter(n => {
      const combined = `${n.subCode} ${n.subName} ${n.topic} ${n.notesName}`.toLowerCase();
      const matchesQ = !q || combined.includes(q);
      const matchesSub = !subj || n.subName === subj;
      return matchesQ && matchesSub;
    });
    currentPage = 1;
    renderNotes();
  }

  // Render notes for current page
  function renderNotes() {
    buildSubjectOptions();
    const total = filteredNotes.length;
    totalCountEl.textContent = total;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    totalPagesEl.textContent = totalPages;
    currentPageEl.textContent = currentPage;

    // clamp currentPage
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredNotes.slice(start, start + PAGE_SIZE);

    notesContainer.innerHTML = '';
    if (!pageItems.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<div class="text-sm">No notes found</div>';
      notesContainer.appendChild(empty);
      return;
    }

    pageItems.forEach(n => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.innerHTML = `
        <div style="flex:1;min-width:0">
          <div class="note-meta">${escapeHtml(n.subCode)} • ${escapeHtml(n.subName)} • ${new Date(n.createdAt).toLocaleString()}</div>
          <div class="note-title">${escapeHtml(n.topic)}</div>
          <div class="text-sm text-gray-700 mt-1">Notes: <a href="${escapeHtml(n.notesLink)}" target="_blank" rel="noopener" class="underline">${escapeHtml(n.notesName)}</a></div>
        </div>
        <div class="note-actions" style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;margin-left:12px">
          <div>
            <a href="${escapeHtml(n.notesLink)}" target="_blank" rel="noopener" class="text-sm text-blue-600 mr-3">Open</a>
            <a href="${escapeHtml(n.notesLink)}" target="_blank" rel="noopener" download class="text-sm text-gray-600">Download</a>
          </div>
          <div>
            <a href="/pages/complaint.html?noteId=${encodeURIComponent(String(n.id))}" class="text-sm text-red-600">Complain</a>
          </div>
        </div>
      `;
      notesContainer.appendChild(card);
    });

    // update pagination button states
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
  }

  // Pagination handlers
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderNotes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filteredNotes.length / PAGE_SIZE));
    if (currentPage < totalPages) {
      currentPage++;
      renderNotes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Search and filter events
  searchInput.addEventListener('input', () => {
    applyFilters();
  });
  subjectFilter.addEventListener('change', () => {
    applyFilters();
  });

  // Upload modal open/close
  openUploadBtn.addEventListener('click', () => {
    showModal(uploadModal);
    // focus first input
    setTimeout(() => {
      const el = document.getElementById('sub-code');
      if (el) el.focus();
    }, 80);
  });
  cancelUploadBtns.forEach(btn => {
    btn.addEventListener('click', () => hideModal(uploadModal));
  });

  // Complaint modal close handlers
  cancelComplaintBtns.forEach(btn => {
    btn.addEventListener('click', () => hideModal(complaintModal));
  });

  // Upload form submit
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subCode = (document.getElementById('sub-code').value || '').trim();
    const subName = (document.getElementById('sub-name').value || '').trim();
    const topic = (document.getElementById('topic-name').value || '').trim();
    const notesLink = (document.getElementById('notes-link').value || '').trim();
    const notesName = notesLink.split('/').pop() || notesLink;

    if (!subCode || !subName || !topic || !notesLink) {
      return alert('Please fill all fields');
    }

    const note = {
      id: uid(),
      subCode,
      subName,
      topic,
      notesLink,
      notesName,
      createdAt: new Date().toISOString()
    };

    notes.unshift(note);
    saveNotes();
    uploadForm.reset();
    hideModal(uploadModal);
    applyFilters();
    // optional small confirmation
    setTimeout(() => alert('Note uploaded successfully'), 50);
  });

  // Complaint flow: open modal when clicking "Complain"
  notesContainer.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.classList && target.classList.contains('file-complaint')) {
      const id = target.getAttribute('data-id');
      const hidden = document.getElementById('complaint-note-id');
      if (hidden) hidden.value = id;
      showModal(complaintModal);
      setTimeout(() => {
        const el = document.getElementById('complainant-name');
        if (el) el.focus();
      }, 80);
    }
  });

  // Complaint submit
  complaintForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const noteId = (document.getElementById('complaint-note-id').value || '').trim();
    const name = (document.getElementById('complainant-name').value || '').trim();
    const reason = (document.getElementById('complaint-reason').value || '').trim();

    if (!reason) return alert('Please provide a reason for the complaint');

    const complaint = {
      id: uid(),
      noteId,
      name,
      reason,
      createdAt: new Date().toISOString()
    };

    complaints.unshift(complaint);
    saveComplaints();
    complaintForm.reset();
    hideModal(complaintModal);
    alert('Complaint submitted. Admin will review it.');
  });

  // Keyboard: close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal(uploadModal);
      hideModal(complaintModal);
    }
  });

  // Click outside modal to close (backdrop)
  document.addEventListener('click', (e) => {
    // upload modal backdrop
    if (!uploadModal.classList.contains('hidden')) {
      const modalBox = uploadModal.querySelector('.modal') || uploadModal.querySelector('div');
      if (modalBox && !modalBox.contains(e.target) && !openUploadBtn.contains(e.target)) {
        hideModal(uploadModal);
      }
    }
    // complaint modal backdrop
    if (!complaintModal.classList.contains('hidden')) {
      const modalBox = complaintModal.querySelector('.modal') || complaintModal.querySelector('div');
      if (modalBox && !modalBox.contains(e.target)) {
        hideModal(complaintModal);
      }
    }
  });

  // Initialize app
  function init() {
    loadData();
    // default filtered list
    filteredNotes = notes.slice();
    applyFilters();
  }

  // Run init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
