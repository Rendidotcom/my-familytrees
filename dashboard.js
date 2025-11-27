// dashboard.js — FINAL 2025

import { API_URL } from "./config.js";
import { getSession, clearSession, createNavbar } from "./session.js";

createNavbar("dashboard");

/* ---------------------- Session Check ---------------------- */
async function checkSession() {
  const s = getSession();
  if (!s || !s.token) {
    alert("Sesi habis, silakan login ulang.");
    window.location.href = "login.html";
    return null;
  }
  return s;
}

/* ---------------------- Load Data ---------------------- */
async function loadMembers() {
  const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, {
    cache: "no-store"
  });
  const j = await res.json();
  return j.data || [];
}

/* ---------------------- Render ---------------------- */
function render(members) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  members.forEach(p => {
    const div = document.createElement("div");
    div.className = "member";

    div.innerHTML = `
      <img src="${p.photoURL || "https://via.placeholder.com/60"}">
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="rel">${p.relationship}</div>
      </div>
      <div class="actions">
        <button onclick="window.location='edit.html?id=${p.id}'">Edit</button>
        <button onclick="window.location='delete.html?id=${p.id}'">Hapus</button>
        <button onclick="window.location='detail.html?id=${p.id}'">Detail</button>
      </div>
    `;

    list.appendChild(div);
  });
}

/* ---------------------- Init ---------------------- */
(async function init() {
  const session = await checkSession();
  if (!session) return;

  document.getElementById("userInfo").textContent =
    `${session.name} (${session.role})`;

  const members = await loadMembers();
  render(members);
})();
