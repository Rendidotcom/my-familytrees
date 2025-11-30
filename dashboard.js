// dashboard.js — FINAL NON-MODULE
console.log("📄 dashboard.js loaded");

// Ambil API dari config.js
const API_URL = window.API_URL;
console.log("➡ Dashboard pakai API_URL =", API_URL);

// Ambil fungsi dari session.js
const { getSession, clearSession, validateToken, createNavbar } = window;
createNavbar("dashboard");

const listEl = document.getElementById("list");
const statusEl = document.getElementById("statusMsg");

async function protectAndGetSession() {
  const s = getSession();

  if (!s || !s.token) {
    statusEl.textContent = "Sesi tidak ditemukan, mengarahkan ke login...";
    setTimeout(() => (location.href = "login.html"), 700);
    return null;
  }

  const v = await validateToken(s.token);

  if (!v.valid) {
    clearSession();
    statusEl.textContent = "Sesi habis, mengarahkan ke login...";
    setTimeout(() => (location.href = "login.html"), 900);
    return null;
  }

  const ui = document.getElementById("userInfo");
  if (ui) ui.textContent = `${v.data.name} (${v.data.role})`;

  return s;
}

async function fetchMembers() {
  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const j = await res.json();

    if (!j || j.status !== "success") {
      throw new Error(j.message || "Invalid response");
    }

    return j.data;
  } catch (err) {
    console.error("❌ fetchMembers:", err);
    throw err;
  }
}

function driveViewUrl(url) {
  if (!url) return "";
  const m = url.match(/[-\w]{25,}/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[0]}` : url;
}

function render(members) {
  listEl.innerHTML = "";

  if (!members || members.length === 0) {
    listEl.innerHTML = `<div class="center muted">Belum ada anggota.</div>`;
    return;
  }

  members.forEach((p) => {
    const wrapper = document.createElement("div");
    wrapper.className = "member-card";

    const img = document.createElement("img");
    img.src = p.photoURL ? driveViewUrl(p.photoURL) : "https://via.placeholder.com/60?text=No+Img";

    const info = document.createElement("div");
    info.innerHTML = `
        <div><strong>${p.name}</strong></div>
        <div class="muted">${p.relationship || ""}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "member-actions";

    // Edit
    const bE = document.createElement("button");
    bE.className = "btn btn-edit";
    bE.textContent = "Edit";
    bE.onclick = () => (location.href = `edit.html?id=${encodeURIComponent(p.id)}`);

    // Delete
    const bD = document.createElement("button");
    bD.className = "btn btn-del";
    bD.textContent = "Hapus";
    bD.onclick = () => {
      if (confirm(`Hapus ${p.name}?`)) {
        location.href = `delete.html?id=${encodeURIComponent(p.id)}`;
      }
    };

    // Detail
    const bDetail = document.createElement("button");
    bDetail.className = "btn";
    bDetail.textContent = "Detail";
    bDetail.onclick = () => (location.href = `detail.html?id=${encodeURIComponent(p.id)}`);

    actions.append(bE, bD, bDetail);

    wrapper.append(img, info, actions);
    listEl.appendChild(wrapper);
  });
}

(async function init() {
  statusEl.textContent = "Memeriksa sesi...";
  const s = await protectAndGetSession();
  if (!s) return;

  statusEl.textContent = "Memuat data...";

  try {
    const members = await fetchMembers();
    render(members);
    statusEl.textContent = `Total: ${members.length}`;
  } catch (err) {
    statusEl.textContent = "Gagal memuat data!";
    listEl.innerHTML = `<div class="center muted">Tidak dapat memuat data.</div>`;
  }
})();
