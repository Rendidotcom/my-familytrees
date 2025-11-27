// ===============================
// 📌 DASHBOARD.JS — FINAL VERSION
// ===============================

import { API_URL } from "./config.js";
import { requireLogin, logout, createNavbar } from "./auth.js";

let user = null;

// ========================================
// 🚀 INIT — TUNGGU DOM SIAP TERLEBIH DAHULU
// ========================================
document.addEventListener("DOMContentLoaded", () => {

  // Ambil user dari localStorage
  user = JSON.parse(localStorage.getItem("familyUser") || "null");

  if (!user || !user.token) {
    alert("⚠ Sesi tidak valid. Silakan login ulang.");
    return logout();
  }

  createNavbar("dashboard");

  validate();   // Validasi token ke GAS
  loadData();   // Load data keluarga
});


// ================================
// 🔐 VALIDASI TOKEN KE GAS
// ================================
async function validate() {
  try {
    if (!user || !user.token) return logout();

    const res = await fetch(`${API_URL}?mode=validate&token=${user.token}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("⚠ Sesi login kadaluarsa. Silakan login ulang.");
      return logout();
    }

    document.getElementById("username").textContent = user.name;

  } catch (e) {
    console.error(e);
    alert("⚠ Gagal validasi sesi.");
    logout();
  }
}


// ================================
// 🖼 CONVERT URL FOTO DRIVE
// ================================
function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/70";
  const id = url.match(/[-\w]{25,}/)?.[0];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}


// ================================
// 📂 LOAD DATA KELUARGA DARI GAS
// ================================
async function loadData() {
  const list = document.getElementById("list");
  list.innerHTML = "⏳ Memuat data...";

  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const json = await res.json();

    if (json.status !== "success") {
      list.innerHTML = "❌ Gagal memuat data.";
      return;
    }

    const data = json.data || [];

    // Urut berdasarkan orderChild
    data.sort((a, b) => Number(a.orderChild || 999) - Number(b.orderChild || 999));

    renderList(data);

  } catch (err) {
    console.error(err);
    list.innerHTML = "❌ Error koneksi!";
  }
}


// ================================
// 🎨 TAMPILKAN LIST DATA
// ================================
function renderList(data) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const idMap = Object.fromEntries(data.map(p => [p.id, p]));

  data.forEach(person => {
    const photo = convertDriveURL(person.photoURL);

    const statusTag = person.status === "meninggal"
      ? `<span class="status-tag status-dead">☠ Meninggal</span>`
      : `<span class="status-tag status-alive">🟢 Hidup</span>`;

    const orderBadge = person.orderChild
      ? `<span class="order-badge">#${person.orderChild}</span>`
      : "";

    const ayah = idMap[person.parentIdAyah]?.name || "-";
    const ibu = idMap[person.parentIdIbu]?.name || "-";
    const pasangan = idMap[person.spouseId]?.name || "-";

    const anak = data
      .filter(p => p.parentIdAyah === person.id || p.parentIdIbu === person.id)
      .map(c => c.name).join(", ") || "-";

    const pinStatus = person.pinSet
      ? `<small style="color:green;">✔ PIN Aktif</small>`
      : `<small style="color:red;">⚠ Belum Set PIN</small>`;

    const buttons =
      person.id === user.id
        ? `
          <button class="btn-detail" onclick="openDetail('${person.id}')">🔍 Detail</button>
          <button class="btn-edit" onclick="openEdit('${person.id}')">✏️ Edit</button>
          <button class="btn-del" onclick="deleteMember('${person.id}')">🗑 Hapus</button>
        `
        : `<button class="btn-detail" onclick="openDetail('${person.id}')">👁 Lihat</button>`;

    list.innerHTML += `
      <div class="member">
        <img src="${photo}" alt="${person.name}">
        <div class="member-info">
          <h4>${person.name} ${statusTag} ${orderBadge}</h4>
          <p>${person.relationship} • ${person.domisili}</p>
          <p><b>Ayah:</b> ${ayah}</p>
          <p><b>Ibu:</b> ${ibu}</p>
          <p><b>Pasangan:</b> ${pasangan}</p>
          <p><b>Anak:</b> ${anak}</p>
          <p>${pinStatus}</p>
        </div>
        <div class="member-buttons">${buttons}</div>
      </div>
    `;
  });
}


// ================================
// 🎯 BUTTON ACTION
// ================================
window.openDetail = function (id) {
  window.location.href = "detail.html?id=" + id;
};

window.openEdit = function (id) {
  if (id !== user.id) {
    alert("❌ Anda hanya dapat mengedit profil diri sendiri.");
    return;
  }
  window.location.href = "edit.html?id=" + id;
};

window.deleteMember = async function (id) {
  if (id !== user.id) {
    alert("❌ Tidak dapat menghapus akun orang lain.");
    return;
  }

  if (!confirm("⚠ Hapus akun ini? Tindakan tidak bisa dibatalkan!")) return;

  const res = await fetch(`${API_URL}?mode=delete&id=${id}`);
  const json = await res.json();

  alert("🗑 Akun berhasil dihapus.");
  localStorage.clear();
  window.location.href = "login.html";
};
