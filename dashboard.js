// dashboard.js — TANPA MODULE, sinkron dengan config.js & session.js

console.log("📄 dashboard.js loaded");

// Pastikan navbar dibuat (kalau ada fungsinya)
if (typeof createNavbar === "function") {
  createNavbar("dashboard");
}

// Ambil API dari config.js
const API_URL = window.API_URL;

// Ambil fungsi dari session.js (global)
const { getSession, clearSession, validateToken } = window;

const listEl = document.getElementById("list");
const statusEl = document.getElementById("statusMsg");

// Error jika elemen list tidak ada
if (!listEl) throw new Error("#list element required");

// ⛔ Proteksi halaman
async function protectAndGetSession() {
  const s = getSession();

  if (!s || !s.token) {
    statusEl.textContent = "Sesi tidak ditemukan, mengarahkan ke login...";
    setTimeout(() => (location.href = "login.html"), 800);
    return null;
  }

  const v = await validateToken(s.token);

  if (!v.valid) {
    clearSession();
    statusEl.textContent = "Sesi habis, mengarahkan ke login...";
    setTimeout(() => (location.href = "login.html"), 900);
    return null;
  }

  // update UI user info
  const ui = document.getElementById("userInfo");
  if (ui) {
    ui.textContent = `${v.data.name || s.name} (${v.data.role || s.role})`;
  }

  return s;
}

// 🔄 Fetch data keluarga dari GAS
async function fetchMembers() {
  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const j = await res.json();

    if (!j || j.status !== "success" || !Array.isArray(j.data)) {
      throw new Error(j.message || "Invalid response from server");
    }

    return j.data;
  } catch (err) {
    console.error("fetchMembers error", err);
    throw err;
  }
}

function driveViewUrl(url) {
  if (!url) return "";
  const m = url.match(/[-\w]{25,}/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[0]}` : url;
}

// 🎨 Render list anggota
function render(members) {
  listEl.innerHTML = "";

  if (!members || members.length === 0) {
    listEl.innerHTML = `<div class="center muted">Belum ada anggota keluarga.</div>`;
    return;
  }

  members.forEach((p) => {
    const wrapper = document.createElement("div");
    wrapper.className = "member-card";

    const img = document.createElement("img");
    img.src = p.photoURL
      ? driveViewUrl(p.photoURL)
      : "https://via.placeholder.com/60?text=No+Img";

    const info = document.createElement("div");
    info.innerHTML = `
      <div><strong>${p.name || "-"}</strong></div>
      <div class="muted">${p.relationship || ""}</div>`;

    const actions = document.createElement("div");
    actions.className = "member-actions";

    // Edit
    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-edit";
    btnEdit.textContent = "Edit";
    btnEdit.onclick = () =>
      (location.href = `edit.html?id=${encodeURIComponent(p.id)}`);

    // Delete
    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-del";
    btnDel.textContent = "Hapus";
    btnDel.onclick = () => {
      if (confirm(`Hapus ${p.name}?`)) {
        location.href = `delete.html?id=${encodeURIComponent(p.id)}`;
      }
    };

    // Detail
    const btnDetail = document.createElement("button");
    btnDetail.className = "btn";
    btnDetail.textContent = "Detail";
    btnDetail.onclick = () =>
      (location.href = `detail.html?id=${encodeURIComponent(p.id)}`);

    actions.append(btnEdit, btnDel, btnDetail);

    wrapper.append(img, info, actions);
    listEl.appendChild(wrapper);
  });
}

// 🚀 INIT
(async function init() {
  statusEl.textContent = "Memeriksa sesi...";
  const session = await protectAndGetSession();
  if (!session) return;

  statusEl.textContent = "Memuat anggota keluarga...";

  try {
    const members = await fetchMembers();
    render(members);
    statusEl.textContent = `Total anggota: ${members.length}`;
  } catch (err) {
    statusEl.textContent = "Gagal memuat data dari server.";
    listEl.innerHTML = `<div class="center muted">Tidak dapat memuat data sekarang.</div>`;
  }
})();
