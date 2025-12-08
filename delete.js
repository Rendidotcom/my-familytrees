# Premium V9 — Delete page + delete.js (preview)

This canvas contains two files you can copy: `delete.html` (preview page) and `delete.js` (robust multi-variant + fallback + realtime client log) — synchronized to your GAS `Sheet1` API (uses `window.API_URL`).

---

## delete.html

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Manajemen Penghapusan User — Premium v9</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
  <style>
    body{background:#f0f4fb;font-family:system-ui,Arial,Helvetica,sans-serif}
    .header{background:#0d47a1;color:#fff;padding:18px;text-align:center;font-weight:700}
    .card{max-width:1100px;margin:28px auto;padding:20px;border-radius:12px}
    pre.client-log{background:#000;color:#6ef;text-padding:12px;border-radius:8px;padding:12px;height:140px;overflow:auto}
  </style>
</head>
<body>
  <div class="header">Manajemen Penghapusan User — Premium v9</div>
  <div class="card bg-white">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <button id="refreshBtn" class="btn btn-outline-primary">⟳ Refresh Data</button>
        <span id="roleBadge" class="ms-3 small text-muted"></span>
      </div>
      <div>
        <button id="deleteSelectedBtn" class="btn btn-danger me-2">🗑️ Hapus Terpilih</button>
        <button id="deleteAllBtn" class="btn btn-secondary">☠️ Hapus Semua</button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead class="table-light text-uppercase">
          <tr><th style="width:1%;text-align:center">PILIH</th><th>ID</th><th>NAMA</th><th>DOMISILI</th></tr>
        </thead>
        <tbody id="userTableBody"><tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Memuat data...</td></tr></tbody>
      </table>
    </div>

    <div class="mt-3">
      <div class="small text-muted">Client Log (debug):</div>
      <pre id="clientLog" class="client-log"></pre>
    </div>
  </div>

  <script src="config.js"></script>
  <script src="delete.js"></script>
</body>
</html>
```

---

## delete.js (Premium V9)

```javascript
/* delete.js — Premium V9
   - aggressive multi-variant delete (GET+POST+FormData)
   - multi-mode fetch for list/getdata/getAll/list variations
   - realtime client log (on-page) to help debugging redirects
   - auto-fallbacks and graceful error messages
*/
(function(){
  'use strict';
  const logEl = (k=>document.getElementById('clientLog'))();
  function clog(...args){
    try{
      const t = new Date().toLocaleTimeString();
      const txt = args.map(a=> (typeof a==='object'?JSON.stringify(a):String(a))).join(' ');
      if(logEl){ logEl.textContent += `${t} ${txt}\n`; logEl.scrollTop = 99999; }
      console.log(...args);
    }catch(e){}
  }

  const session = JSON.parse(localStorage.getItem('familyUser')||'null');
  if(!session || !session.token){ alert('Sesi hilang, silakan login ulang'); location.href='login.html'; }

  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role||'user').toLowerCase();

  const tbody = document.getElementById('userTableBody');
  const btnRefresh = document.getElementById('refreshBtn');
  const btnDeleteSelected = document.getElementById('deleteSelectedBtn');
  const btnDeleteAll = document.getElementById('deleteAllBtn');
  const roleBadge = document.getElementById('roleBadge');

  roleBadge && (roleBadge.textContent = `Peran: ${MY_ROLE} (ID: ${MY_ID})`);

  const API = window.API_URL;
  if(!API) { clog('KELUAR: API_URL tidak ditemukan'); alert('config.js (API_URL) required'); return; }
  clog('API', API, 'token', TOKEN.substring(0,8)+'...');

  // Utility safe fetch that returns raw text + status and marks redirected
  async function safeFetchRaw(url, opts){
    clog('FETCH', url, opts && opts.method?opts.method:'GET');
    try{
      const res = await fetch(url, opts);
      const redirected = res.redirected;
      const status = res.status;
      // try to read text safely
      const txt = await res.text();
      // try parse json
      let json = null; try{ json = JSON.parse(txt); }catch(e){}
      return { ok: res.ok, status, redirected, text: txt, json };
    }catch(err){
      clog('NETWORK ERROR', String(err));
      return { ok:false, error:'network', detail:String(err) };
    }
  }

  // Try many list endpoints in falling order
  async function fetchListCandidates(){
    const candidates = [
      `${API}?mode=getAll&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${API}?mode=getdata&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${API}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${API}?ts=${Date.now()}` // raw endpoint
    ];
    for(const u of candidates){
      const r = await safeFetchRaw(u);
      if(r && r.ok && r.json && (Array.isArray(r.json.data) || Array.isArray(r.json))){
        clog('list ok ->', u);
        // normalize
        const data = Array.isArray(r.json)? r.json : (r.json.data || r.json.users || r.json.items || []);
        return { ok:true, data };
      }
      // if non-ok but has json -> maybe status field
      if(r && r.json && r.json.status && r.json.status==='success' && Array.isArray(r.json.data)){
        return { ok:true, data: r.json.data };
      }
      // redirect detection
      if(r && r.redirected){ clog('REDIRECT detected on', u); return { ok:false, reason:'redirect', raw:r }; }
      clog('candidate failed', u, r && r.status);
    }
    return { ok:false };
  }

  function renderEmpty(msg){
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#c44">${msg}</td></tr>`;
  }

  function renderRows(list){
    if(!Array.isArray(list) || !list.length) return renderEmpty('Tidak ada user.');
    const visible = (MY_ROLE==='admin')? list : list.filter(u=>String(u.id||u.ID||u.Id)===MY_ID);
    if(!visible.length) return renderEmpty('Tidak ada user.');
    const html = visible.map(u=>{
      const id = u.id||u.ID||u.Id||u.ID || '';
      const name = u.name||u.nama||u.Name||'-';
      const dom = u.domisili||u.domisili||u.email||'-';
      const allow = (MY_ROLE==='admin' || String(id)===MY_ID);
      const chk = allow? `<input type="checkbox" class="sel" value="${escapeHtml(id)}">` : `<input type="checkbox" disabled>`;
      return `<tr><td style="text-align:center">${chk}</td><td>${escapeHtml(id)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(dom)}</td></tr>`;
    }).join('\n');
    tbody.innerHTML = html;
  }

  function escapeHtml(s){ if(s===undefined||s===null) return ''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  async function loadUsers(){
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:#666">Memuat data...</td></tr>`;
    const r = await fetchListCandidates();
    if(!r.ok){ clog('Gagal memuat data dari server', r); renderEmpty('Gagal memuat data (cek console / log)'); return; }
    renderRows(r.data);
  }

  // Delete variants for single id
  async function tryDeleteSingle(id){
    if(!id) return { ok:false, reason:'noid' };
    const postJsonCandidates = [
      { mode:'delete', id, token:TOKEN },
      { mode:'deleteMember', id, token:TOKEN },
      { mode:'hardDelete', id, token:TOKEN },
      { action:'delete', id, token:TOKEN }
    ];
    // Try POST JSON
    for(const p of postJsonCandidates){
      try{
        clog('POST JSON ->', p.mode || p.action);
        const res = await safeFetchRaw(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(p) });
        if(res && res.ok && res.json && (res.json.status==='success' || res.json.status==='ok')) return { ok:true, result:res.json };
        if(res && res.redirected) return { ok:false, reason:'redirect', raw:res };
      }catch(e){ clog('post json err', e); }
    }

    // Try GET variants
    const getCandidates = [
      `${API}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${API}?mode=deleteMember&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${API}?action=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${API}?mode=hardDelete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`
    ];
    for(const u of getCandidates){
      const r = await safeFetchRaw(u);
      if(r && r.ok && r.json && (r.json.status==='success' || r.json.status==='ok')) return { ok:true, result:r.json };
      if(r && r.redirected) return { ok:false, reason:'redirect', raw:r };
    }

    // Last resort: POST formdata (some GAS expect multipart)
    try{
      const fd = new FormData(); fd.append('mode','delete'); fd.append('id',id); fd.append('token',TOKEN);
      const r = await safeFetchRaw(API, { method:'POST', body: fd });
      if(r && r.ok && r.json && (r.json.status==='success' || r.json.status==='ok')) return { ok:true, result:r.json };
      if(r && r.redirected) return { ok:false, reason:'redirect', raw:r };
    }catch(e){ clog('post formdata err', e); }

    return { ok:false, reason:'all_failed' };
  }

  async function deleteSelected(){
    const ch = Array.from(document.querySelectorAll('.sel:checked')).map(i=>i.value);
    if(!ch.length){ alert('Tidak ada yang dipilih'); return; }
    if(MY_ROLE!=='admin'){ const others = ch.filter(x=>String(x)!==MY_ID); if(others.length){ alert('Anda hanya dapat menghapus akun sendiri'); return; }}
    if(!confirm(`Hapus ${ch.length} akun terpilih?`)) return;
    for(const id of ch){
      const res = await tryDeleteSingle(id);
      if(!res.ok){ clog('delete failed', id, res); alert('Gagal hapus ID: '+id+' (cek log)'); return; }
      if(String(id)===MY_ID){ localStorage.removeItem('familyUser'); alert('Anda dihapus, logout'); location.href='login.html'; return; }
    }
    alert('Penghapusan selesai');
    await loadUsers();
  }

  async function deleteAll(){
    if(MY_ROLE!=='admin'){ alert('Hanya admin'); return; }
    if(!confirm('⚠️ Yakin hapus SEMUA user?')) return;
    // fetch full list first
    const r = await fetchListCandidates();
    if(!r.ok){ alert('Gagal ambil daftar'); return; }
    const ids = (r.data||[]).map(u=>(u.id||u.ID||u.Id||u.id));
    for(const id of ids){
      if(!id) continue;
      const res = await tryDeleteSingle(id);
      if(!res.ok){ clog('deleteAll failed on', id, res); alert('Gagal hapus '+id); return; }
    }
    alert('Semua user sudah dihapus');
    await loadUsers();
  }

  if(btnRefresh) btnRefresh.addEventListener('click', ()=>{ loadUsers(); });
  if(btnDeleteSelected) btnDeleteSelected.addEventListener('click', deleteSelected);
  if(btnDeleteAll) btnDeleteAll.addEventListener('click', deleteAll);

  // initial
  clog('Delete Premium V9 initialized');
  setTimeout(()=>loadUsers(),80);

  // expose for debug
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.tryDeleteSingle = tryDeleteSingle;
})();
```

---

Paste the two files to your hosting (remember `config.js` must expose `window.API_URL`).

If you want I can also generate a `config.js` and a compact `manifest` snippet for your GAS, or adjust the client logging format.

> NOTE: after you deploy the GAS endpoint, **open DevTools Network** and check the first failing request. If it shows `redirected: true` we must ensure GAS `doGet` returns `ContentService` JSON (the code you pasted already uses `jsonResponse()` — good). If you still see redirect, the issue is usually an HTML return somewhere (I can scan your GAS further if you paste the exact `doGet` you deployed).

---

Ready for next step? Copy files, deploy, and tell me the Network entry (or paste the failing response raw) and I will iterate.
