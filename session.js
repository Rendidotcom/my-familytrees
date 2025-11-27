// session.js — helper session & navbar (module)
import { API_URL } from "./config.js";

const STORAGE_KEY = "familyUser";

/**
 * Ambil session (obj) dari localStorage.
 * Mengembalikan null kalau tidak ada.
 */
export function getSession() {
  try {
    const s = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("session") || localStorage.getItem("token");
    if (!s) return null;
    const obj = (typeof s === "string") ? JSON.parse(s) : s;
    // Normalize fields (id, name, role, token)
    return {
      id: obj.id || obj.userId || obj.user?.id || obj.userId || obj.uid || null,
      name: obj.name || obj.user?.name || obj.userName || null,
      role: obj.role || obj.user?.role || "user",
      token: obj.token || obj.accessToken || obj.sessionToken || null
    };
  } catch (e) {
    console.warn("getSession parse error", e);
    return null;
  }
}

export function saveSession(obj) {
  const normalized = {
    id: obj.id || obj.user?.id || obj.uid || "",
    name: obj.name || obj.user?.name || "",
    role: obj.role || obj.user?.role || "user",
    token: obj.token || obj.accessToken || ""
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Validate token by calling API validate endpoint.
 * returns { valid: boolean, data: serverResponseIfAny }
 */
export async function validateToken(token) {
  if (!token) return { valid: false, reason: "no-token" };
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(token)}&nocache=${Date.now()}`);
    const j = await res.json();
    if (j && j.status === "success") return { valid: true, data: j };
    return { valid: false, data: j, reason: j?.message || "invalid" };
  } catch (err) {
    return { valid: false, reason: "network", error: err };
  }
}

/**
 * Logout (call server and clear session)
 */
export async function doLogout() {
  const sess = getSession();
  try {
    if (sess && sess.token) {
      // best-effort notify server
      await fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(sess.token)}`).catch(()=>{});
    }
  } finally {
    clearSession();
    window.location.href = "login.html";
  }
}

/**
 * Render a simple navbar (insert before body content)
 */
export function createNavbar(active = "") {
  const nav = document.createElement("nav");
  nav.style.background = "#3498db";
  nav.style.padding = "10px 14px";
  nav.style.color = "white";
  nav.style.display = "flex";
  nav.style.justifyContent = "space-between";
  nav.style.alignItems = "center";
  nav.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <a href="dashboard.html" style="color:white;text-decoration:none;font-weight:bold">📋 Dashboard</a>
      <a href="tree.html" style="color:white;text-decoration:none;font-weight:bold">🌳 Tree</a>
    </div>
    <div style="display:flex;gap:12px;align-items:center">
      <span id="navUser" style="font-weight:600"></span>
      <button id="navLogoutBtn" style="background:none;border:1px solid rgba(255,255,255,0.15);color:white;padding:6px 10px;border-radius:8px;cursor:pointer">Logout</button>
    </div>
  `;
  document.body.insertAdjacentElement("afterbegin", nav);
  document.getElementById("navLogoutBtn").addEventListener("click", doLogout);

  const sess = getSession();
  if (sess && sess.name) document.getElementById("navUser").textContent = sess.name + (sess.role ? ` (${sess.role})` : "");
}
