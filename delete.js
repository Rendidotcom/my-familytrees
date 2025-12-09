/* ============================================================
   delete.js — PREMIUM V8 (FormData-first, no preflight)
   - Uses FormData for list / delete to avoid CORS preflight with GAS
   - Admin sees all; normal user sees only themselves
   - Auto-logout when user self-deletes
   - Requires: config.js (window.API_URL) + delete.html markup
============================================================= */
(function () {
  "use strict";

  // ---------- sanity ----------
  if (typeof window === "undefined") return;
  if (!window.API_URL) console.warn("window.API_URL not found — pastikan config.js dimuat sebelum delete.js");

  // ---------- DOM ----------
  const tbody = document.getElementById("userTableBody");
  const refreshBtn = document.getElementById("refreshBtn");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const deleteAllBtn = document.getElementById("deleteAllBtn");
  const roleBadge = document.getElementById("roleBadge");
  const logEl = document.getElementById("mftLog");

  function clog(...args) {
    try {
      const t = new Date().toLocaleTimeString();
      const s = args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
      if (logEl) logEl.textContent = `${t}  ${s}\n` + logEl.textContent;
    } catch (e) {}
    console.log(...args);
  }

  // ---------- session ----------
  let session = null;
  try { session = JSON.parse(localStorage.getItem("familyUser") || "null"); } catch(e){ session = null; }
  if (!session || !session.token) {
    alert("Sesi tidak ditemukan. Silakan login ulang.");
    location.href = "login.html";
    return;
  }
  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role || "user").toLowerCase();

  if (roleBadge) roleBadge.textContent = MY_ROLE.toUpperCase() + " • ID:" + MY_ID;

  // ---------- helpers ----------
  function esc(s){ if(s===undefined||s===null) return ""; return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

  async function postFormMode(mode, fields = {}) {
    // FormData-only POST: avoids preflight
    const fd = new FormData();
    fd.append("mode", mode);
    // include token if available
    if (TOKEN) fd.append("token", TOKEN);
    for (const k in fields) {
      if (fields[k] !== undefined && fields[k] !== null) fd.append(k, fields[k]);
    }
    try {
      const r = await fetch(window.API_URL, { method: "POST", body: fd });
      const txt = await r.text();
      try { return { ok:true, json: JSON.parse(txt), raw: txt, status: r.status }; }
      catch(e){ return { ok:false, err: "invalid_json", raw: txt, status: r.status }; }
    } catch (err) {
      return { ok:false, err: String(err) };
    }
  }

  async function getUrl(url) {
    try {
      const r = await fetch(url);
      const txt = await r.text();
      try { return { ok:true, json: JSON.parse(txt), raw: txt, status: r.status }; }
      catch(e){ return { ok:false, err:"invalid_json", raw: txt, status: r.status }; }
    } catch (err) {
      return { ok:false, err: String(err) };
    }
  }

  function extractArray(payload){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;
    if(Array.isArray(payload.data)) return payload.data;
    if(Array.isArray(payload.users)) return payload.users;
    if(Array.isArray(payload.items)) return payload.items;
    if(Array.isArray(payload.members)) return payload.members;
    if(payload.status && payload.data && typeof payload.data === "object"){
      const arr = Object.values(payload.data).find(v=>Array.isArray(v));
      if(Array.isArray(arr)) return arr;
    }
    return [];
  }

  // ---------- render ----------
  function renderRows(list){
    const visible = (MY_ROLE === "admin") ? list : list.filter(u=> String(u.id||u.ID||u.Id||u.recordId) === MY_ID);
    if(!visible || visible.length === 0){
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada data.</td></tr>';
      return;
    }
    const rows = visible.map(u=>{
      const id = u.id ?? u.ID ?? u.Id ?? u.recordId ?? '';
      const name = u.name ?? u.nama ?? '-';
      const dom = u.domisili ?? u.Domisili ?? u.email ?? '-';
      const allow = (MY_ROLE === 'admin' || String(id) === MY_ID);
      const chk = allow ? `<input type="checkbox" class="mft-chk" value="${esc(id)}">` : `<input type="checkbox" class="mft-chk" value="${esc(id)}" disabled title="Hanya admin atau pemilik yang dapat hapus">`;
      return `<tr>
                <td style="text-align:center">${chk}</td>
                <td style="word-break:break-all">${esc(id)}</td>
                <td>${esc(name)}</td>
                <td>${esc(dom)}</td>
              </tr>`;
    }).join('');
    tbody.innerHTML = rows;
  }

  // ---------- load users (FormData-first) ----------
  async function loadUsers(){
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Memuat data...</td></tr>';
    clog('Memuat data...');

    // Try FormData POST getdata / list variants
    const postModes = ['getdata','list','getAll','getData','getUsers'];
    for(const m of postModes){
      const res = await postFormMode(m, {});
      if(res.ok && res.json){
        const arr = extractArray(res.json);
        if(arr.length){
          clog('Loaded via POST FormData mode=' + m);
          return renderRows(arr);
        } else {
          // some APIs return {status: 'success', data: []}
          if(res.json && (Array.isArray(res.json) && res.json.length) ){
            clog('Loaded array via POST FormData mode=' + m);
            return renderRows(res.json);
          }
        }
      } else {
        clog('no-json or error from POST mode=' + m, res.err || res.raw || res);
      }
    }

    // Try GET fallbacks (if same-origin or shell)
    const getCandidates = [
      `${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?mode=getdata&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?mode=getAll&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?ts=${Date.now()}`
    ];
    for(const u of getCandidates){
      const r = await getUrl(u);
      if(r.ok && r.json){
        const arr = extractArray(r.json);
        if(arr.length){ clog('Loaded via GET', u); return renderRows(arr); }
      } else {
        clog('GET no-json/error', u, r.err || r.raw);
      }
    }

    // Last attempt: POST JSON fallback (some endpoints accept it)
    try {
      const r = await fetch(window.API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'getData', token: TOKEN }) });
      const txt = await r.text();
      let j = null;
      try { j = JSON.parse(txt); } catch(e){ j = null; }
      if(j){
        const arr = extractArray(j);
        if(arr.length){ clog('Loaded via POST JSON fallback'); return renderRows(arr); }
      }
    } catch(e){ clog('POST JSON fallback failed', e); }

    clog('Gagal memuat data dari server');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:18px;color:red">Gagal memuat data (cek log)</td></tr>';
  }

  // ---------- delete helpers ----------
  async function tryDeleteVariant(id){
    if(!id) return { ok:false, reason:'no_id' };

    // 1) try FormData single-mode variants
    const singleModes = ['delete','deleteMember','hardDelete','remove','del'];
    for(const m of singleModes){
      clog('Trying FormData POST mode=' + m, 'id=' + id);
      const res = await postFormMode(m, { id });
      if(res.ok && res.json && (res.json.status === 'success' || res.json.status === 'ok' || res.json.success)){
        return { ok:true, via:'post-form', res:res.json };
      }
    }

    // 2) try GET compatibility variants
    const getCandidates = [
      `${window.API_URL}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?mode=deleteMember&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?action=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?mode=hardDelete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?id=${encodeURIComponent(id)}&mode=delete&token=${encodeURIComponent(TOKEN)}`
    ];
    for(const u of getCandidates){
      clog('Trying GET', u);
      const r = await getUrl(u);
      if(r.ok && r.json && (r.json.status === 'success' || r.json.status === 'ok' || r.json.success)) return { ok:true, via:'get', res:r.json };
    }

    return { ok:false };
  }

  async function deleteByIds(ids){
    if(!Array.isArray(ids) || !ids.length) return { ok:false, reason:'no_ids' };

    // try batch via FormData (ids as JSON string)
    const batchModes = ['delete','deleteMember','hardDelete','removeAll'];
    for(const m of batchModes){
      clog('Trying batch FormData mode=' + m, ids.length + ' ids');
      const res = await postFormMode(m, { ids: JSON.stringify(ids) });
      if(res.ok && res.json && (res.json.status === 'success' || res.json.status === 'ok' || res.json.success)){
        return { ok:true, via:'batch-form', res:res.json };
      }
    }

    // fallback sequential
    for(const id of ids){
      const r = await tryDeleteVariant(id);
      if(!r.ok) return { ok:false, failedId:id, detail:r };
      // if self-deleted -> logout & redirect
      if(String(id) === MY_ID){
        localStorage.removeItem('familyUser');
        alert('Akun Anda dihapus. Keluar.');
        location.href = 'login.html';
        return { ok:true, via:'self-deleted' };
      }
    }
    return { ok:true, via:'sequential' };
  }

  // ---------- handlers ----------
  async function handleDeleteSelected(){
    const checked = Array.from(document.querySelectorAll('.mft-chk:checked')).map(i=>i.value);
    if(!checked.length){ alert('Pilih minimal 1 user'); return; }

    if(MY_ROLE !== 'admin'){
      const others = checked.filter(x=> String(x)!==MY_ID);
      if(others.length){ alert('Anda hanya dapat menghapus akun Anda sendiri.'); return; }
    }

    if(!confirm('Yakin hapus '+checked.length+' akun?')) return;
    clog('Deleting selected', checked);
    const r = await deleteByIds(checked);
    if(!r.ok){ clog('Delete failed', r); alert('Gagal menghapus beberapa id. Lihat log.'); return; }
    alert('Penghapusan selesai.');
    await loadUsers();
  }

  async function handleDeleteAll(){
    if(MY_ROLE !== 'admin'){ alert('Hanya admin yg dapat menghapus semua.'); return; }
    if(!confirm('⚠ Yakin hapus SEMUA user? Tindakan ini permanen.')) return;

    clog('Fetching full list for deleteAll');
    // try FormData list first
    const rlist = await postFormMode('list', {});
    let arr = [];
    if(rlist.ok && rlist.json) arr = extractArray(rlist.json);
    else {
      const r2 = await postFormMode('getdata', {});
      if(r2.ok && r2.json) arr = extractArray(r2.json);
    }
    if(!arr.length){
      // try GET fallback
      const g = await getUrl(`${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`);
      if(g.ok && g.json) arr = extractArray(g.json);
    }
    if(!arr.length){ alert('Gagal mengambil daftar user.'); return; }

    const ids = arr.map(u=> u.id ?? u.ID ?? u.Id ?? u.recordId).filter(Boolean);
    const res = await deleteByIds(ids);
    if(!res.ok){ clog('deleteAll failed', res); alert('Gagal hapus beberapa id. Lihat log.'); return; }
    alert('Semua user berhasil dihapus.');
    await loadUsers();
  }

  // ---------- wiring ----------
  if(refreshBtn) refreshBtn.addEventListener('click', loadUsers);
  if(deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
  if(deleteAllBtn) deleteAllBtn.addEventListener('click', handleDeleteAll);
  if(MY_ROLE!=='admin' && deleteAllBtn) deleteAllBtn.style.display='none';

  // initial
  setTimeout(()=>loadUsers(), 80);

  // expose helpers for debugging
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.deleteByIds = deleteByIds;
  window.mft.tryDeleteVariant = tryDeleteVariant;

  clog('delete.js (FormData-first) initialized', { API: window.API_URL });

})();
