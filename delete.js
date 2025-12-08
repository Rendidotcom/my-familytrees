/* ============================================================
   delete.js — PREMIUM V8 (FINAL, CLEAN)
   - Sinkron dengan GAS (mode=getdata/list/getAll) untuk listing
   - Menggunakan mode=delete (POST JSON / POST FormData / GET fallback)
   - Admin lihat semua, user hanya lihat & hapus diri sendiri
   - Auto logout bila user menghapus akunnya sendiri
   - Mengupdate elemen debug #mftLog
   - Memerlukan: config.js (window.API_URL) dan struktur HTML Premium V8
============================================================= */
(function () {
  "use strict";

  // ---------- sanity checks ----------
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

  async function fetchRaw(url, opts) {
    try {
      const r = await fetch(url, opts);
      const text = await r.text();
      try {
        const json = JSON.parse(text);
        return { ok:true, json, raw:text, status:r.status };
      } catch(err) {
        return { ok:false, raw:text, status:r.status };
      }
    } catch (err) {
      return { ok:false, error:String(err) };
    }
  }

  function extractArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.users)) return payload.users;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.members)) return payload.members;
    if (payload.status && payload.data && typeof payload.data === "object") {
      // try find any array inside data
      const arr = Object.values(payload.data).find(v => Array.isArray(v));
      if (Array.isArray(arr)) return arr;
    }
    return [];
  }

  // ---------- render ----------
  function renderRows(list) {
    const visible = (MY_ROLE === "admin") ? list : list.filter(u => String(u.id ?? u.ID ?? u.Id ?? u.recordId) === MY_ID);
    if (!visible || visible.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada data.</td></tr>`;
      return;
    }
    const html = visible.map(u => {
      const id = u.id ?? u.ID ?? u.Id ?? u.recordId ?? "";
      const name = u.name ?? u.nama ?? u.Name ?? "-";
      const dom = u.domisili ?? u.Domisili ?? u.email ?? "-";
      const allow = (MY_ROLE === "admin" || String(id) === MY_ID);
      const chkHtml = allow
        ? `<input type="checkbox" class="mft-chk" value="${esc(id)}">`
        : `<input type="checkbox" class="mft-chk" value="${esc(id)}" disabled title="Hanya admin atau pemilik yang dapat hapus">`;
      return `<tr>
                <td style="text-align:center">${chkHtml}</td>
                <td style="word-break:break-all">${esc(id)}</td>
                <td>${esc(name)}</td>
                <td>${esc(dom)}</td>
              </tr>`;
    }).join("");
    tbody.innerHTML = html;
  }

  // ---------- load users (try many variants) ----------
  async function loadUsers() {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Memuat data...</td></tr>`;
    clog("Memuat data...");

    const candidates = [
      `${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?mode=getdata&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?mode=getAll&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`,
      `${window.API_URL}?mode=getdata&ts=${Date.now()}`,
      `${window.API_URL}?ts=${Date.now()}`
    ];

    for (const url of candidates) {
      const r = await fetchRaw(url);
      if (r.ok && r.json) {
        const arr = extractArray(r.json);
        if (arr.length) {
          clog("Loaded via", url);
          renderRows(arr);
          return;
        }
      } else {
        clog("no-json or error from", url, r);
      }
    }

    // POST JSON fallback
    try {
      const res = await fetchRaw(window.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "getData", token: TOKEN })
      });
      if (res.ok && res.json) {
        const arr = extractArray(res.json);
        if (arr.length) {
          clog("Loaded via POST fallback");
          renderRows(arr);
          return;
        }
      }
    } catch (e) { clog("POST fallback error", e); }

    clog("Gagal memuat data dari server");
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:red">Gagal memuat data (cek console)</td></tr>`;
  }

  // ---------- deletion primitives ----------
  // POST JSON helper
  async function postJson(payload) {
    try {
      const r = await fetchRaw(window.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return r;
    } catch (e) { return { ok:false, error:String(e) }; }
  }

  // POST FormData helper
  async function postForm(fd) {
    try {
      const r = await fetchRaw(window.API_URL, { method: "POST", body: fd });
      return r;
    } catch (e) { return { ok:false, error:String(e) }; }
  }

  // GET helper
  async function getUrl(url) {
    try {
      const r = await fetchRaw(url);
      return r;
    } catch (e) { return { ok:false, error:String(e) }; }
  }

  // try delete single id using several strategies
  async function tryDeleteOne(idValue) {
    if (!idValue) return { ok:false, reason:"missing_id" };

    // 1) try POST JSON single
    const singleCandidates = [
      { mode: "delete", id: idValue, token: TOKEN },
      { mode: "deleteMember", id: idValue, token: TOKEN },
      { mode: "hardDelete", id: idValue, token: TOKEN },
      { action: "delete", id: idValue, token: TOKEN }
    ];
    for (const p of singleCandidates) {
      clog("Trying POST JSON", p.mode || p.action);
      const r = await postJson(p);
      if (r.ok && r.json && (r.json.status === "success" || r.json.status === "ok" || r.json.success)) return { ok:true, via:"post-json", res:r.json };
    }

    // 2) try GET variants
    const getCandidates = [
      `${window.API_URL}?mode=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?mode=deleteMember&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?action=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?mode=hardDelete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(TOKEN)}`,
      `${window.API_URL}?id=${encodeURIComponent(idValue)}&mode=delete&token=${encodeURIComponent(TOKEN)}`
    ];
    for (const u of getCandidates) {
      clog("Trying GET", u);
      const r = await getUrl(u);
      if (r.ok && r.json && (r.json.status === "success" || r.json.status === "ok" || r.json.success)) return { ok:true, via:"get", res:r.json };
    }

    // 3) POST FormData fallback
    try {
      const fd = new FormData();
      fd.append("mode","delete");
      fd.append("id", idValue);
      fd.append("token", TOKEN);
      clog("Trying POST FormData mode=delete");
      const r = await postForm(fd);
      if (r.ok && r.json && (r.json.status === "success" || r.json.status === "ok" || r.json.success)) return { ok:true, via:"post-form", res:r.json };
    } catch (e) { clog("postForm error", e); }

    return { ok:false, reason:"all_failed" };
  }

  // delete array of ids: try batch first, then sequential fallback
  async function deleteByIds(ids) {
    if (!Array.isArray(ids) || !ids.length) return { ok:false, reason:"no_ids" };

    clog("Attempting batch JSON delete (if supported)");
    // attempt batch JSON (some GAS implementations accept ids array)
    const batchCandidates = [
      { mode: "delete", ids, token: TOKEN },
      { mode: "deleteMember", ids, token: TOKEN },
      { mode: "hardDelete", ids, token: TOKEN },
      { action: "delete", ids, token: TOKEN }
    ];
    for (const p of batchCandidates) {
      clog("Trying batch POST JSON", p.mode || p.action);
      const r = await postJson(p);
      if (r.ok && r.json && (r.json.status === "success" || r.json.status === "ok" || r.json.success)) {
        return { ok:true, via:"batch-json", res:r.json };
      }
    }

    clog("Batch not supported — fallback to sequential deletes");
    for (const id of ids) {
      const r = await tryDeleteOne(id);
      if (!r.ok) return { ok:false, failedId:id, detail:r };
      // if current user deleted — perform logout redirect
      if (String(id) === MY_ID) {
        localStorage.removeItem("familyUser");
        alert("Akun Anda telah dihapus. Anda akan diarahkan ke login.");
        location.href = "login.html";
        return { ok:true, via:"self-deleted" };
      }
    }
    return { ok:true, via:"sequential" };
  }

  // ---------- handlers ----------
  async function handleDeleteSelected() {
    const checked = Array.from(document.querySelectorAll(".mft-chk:checked")).map(i => i.value);
    if (!checked.length) { alert("Pilih minimal 1 user."); return; }

    if (MY_ROLE !== "admin") {
      const others = checked.filter(x => String(x) !== MY_ID);
      if (others.length) { alert("Anda hanya dapat menghapus akun Anda sendiri."); return; }
    }

    if (!confirm(`Yakin hapus ${checked.length} akun terpilih?`)) return;

    clog("Deleting selected", checked);
    const r = await deleteByIds(checked);
    if (!r.ok) {
      clog("Delete failed", r);
      alert("Gagal menghapus beberapa id. Cek console/log.");
      return;
    }
    toastSafe("Penghapusan selesai.");
    await loadUsers();
  }

  async function handleDeleteAll() {
    if (MY_ROLE !== "admin") { alert("Hanya admin yang dapat menghapus semua user."); return; }
    if (!confirm("⚠️ Yakin hapus SEMUA user? Tindakan ini permanen.")) return;

    clog("Fetching full list for deleteAll");
    // fetch all
    const r = await fetchRaw(`${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`);
    let arr = [];
    if (r.ok && r.json) arr = extractArray(r.json);
    else {
      const r2 = await fetchRaw(`${window.API_URL}?mode=getdata&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`);
      if (r2.ok && r2.json) arr = extractArray(r2.json);
    }
    if (!arr.length) { alert("Gagal mengambil daftar user."); return; }

    const ids = arr.map(u => u.id ?? u.ID ?? u.Id ?? u.recordId).filter(Boolean);
    if (!ids.length) { alert("Tidak ada ID ditemukan."); return; }

    clog("Deleting all ids count:", ids.length);
    const res = await deleteByIds(ids);
    if (!res.ok) { clog("deleteAll failed", res); alert("Gagal hapus beberapa id. Lihat log."); return; }
    alert("Semua user berhasil dihapus.");
    await loadUsers();
  }

  // a tiny toast (re-usable)
  function toastSafe(msg, ok=true){
    try {
      // reuse existing mftLog for visible toast is avoided; use alert minimal
      // keep non-blocking small console and in-log message
      clog("TOAST:", msg);
      if (logEl) logEl.textContent = (new Date().toLocaleTimeString()) + "  " + msg + "\n" + logEl.textContent;
    } catch(e){}
  }

  // ---------- wiring ----------
  if (refreshBtn) refreshBtn.addEventListener("click", loadUsers);
  if (deleteSelectedBtn) deleteSelectedBtn.addEventListener("click", handleDeleteSelected);
  if (deleteAllBtn) deleteAllBtn.addEventListener("click", handleDeleteAll);
  if (MY_ROLE !== "admin" && deleteAllBtn) deleteAllBtn.style.display = "none";

  // initial load
  setTimeout(() => loadUsers(), 80);

  // expose for debugging
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.deleteByIds = deleteByIds;
  window.mft.tryDeleteOne = tryDeleteOne;

  clog("delete.js (Premium V8) initialized", { API: window.API_URL, id: MY_ID, role: MY_ROLE });

})();
