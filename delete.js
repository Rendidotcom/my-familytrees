/* ======================================================
   delete.js — PREMIUM v4 (sync with your GAS)
   Requires: config.js (window.API_URL)
   Expects: localStorage.familyUser = { id, name, role, token }
====================================================== */
(function () {
  "use strict";
  console.log("DELETE.JS PREMIUM v4 LOADED");

  /* ---------- small UI helpers (toast + spinner) ---------- */
  function ensureUI() {
    if (!document.getElementById("mft-toast")) {
      const t = document.createElement("div");
      t.id = "mft-toast";
      Object.assign(t.style, {
        position: "fixed", right: "18px", bottom: "18px",
        padding: "10px 14px", borderRadius: "10px",
        color: "#fff", fontWeight: 700, display: "none",
        zIndex: 99999, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        fontFamily: "system-ui, Arial"
      });
      document.body.appendChild(t);
    }
    if (!document.getElementById("mft-spinner")) {
      const s = document.createElement("div");
      s.id = "mft-spinner";
      Object.assign(s.style, {
        position: "fixed", left: "50%", top: "28%", transform: "translateX(-50%)",
        zIndex: 99998, display: "none", padding: "12px 16px", borderRadius: "10px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.98)",
        fontFamily: "system-ui, Arial"
      });
      s.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
        <svg width="18" height="18" viewBox="0 0 50 50"><circle cx="25" cy="25" r="8" stroke="#1565c0" stroke-width="4" stroke-linecap="round" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/></circle></svg>
        <div style="font-weight:700;color:#333">Memproses...</div>
      </div>`;
      document.body.appendChild(s);
    }
  }
  function toast(msg, ok=true, ms=2000) {
    const t = document.getElementById("mft-toast"); if(!t) return;
    t.style.background = ok ? "#2e7d32" : "#c62828";
    t.textContent = msg; t.style.display = "block";
    setTimeout(()=> t.style.display = "none", ms);
  }
  function showSpinner(show=true){ const s = document.getElementById("mft-spinner"); if(!s) return; s.style.display = show ? "block":"none"; }
  function setButtonsBusy(btns=[], busy=true){ btns.forEach(b=>{ if(!b) return; try{ b.disabled = busy; if(busy) b.classList.add('disabled'); else b.classList.remove('disabled'); }catch(e){} }); }

  ensureUI();

  /* ---------- session + DOM ---------- */
  const raw = localStorage.getItem("familyUser") || null;
  let session = null;
  try { session = raw ? JSON.parse(raw) : null; } catch(e){ session = null; }
  if(!session || !session.token) {
    alert("Sesi tidak ditemukan. Silakan login ulang.");
    return location.href = "login.html";
  }
  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role || "user").toLowerCase();

  const tbody = document.querySelector("#userTableBody");
  const btnRefresh = document.querySelector("#refreshBtn");
  const btnDeleteSelected = document.querySelector("#deleteSelectedBtn");
  const btnDeleteAll = document.querySelector("#deleteAllBtn");
  const roleBadge = document.querySelector("#roleBadge");

  if(roleBadge) roleBadge.textContent = `Role: ${MY_ROLE.toUpperCase()}`;

  if(!tbody) {
    console.error("Tabel pengguna tidak ditemukan (#userTableBody).");
    toast("Tabel user tidak ditemukan!", false, 3500);
    return;
  }

  /* ---------- small utilities ---------- */
  function escapeHtml(s){ if(s===undefined||s===null) return ""; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }

  async function safeFetch(url, opts={}) {
    console.log("[fetch]", url, opts && opts.method ? opts.method : "GET");
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return { ok:true, status: res.status, json, raw:text };
      } catch(err) {
        return { ok:false, status: res.status, error:"invalid_json", raw:text };
      }
    } catch(err) {
      return { ok:false, error:"network", detail: String(err) };
    }
  }

  /* ---------- determine API URL ---------- */
  const API = window.API_URL || null;
  if(!API) {
    toast("config.js (API_URL) tidak ditemukan.", false, 4000);
    console.error("Missing window.API_URL. Include config.js before delete.js");
    return;
  }

  /* ---------- render helpers ---------- */
  function emptyMsg(msg){ tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">${escapeHtml(msg)}</td></tr>`; }
  function renderRows(list) {
    if(!Array.isArray(list) || list.length === 0) {
      emptyMsg("Tidak ada user.");
      return;
    }
    const rows = list.map(u => {
      const id = u.id ?? u.ID ?? "";
      const name = u.name ?? u.nama ?? u.Name ?? "-";
      const email = u.email ?? u.domisili ?? "-";
      const status = (u.status ?? u.Status ?? "").toString().toLowerCase();
      if(status === "deleted") return ""; // skip soft deleted rows
      const allow = (MY_ROLE === "admin" || String(id) === MY_ID);
      const chk = allow
        ? `<input type="checkbox" class="mft-chk" value="${escapeHtml(id)}">`
        : `<input type="checkbox" class="mft-chk" value="${escapeHtml(id)}" disabled title="Hanya admin atau pemilik akun yang bisa menghapus">`;
      return `<tr>
        <td style="text-align:center">${chk}</td>
        <td style="word-break:break-all;min-width:220px">${escapeHtml(id)}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(email)}</td>
      </tr>`;
    }).join("");
    tbody.innerHTML = rows || `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada user.</td></tr>`;
  }

  /* ---------- load list (mode=list then fallback getdata) ---------- */
  async function loadUsers() {
    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);
    emptyMsg("Memuat data...");
    try {
      // primary
      const r1 = await safeFetch(`${API}?mode=list&token=${encodeURIComponent(TOKEN)}`);
      let payload = null;
      if(r1.ok && r1.json) payload = r1.json;
      else {
        const r2 = await safeFetch(`${API}?mode=getdata&token=${encodeURIComponent(TOKEN)}`);
        if(r2.ok && r2.json) payload = r2.json;
        else {
          // try without token (some deployments allow public read)
          const r3 = await safeFetch(`${API}?mode=getdata`);
          if(r3.ok && r3.json) payload = r3.json;
          else {
            console.error("All list/getdata attempts failed", r1, r2, r3);
            emptyMsg("Gagal memuat data (server). Periksa console.");
            toast("Gagal memuat data", false, 2500);
            return;
          }
        }
      }

      // Normal forms:
      // 1) raw array: [...]
      // 2) {status:"success", data:[...]} or {status:"success", users:[...]}
      // 3) {data: {someKey: [...]}} -> try to extract first array
      if(Array.isArray(payload)) {
        const visible = MY_ROLE === "admin" ? payload : payload.filter(u => String(u.id ?? u.ID) === MY_ID);
        renderRows(visible);
        return;
      }
      if(payload && payload.status && (Array.isArray(payload.data) || Array.isArray(payload.users))) {
        const arr = Array.isArray(payload.data) ? payload.data : payload.users;
        const filtered = arr.filter(i => (i.status ?? i.Status ?? "").toString().toLowerCase() !== "deleted");
        const visible = MY_ROLE === "admin" ? filtered : filtered.filter(u => String(u.id ?? u.ID) === MY_ID);
        renderRows(visible);
        return;
      }
      if(payload && payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
        const arr = Object.values(payload.data).find(v => Array.isArray(v));
        if(Array.isArray(arr)) {
          const visible = MY_ROLE === "admin" ? arr : arr.filter(u => String(u.id ?? u.ID) === MY_ID);
          renderRows(visible);
          return;
        }
      }

      // Unknown format
      console.error("Unknown list response:", payload);
      emptyMsg("Format response tidak sesuai. Periksa console.");
      toast("Response server tidak sesuai", false, 3000);

    } finally {
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
    }
  }

  /* ---------- delete helpers (POST mode=delete) ---------- */
  async function postDeleteId(id) {
    const body = { mode: "delete", token: TOKEN, id };
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const txt = await res.text();
      try {
        const json = JSON.parse(txt);
        if(json && (json.status === "success" || json.status === "ok" || !json.status)) return { ok:true, json };
        return { ok:false, json };
      } catch(err) {
        console.error("postDeleteId parse error", txt);
        return { ok:false, raw: txt };
      }
    } catch(err) {
      return { ok:false, error: String(err) };
    }
  }

  async function deleteSelectedHandler() {
    const checked = Array.from(document.querySelectorAll(".mft-chk:checked")).map(i => i.value);
    if(!checked.length) return alert("Tidak ada user dipilih.");
    if(MY_ROLE !== "admin") {
      const others = checked.filter(x => String(x) !== MY_ID);
      if(others.length) return alert("Anda hanya dapat menghapus akun Anda sendiri.");
    }
    if(!confirm(`Hapus ${checked.length} akun terpilih?`)) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);
    try {
      for(const id of checked) {
        const res = await postDeleteId(id);
        if(!res.ok) {
          console.error("Gagal hapus id", id, res);
          toast(`Gagal hapus ID: ${id}`, false, 3000);
          return;
        }
        if(String(id) === MY_ID) {
          // current user deleted: immediate logout
          localStorage.removeItem("familyUser");
          alert("Akun Anda telah dihapus. Anda akan diarahkan ke login.");
          return location.href = "login.html";
        }
      }
      toast("Penghapusan selesai.", true, 1800);
      await loadUsers();
    } finally {
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
    }
  }

  async function deleteAllHandler() {
    if(MY_ROLE !== "admin") return alert("Hanya admin yang dapat menghapus semua user.");
    if(!confirm("⚠ Yakin hapus SEMUA user? (tidak bisa dikembalikan)")) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);
    try {
      // fetch list without token fallback (some GAS may require token; we include token)
      const r = await safeFetch(`${API}?mode=list&token=${encodeURIComponent(TOKEN)}`);
      let arr = [];
      if(r.ok && r.json) {
        if(Array.isArray(r.json)) arr = r.json;
        else if(Array.isArray(r.json.data)) arr = r.json.data;
        else if(Array.isArray(r.json.users)) arr = r.json.users;
      }
      if(!arr.length) {
        toast("Gagal mengambil daftar user.", false, 3000);
        return;
      }
      for(const u of arr) {
        const id = u.id ?? u.ID ?? null;
        if(!id) continue;
        const res = await postDeleteId(id);
        if(!res.ok) {
          console.error("deleteAllHandler failed", id, res);
          toast(`Gagal hapus ID: ${id}`, false, 3000);
          return;
        }
      }
      toast("Semua user berhasil dihapus.", true, 2400);
      await loadUsers();
    } finally {
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
    }
  }

  /* ---------- wire events ---------- */
  if(btnRefresh) btnRefresh.addEventListener("click", loadUsers);
  if(btnDeleteSelected) btnDeleteSelected.addEventListener("click", deleteSelectedHandler);
  if(btnDeleteAll) btnDeleteAll.addEventListener("click", deleteAllHandler);

  if(MY_ROLE !== "admin" && btnDeleteAll) btnDeleteAll.style.display = "none";

  // initial load
  setTimeout(()=> loadUsers(), 80);

  // expose for debugging
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.deleteSelected = deleteSelectedHandler;
  window.mft.deleteAll = deleteAllHandler;

})();
