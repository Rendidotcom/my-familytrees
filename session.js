// session.js — non-module (HARUS load setelah config.js)
(function () {

  // Pastikan API_URL tersedia
  const API_URL = window.API_URL;
  if (!API_URL) console.error("❌ ERROR: window.API_URL belum ter-define. Pastikan config.js sudah load lebih dulu.");

  const KEY = "familyUser"; // key localStorage

  /* ================================
     Local Storage Session
  ================================== */
  function saveSession(obj) {
    try {
      localStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {
      console.error("saveSession error:", e);
    }
  }

  function getSession() {
    try {
      const s = localStorage.getItem(KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      console.error("getSession error:", e);
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      console.error("clearSession error:", e);
    }
  }

  /* ================================
     VALIDATE TOKEN ke GAS
  ================================== */
  async function validateToken(token) {
    if (!token) return { valid: false, reason: "no token" };

    try {
      const res = await fetch(
        `${API_URL}?mode=validate&token=${encodeURIComponent(token)}`,
        { method: "GET", cache: "no-store" }
      );

      if (!res.ok) {
        return { valid: false, reason: "network" };
      }

      const j = await res.json().catch(() => null);
      if (!j) return { valid: false, reason: "response parse" };

      if (j.status === "success") {
        return {
          valid: true,
          data: {
            id: j.id || null,
            name: j.name || null,
            role: j.role || "user"
          }
        };
      }

      return { valid: false, reason: j.message || "invalid" };

    } catch (err) {
      console.error("validateToken error:", err);
      return { valid: false, reason: "error" };
    }
  }

  /* ================================
     LOGOUT — Hapus session + ping GAS
  ================================== */
  function doLogout() {
    try {
      const s = getSession();
      if (s && s.token) {
        fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(s.token)}`)
          .catch(() => { /* ignore error */ });
      }
    } catch (e) {
      console.error("logout error:", e);
    }

    clearSession();
    window.location.href = "login.html";
  }

  /* ================================
     NAVBAR DINAMIS
  ================================== */
  function createNavbar(active) {
    // Jangan duplikasi jika sudah ada
    if (document.getElementById("__app_nav")) return;

    const nav = document.createElement("div");
    nav.id = "__app_nav";
    nav.style.cssText = `
      width:100%;
      background:#1976d2;
      color:#fff;
      padding:10px 16px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      box-sizing:border-box;
    `;

    nav.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <a href="dashboard.html" style="color:white;text-decoration:none">📋 Dashboard</a>
        <a href="tree.html" style="color:white;text-decoration:none">🌳 Tree</a>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <span id="userInfo" style="font-weight:600"></span>
        <button id="logoutBtn"
          style="
            background:#ff7043;
            border:0;
            padding:6px 10px;
            border-radius:6px;
            color:white;
            cursor:pointer;
          ">🚪 Logout</button>
      </div>
    `;

    document.body.prepend(nav);

    // Tambah event logout
    const logoutBtn = nav.querySelector("#logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", doLogout);

    // Highlight active menu
    try {
      if (active === "dashboard") {
        nav.querySelector('a[href="dashboard.html"]').style.textDecoration = "underline";
      }
      if (active === "tree") {
        nav.querySelector('a[href="tree.html"]').style.textDecoration = "underline";
      }
    } catch (e) {
      console.warn("Navbar highlight error", e);
    }
  }

  /* ================================
     Export ke window
  ================================== */
  window.saveSession = saveSession;
  window.getSession = getSession;
  window.clearSession = clearSession;
  window.validateToken = validateToken;
  window.doLogout = doLogout;
  window.createNavbar = createNavbar;

  console.log("📡 session.js loaded (clean, stable)");

})();
