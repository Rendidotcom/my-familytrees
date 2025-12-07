/* ======================================================
   delete.js — PREMIUM v4 (robust GET/POST + GAS compatibility)
   Requires: config.js -> window.API_URL
   Expects: localStorage.familyUser = { id, name, role, token }
   - Uses POST mode=delete as primary (JSON). Falls back to GET variants.
   - Filters data based on your Sheet1 schema (ID at column 'id' field)
====================================================== */
(function () {
  "use strict";
  console.log("DELETE.JS — PREMIUM v4 loaded");

  /* ---------------- UI helpers ---------------- */
  function ensureUI() {
    if (!document.getElementById("mft-toast")) {
      const t = document.createElement("div");
      t.id = "mft-toast";
      Object.assign(t.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        padding: "10px 14px",
        color: "#fff",
        fontWeight: 700,
        borderRadius: "10px",
        zIndex: 99999,
        display: "none",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        fontFamily: "system-ui, Arial"
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
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        background: "rgba(255,255,255,0.96)",
        fontFamily: "system-ui, Arial"
      });
      s.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
        <svg width="18" height="18" viewBox="0 0 50 50"><circle cx="25" cy="25" r="8" stroke="#1565c0" stroke-width="4" stroke-linecap="round" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/></circle></svg>
        <div style="font-weight:700;color:#333">Memproses...</div>
      </div>`;
      document.body.appendChild(s);
    }
  }
  function toast(msg, ok = true, ms = 2200) {
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

  ensureUI();

  /* ---------------- Session + DOM ---------------- */
  const raw = localStorage.getItem("familyUser") || null;
  let session = null;
  try { session = raw ? JSON.parse(raw) : null; } catch(e) { session = null; }
  if (!session || !session.token) {
    alert("Sesi tidak ditemukan. Silakan login ulang.");
    return location.href = "login.html";
  }

  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role || "user").toLowerCase();

  // DOM elements (delete.html expected IDs)
  const tbody = document.querySelector("#userTableBody");
  const btnRefresh = document.querySelector("#refreshBtn");
  const btnDeleteSelected = document.querySelector("#deleteSelectedBtn");
  const btnDeleteAll = document.querySelector("#deleteAllBtn");
  const roleBadge = document.querySelector("#roleBadge");

  if (!tbody) {
    console.error("Tbody not found (#userTableBody).");
    toast("Tabel user tidak ditemukan!", false, 3500);
    return;
  }
  if (roleBadge) roleBadge.textContent = `Role: ${MY_ROLE.toUpperCase()}`;

  /* ---------------- utilities ---------------- */
  function escapeHtml(s) {
    if (s === undefined || s === null) return "";
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'", "&#39;");
  }

  async function safeFetch(url, opts = {}) {
    console.log("[FETCH] →", url, opts.method || "GET");
    try {
      const r = await fetch(url, opts);
      const text = await r.text();
      try {
        const json = JSON.parse(text);
        return { ok: true, status: r.status, json, raw: text };
      } catch (e) {
        return { ok: false, status: r.status, error: "invalid_json", raw: text };
      }
    } catch (err) {
      return { ok: false, error: "network", detail: String(err) };
    }
  }

  const API = window.API_URL || null;
  if (!API) {
    toast("config.js (API_URL) tidak ditemukan.", false, 4000);
    console.error("Missing window.API_URL");
    return;
  }

  /* ---------------- parse list responses (many shapes) ---------------- */
  function extractArrayFromPayload(payload) {
    if (!payload) return [];
    // raw array
    if (Array.isArray(payload)) return payload;
    // common shape { status: "success", data: [...] }
    if (payload.status && Array.isArray(payload.data)) return payload.data;
    if (payload.status && Array.isArray(payload.users)) return payload.users;
    // maybe top-level "data" object with arrays inside
    if (payload.data && typeof payload.data === "object") {
      const arr = Object.values(payload.data).find(v => Array.isArray(v));
      if (Array.isArray(arr)) return arr;
    }
    // maybe "items" or "members"
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.members)) return payload.members;
    // fallback: empty
    return [];
  }

  /* ---------------- render rows ---------------- */
  function renderRows(list) {
    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada user.</td></tr>`;
      return;
    }

    // show only admin or self
    const visible = (MY_ROLE === "admin") ? list : list.filter(u => String(u.id ?? u.ID ?? u.Id) === MY_ID);

    if (!visible.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada user.</td></tr>`;
      return;
    }

    const rows = visible.map(u => {
      // normalize fields (Sheet1 mapping)
      const id = u.id ?? u.ID ?? u.Id ?? u.recordId ?? "";
      const name = u.name ?? u.nama ?? u.Name ?? "-";
      // email is not in sheet; we fallback to domisili if present
      const email = u.email ?? u.domisili ?? "-";
      const role = u.role ?? u.Role ?? (u.roleName) ?? "-";
      const status = (u.status ?? u.Status ?? "").toString().toLowerCase();

      if (status === "deleted") return ""; // hide soft deleted

      // allow checkbox if admin or own id
      const allow = (MY_ROLE === "admin" || String(id) === MY_ID);
      const chk = allow
        ? `<input type="checkbox" class="mft-chk" value="${escapeHtml(id)}">`
        : `<input type="checkbox" class="mft-chk" value="${escapeHtml(id)}" disabled title="Hanya admin atau pemilik akun yang dapat menghapus">`;

      return `<tr>
        <td style="text-align:center">${chk}</td>
        <td style="word-break:break-all;min-width:220px">${escapeHtml(id)}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(email)}</td>
      </tr>`;
    }).join("");

    tbody.innerHTML = rows || `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Tidak ada user.</td></tr>`;
  }

  /* ---------------- load users (mode=list or mode=getdata) ---------------- */
  async function loadUsers() {
    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Memuat data...</td></tr>`;

    try {
      // try list
      const r1 = await safeFetch(`${API}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`);
      if (r1.ok && r1.json) {
        const arr = extractArrayFromPayload(r1.json);
        renderRows(arr);
        return;
      }
      // fallback getdata
      const r2 = await safeFetch(`${API}?mode=getdata&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`);
      if (r2.ok && r2.json) {
        const arr = extractArrayFromPayload(r2.json);
        renderRows(arr);
        return;
      }
      // fallback without token (some deployments)
      const r3 = await safeFetch(`${API}?mode=getdata&ts=${Date.now()}`);
      if (r3.ok && r3.json) {
        const arr = extractArrayFromPayload(r3.json);
        renderRows(arr);
        return;
      }
      // try raw endpoint default
      const r4 = await safeFetch(`${API}?ts=${Date.now()}`);
      if (r4.ok && r4.json) {
        const arr = extractArrayFromPayload(r4.json);
        renderRows(arr);
        return;
      }

      // If all failed
      console.error("All list/getdata attempts failed", r1, r2, r3, r4);
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#666">Gagal memuat data (server). Periksa console.</td></tr>`;
      toast("Gagal memuat data", false, 2600);

    } finally {
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
    }
  }

  /* ---------------- delete helpers (POST primary + GET fallback) ---------------- */

  // Primary: POST JSON { mode: "delete", id, token }
  async function postDeletePayload(payload) {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        return { ok: true, json: j };
      } catch(e) {
        return { ok: false, error: "invalid_json", raw: text };
      }
    } catch(e) {
      return { ok: false, error: "network", detail: String(e) };
    }
  }

  // Try many variants (mirrors edit.js pattern)
  async function tryDeleteVariants(idValue, token) {
    if (!idValue) return { ok:false, reason: "missing_id" };

    // Try POST JSON variants first (preferred)
    const postCandidates = [
      { mode: "delete", id: idValue, token },
      { mode: "deleteMember", id: idValue, token },
      { mode: "hardDelete", id: idValue, token },
      { action: "delete", id: idValue, token }
    ];
    for (const p of postCandidates) {
      try {
        const r = await postDeletePayload(p);
        if (r.ok && r.json && (r.json.status === "success" || r.json.status === "ok" || !r.json.status && Object.keys(r.json).length)) {
          return { ok:true, result: r.json, variant: "post", payload: p };
        }
      } catch (e) {}
    }

    // Try GET URL variants
    const getCandidates = [
      `${API}?mode=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API}?mode=deleteMember&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API}?action=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API}?mode=hardDelete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API}?id=${encodeURIComponent(idValue)}&mode=delete&token=${encodeURIComponent(token)}`
    ];
    for (const u of getCandidates) {
      try {
        const r = await safeFetch(u);
        if (r.ok && r.json && (r.json.status === "success" || r.json.status === "ok" || !r.json.status && Object.keys(r.json).length)) {
          return { ok:true, result: r.json, variant: "get", url: u };
        }
      } catch (e) {}
    }

    // Last resort: try POST FormData (multipart) with mode=delete
    try {
      const fd = new FormData();
      fd.append("mode", "delete");
      fd.append("id", idValue);
      fd.append("token", token);
      const r = await fetch(API, { method: "POST", body: fd });
      const txt = await r.text();
      try {
        const j = JSON.parse(txt);
        if (j && (j.status === "success" || j.status === "ok" || !j.status)) return { ok:true, result:j, variant:"post-form"};
      } catch(e) {}
    } catch(e) {}

    return { ok:false, reason: "all_failed" };
  }

  async function deleteSingleId(idValue) {
    const res = await tryDeleteVariants(idValue, TOKEN);
    return res;
  }

  /* ---------------- delete selected handler ---------------- */
  async function deleteSelectedHandler() {
    const checked = Array.from(document.querySelectorAll(".mft-chk:checked")).map(i => i.value);
    if (!checked.length) return alert("Tidak ada user dipilih.");

    // non-admin may only delete themselves
    if (MY_ROLE !== "admin") {
      const others = checked.filter(x => String(x) !== MY_ID);
      if (others.length) return alert("Anda hanya dapat menghapus akun Anda sendiri.");
    }

    if (!confirm(`Hapus ${checked.length} akun terpilih?`)) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);

    try {
      for (const id of checked) {
        const r = await deleteSingleId(id);
        if (!r.ok) {
          console.error("Failed deleting id", id, r);
          toast(`Gagal hapus ID: ${id}`, false, 3000);
          return;
        }
        // if current user deleted — logout & redirect
        if (String(id) === MY_ID) {
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

  /* ---------------- delete all handler (admin only) ---------------- */
  async function deleteAllHandler() {
    if (MY_ROLE !== "admin") return alert("Hanya admin yang dapat menghapus semua user.");
    if (!confirm("⚠ Yakin hapus SEMUA user? (tidak bisa dikembalikan)")) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);

    try {
      // get full list (no local filter)
      const r = await safeFetch(`${API}?mode=list&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`);
      let arr = [];
      if (r.ok && r.json) arr = extractArrayFromPayload(r.json);
      else {
        const r2 = await safeFetch(`${API}?mode=getdata&token=${encodeURIComponent(TOKEN)}&ts=${Date.now()}`);
        if (r2.ok && r2.json) arr = extractArrayFromPayload(r2.json);
      }

      if (!Array.isArray(arr) || !arr.length) {
        toast("Gagal mengambil daftar user.", false, 3000);
        return;
      }

      for (const u of arr) {
        const id = u.id ?? u.ID ?? u.Id ?? null;
        if (!id) continue;
        const res = await deleteSingleId(id);
        if (!res.ok) {
          console.error("deleteAll failed:", id, res);
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

  /* ---------------- wire events ---------------- */
  if (btnRefresh) btnRefresh.addEventListener("click", loadUsers);
  if (btnDeleteSelected) btnDeleteSelected.addEventListener("click", deleteSelectedHandler);
  if (btnDeleteAll) btnDeleteAll.addEventListener("click", deleteAllHandler);

  if (MY_ROLE !== "admin" && btnDeleteAll) {
    btnDeleteAll.style.display = "none";
  }

  /* ---------------- initial load ---------------- */
  setTimeout(() => {
    loadUsers();
  }, 60);

  // Expose debug helpers
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.deleteSelected = deleteSelectedHandler;
  window.mft.deleteAll = deleteAllHandler;

})();
