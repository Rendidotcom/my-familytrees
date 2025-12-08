/* ============================================================
   DELETE.JS — PREMIUM V7 (ANTI-CORS, TRY MULTI-ENDPOINT)
   - Admin melihat semua user
   - User biasa hanya melihat akun dirinya
   - GET-first (anti-CORS)
   - Multi-endpoint delete fallback
   - Auto logout jika self-delete
============================================================= */

(function () {
  "use strict";

  const API_URL = window.API_URL;

  /* -------------------------
     SESSION LOAD
  ---------------------------- */
  const session = JSON.parse(localStorage.getItem("familyUser") || "null");
  if (!session) {
    alert("Sesi habis. Silakan login.");
    location.href = "login.html";
  }
  const token = session.token;
  const sessionId = session.id;
  const role = session.role || "user";

  /* -------------------------
     UI ELEMENTS
  ---------------------------- */
  const listEl = document.getElementById("userList");
  const msgEl = document.getElementById("msg");
  const btnLogout = document.getElementById("btnLogout");

  function toast(m) {
    msgEl.textContent = m;
  }

  /* ============================================================
     1) GENERIC GET WRAPPER (ANTI-CORS)
  ============================================================ */
  async function tryFetchJsonGET(url) {
    try {
      const r = await fetch(url, { method: "GET" });
      return await r.json();
    } catch (e) {
      return { status: "error", message: e.toString() };
    }
  }

  /* ============================================================
     2) GENERIC POST WRAPPER
  ============================================================ */
  async function tryFetchJsonPOST(payload) {
    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await r.json();
    } catch (e) {
      return { status: "error", message: e.toString() };
    }
  }

  /* ============================================================
     3) MULTI-ENDPOINT DELETE (ANTI-CORS)
     — sama persis logika sukses dari edit.js
  ============================================================ */
  async function tryDeleteVariants(idValue, token) {
    const getUrls = [
      `${API_URL}?mode=deleteMember&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?mode=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?action=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?mode=hardDelete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?id=${encodeURIComponent(idValue)}&mode=delete&token=${encodeURIComponent(token)}`,
    ];

    // 1) Try GET first (anti-CORS)
    for (const u of getUrls) {
      const j = await tryFetchJsonGET(u);
      if (j && (j.status === "success" || j.status === "ok")) {
        return { ok: true, result: j, via: u };
      }
    }

    // 2) POST FALLBACK
    const postPayloads = [
      { mode: "delete", id: idValue, token },
      { mode: "deleteMember", id: idValue, token },
      { mode: "hardDelete", id: idValue, token },
      { action: "delete", id: idValue, token },
    ];

    for (const payload of postPayloads) {
      const j = await tryFetchJsonPOST(payload);
      if (j && (j.status === "success" || j.status === "ok")) {
        return { ok: true, result: j, via: payload };
      }
    }

    return { ok: false, result: null };
  }

  /* ============================================================
     4) LOAD USER LIST
  ============================================================ */
  async function loadUsers() {
    toast("Memuat...");

    // GET data anti-CORS
    const url = `${API_URL}?mode=getData&ts=${Date.now()}`;
    const res = await tryFetchJsonGET(url);

    if (res.status !== "success") {
      toast("Gagal memuat data");
      return;
    }

    const data = res.data || [];

    let filtered = [];
    if (role === "admin") {
      filtered = data; // admin melihat semua
    } else {
      filtered = data.filter((u) => u.id === sessionId); // user biasa hanya dirinya
    }

    listEl.innerHTML = "";
    filtered.forEach((u) => {
      const row = document.createElement("div");
      row.className = "user-row";

      row.innerHTML = `
        <div class="user-name">${u.name}</div>
        <button class="btn-delete" data-id="${u.id}">Hapus</button>
      `;

      listEl.appendChild(row);
    });

    toast("Siap");
  }

  /* ============================================================
     5) DELETE BUTTON HANDLER
  ============================================================ */
  listEl.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-delete")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    if (!confirm("Yakin ingin menghapus data ini?")) return;

    toast("Menghapus...");

    const result = await tryDeleteVariants(id, token);

    if (result.ok) {
      toast("Berhasil dihapus");

      // Jika user hapus dirinya sendiri → logout
      if (id === sessionId) {
        localStorage.removeItem("familyUser");
        setTimeout(() => (location.href = "login.html"), 600);
      } else {
        loadUsers();
      }

    } else {
      toast("Gagal menghapus: endpoint tidak ada yang merespon success");
      console.warn("Delete failed", result);
    }
  });

  /* ============================================================
     6) LOGOUT
  ============================================================ */
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
  }

  /* ============================================================
     INIT
  ============================================================ */
  loadUsers();
})();
