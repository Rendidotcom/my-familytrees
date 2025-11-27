// dashboard.js — FINAL (sinkron dengan GAS Sheet1)
// - Tidak memaksa loop ke login kecuali token memang invalid
// - Tombol Edit -> edit.html?id=... (sinkron GAS)
// - Tombol Detail -> detail.html?id=...
// - Tombol Hapus -> delete.html?id=... (soft/hard sesuai flow kamu)

import { API_URL } from "./config.js";
import { getSession, clearSession, createNavbar } from "./session.js";

/* -------------------------
   Helpers
--------------------------*/

// Convert Google Drive file url -> direct view (if needed)
function driveViewUrl(url) {
  if (!url) return "";
  const m = url.match(/[-\w]{25,}/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[0]}` : url;
}

// Safe text escape to avoid XSS in inserted text nodes
function escapeText(s) {
  if (s === null || s === undefined) return "";
  return String(s);
}

/* -------------------------
   UI Setup
--------------------------*/
createNavbar("dashboard");

const listEl = document.getElementById("list");
const statusEl = document.getElementById("statusMsg");

if (!listEl) throw new Error("Element #list tidak ditemukan di halaman.");
if (!statusEl) console.warn("Element #statusMsg tidak ditemukan — status tidak akan tampil.");

/* -------------------------
   Protect / Validate Session
--------------------------*/
async function checkSessionAndToken() {
  const session = getSession();
  if (!session || !session.token) {
    // jangan auto-redirect berulang-ulang; tampilkan pesan singkat lalu redirect
    if (statusEl) statusEl.textContent = "Sesi tidak ditemukan — silakan login.";
    setTimeout(() => window.location.href = "login.html", 900);
    return null;
  }

  // Call validate endpoint directly (tolerant terhadap format response)
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
    const j = await res.json();

    // GAS variants observed:
    // - {status:"success", id, name, role}
    // - {status:"error", message:"invalid" }
    // So we treat status === "success" as valid.
    if (j && j.status === "success") {
      // normalize session fields if available
      const updated = Object.assign({}, session);
      if (j.name) updated.name = j.name;
      if (j.id) updated.id = j.id;
      if (j.role) updated.role = j.role;
      // save back to localStorage if session object exists
      try { localStorage.setItem("familyUser", JSON.stringify(updated)); } catch (e) {}
      return updated;
    } else {
      // token invalid or expired
      if (statusEl) statusEl.textContent = "Sesi kadaluarsa. Mengarahkan ke login...";
      // clear session then redirect
      clearSession();
      setTimeout(() => window.location.href = "login.html", 900);
      return null;
    }
  } catch (err) {
    console.error("validate token error:", err);
    // Jika koneksi error jangan langsung logout — beri kesempatan user melihat UI sementara
    if (statusEl) statusEl.textContent = "Gagal memeriksa sesi (koneksi). Memuat data lokal jika ada...";
    // but still return session (optimistis)
    return session;
  }
}

/* -------------------------
   Load data from GAS
   mode=getData (as implemented in your GAS)
--------------------------*/
async function fetchAllMembers() {
  // Use nocache param to avoid stale caches
  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    if (!j || j.status !== "success" || !Array.isArray(j.data)) {
      throw new Error(j && j.message ? j.message : "Response tidak valid");
    }
    return j.data;
  } catch (err) {
    console.error("fetchAllMembers error:", err);
    throw err;
  }
}

/* -------------------------
   Render list
--------------------------*/
function renderMembers(members) {
  listEl.innerHTML = "";

  if (!members || members.length === 0) {
    listEl.innerHTML = `<div class="center muted">Belum ada anggota keluarga.</div>`;
    return;
  }

  members.forEach(p => {
    const photoUrl = p.photoURL ? driveViewUrl(p.photoURL) : "https://via.placeholder.com/60?text=👤";
    const wrapper = document.createElement("div");
    wrapper.className = "member-card";

    // Build inner nodes with safe text insertion
    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = p.name || "member";

    const info = document.createElement("div");
    info.innerHTML = `<div><strong>${escapeText(p.name)}</strong></div>
                      <div class="muted">${escapeText(p.relationship || "")}</div>`;

    const actions = document.createElement("div");
    actions.className = "member-actions";

    // Edit button -> to edit.html?id=
    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-edit";
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => {
      window.location.href = `edit.html?id=${encodeURIComponent(p.id)}`;
    });

    // Delete button -> to delete.html?id=
    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-del";
    btnDel.textContent = "Hapus";
    btnDel.addEventListener("click", () => {
      if (confirm(`Hapus anggota ${p.name}?`)) {
        window.location.href = `delete.html?id=${encodeURIComponent(p.id)}`;
      }
    });

    // Detail button -> detail.html?id=
    const btnDetail = document.createElement("button");
    btnDetail.className = "btn";
    btnDetail.textContent = "Detail";
    btnDetail.addEventListener("click", () => {
      window.location.href = `detail.html?id=${encodeURIComponent(p.id)}`;
    });

    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    actions.appendChild(btnDetail);

    wrapper.appendChild(img);
    wrapper.appendChild(info);
    wrapper.appendChild(actions);

    listEl.appendChild(wrapper);
  });
}

/* -------------------------
   Init flow
--------------------------*/
(async function init() {
  // Friendly status while starting
  if (statusEl) statusEl.textContent = "Memeriksa sesi...";

  const session = await checkSessionAndToken();
  if (!session) return; // aborted (redirected) or invalid

  // Show user in navbar if possible (session.name stored)
  const userInfoSpan = document.getElementById("userInfo");
  if (userInfoSpan) userInfoSpan.textContent = session.name || (session.id || "User");

  if (statusEl) statusEl.textContent = "Memuat anggota...";

  try {
    const members = await fetchAllMembers();
    renderMembers(members);
    if (statusEl) statusEl.textContent = `Total anggota: ${members.length}`;
  } catch (err) {
    if (statusEl) statusEl.textContent = "Gagal memuat data. Cek koneksi atau server.";
    // show fallback empty list
    listEl.innerHTML = `<div class="center muted">Tidak dapat memuat data sekarang.</div>`;
  }
})();
