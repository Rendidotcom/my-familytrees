/* ======================================================
   delete.js — ADMIN FULL MODE (sinkron dgn GAS)
   - expects window.API_URL from config.js
   - expects localStorage.familyUser contains {id,name,role,token}
====================================================== */

(function(){
  'use strict';

  console.log("DELETE.JS (ADMIN FULL MODE) LOADED");

  // --------- Utilities & UI helpers ----------
  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Toast container (small)
  function ensureToast() {
    let c = document.getElementById('mft-toast-container');
    if (c) return c;
    c = document.createElement('div');
    c.id = 'mft-toast-container';
    c.style.position = 'fixed';
    c.style.right = '18px';
    c.style.top = '18px';
    c.style.zIndex = 99999;
    document.body.appendChild(c);
    return c;
  }
  function toast(msg, type='info', timeout=3500){
    // type: info | success | error
    const c = ensureToast();
    const el = document.createElement('div');
    el.className = 'mft-toast mft-toast-' + type;
    el.style.marginTop = '8px';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
    el.style.background = (type==='error') ? '#ffeded' : (type==='success') ? '#e8f7ec' : '#eef6ff';
    el.style.color = (type==='error') ? '#8b0000' : (type==='success') ? '#0b6623' : '#0d47a1';
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(()=> {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(12px)';
      setTimeout(()=> el.remove(), 350);
    }, timeout);
  }

  // add small styles
  (function addStyles(){
    if (document.getElementById('mft-delete-styles')) return;
    const s = document.createElement('style');
    s.id = 'mft-delete-styles';
    s.innerHTML = `
      .mft-loader { display:inline-block; margin-left:8px; width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,0.6); border-top-color: rgba(255,255,255,1); animation:mft-spin .8s linear infinite; vertical-align:middle; }
      .mft-loader-dark { border:2px solid rgba(0,0,0,0.12); border-top-color: rgba(0,0,0,0.35); }
      @keyframes mft-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(s);
  })();

  // --------- Config & Session ----------
  if (typeof window.API_URL === 'undefined' || !window.API_URL) {
    console.error("delete.js: API_URL missing. Make sure config.js sets window.API_URL");
    toast("Konfigurasi API hilang. Periksa config.js", "error", 5000);
    return;
  }
  const API_URL = window.API_URL;

  function safeParseSession(){
    try {
      const raw = localStorage.getItem('familyUser') || 'null';
      return JSON.parse(raw);
    } catch(e) {
      return null;
    }
  }

  const session = safeParseSession();
  if (!session || !session.token || !session.id) {
    console.warn("delete.js: session missing or invalid");
    // redirect to login or show message
    toast("Sesi tidak valid. Silakan login kembali.", "error", 5000);
    setTimeout(()=> location.href = 'login.html', 1400);
    return;
  }

  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const IS_ADMIN = (session.role === 'admin');

  // --------- DOM elements (expected in delete.html) ----------
  // Prefer IDs used in your HTML; fallback auto-find
  const tbody = qs('#userTableBody') || qs('#tbody') || qs('#userTable tbody') || (() => {
    // try to create one if missing
    const tbl = qs('table');
    if (tbl) {
      let tb = tbl.querySelector('tbody');
      if (!tb) {
        tb = document.createElement('tbody');
        tbl.appendChild(tb);
      }
      tb.id = 'userTableBody';
      return tb;
    }
    return null;
  })();

  // Buttons: prefer explicit IDs used in your HTML
  const btnRefresh = qs('#refreshBtn') || qs('#btnRefresh') || findButtonByText('refresh') || null;
  const btnDeleteSelected = qs('#deleteSelectedBtn') || qs('#btnDeleteSelected') || findButtonByText('hapus terpilih') || null;
  const btnDeleteAll = qs('#deleteAllBtn') || qs('#btnDeleteAll') || findButtonByText('hapus semua') || null;

  function findButtonByText(part){
    part = (part || '').toLowerCase();
    return Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').toLowerCase().includes(part));
  }

  if (!tbody) {
    console.error("delete.js: tbody (#userTableBody) not found. Aborting.");
    toast("Elemen tabel tidak ditemukan (userTableBody).", "error", 5000);
    return;
  }

  // graceful: hide admin-only buttons for non-admin
  if (!IS_ADMIN) {
    if (btnDeleteAll) btnDeleteAll.style.display = 'none';
    if (btnDeleteSelected) btnDeleteSelected.style.display = 'none';
  }

  // disable/enable helper
  function setControlsDisabled(state){
    if (btnRefresh) btnRefresh.disabled = state;
    if (btnDeleteSelected) btnDeleteSelected.disabled = state;
    if (btnDeleteAll) btnDeleteAll.disabled = state;
    // also disable checkboxes
    qsa('.chkUser').forEach(c => c.disabled = state);
  }

  // --------- Fetch helpers ----------
  async function safeFetchJSON(url, opts){
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch(e) {
        console.error("safeFetchJSON: JSON parse failed:", e, "raw:", text);
        return { error: true, raw: text };
      }
    } catch (netErr) {
      console.error("safeFetchJSON: network error", netErr);
      return { error: true, message: netErr.message || String(netErr) };
    }
  }

  // --------- Main: load users ----------
  async function loadUsers(){
    setControlsDisabled(true);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px">Memuat data... <span class="mft-loader-dark"></span></td></tr>`;

    const url = `${API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}`;
    console.log("[DELETE] FETCH", url);

    const r = await safeFetchJSON(url);
    if (!r || r.error) {
      console.error("LOAD ERROR:", r);
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#b00020;padding:18px">Gagal memuat data</td></tr>`;
      toast("Gagal memuat data dari server.", "error", 3500);
      setControlsDisabled(false);
      return;
    }

    if (r.status !== 'success' || !Array.isArray(r.data)) {
      console.error("LOAD ERROR: unexpected response", r);
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#b00020;padding:18px">Response tidak sesuai</td></tr>`;
      toast("Format response API tidak sesuai.", "error", 4000);
      setControlsDisabled(false);
      return;
    }

    let users = r.data;
    // normalize: ensure each item has id,name,email keys
    users = users.map(u => ({
      id: String(u.id || u.ID || u.Id || ''),
      name: u.name || u.nama || u.Name || '',
      email: u.email || u.domisili || u.domisili || ''
    })).filter(u => u.id);

    // Non-admin only sees own record
    if (!IS_ADMIN) {
      users = users.filter(u => String(u.id) === MY_ID);
    }

    renderTable(users);
    setControlsDisabled(false);
  }

  // --------- Render ----------
  function renderTable(users){
    if (!users || users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px">Tidak ada user.</td></tr>`;
      return;
    }

    const rows = users.map(u => {
      const canCheck = IS_ADMIN || String(u.id) === MY_ID;
      const chk = `<input type="checkbox" class="chkUser" value="${escapeHtml(u.id)}" ${canCheck ? '' : 'disabled'} aria-label="Pilih user ${escapeHtml(u.name)}">`;
      return `<tr>
        <td style="width:1%">${chk}</td>
        <td style="width:40%;word-break:break-word">${escapeHtml(u.id)}</td>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email || '-')}</td>
      </tr>`;
    }).join('');
    tbody.innerHTML = rows;
  }

  // basic escaper
  function escapeHtml(s){
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }

  // --------- Delete helpers ----------
  async function deleteById(id){
    const url = `${API_URL}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`;
    console.log("[DELETE] DELETE ID", id);
    return await safeFetchJSON(url);
  }

  // delete selected
  async function deleteSelected(){
    const checked = qsa('.chkUser:checked').map(i => i.value);
    if (!checked.length) {
      alert("Tidak ada user dipilih.");
      return;
    }

    // if non-admin and they selected someone else — block (shouldn't happen because non-admin only sees own)
    if (!IS_ADMIN && !checked.includes(MY_ID)) {
      alert("Anda hanya boleh menghapus akun Anda sendiri.");
      return;
    }

    if (!confirm(`Hapus ${checked.length} akun terpilih?`)) return;

    setControlsDisabled(true);

    for (const id of checked) {
      const res = await deleteById(id);
      if (!res || res.error) {
        console.error("DELETE ERROR for", id, res);
        toast(`Gagal menghapus ID ${id}`, "error", 5000);
        setControlsDisabled(false);
        return;
      }
      if (res.status && res.status === 'error') {
        console.error("DELETE REJECTED", res);
        toast(`Gagal: ${res.message || 'server'}`, "error", 4500);
        setControlsDisabled(false);
        return;
      }

      // if user deleted themselves, log out and redirect
      if (String(id) === MY_ID) {
        localStorage.removeItem('familyUser');
        toast("Akun Anda telah dihapus. Mengalihkan ke login...", "success", 2400);
        setTimeout(()=> location.href = 'login.html', 900);
        return;
      }
    }

    toast("Penghapusan selesai.", "success", 2200);
    await loadUsers();
  }

  // delete all (admin only)
  async function deleteAll(){
    if (!IS_ADMIN) {
      alert("Akses ditolak: hanya admin.");
      return;
    }
    if (!confirm("⚠ Yakin ingin menghapus SEMUA user? (tidak dapat dibatalkan)")) return;

    setControlsDisabled(true);

    // collect all non-empty ids currently rendered (enabled or not)
    const allIds = qsa('.chkUser').map(c => c.value).filter(Boolean);

    // fallback: if table empty, fetch list first
    if (allIds.length === 0) {
      // try loading users (admin) and collect IDs
      const url = `${API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}`;
      const r = await safeFetchJSON(url);
      if (!r || r.error || r.status !== 'success' || !Array.isArray(r.data)) {
        toast("Gagal memuat daftar untuk hapus semua.", "error", 4000);
        setControlsDisabled(false);
        return;
      }
      allIds.push(...r.data.map(u => String(u.id)).filter(Boolean));
    }

    for (const id of allIds) {
      const res = await deleteById(id);
      if (!res || res.error) {
        console.error("DELETE ALL ERROR for", id, res);
        toast(`Gagal menghapus ID ${id}`, "error", 5000);
        setControlsDisabled(false);
        return;
      }
    }

    toast("Semua user berhasil dihapus.", "success", 2500);
    await loadUsers();
    setControlsDisabled(false);
  }

  // --------- Attach events ----------
  if (btnRefresh) btnRefresh.addEventListener('click', loadUsers);
  if (btnDeleteSelected) btnDeleteSelected.addEventListener('click', deleteSelected);
  if (btnDeleteAll) btnDeleteAll.addEventListener('click', deleteAll);

  // keyboard: Enter on refresh button
  if (btnRefresh) btnRefresh.addEventListener('keyup', e => { if (e.key === 'Enter') loadUsers(); });

  // init
  setTimeout(() => {
    // small delay so page elements settle
    loadUsers().catch(err => {
      console.error("Initial loadUsers error", err);
      toast("Gagal memuat data pada inisialisasi.", "error", 4000);
    });
  }, 60);

})();
