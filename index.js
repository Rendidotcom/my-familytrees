// index.js — kompatibel dengan GAS "as-is"
// Requires: config.js that defines window.API_URL (string)

(function(){
  // --- helper UI navbar (self-contained) ---
  function createNavbar() {
    const nav = document.getElementById('navbar');
    nav.innerHTML = `<div class="nav">
      <a href="dashboard.html">📋 Dashboard</a>
      <a href="tree.html">🌳 Tree</a>
      <a href="#" id="navLogout">🚪 Logout</a>
    </div>`;
    const lnk = document.getElementById('navLogout');
    if (lnk) lnk.addEventListener('click', (e)=>{ e.preventDefault(); logout();});
  }
  createNavbar();

  // --- session helpers ---
  function getSession() {
    try{
      return JSON.parse(localStorage.getItem('familyUser') || 'null');
    }catch(e){
      return null;
    }
  }

  function requireSession() {
    const s = getSession();
    if(!s || !s.token) {
      alert('⚠ Harap login terlebih dahulu!');
      location.href = 'login.html';
      throw new Error('no-session');
    }
    return s;
  }

  // --- basic DOM refs ---
  const form = document.getElementById('formAdd');
  const msg = document.getElementById('msg');
  const errBox = document.getElementById('errBox');
  const btnSave = document.getElementById('btnSave');

  const nameEl = document.getElementById('name');
  const domEl = document.getElementById('domisili');
  const relEl = document.getElementById('relationship');
  const ayahEl = document.getElementById('parentIdAyah');
  const ibuEl = document.getElementById('parentIdIbu');
  const spouseEl = document.getElementById('spouseId');
  const orderEl = document.getElementById('orderChild');
  const statusEl = document.getElementById('status');
  const notesEl = document.getElementById('notes');
  const photoEl = document.getElementById('photo');

  // --- safety: ensure API_URL is present ---
  if (typeof window.API_URL === 'undefined' || !window.API_URL) {
    err('Konfigurasi API_URL tidak ditemukan. Pastikan file config.js memuat: window.API_URL = "https://script.google.com/......./exec";');
    throw new Error('no-api-url');
  }

  // --- utility functions ---
  function err(text){
    errBox.style.display = 'block';
    errBox.textContent = text;
    console.error(text);
  }
  function info(text){
    msg.textContent = text;
    errBox.style.display = 'none';
  }

  async function toBase64(file){
    return new Promise((res, rej)=>{
      const r = new FileReader();
      r.onload = ()=>res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // --- token validation (calls GAS validate) ---
  async function validateToken(session){
    try {
      const url = `${API_URL}?mode=validate&token=${encodeURIComponent(session.token)}`;
      const r = await fetch(url);
      // if response is not JSON, this will throw later — handle gracefully
      const j = await r.json();
      if (j.status !== 'success') {
        alert('Sesi berakhir!');
        logout();
        throw new Error('invalid-session');
      }
      // map name & role back to session object
      session.role = j.role;
      session.name = j.name;
      // admin only for this form
      if (session.role !== 'admin') {
        alert('⛔ Hanya admin!');
        location.href = 'dashboard.html';
        throw new Error('forbidden');
      }
      return session;
    } catch (e){
      // common reason: CORS failed (fetch failed), or JSON parse failed
      if (e.name === 'TypeError' || e.message.includes('Failed to fetch')) {
        err('Gagal terhubung ke API. Jika pesan menunjukkan CORS, pastikan WebApp GAS sudah di-deploy dan web app permission: "Anyone, even anonymous" atau gunakan ?shell=1 untuk debugging.');
      } else {
        err('validateToken error: ' + (e.message || e));
      }
      throw e;
    }
  }

  // --- load members for selects ---
  async function loadMembers(){
    try {
      const r = await fetch(`${API_URL}?mode=getdata`); // GAS router lowercases mode
      const j = await r.json();
      if (j.status !== 'success') {
        console.warn('getdata returned not-success:', j);
        return;
      }
      const arr = j.data || [];
      const selects = [ayahEl, ibuEl, spouseEl];
      selects.forEach(s => s.innerHTML = `<option value="">-- Pilih --</option>`);
      arr.forEach(person => {
        const opt = `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name)}</option>`;
        selects.forEach(s => s.insertAdjacentHTML('beforeend', opt));
      });
    } catch (e) {
      console.error('Load members error:', e);
      // if CORS or network, give hint
      err('Gagal memuat daftar anggota. Periksa koneksi / izin WebApp GAS (CORS). Pesan: ' + (e.message || e));
    }
  }

  // sanitize simple text for HTML insertion
  function escapeHtml(s){
    if(!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  // --- submit handler ---
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    info('⏳ Menyimpan...');
    btnSave.disabled = true;
    btnSave.style.opacity = '0.6';

    const session = requireSession();

    // basic client validation
    const name = nameEl.value.trim();
    if (!name) {
      alert('Nama wajib diisi.');
      info('');
      btnSave.disabled = false; btnSave.style.opacity = '1';
      return;
    }

    let photoBase = '';
    let photoType = '';
    const f = photoEl.files[0];
    if (f) {
      try {
        const b64 = await toBase64(f);
        photoBase = b64.split(',')[1] || '';
        photoType = f.type || '';
      } catch (errRead) {
        console.warn('read photo error', errRead);
      }
    }

    const payload = {
      mode: 'insert',
      token: session.token,
      createdBy: session.name || '',
      name: name,
      domisili: domEl.value.trim(),
      relationship: relEl.value,
      parentIdAyah: ayahEl.value,
      parentIdIbu: ibuEl.value,
      spouseId: spouseEl.value,
      orderChild: orderEl.value,
      status: statusEl.value,
      notes: notesEl.value.trim(),
      photo_base64: photoBase,
      photo_type: photoType
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      // if CORS preflight / OPTIONS failed, this will throw
      const j = await res.json();

      if (j.status === 'success') {
        info('✅ Berhasil! Mengalihkan…');
        // small delay so user sees the message
        setTimeout(()=> {
          form.reset();
          location.href = 'dashboard.html';
        }, 600);
      } else {
        info('❌ ' + (j.message || 'Server menolak permintaan.'));
      }

    } catch (e) {
      console.error('Submit error', e);
      if (e.name === 'TypeError' && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'))) {
        err('Gagal terhubung ke API. Kemungkinan: CORS atau WebApp belum di-deploy untuk publik. Cek pengaturan deploy (publish as web app) atau buka URL GAS dengan ?shell=1 untuk debug.');
      } else {
        err('Error saat menyimpan: ' + (e.message || e));
      }
    } finally {
      btnSave.disabled = false;
      btnSave.style.opacity = '1';
    }
  });

  // --- logout ---
  function logout(){
    const s = getSession();
    if (s && s.token) {
      // best-effort logout; ignore errors
      fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(s.token)}`).finally(()=> {
        localStorage.removeItem('familyUser');
        location.href = 'login.html';
      });
    } else {
      localStorage.removeItem('familyUser');
      location.href = 'login.html';
    }
  }

  // --- bootstrap: require session, validate, load members ---
  (async function init(){
    try {
      const session = requireSession();
      await validateToken(session);
      await loadMembers();
      info('Siap. Silakan isi form.');
    } catch (e) {
      // validation already reported; ensure UI shows problem
      if (e.message !== 'no-session' && e.message !== 'forbidden') {
        err('Inisialisasi gagal: ' + (e.message || e));
      }
    }
  })();

})();