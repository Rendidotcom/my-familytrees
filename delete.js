/* ======================================================
   delete.js — SYNC WITH GAS (mode=list & mode=delete via GET)
   - Requires: config.js (window.API_URL)
   - Expects session in localStorage.familyUser { id, name, role, token }
====================================================== */

console.log("DELETE.JS START");

(function () {
  // ---------- helper UI creation (toast + spinner) ----------
  function createUIHelpers() {
    if (!document.getElementById("mft-toast")) {
      const toast = document.createElement("div");
      toast.id = "mft-toast";
      toast.style.position = "fixed";
      toast.style.right = "20px";
      toast.style.bottom = "20px";
      toast.style.minWidth = "220px";
      toast.style.padding = "10px 14px";
      toast.style.borderRadius = "8px";
      toast.style.boxShadow = "0 6px 22px rgba(0,0,0,0.12)";
      toast.style.zIndex = 9999;
      toast.style.display = "none";
      toast.style.fontFamily = "system-ui, Arial, sans-serif";
      toast.style.color = "#fff";
      document.body.appendChild(toast);
    }

    if (!document.getElementById("mft-spinner")) {
      const sp = document.createElement("div");
      sp.id = "mft-spinner";
      sp.style.position = "fixed";
      sp.style.left = "50%";
      sp.style.top = "30%";
      sp.style.transform = "translateX(-50%)";
      sp.style.padding = "12px 18px";
      sp.style.background = "rgba(255,255,255,0.95)";
      sp.style.borderRadius = "10px";
      sp.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
      sp.style.fontFamily = "system-ui, Arial, sans-serif";
      sp.style.display = "none";
      sp.style.zIndex = 9998;
      sp.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
        <div class="mft-dot" style="width:10px;height:10px;border-radius:50%;background:#1565c0;animation:mft-pulse 1s infinite"></div>
        <div style="font-weight:600;color:#333">Memproses...</div>
      </div>
      <style>
        @keyframes mft-pulse {
          0% { transform: scale(1); opacity:1}
          50% { transform: scale(1.6); opacity:0.6}
          100% { transform: scale(1); opacity:1}
        }
      </style>`;
      document.body.appendChild(sp);
    }
  }

  function showToast(msg, ok = true, timeout = 2300) {
    const toast = document.getElementById("mft-toast");
    if (!toast) return;
    toast.style.background = ok ? "#2e7d32" : "#c62828";
    toast.style.display = "block";
    toast.textContent = msg;
    setTimeout(() => {
      toast.style.display = "none";
    }, timeout);
  }

  function showSpinner(show = true) {
    const s = document.getElementById("mft-spinner");
    if (!s) return;
    s.style.display = show ? "block" : "none";
  }

  createUIHelpers();

  // ---------- session & config ----------
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
    return location.href = "login.html";
  }

  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = session.role || "user";

  // ---------- DOM hooks ----------
  const selTableBody = document.querySelector("#userTableBody") || document.querySelector("#tbl tbody") || document.querySelector("#userTable tbody");
  const btnRefresh = document.querySelector("#refreshBtn") || document.querySelector("#btnRefresh") || Array.from(document.querySelectorAll("button")).find(b => /refresh/i.test(b.textContent));
  const btnDeleteSelected = document.querySelector("#deleteSelectedBtn") || document.querySelector("#btnDeleteSelected") || Array.from(document.querySelectorAll("button")).find(b => /hapus terpilih/i.test(b.textContent));
  const btnDeleteAll = document.querySelector("#deleteAllBtn") || document.querySelector("#btnDeleteAll") || Array.from(document.querySelectorAll("button")).find(b => /hapus semua/i.test(b.textContent));

  if (!selTableBody) {
    console.error("ERROR: #userTableBody (tbody) tidak ditemukan");
    // graceful fallback: try to create a table body in page
    showToast("Tabel pengguna tidak ditemukan di halaman", false, 3500);
    return;
  }

  // disable/enable UI
  function setBusy(state) {
    showSpinner(state);
    [btnRefresh, btnDeleteSelected, btnDeleteAll].forEach(b => {
      if (!b) return;
      try { b.disabled = state; } catch(e){}
      if (state) b.classList && b.classList.add && b.classList.add("disabled");
      else b.classList && b.classList.remove && b.classList.remove("disabled");
    });
  }

  // ---------- safe fetch wrapper ----------
  async function safeFetch(url, opts = {}) {
    console.log("[FETCH] →", url);
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      // attempt parse json
      try {
        const json = JSON.parse(text);
        return { ok: true, json, status: res.status };
      } catch (e) {
        console.error("Response JSON parse error", e, text);
        return { ok: false, error: "invalid_json", raw: text, status: res.status };
      }
    } catch (err) {
      console.error("Network fetch error", err);
      return { ok: false, error: "network", detail: String(err) };
    }
  }

  // ---------- render helpers ----------
  function emptyRowMessage(msg) {
    selTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#666;padding:18px">${msg}</td></tr>`;
  }

  function renderTableRows(list) {
    if (!Array.isArray(list) || list.length === 0) {
      emptyRowMessage("Tidak ada user.");
      return;
    }

    const rows = list.map(u => {
      // normalize properties (some GAS used name vs nama)
      const id = u.id ?? u.ID ?? u.id_user ?? "";
      const name = u.name ?? u.nama ?? u.Name ?? u.nama_user ?? "-";
      const email = u.email ?? u.domisili ?? u.email_user ?? "-";
      // produce checkbox but if non-admin and not self, hide checkbox (user cannot select others)
      const checkbox = (MY_ROLE === "admin" || String(id) === MY_ID)
        ? `<input type="checkbox" class="mft-chk" value="${id}">`
        : `<input type="checkbox" class="mft-chk" value="${id}" disabled title="Hanya admin atau pemilik akun yang bisa menghapus">`;

      return `<tr>
        <td style="width:1%;text-align:center">${checkbox}</td>
        <td style="word-break:break-all;min-width:220px">${id}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(email || "-")}</td>
      </tr>`;
    }).join("");

    selTableBody.innerHTML = rows;
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

  // ---------- load users ----------
  async function loadUsers() {
    setBusy(true);
    try {
      // show loading row
      selTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px">Memuat data...</td></tr>`;

      // GAS supports mode=list (and getdata) — we call mode=list for compatibility
      const url = `${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}`;
      const r = await safeFetch(url);

      if (!r.ok) {
        // try fallback mode=getdata
        console.warn("Primary response not ok, trying fallback mode=getdata");
        const r2 = await safeFetch(`${window.API_URL}?mode=getdata&token=${encodeURIComponent(TOKEN)}`);
        if (!r2.ok) {
          console.error("Both list/getdata failed", r, r2);
          emptyRowMessage("Gagal memuat data (server). Periksa console.");
          showToast("Gagal memuat data", false, 2500);
          setBusy(false);
          return;
        } else {
          return handleListResponse(r2.json);
        }
      } else {
        return handleListResponse(r.json);
      }

    } catch (err) {
      console.error("loadUsers error", err);
      emptyRowMessage("Terjadi kesalahan saat memuat data.");
      showToast("Error memuat data", false, 2200);
    } finally {
      setBusy(false);
    }
  }

  // handle JSON returned by GAS
  function handleListResponse(json) {
    // GAS returns: { status:"success", data: [...] }
    // but older variants may return { status:"success", users: [...] } or raw array
    if (!json) {
      emptyRowMessage("Response kosong dari server");
      return;
    }

    if (Array.isArray(json)) {
      renderTableRows(json);
      return;
    }

    if (json.status && (Array.isArray(json.data) || Array.isArray(json.users))) {
      const list = Array.isArray(json.data) ? json.data : (Array.isArray(json.users) ? json.users : []);
      // Filter out rows with status='deleted' if present
      const filtered = list.filter(i => {
        const st = i.status ?? i.Status ?? "";
        return String(st).toLowerCase() !== "deleted";
      });
      // If non-admin, show only self
      const visible = (MY_ROLE === "admin") ? filtered : filtered.filter(u => String(u.id) === MY_ID || String(u.ID) === MY_ID);
      renderTableRows(visible);
      return;
    }

    // if json has top-level data property but not array
    if (json.data && typeof json.data === "object" && !Array.isArray(json.data)) {
      // try to extract array inside
      const arr = Object.values(json.data).filter(x => Array.isArray(x)).flat()[0] || [];
      if (Array.isArray(arr)) {
        renderTableRows(arr);
        return;
      }
    }

    // unknown format
    console.error("Unknown response format", json);
    emptyRowMessage("Format response tidak sesuai. Periksa console.");
    showToast("Response server tidak sesuai", false, 3000);
  }

  // ---------- delete helpers ----------
  async function deleteById(id) {
    // GAS supports delete via GET: mode=delete&id=...&token=...
    const url = `${window.API_URL}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(TOKEN)}`;
    const r = await safeFetch(url);
    if (!r.ok) return { ok: false, reason: r.error, detail: r };
    // expect {status:"success", id:...} or similar
    if (r.json && (r.json.status === "success" || r.json.status === "ok")) return { ok: true, json: r.json };
    // some handlers return plain object
    if (r.json && typeof r.json === "object" && !r.json.status) return { ok: true, json: r.json };
    return { ok: false, reason: "delete_failed", json: r.json };
  }

  async function deleteSelectedHandler() {
    const chks = Array.from(document.querySelectorAll(".mft-chk:checked")).map(i => i.value);
    if (!chks.length) return alert("Tidak ada user terpilih.");

    // if non-admin, ensure they are only deleting their own id
    if (MY_ROLE !== "admin") {
      const other = chks.filter(x => String(x) !== MY_ID);
      if (other.length) {
        return alert("Anda tidak diizinkan menghapus akun orang lain.");
      }
    }

    if (!confirm(`Hapus ${chks.length} akun terpilih?`)) return;

    setBusy(true);
    try {
      for (const id of chks) {
        const resp = await deleteById(id);
        if (!resp.ok) {
          console.error("Gagal hapus id", id, resp);
          showToast(`Gagal hapus ID: ${id}`, false, 3000);
          setBusy(false);
          return;
        }
        // if current user deleted, force logout
        if (String(id) === MY_ID) {
          localStorage.removeItem("familyUser");
          alert("Akun Anda telah dihapus. Anda akan diarahkan ke login.");
          return location.href = "login.html";
        }
      }
      showToast("Penghapusan selesai.", true, 2000);
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  async function deleteAllHandler() {
    if (MY_ROLE !== "admin") return alert("Hanya admin yang dapat menghapus semua user.");
    if (!confirm("Yakin hapus SEMUA user? (tidak bisa dibatalkan)")) return;

    setBusy(true);
    try {
      // get current user list (we'll call delete per id)
      // reuse loadUsers logic by requesting raw list
      const r = await safeFetch(`${window.API_URL}?mode=list&token=${encodeURIComponent(TOKEN)}`);
      let arr = [];
      if (r.ok && r.json) {
        arr = Array.isArray(r.json.data) ? r.json.data : (Array.isArray(r.json.users) ? r.json.users : (Array.isArray(r.json) ? r.json : []));
      } else {
        showToast("Gagal memuat daftar untuk hapus semua.", false, 3000);
        return;
      }

      const ids = arr.map(x => x.id ?? x.ID).filter(Boolean);
      for (const id of ids) {
        const resp = await deleteById(id);
        if (!resp.ok) {
          console.error("Gagal hapus id", id, resp);
          showToast(`Gagal hapus ID: ${id}`, false, 3000);
          setBusy(false);
          return;
        }
      }

      showToast("Semua user berhasil dihapus.", true, 2500);
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  // ---------- wire events ----------
  (btnRefresh && btnRefresh.addEventListener) && btnRefresh.addEventListener("click", loadUsers);
  (btnDeleteSelected && btnDeleteSelected.addEventListener) && btnDeleteSelected.addEventListener("click", deleteSelectedHandler);
  (btnDeleteAll && btnDeleteAll.addEventListener) && btnDeleteAll.addEventListener("click", deleteAllHandler);

  // If some buttons not found, log friendly message
  if (!btnRefresh) console.warn("Tombol Refresh tidak ditemukan (id refreshBtn / btnRefresh / auto-detect).");
  if (!btnDeleteSelected) console.warn("Tombol Hapus Terpilih tidak ditemukan (id deleteSelectedBtn / btnDeleteSelected / auto-detect).");
  if (!btnDeleteAll) console.warn("Tombol Hapus Semua tidak ditemukan (id deleteAllBtn / btnDeleteAll / auto-detect).");

  // ---------- initial load ----------
  // small delay to allow page to fully render
  setTimeout(() => {
    loadUsers();
  }, 80);

  // expose for debugging
  window.mft = window.mft || {};
  window.mft.loadUsers = loadUsers;
  window.mft.deleteSelected = deleteSelectedHandler;
  window.mft.deleteAll = deleteAllHandler;

})();
