// =============================
// dashboard.js — FINAL WORKING
// =============================

// Ambil API dari config.js (GLOBAL)
const API_URL = window.API_URL;

// Ambil session functions dari session.js (GLOBAL)
const { getSession, validateToken, clearSession } = window;

console.log("📌 dashboard.js loaded, API =", API_URL);

// UI elements
const statusMsg = document.getElementById("statusMsg");
const listEl = document.getElementById("list");

// =====================
// 1) PROTECT SESSION
// =====================
async function protect() {
  const s = getSession();
  if (!s || !s.token) {
    statusMsg.textContent = "Sesi hilang. Mengalihkan ke login...";
    setTimeout(() => location.href = "login.html", 800);
    return null;
  }

  statusMsg.textContent = "Memvalidasi sesi...";

  const v = await validateToken(s.token);
  if (!v.valid) {
    clearSession();
    statusMsg.textContent = "Sesi kadaluarsa. Login ulang...";
    setTimeout(() => location.href = "login.html", 900);
    return null;
  }

  // tampilkan user info di dashboard
  statusMsg.textContent = `Halo, ${v.data.name || "pengguna"} (${v.data.role})`;

  return s;
}

// =====================
// 2) LOAD DATA ANGGOTA
// =====================
async function fetchMembers() {
  statusMsg.textContent = "Mengambil data keluarga...";

  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, {
      cache: "no-store"
    });
    const j = await res.json();

    if (j.status !== "success") {
      statusMsg.textContent = "Gagal mengambil data dari server.";
      return [];
    }

    return j.data;
  } catch (err) {
    console.error("fetchMembers error:", err);
    statusMsg.textContent = "Gagal koneksi ke server.";
    return [];
  }
}

// =====================
// 3) RENDER LIST
// =====================
function renderList(members) {
  listEl.innerHTML = "";

  if (!members || members.length === 0) {
    listEl.innerHTML = `<div class="center muted">Tidak ada data.</div>`;
    return;
  }

  members.forEach(m => {
    const card = document.createElement("div");
    card.className = "member-card";

    let photoUrl = "https://via.placeholder.com/80"; // default
    if (m.photoURL) {
      const match = m.photoURL.match(/[-\w]{25,}/);
      if (match) {
        photoUrl = `https://drive.google.com/uc?export=view&id=${match[0]}`;
      }
    }

    card.innerHTML = `
      <img src="${photoUrl}" alt="">
      <div>
        <div><strong>${m.name}</strong></div>
        <div class="muted">ID: ${m.id}</div>
      </div>
      <div class="member-actions">
        <a href="edit.html?id=${m.id}">
          <button class="btn btn-edit">Edit</button>
        </a>
      </div>
    `;

    listEl.appendChild(card);
  });
}

// =====================
// 4) INIT
// =====================
(async function init() {
  statusMsg.textContent = "Memeriksa sesi...";

  const s = await protect();
  if (!s) return;

  const members = await fetchMembers();
  renderList(members);

  statusMsg.textContent = "Data berhasil dimuat.";
})();
