// delete.js — FINAL VERSION (Admin full delete, User self-delete only)
(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;
  if (typeof createNavbar === "function") createNavbar();

  const msg = document.getElementById("msg");
  const btnDelete = document.getElementById("btnDelete");
  const btnLogout = document.getElementById("btnLogout");

  function getIdFromUrl() {
    return new URLSearchParams(location.search).get("id");
  }

  // -------------------------------
  // PROTECT SESSION
  // -------------------------------
  async function protect() {
    const s = getSession ? getSession() : JSON.parse(localStorage.getItem("familyUser") || "null");
    if (!s || !s.token) {
      msg.textContent = "Sesi hilang";
      setTimeout(() => (location.href = "login.html"), 700);
      return null;
    }

    if (typeof validateToken === "function") {
      const v = await validateToken(s.token);
      if (!v || !v.valid) {
        if (typeof clearSession === "function") clearSession();
        setTimeout(() => (location.href = "login.html"), 700);
        return null;
      }
    }
    return s;
  }

  // ------------------------------------
  // Helper for safe JSON fetch
  // ------------------------------------
  async function tryFetchJson(url, opts = {}) {
    try {
      const r = await fetch(url, opts);
      return await r.json();
    } catch (e) {
      return { status: "error", message: String(e) };
    }
  }

  // ------------------------------------
  // DELETE API variants support
  // ------------------------------------
  async function tryDeleteVariants(idValue, token) {
    const urls = [
      `${API_URL}?mode=deleteMember&id=${idValue}&token=${token}`,
      `${API_URL}?mode=delete&id=${idValue}&token=${token}`,
      `${API_URL}?action=delete&id=${idValue}&token=${token}`,
      `${API_URL}?mode=hardDelete&id=${idValue}&token=${token}`,
      `${API_URL}?id=${idValue}&mode=delete&token=${token}`,
    ];

    for (const u of urls) {
      const j = await tryFetchJson(u);
      if (j && (j.status === "success" || j.status === "ok")) return { ok: true, result: j };
    }

    const bodies = [
      { mode: "delete", id: idValue, token },
      { mode: "deleteMember", id: idValue, token },
      { mode: "hardDelete", id: idValue, token },
      { action: "delete", id: idValue, token },
    ];

    for (const body of bodies) {
      try {
        const r = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await r.json();
        if (j && (j.status === "success" || j.status === "ok")) return { ok: true, result: j };
      } catch (e) {}
    }

    return { ok: false };
  }

  // ------------------------------------
  // DELETE BUTTON ACTION
  // ------------------------------------
  btnDelete.addEventListener("click", async () => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    const s = await protect();
    if (!s) return;

    const targetId = getIdFromUrl();
    if (!targetId) {
      msg.textContent = "ID tidak ditemukan";
      return;
    }

    msg.textContent = "Menghapus...";

    const res = await tryDeleteVariants(targetId, s.token);

    if (!res.ok) {
      msg.textContent = "Gagal menghapus: API tidak merespon success";
      return;
    }

    // --------------------------
    // If user deletes himself
    // --------------------------
    if (String(s.id) === String(targetId) && s.role !== "admin") {
      msg.textContent = "Akun Anda dihapus. Logout...";

      setTimeout(() => {
        if (typeof clearSession === "function") clearSession();
        else localStorage.removeItem("familyUser");
        location.href = "login.html";
      }, 800);
      return;
    }

    // --------------------------
    // Admin deleting others
    // --------------------------
    msg.textContent = "Berhasil dihapus";
    setTimeout(() => (location.href = "dashboard.html"), 800);
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (typeof clearSession === "function") clearSession();
      else localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
  }
})();
