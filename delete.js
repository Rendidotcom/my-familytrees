# delete.html — Premium V9

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Delete Manager — Premium V9</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
  <style>
    body{background:#f4f7fa}
    .card{max-width:1100px;margin:28px auto;padding:18px}
    .logBox{background:#0b1220;color:#bfe1ff;padding:12px;border-radius:8px;height:160px;overflow:auto;font-family:monospace;font-size:13px}
    .small-note{font-size:12px;color:#666}
  </style>
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container-fluid">
    <span class="navbar-brand">🌳 Delete Manager</span>
    <div class="d-flex">
      <button class="btn btn-light me-2" id="btnRefresh">🔄 Refresh</button>
      <button class="btn btn-danger me-2" id="btnDeleteSelected">🗑 Hapus Terpilih</button>
      <button class="btn btn-dark" id="btnDeleteAll">🔥 Delete SEMUA</button>
    </div>
  </div>
</nav>

<div class="container">
  <div class="card shadow">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="mb-0">Daftar Anggota</h5>
        <div class="small-note" id="roleBadge">Memuat sesi...</div>
      </div>
      <div>
        <input class="form-control" id="filterInput" placeholder="Cari nama atau id..." style="min-width:260px">
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:54px;text-align:center">Pilih</th>
            <th style="width:160px">ID</th>
            <th>Nama</th>
            <th>Domisili / Email</th>
          </tr>
        </thead>
        <tbody id="userTableBody">
          <tr><td colspan="4" class="text-center py-4">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3">
      <h6 class="mb-2">Debug / Log</h6>
      <div id="mftLog" class="logBox">Log dimulai...</div>
    </div>

  </div>
</div>

<!-- wajib: config.js mendefinisikan window.API_URL -->
<script src="config.js"></script>
<!-- delete.js (berisi logic) -->
<script src="delete.js"></script>
</body>
</html>
```

---

# delete.js — Premium V9 (FormData-first, CORS-safe, admin/user rules)

```javascript
/* delete.js — Premium V9
   - expects window.API_URL from config.js
   - expects localStorage.familyUser = { id, name, role, token }
   - FormData-first POST to avoid preflight with Google Apps Script
*/
(function () {
  "use strict";

  // DOM
  const tbody = document.getElementById('userTableBody');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnDeleteSelected = document.getElementById('btnDeleteSelected');
  const btnDeleteAll = document.getElementById('btnDeleteAll');
  const logEl = document.getElementById('mftLog');
  const roleBadge = document.getElementById('roleBadge');
  const filterInput = document.getElementById('filterInput');

  function log(...args){
    try{
      const t = new Date().toLocaleTimeString();
      const s = args.map(a => (typeof a==='object'?JSON.stringify(a):String(a))).join(' ');
      if(logEl) logEl.textContent = `${t}  ${s}\n` + logEl.textContent;
    }catch(e){}
    console.log(...args);
  }

  // session
  let session = null;
  try{ session = JSON.parse(localStorage.getItem('familyUser') || 'null'); }catch(e){ session = null; }
  if(!session || !session.token){
    alert('Sesi tidak tersedia — silakan login.');
    location.href = 'login.html';
    return;
  }
  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role||'user').toLowerCase();
  if(roleBadge) roleBadge.textContent = `${MY_ROLE.toUpperCase()} • ID: ${MY_ID}`;
  if(MY_ROLE !== 'admin' && btnDeleteAll) btnDeleteAll.style.display = 'none';

  // helpers
  function esc(s){ if(s===undefined||s===null) return ''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  async function postForm(mode, fields){
    const fd = new FormData();
    fd.append('mode', mode);
    if(TOKEN) fd.append('token', TOKEN);
    for(const k in fields) if(fields[k]!==undefined && fields[k]!==null) fd.append(k, fields[k]);
    try{
      const r = await fetch(window.API_URL, { method: 'POST', body: fd });
      const txt = await r.text();
      try{ return { ok:true, json: JSON.parse(txt), raw: txt, status: r.status }; }
      catch(e){ return { ok:false, err: 'invalid_json', raw: txt, status: r.status }; }
    }catch(err){ return { ok:false, err: String(err) }; }
  }

  async function getUrl(url){
    try{
      const r = await fetch(url);
      const txt = await r.text();
      try{ return { ok:true, json: JSON.parse(txt), raw: txt, status: r.status }; }
      catch(e){ return { ok:false, err:'invalid_json', raw: txt, status: r.status }; }
    }catch(err){ return { ok:false, err: String(err) }; }
  }

  function extractArray(payload){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;
    if(Array.isArray(payload.data)) return payload.data;
    if(Array.isArray(payload.users)) return payload.users;
    if(Array.isArray(payload.members)) return payload.members;
    if(Array.isArray(payload.items)) return payload.items;
    return [];
  }

  // render
  let lastList = [];
  function renderRows(list){
    lastList = list || [];
    const filter = (filterInput && filterInput.value || '').toLowerCase().trim();
    const visible = list.filter(u=>{
      if(!u) return false;
      const id = (u.id||u.ID||u.Id||'')+'';
      const name = (u.name||u.nama||'')+'';
      const dom = (u.domisili||u.domicile||u.email||'')+'';
      if(!filter) return true;
      return id.toLowerCase().includes(filter) || name.toLowerCase().includes(filter) || dom.toLowerCase().includes(filter);
    });

    if(!visible.length){
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Tidak ada data.</td></tr>';
      return;
    }

    const rows = visible.map(u=>{
      const id = u.id ?? u.ID ?? u.Id ?? '';
      const name = u.name ?? u.nama ?? '-';
      const dom = u.domisili ?? u.domicile ?? u.email ?? '-';
      const allow = (MY_ROLE==='admin' || String(id)===MY_ID);
      const chk = allow ? `<input type="checkbox" class="mft-chk" value="${esc(id)}">` : `<input type="checkbox" class="mft-chk" value="${esc(id)}" disabled title="Hanya admin atau pemilik yang dapat hapus">`;
      return `<tr>\n<td style="text-align:center">${chk}</td>\n<td style="word-break:break-all">${esc(id)}</td>\n<td>${esc(name)}</td>\n<td>${esc(dom)}</td>\n</tr>`;
    }).join('');

    tbody.innerHTML = rows;
  }

  // load users (FormData-first)
  async function loadUsers(){
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Memuat data...</td></tr>';
    log('Memuat data...');
    const modes = ['list','getdata','getAll','getUsers'];
    for(const m of modes){
      const res = await postForm(m, {});
      if(res.ok && res.json){
        const arr = extractArray(res.json);
        if(arr.length){ log('Loaded via POST', m); renderRows(arr); return; }
        // handle case {status:'success', data: []}
        if(res.json && Array.isArray(res.json.data) && res.json.data.length===0){ log('Loaded empty array via POST', m); renderRows([]); return; }
      } else {
        log('POST no-json/error', m, res.err || res.raw || res);
      }
    }

    // try GET fallback
    const gCandidates = [
      `${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?mode=getdata&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?ts=${Date.now()}`
    ];
    for(const u of gCandidates){
      const r = await getUrl(u);
      if(r.ok && r.json){ const arr = extractArray(r.json); if(arr.length){ log('Loaded via GET', u); renderRows(arr); return; } }
      else log('GET no-json/error', u, r.err || r.raw);
    }

    // final JSON POST fallback
    try{
      const r = await fetch(window.API_URL,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'getData', token: TOKEN }) });
      const txt = await r.text();
      let j=null; try{ j=JSON.parse(txt); }catch(e){ j=null; }
      if(j){ const arr = extractArray(j); if(arr.length){ log('Loaded via POST JSON fallback'); renderRows(arr); return; } }
    }catch(e){ log('POST JSON fallback failed', e); }

    log('Gagal memuat data');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Gagal memuat data (cek log)</td></tr>';
  }

  // delete helpers
  async function tryDeleteVariant(id){
    if(!id) return { ok:false };
    const singleModes = ['delete','deleteMember','hardDelete','remove','del'];
    for(const m of singleModes){
      log('Trying FormData mode=',m,'id=',id);
      const res = await postForm(m,{ id });
      if(res.ok && res.json && (res.json.status==='success' || res.json.status==='ok' || res.json.success)) return { ok:true, via:'post', res:res.json };
    }

    const getCandidates = [
      `${window.API_URL}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?mode=deleteMember&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?action=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`
    ];
    for(const u of getCandidates){
      log('Trying GET',u);
      const r = await getUrl(u);
      if(r.ok && r.json && (r.json.status==='success' || r.json.status==='ok' || r.json.success)) return { ok:true, via:'get', res:r.json };
    }
    return { ok:false };
  }

  async function deleteByIds(ids){
    if(!Array.isArray(ids) || !ids.length) return { ok:false };

    // try batch FormData
    const batchModes = ['delete','deleteMember','hardDelete','removeAll'];
    for(const m of batchModes){
      log('Trying batch mode',m); const r = await postForm(m,{ ids: JSON.stringify(ids) });
      if(r.ok && r.json && (r.json.status==='success' || r.json.status==='ok' || r.json.success)) return { ok:true, via:'batch', res:r.json };
    }

    // fallback: sequential
    for(const id of ids){
      const res = await tryDeleteVariant(id);
      if(!res.ok) return { ok:false, failedId:id, detail:res };
      if(String(id)===MY_ID){ localStorage.removeItem('familyUser'); alert('Akun Anda dihapus — keluar.'); location.href='login.html'; return { ok:true, via:'self' }; }
    }
    return { ok:true, via:'seq' };
  }

  // handlers
  async function handleDeleteSelected(){
    const checked = Array.from(document.querySelectorAll('.mft-chk:checked')).map(i=>i.value);
    if(!checked.length){ alert('Pilih minimal 1 user'); return; }
    if(MY_ROLE!=='admin'){
      const others = checked.filter(x=>String(x)!==MY_ID);
      if(others.length){ alert('Anda hanya dapat menghapus akun Anda sendiri.'); return; }
    }
    if(!confirm('Yakin hapus '+checked.length+' akun?')) return;
    log('Deleting',checked);
    const res = await deleteByIds(checked);
    if(!res.ok){ log('Delete failed', res); alert('Gagal hapus. Cek log.'); return; }
    alert('Penghapusan selesai.'); await loadUsers();
  }

  async function handleDeleteAll(){
    if(MY_ROLE!=='admin'){ alert('Hanya admin yang dapat melakukan ini.'); return; }
    if(!confirm('⚠️ Yakin hapus SEMUA user?')) return;
    const listRes = await postForm('list',{});
    let arr = [];
    if(listRes.ok && listRes.json) arr = extractArray(listRes.json);
    if(!arr.length){ const g = await getUrl(`${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`); if(g.ok && g.json) arr = extractArray(g.json); }
    if(!arr.length){ alert('Gagal ambil daftar user.'); return; }
    const ids = arr.map(u=>u.id||u.ID||u.Id||u.recordId).filter(Boolean);
    const r = await deleteByIds(ids);
    if(!r.ok){ log('deleteAll failed', r); alert('Gagal hapus beberapa id.'); return; }
    alert('Semua user berhasil dihapus.'); await loadUsers();
  }

  // wiring
  if(btnRefresh) btnRefresh.addEventListener('click', ()=>loadUsers());
  if(btnDeleteSelected) btnDeleteSelected.addEventListener('click', ()=>handleDeleteSelected());
  if(btnDeleteAll) btnDeleteAll.addEventListener('click', ()=>handleDeleteAll());
  if(filterInput) filterInput.addEventListener('input', ()=>renderRows(lastList));

  // init
  setTimeout(()=>loadUsers(),80);

  // expose debug
  window.mft = window.mft||{}; window.mft.loadUsers = loadUsers; window.mft.deleteByIds = deleteByIds;

  log('delete.js initialized', { API: window.API_URL, me: MY_ID, role: MY_ROLE });
})();
```

---

**Catatan singkat:**

* Script menggunakan *FormData-first* untuk menghindari preflight CORS pada Google Apps Script.
* Jika server merespons JSON dengan format berbeda, `extractArray` mencoba beberapa field umum (`data`, `users`, `members`, dll.).
* Self-delete otomatis menghapus `localStorage.familyUser` lalu redirect ke `login.html`.

Simpan dua file ini (`delete.html` dan `delete.js`) ke project kamu. Pastikan `config.js` (mendefinisikan `window.API_URL`) dan `localStorage.familyUser` tersedia.
