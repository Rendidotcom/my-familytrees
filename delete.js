/* ======================================================
   delete.js — PREMIUM V2 (FULL SAFE + GAS SYNC)
   - Requires: config.js (window.API_URL)
   - Expects session in localStorage.familyUser: { id, name, role, token }
   - Compatible with GAS from user (mode=list|getdata, mode=delete)
====================================================== */
(function () {
  "use strict";
  console.log("DELETE.JS PREMIUM V2 LOADED");

  /************************************************************************
   *  Helpers: UI (toast + spinner) + util functions
   ************************************************************************/
  // remove query params to avoid accidental server confusion
  (function cleanUrl() {
    try {
      if (location.search && history && history.replaceState) {
        const clean = location.origin + location.pathname;
        history.replaceState({}, "", clean);
        console.log("Cleaned URL querystring for stability.");
      }
    } catch (e) {
      // ignore
    }
  })();

  // create toast & spinner if missing
  function ensureUiHelpers() {
    if (!document.getElementById("mft-toast")) {
      const t = document.createElement("div");
      t.id = "mft-toast";
      Object.assign(t.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: 99999,
        display: "none",
        padding: "10px 14px",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: 600,
        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
        fontFamily: "system-ui,Segoe UI,Roboto,Arial"
      });
      document.body.appendChild(t);
    }

    if (!document.getElementById("mft-spinner")) {
      const s = document.createElement("div");
      s.id = "mft-spinner";
      Object.assign(s.style, {
        position: "fixed",
        left: "50%",
        top: "28%",
        transform: "translateX(-50%)",
        zIndex: 99998,
        display: "none",
        padding: "12px 16px",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        background: "rgba(255,255,255,0.96)",
        fontFamily: "system-ui,Segoe UI,Roboto,Arial"
      });
      s.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
        <svg width="18" height="18" viewBox="0 0 50 50" style="overflow:visible">
          <circle cx="25" cy="25" r="8" stroke="#1565c0" stroke-width="4" stroke-linecap="round" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
          </circle>
        </svg>
        <div style="font-weight:700;color:#333">Memproses...</div>
      </div>`;
      document.body.appendChild(s);
    }
  }

  function toast(msg, ok = true, ms = 2000) {
    const t = document.getElementById("mft-toast");
    if (!t) return;
    t.style.background = ok ? "#2e7d32" : "#c62828";
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => (t.style.display = "none"), ms);
  }

  function showSpinner(show = true) {
    const s = document.getElementById("mft-spinner");
    if (!s) return;
    s.style.display = show ? "block" : "none";
  }

  function setButtonsBusy(btns = [], busy = true) {
    btns.forEach(b => {
      if (!b) return;
      try {
        b.disabled = busy;
        if (busy) b.classList && b.classList.add("disabled");
        else b.classList && b.classList.remove("disabled");
      } catch (e) {}
    });
  }

  function escapeHtml(s) {
    if (s === undefined || s === null) return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  ensureUiHelpers();

  /************************************************************************
   *  Session & DOM detection
   ************************************************************************/
  const raw = localStorage.getItem("familyUser") || null;
  let session = null;
  try {
    session = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to parse session:", e);
    session = null;
  }

  if (!session || !session.token) {
    alert("Sesi tidak ditemukan atau kedaluwarsa. Silakan login ulang.");
    return (location.href = "login.html");
  }

  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role || "user").toLowerCase();

  // Look for typical DOM elements from delete.html
  const tbody =
    document.querySelector("#userTableBody") ||
    document.querySelector("#tbl tbody") ||
    document.querySelector("#userTable tbody");

  const btnRefresh =
    document.querySelector("#refreshBtn") ||
    document.querySelector("#btnRefresh") ||
    Array.from(document.querySelectorAll("button")).find(b => /refresh\s*data/i.test(b.textContent));

  const btnDeleteSelected =
    document.querySelector("#deleteSelectedBtn") ||
    document.querySelector("#btnDeleteSelected") ||
    Array.from(document.querySelectorAll("button")).find(b => /hapus terpilih/i.test(b.textContent));

  const btnDeleteAll =
    document.querySelector("#deleteAllBtn") ||
    document.querySelector("#btnDeleteAll") ||
    Array.from(document.querySelectorAll("button")).find(b => /hapus semua/i.test(b.textContent));

  if (!tbody) {
    console.error("Tbody (user table) not found. Please ensure #userTableBody exists.");
    toast("Tabel pengguna tidak ditemukan pada halaman", false, 3000);
    return;
  }

  /************************************************************************
   *  safeFetch: always return structured object
   ************************************************************************/
  async function safeFetch(url, opts = {}) {
    console.log("[FETCH] →", url);
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return { ok: true, status: res.status, json, raw: text };
      } catch (e) {
        // not JSON
        console.error("safeFetch: JSON parse failed:", e);
        return { ok: false, status: res.status, error: "invalid_json", raw: text };
      }
    } catch (err) {
      console.error("safeFetch network error:", err);
      return { ok: false, error: "network", detail: String(err) };
    }
  }

  /************************************************************************
   *  API helpers & detection
   ************************************************************************/
  // prefer window.API_URL from config.js
  const API = window.API_URL || (console.warn("window.API_URL not defined"), null);
  if (!API) {
    toast("API_URL tidak ditemukan (config.js).", false, 4000);
    console.error("Missing window.API_URL. Please include config.js before delete.js");
    return;
  }

  // validate token on server (best-effort)
  let serverValidated = false;
  async function validateTokenOnServer() {
    try {
      const r = await safeFetch(`${API}?mode=validate&token=${encodeURIComponent(TOKEN)}`);
      if (r.ok && r.json && r.json.status === "success") {
        serverValidated = true;
        console.log("Token validated by server:", r.json);
        return { ok: true, info: r.json };
      }
      console.warn("Token validation failed or returned error:", r);
      return { ok: false, reason: r };
    } catch (e) {
      console.error("validateTokenOnServer error", e);
      return { ok: false, reason: e };
    }
  }

  // determine which list mode to call: prefer mode=list then fallback to mode=getdata
  async function fetchList() {
    // try mode=list
    const urlList = `${API}?mode=list&token=${encodeURIComponent(TOKEN)}`;
    const r1 = await safeFetch(urlList);
    if (r1.ok && r1.json) return r1.json;
    // fallback to getdata
    const urlGet = `${API}?mode=getdata&token=${encodeURIComponent(TOKEN)}`;
    const r2 = await safeFetch(urlGet);
    if (r2.ok && r2.json) return r2.json;
    // maybe api returns raw array at ?mode=getdata without token
    const urlGetNoToken = `${API}?mode=getdata`;
    const r3 = await safeFetch(urlGetNoToken);
    if (r3.ok && r3.json) return r3.json;
    // failed
    return { error: true, rawResponses: [r1, r2, r3] };
  }

  /************************************************************************
   *  Rendering
   ************************************************************************/
  function showLoadingRows(msg = "Memuat data...") {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">${escapeHtml(msg)}</td></tr>`;
  }

  function renderRows(list) {
    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada user.</td></tr>`;
      return;
    }

    const rowsHtml = list.map(u => {
      // normalize potential variations
      const id = u.id ?? u.ID ?? u.Id ?? u.iD ?? "";
      const name = u.name ?? u.nama ?? u.Name ?? u.nama_user ?? "-";
      const email = u.email ?? u.domisili ?? u.email_user ?? "-";
      const status = (u.status ?? u.Status ?? "").toString().toLowerCase();

      // skip deleted if present
      if (status === "deleted") return "";

      // checkbox allowed only if admin OR it's current user
      const allowCheckbox = (MY_ROLE === "admin" || String(id) === MY_ID);
      const chk = allowCheckbox
        ? `<input type="checkbox" class="mft-chk" value="${escapeHtml(id)}">`
        : `<input type="checkbox" class="mft-chk" value="${escapeHtml(id)}" disabled title="Hanya admin atau pemilik yang bisa hapus">`;

      return `<tr>
        <td style="width:1%;text-align:center">${chk}</td>
        <td style="word-break:break-all;min-width:220px">${escapeHtml(id)}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(email || "-")}</td>
      </tr>`;
    }).join("");

    tbody.innerHTML = rowsHtml || `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada user.</td></tr>`;
  }

  /************************************************************************
   *  Load users
   ************************************************************************/
  async function loadUsers() {
    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);
    showLoadingRows("Memuat data...");

    // try server token validation silently
    if (!serverValidated) {
      await validateTokenOnServer();
    }

    const listRes = await fetchList();
    if (listRes && Array.isArray(listRes)) {
      // raw array
      const visible = MY_ROLE === "admin" ? listRes : listRes.filter(u => String(u.id ?? u.ID) === MY_ID);
      renderRows(visible);
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
      return;
    }

    if (listRes && listRes.status && (Array.isArray(listRes.data) || Array.isArray(listRes.users))) {
      const arr = Array.isArray(listRes.data) ? listRes.data : (Array.isArray(listRes.users) ? listRes.users : []);
      const filtered = arr.filter(i => (i.status ?? i.Status ?? "").toString().toLowerCase() !== "deleted");
      const visible = MY_ROLE === "admin" ? filtered : filtered.filter(u => String(u.id ?? u.ID) === MY_ID);
      renderRows(visible);
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
      return;
    }

    // If returned object includes data as object mapping (older variant)
    if (listRes && listRes.data && typeof listRes.data === "object" && !Array.isArray(listRes.data)) {
      // try to extract first array found
      const arr = Object.values(listRes.data).find(v => Array.isArray(v));
      if (Array.isArray(arr)) {
        const visible = MY_ROLE === "admin" ? arr : arr.filter(u => String(u.id ?? u.ID) === MY_ID);
        renderRows(visible);
        showSpinner(false);
        setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
        return;
      }
    }

    // unknown or error
    console.error("loadUsers: Unknown server response:", listRes);
    let msg = "Format response tidak sesuai. Periksa console.";
    if (listRes && listRes.error) msg = "Gagal memuat data (server). Periksa console.";
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">${escapeHtml(msg)}</td></tr>`;
    toast("Response server tidak sesuai", false, 3000);
    showSpinner(false);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
  }

  /************************************************************************
   *  Delete helpers
   ************************************************************************/
  async function deleteSingleId(id) {
    if (!id) return { ok: false, reason: "missing_id" };
    const url = `${API}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`;
    const r = await safeFetch(url);
    if (!r.ok) return { ok: false, reason: "network_or_parse", raw: r };
    // expect r.json.status == success
    if (r.json && (r.json.status === "success" || r.json.status === "ok")) return { ok: true, json: r.json };
    // sometimes returns plain object w/o status
    if (r.json && typeof r.json === "object" && !r.json.status) return { ok: true, json: r.json };
    return { ok: false, reason: "delete_failed", json: r.json || r.raw };
  }

  async function deleteSelectedHandler() {
    const checked = Array.from(document.querySelectorAll(".mft-chk:checked")).map(i => i.value);
    if (!checked.length) {
      return alert("Tidak ada user dipilih.");
    }

    // if non-admin, ensure only self is included
    if (MY_ROLE !== "admin") {
      const others = checked.filter(x => String(x) !== MY_ID);
      if (others.length) return alert("Anda hanya bisa menghapus akun Anda sendiri.");
    }

    if (!confirm(`Hapus ${checked.length} akun terpilih?`)) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);

    try {
      for (const id of checked) {
        const res = await deleteSingleId(id);
        if (!res.ok) {
          console.error("deleteSelectedHandler: failure", id, res);
          toast(`Gagal menghapus ID ${id}`, false, 3000);
          showSpinner(false);
          setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
          return;
        }
        // if user deleted own account
        if (String(id) === MY_ID) {
          localStorage.removeItem("familyUser");
          alert("Akun Anda telah dihapus. Anda akan dialihkan ke halaman login.");
          return (location.href = "login.html");
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
    if (MY_ROLE !== "admin") return alert("Hanya admin yang dapat menghapus semua user.");
    if (!confirm("⚠ Yakin ingin menghapus SEMUA user? (tidak bisa dikembalikan)")) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);

    try {
      // fetch full list raw (no filter)
      const r = await safeFetch(`${API}?mode=list&token=${encodeURIComponent(TOKEN)}`);
      let arr = [];
      if (r.ok && r.json) {
        if (Array.isArray(r.json)) arr = r.json;
        else if (Array.isArray(r.json.data)) arr = r.json.data;
        else if (Array.isArray(r.json.users)) arr = r.json.users;
      }
      if (!arr.length) {
        toast("Gagal mengambil daftar user untuk dihapus.", false, 3000);
        return;
      }

      for (const u of arr) {
        const id = u.id ?? u.ID ?? "";
        if (!id) continue;
        const res = await deleteSingleId(id);
        if (!res.ok) {
          console.error("deleteAllHandler failed on", id, res);
          toast(`Gagal hapus ID: ${id}`, false, 3000);
          return;
        }
      }

      toast("Semua user berhasil dihapus.", true, 2200);
      await loadUsers();
    } finally {
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
    }
  }

  /************************************************************************
   * Wire events & init
   ************************************************************************/
  if (btnRefresh && btnRefresh.addEventListener) btnRefresh.addEventListener("click", loadUsers);
  if (btnDeleteSelected && btnDeleteSelected.addEventListener) btnDeleteSelected.addEventListener("click", deleteSelectedHandler);
  if (btnDeleteAll && btnDeleteAll.addEventListener) btnDeleteAll.addEventListener("click", deleteAllHandler);

  // show/hide buttons depending on role
  if (MY_ROLE !== "admin") {
    // user cannot see "delete all" (graceful hide)
    if (btnDeleteAll) btnDeleteAll.style.display = "none";
  }

  // expose control for debugging
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.deleteSelected = deleteSelectedHandler;
  window.mft.deleteAll = deleteAllHandler;

  // auto load after tiny delay (let DOM settle)
  setTimeout(() => {
    loadUsers();
  }, 60);
})();
