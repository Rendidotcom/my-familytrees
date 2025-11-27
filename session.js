// session.js (clean fixed)
import { API_URL } from "./config.js";

/* -------------------------------------------------------
   UTIL: SESSION STORAGE
------------------------------------------------------- */

export function saveSession(data) {
  localStorage.setItem("familyUser", JSON.stringify(data));
}

export function getSession() {
  const s = localStorage.getItem("familyUser");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("familyUser");
}

/* -------------------------------------------------------
   LOGOUT
------------------------------------------------------- */

export function doLogout() {
  clearSession();
  window.location.href = "login.html";
}

/* -------------------------------------------------------
   TOKEN VALIDATION (via Google Apps Script)
------------------------------------------------------- */

export async function validateToken(token) {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(token)}`);
    if (!res.ok) return { valid: false };

    const j = await res.json();
    if (j.status === "success" && j.valid === true) {
      return { valid: true, data: j.data };
    }
    return { valid: false };
  } catch (err) {
    console.error("validateToken error:", err);
    return { valid: false };
  }
}

/* -------------------------------------------------------
   NAVBAR RENDER
------------------------------------------------------- */

export function createNavbar(active) {
  const nav = document.createElement("div");
  nav.style.width = "100%";
  nav.style.background = "#1976d2";
  nav.style.color = "white";
  nav.style.padding = "12px 16px";
  nav.style.display = "flex";
  nav.style.alignItems = "center";
  nav.style.boxSizing = "border-box";
  nav.style.fontWeight = "600";
  nav.style.fontSize = "16px";
  nav.style.justifyContent = "space-between";

  nav.innerHTML = `
    <div style="display:flex;gap:16px;align-items:center">
      <a href="dashboard.html" style="color:white;text-decoration:none;">📋 Dashboard</a>
      <a href="tree.html" style="color:white;text-decoration:none;">🌳 Tree</a>
    </div>

    <div style="display:flex;align-items:center;gap:16px">
      <span id="userInfo" style="font-weight:400;opacity:0.9"></span>
      <button id="logoutBtn"
              style="background:#ff7043;border:0;padding:6px 12px;color:white;border-radius:6px;cursor:pointer;">
        🚪 Logout
      </button>
    </div>
  `;

  document.body.prepend(nav);

  document.getElementById("logoutBtn").addEventListener("click", doLogout);

  // highlight active menu
  if (active === "dashboard") nav.querySelector('a[href="dashboard.html"]').style.textDecoration = "underline";
  if (active === "tree") nav.querySelector('a[href="tree.html"]').style.textDecoration = "underline";
}