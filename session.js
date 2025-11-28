// session.js — FINAL (sinkron dengan GAS)
import { API_URL } from "./config.js";

const KEY = "familyUser";

export function saveSession(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch (e) {
    console.error("saveSession error", e);
  }
}

export function getSession() {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    return JSON.parse(s);
  } catch (e) {
    console.error("getSession error", e);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.error("clearSession error", e);
  }
}

export function doLogout() {
  try {
    // best-effort notify server (fire-and-forget)
    const s = getSession();
    if (s && s.token) {
      fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(s.token)}`).catch(()=>{});
    }
  } catch(e){}
  clearSession();
  window.location.href = "login.html";
}

/**
 * validateToken(token)
 * Returns { valid: true, data: {id,name,role} }  OR { valid:false, reason }
 * Accepts GAS format: {status:"success", id, name, role}
 */
export async function validateToken(token) {
  if (!token) return { valid: false, reason: "no token" };
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) return { valid: false, reason: "network" };
    const j = await res.json();
    if (j && j.status === "success") {
      // normalize and return
      return { valid: true, data: { id: j.id || j.userId || null, name: j.name || j.user?.name || null, role: j.role || j.user?.role || "user" } };
    }
    return { valid: false, reason: j && j.message ? j.message : "invalid" };
  } catch (err) {
    console.error("validateToken error:", err);
    return { valid: false, reason: "error" };
  }
}

/* createNavbar(active)
   - will render simple top bar and a #userInfo span for name(role)
*/
export function createNavbar(active = "") {
  // avoid duplicate
  if (document.getElementById("__app_nav")) return;
  const nav = document.createElement("div");
  nav.id = "__app_nav";
  nav.style.cssText = `width:100%;background:#1976d2;color:white;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;font-weight:600;`;
  nav.innerHTML = `
    <div style="display:flex;gap:16px;align-items:center">
      <a href="dashboard.html" style="color:white;text-decoration:none;">📋 Dashboard</a>
      <a href="tree.html" style="color:white;text-decoration:none;">🌳 Tree</a>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span id="userInfo" style="opacity:0.95"></span>
      <button id="logoutBtn" style="background:#ff7043;border:0;padding:6px 12px;color:white;border-radius:6px;cursor:pointer;">🚪 Logout</button>
    </div>
  `;
  document.body.prepend(nav);
  document.getElementById("logoutBtn").addEventListener("click", doLogout);

  // highlight active
  try {
    if (active === "dashboard") nav.querySelector('a[href="dashboard.html"]').style.textDecoration = "underline";
    if (active === "tree") nav.querySelector('a[href="tree.html"]').style.textDecoration = "underline";
  } catch(e){}
}
