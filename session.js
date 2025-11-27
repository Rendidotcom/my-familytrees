// session.js — FINAL 2025 (stabil, anti-loop login)
// Penyimpanan session: localStorage key = "session"

import { API_URL } from "./config.js";

const KEY = "session";

/* ---------------------- SESSION ---------------------- */
export function saveSession(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.error("Gagal simpan session", e); }
}

export function getSession() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    console.error("Session corrupt", e);
    return null;
  }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); }
  catch (e) { console.error("Tidak bisa hapus session", e); }
}

/* ---------------------- LOGOUT ---------------------- */
export function doLogout() {
  clearSession();
  window.location.href = "login.html";
}

/* ---------------------- VALIDATE TOKEN ---------------------- */
export async function validateToken(token) {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(token)}`, {
      cache: "no-store"
    });
    const j = await res.json();
    return j.status === "success" ? { valid: true, data: j } : { valid: false };
  } catch (e) {
    console.error("validate error:", e);
    return { valid: false };
  }
}

/* ---------------------- NAVBAR ---------------------- */
export function createNavbar(active) {
  const nav = document.createElement("div");
  nav.className = "navbar";
  nav.innerHTML = `
    <div class="left">
      <a href="dashboard.html">📋 Dashboard</a>
      <a href="tree.html">🌳 Tree</a>
    </div>

    <div class="right">
      <span id="userInfo"></span>
      <button id="logoutBtn" class="logout">Logout</button>
    </div>
  `;
  document.body.prepend(nav);

  document.getElementById("logoutBtn").onclick = doLogout;

  if (active) {
    const el = nav.querySelector(`a[href="${active}.html"]`);
    if (el) el.style.textDecoration = "underline";
  }
}
