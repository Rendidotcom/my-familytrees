/* ======================================================
   delete.js — PREMIUM V4 (FULL SAFE + GAS SYNC)
   Requires: config.js (window.API_URL)
   Expects session in localStorage.familyUser: { id, name, role, token }
   - Uses POST mode=delete preferred, fallback to GET
   - Multi-endpoint list detection & format normalization
   - Optional soft-delete (set USE_SOFT_DELETE = true)
====================================================== */
(function () {
  "use strict";
  console.log("DELETE.JS — PREMIUM V4 (compatible)");

  // -----------------------
  // CONFIG / FLAGS
  // -----------------------
  const USE_SOFT_DELETE = false; // jika true, gunakan POST mode=softdelete (admin only)
  const DELETE_VIA_POST = true;  // coba POST dulu, fallback ke GET otomatis

  // -----------------------
  // UI helpers
  // -----------------------
  function ensureUi() {
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
        fontWeight: 700,
        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
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
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        background: "rgba(255,255,255,0.96)",
        fontFamily: "system-ui, Arial"
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
    btns.forEach((b) => {
      if (!b) return;
      try {
        b.disabled = busy;
        if (busy) b.classList && b.classList.add("disabled");
        else b.classList && b.classList.remove("disabled");
      } catch (e) {}
    });
  }

  ensureUi();

  // -----------------------
  // Session + DOM detection
  // -----------------------
  const raw = localStorage.getItem("familyUser") || null;
  let session = null;
  try {
    session = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Session parse error", e);
    session = null;
  }

  if (!session || !session.token) {
    alert("Sesi tidak ditemukan. Silakan login ulang.");
    return (location.href = "login.html");
  }

  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role || "user").toLowerCase();

  // DOM hooks (support multiple id variants)
  const tbody =
    document.querySelector("#userTableBody") ||
    document.querySelector("#tbl tbody") ||
    document.querySelector("#userTable tbody");
  const btnRefresh =
    document.querySelector("#refreshBtn") ||
    document.querySelector("#btnRefresh") ||
    Array.from(document.querySelectorAll("button")).find((b) => /refresh/i.test(b.textContent));
  const btnDeleteSelected =
    document.querySelector("#deleteSelectedBtn") ||
    document.querySelector("#btnDeleteSelected") ||
    Array.from(document.querySelectorAll("button")).find((b) => /hapus\s*terpilih/i.test(b.textContent));
  const btnDeleteAll =
    document.querySelector("#deleteAllBtn") ||
    document.querySelector("#btnDeleteAll") ||
    Array.from(document.querySelectorAll("button")).find((b) => /hapus\s*semua/i.test(b.textContent));
  // optional role display
  const roleBadge = document.querySelector("#roleBadge");
  if (roleBadge) roleBadge.textContent = `Role: ${MY_ROLE.toUpperCase()}`;

  if (!tbody) {
    console.error("Tabel pengguna tidak ditemukan (#userTableBody).");
    toast("Tabel user tidak ditemukan!", false, 3500);
    return;
  }

  // -----------------------
  // util helpers
  // -----------------------
  function escapeHtml(s) {
    if (s === undefined || s === null) return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function safeFetch(url, opts = {}) {
    console.log("[fetch]", url, opts && opts.method ? opts.method : "GET");
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return { ok: true, status: res.status, json, raw: text };
      } catch (e) {
        return { ok: false, status: res.status, error: "invalid_json", raw: text };
      }
    } catch (err) {
      return { ok: false, error: "network", detail: String(err) };
    }
  }

  // -----------------------
  // API URL
  // -----------------------
  const API = window.API_URL || null;
  if (!API) {
    toast("config.js (API_URL) tidak ditemukan.", false, 4000);
    console.error("Missing window.API_URL. Include config.js before delete.js");
    return;
  }

  // -----------------------
  // LIST / NORMALIZE logic
  // -----------------------
  function extractArrayFromPayload(payload) {
    // payload might be raw array
    if (!payload) return null;
    if (Array.isArray(payload)) return payload;
    // common pattern { status:"success", data:[...] }
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.users && Array.isArray(payload.users)) return payload.users;
    if (payload.items && Array.isArray(payload.items)) return payload.items;
    if (payload.result && Array.isArray(payload.result)) return payload.result;
    // sometimes data is object with nested arrays
    if (payload.data && typeof payload.data === "object") {
      const arr = Object.values(payload.data).find((v) => Array.isArray(v));
      if (Array.isArray(arr)) return arr;
    }
    // or payload might have top-level keys mapping -> try find first array
    const firstArr = Object.values(payload).find((v) => Array.isArray(v));
    if (firstArr) return firstArr;
    return null;
  }

  function normalizeRowObject(rawRow) {
    // map Sheet1 columns to normalized object (safe)
    // expected columns in sheet: Timestamp,name,Domisili,Relationship,PhotoURL,Notes,parentIdAyah,parentIdIbu,spouseId,ID,orderChild,status,pinHash,Role,sessionToken,tokenExpiry
    // But server returns rows as objects — so try to map common keys
    const o = rawRow || {};
    const id = o.id ?? o.ID ?? o.Id ?? o["ID"] ?? o.IDx ?? o.identifier ?? o.id_user ?? "";
    const name = o.name ?? o.nama ?? o.Name ?? o.nama_user ?? "";
    const email = o.email ?? o.domisili ?? o.email_user ?? "";
    const status = (o.status ?? o.Status ?? "").toString();
    return {
      id: String(id || ""),
      name: name || "",
      email: email || "",
      status: status
    };
  }

  // -----------------------
  // RENDER
  // -----------------------
  function emptyMessage(msg) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#666;padding:18px">${escapeHtml(msg)}</td></tr>`;
  }

  function renderRows(list) {
    if (!Array.isArray(list) || list.length === 0) {
      emptyMessage("Tidak ada user.");
      return;
    }
    const rows = list
      .map((r) => {
        const n = normalizeRowObject(r);
        if (!n.id) return ""; // skip if no id
        if ((n.status || "").toLowerCase() === "deleted") return ""; // skip soft deleted
        const allow = MY_ROLE === "admin" || String(n.id) === MY_ID;
        const chk = allow
          ? `<input type="checkbox" class="mft-chk" value="${escapeHtml(n.id)}">`
          : `<input type="checkbox" class="mft-chk" value="${escapeHtml(n.id)}" disabled title="Hanya admin atau pemilik akun yang bisa menghapus">`;
        return `<tr>
          <td style="text-align:center;white-space:nowrap">${chk}</td>
          <td style="word-break:break-all;min-width:220px">${escapeHtml(n.id)}</td>
          <td>${escapeHtml(n.name || "-")}</td>
          <td>${escapeHtml(n.email || "-")}</td>
        </tr>`;
      })
      .join("");
    tbody.innerHTML = rows || `<tr><td colspan="4" style="text-align:center;color:#666;padding:18px">Tidak ada user.</td></tr>`;
  }

  // -----------------------
  // LOAD USERS (multi-endpoint fallback)
  // -----------------------
  async function loadUsers() {
    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);
    emptyMessage("Memuat data...");
    try {
      // try mode=list
      const r1 = await safeFetch(`${API}?mode=list&token=${encodeURIComponent(TOKEN)}`);
      let payload = null;
      if (r1.ok && r1.json) payload = r1.json;
      else {
        // fallback to getdata
        const r2 = await safeFetch(`${API}?mode=getdata&token=${encodeURIComponent(TOKEN)}`);
        if (r2.ok && r2.json) payload = r2.json;
        else {
          // fallback to getdata without token (some deployments)
          const r3 = await safeFetch(`${API}?mode=getdata`);
          if (r3.ok && r3.json) payload = r3.json;
          else {
            // try calling root (no mode)
            const r4 = await safeFetch(`${API}`);
            if (r4.ok && r4.json) payload = r4.json;
            else {
              console.error("All list/getdata attempts failed", r1, r2, r3, r4);
              emptyMessage("Gagal memuat data (server). Periksa console.");
              toast("Gagal memuat data", false, 2400);
              return;
            }
          }
        }
      }

      // Accept raw array or wrapped array variants
      const arr = extractArrayFromPayload(payload);
      if (!arr) {
        // If payload itself looks like an object describing single user? try to transform to array
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          // Look for object where keys are rows (rare) -> try to flatten values array
          const maybe = Object.values(payload).filter((v) => typeof v === "object");
          if (maybe && maybe.length > 0) {
            const arrTry = maybe.find((v) => Array.isArray(v));
            if (Array.isArray(arrTry)) {
              renderRows(arrTry);
              return;
            }
          }
        }
        console.error("Unknown list response format:", payload);
        emptyMessage("Format response tidak sesuai. Periksa console.");
        toast("Response server tidak sesuai", false, 3000);
        return;
      }

      // Filter out soft-deleted and apply role restriction
      const filtered = arr.filter((i) => {
        const st = (i.status ?? i.Status ?? "").toString().toLowerCase();
        return st !== "deleted";
      });
      const visible = MY_ROLE === "admin" ? filtered : filtered.filter((u) => String(u.id ?? u.ID ?? "") === MY_ID);
      renderRows(visible);
    } finally {
      showSpinner(false);
      setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], false);
    }
  }

  // -----------------------
  // DELETE helpers (POST preferred, fallback to GET)
  // -----------------------
  async function postDelete(id, soft = false) {
    if (!id) return { ok: false, reason: "missing_id" };
    const mode = soft ? "softdelete" : "delete";
    const body = { mode, token: TOKEN, id };
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const txt = await res.text();
      try {
        const json = JSON.parse(txt);
        // success when status === success or ok or missing status but returned object
        if (json && (json.status === "success" || json.status === "ok" || !json.status)) return { ok: true, json };
        return { ok: false, json };
      } catch (e) {
        console.error("postDelete parse error:", txt);
        return { ok: false, raw: txt };
      }
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  async function getDelete(id, soft = false) {
    if (!id) return { ok: false, reason: "missing_id" };
    const mode = soft ? "softdelete" : "delete";
    const url = `${API}?mode=${encodeURIComponent(mode)}&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`;
    const r = await safeFetch(url);
    if (!r.ok) return { ok: false, reason: "network_or_parse", raw: r };
    if (r.json && (r.json.status === "success" || r.json.status === "ok" || !r.json.status)) return { ok: true, json: r.json };
    return { ok: false, json: r.json };
  }

  async function deleteId(id, soft = false) {
    if (DELETE_VIA_POST) {
      const p = await postDelete(id, soft);
      if (p.ok) return p;
      console.warn("POST delete failed or not supported, trying GET fallback for id=", id, p);
      return await getDelete(id, soft);
    } else {
      // prefer GET
      const g = await getDelete(id, soft);
      if (g.ok) return g;
      console.warn("GET delete failed, trying POST fallback for id=", id, g);
      return await postDelete(id, soft);
    }
  }

  // -----------------------
  // ACTIONS: delete selected / delete all
  // -----------------------
  async function deleteSelectedHandler() {
    const checked = Array.from(document.querySelectorAll(".mft-chk:checked")).map((i) => i.value);
    if (!checked.length) return alert("Tidak ada user dipilih.");
    if (MY_ROLE !== "admin") {
      const others = checked.filter((x) => String(x) !== MY_ID);
      if (others.length) return alert("Anda hanya dapat menghapus akun Anda sendiri.");
    }
    if (!confirm(`Hapus ${checked.length} akun terpilih?`)) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);

    try {
      for (const id of checked) {
        const res = await deleteId(id, USE_SOFT_DELETE);
        if (!res.ok) {
          console.error("Gagal hapus id", id, res);
          toast(`Gagal hapus ID: ${id}`, false, 3000);
          return;
        }
        // if current user deleted -> logout
        if (String(id) === MY_ID) {
          localStorage.removeItem("familyUser");
          alert("Akun Anda telah dihapus. Anda akan diarahkan ke login.");
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
    if (!confirm("⚠ Yakin hapus SEMUA user? (tidak bisa dikembalikan)")) return;

    showSpinner(true);
    setButtonsBusy([btnRefresh, btnDeleteSelected, btnDeleteAll], true);

    try {
      // fetch complete list
      const r = await safeFetch(`${API}?mode=list&token=${encodeURIComponent(TOKEN)}`);
      let arr = [];
      if (r.ok && r.json) {
        const extracted = extractArrayFromPayload(r.json);
        if (Array.isArray(extracted)) arr = extracted;
      }
      if (!arr.length) {
        // try getdata fallback
        const r2 = await safeFetch(`${API}?mode=getdata&token=${encodeURIComponent(TOKEN)}`);
        if (r2.ok && r2.json) {
          const extracted = extractArrayFromPayload(r2.json);
          if (Array.isArray(extracted)) arr = extracted;
        }
      }
      if (!arr.length) {
        toast("Gagal mengambil daftar user.", false, 3000);
        return;
      }
      for (const u of arr) {
        const id = u.id ?? u.ID ?? null;
        if (!id) continue;
        const res = await deleteId(id, USE_SOFT_DELETE);
        if (!res.ok) {
          console.error("deleteAll failed on id", id, res);
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

  // -----------------------
  // Wire events
  // -----------------------
  if (btnRefresh && btnRefresh.addEventListener) btnRefresh.addEventListener("click", loadUsers);
  if (btnDeleteSelected && btnDeleteSelected.addEventListener) btnDeleteSelected.addEventListener("click", deleteSelectedHandler);
  if (btnDeleteAll && btnDeleteAll.addEventListener) btnDeleteAll.addEventListener("click", deleteAllHandler);

  // hide deleteAll for non-admins (graceful)
  if (MY_ROLE !== "admin" && btnDeleteAll) btnDeleteAll.style.display = "none";

  // expose for debugging
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.deleteSelected = deleteSelectedHandler;
  window.mft.deleteAll = deleteAllHandler;

  // initial load (small delay so page DOM settle)
  setTimeout(() => loadUsers(), 80);
})();
