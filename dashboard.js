/**************************************************************
 🌳 DASHBOARD SYSTEM — FAMILY TREE 2025  
 Full fixed, stable untuk Vercel + GAS
**************************************************************/

// Pastikan API_URL tersedia
if (typeof API_URL === "undefined" || !API_URL) {
  alert("API_URL tidak ditemukan. Pastikan config.js atau login.js dimuat.");
}

// ------------------------------------------
// 🔐 Ambil Session
// ------------------------------------------
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("Sesi tidak ditemukan. Silakan login ulang.");
  location.href = "login.html";
}

// ------------------------------------------
// 🔍 VALIDASI TOKEN (tidak kadaluarsa)
// ------------------------------------------
async function validateToken() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "validateToken", token: session.token })
    });

    if (!res.ok) throw new Error("Fetch gagal");

    const j = await res.json();

    if (j.status !== "success") {
      alert("⚠️ Sesi kadaluarsa. Silakan login ulang.");
      logout();
      return;
    }

    // update session info
    session.name = j.name;
    session.role = j.role;
    session.id   = j.id;
    localStorage.setItem("familyUser", JSON.stringify(session));

    document.getElementById("userInfo").textContent =
      `${session.name} (${session.role})`;

    // jika admin, tampilkan menu tambah
    if (session.role === "admin") {
      const addMenu = document.getElementById("addMenu");
      if(addMenu) addMenu.innerHTML = `<a href="index.html">➕ Tambah</a>`;
    }

    loadData();

  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi server saat validasi token.");
    logout();
  }
}

// ------------------------------------------
// 📥 LOAD DATA KELUARGA
// ------------------------------------------
async function loadData() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "getData", token: session.token })
    });

    if (!res.ok) throw new Error("Fetch gagal");

    const j = await res.json();

    if (j.status !== "success" || !j.data || j.data.length === 0) {
      document.getElementById("list").innerHTML = "⚠️ Tidak ada data keluarga.";
      return;
    }

    let html = "";
    j.data.forEach(p => {
      const photo = p.photoURL || "https://via.placeholder.com/60?text=👤";

      let buttons = `<button class="btn btn-detail" onclick="viewDetail('${p.id}')">👁 Detail</button>`;

      if (session.role === "admin" || session.id === p.id) {
        buttons += `<button class="btn btn-edit" onclick="editMember('${p.id}')">✏️ Edit</button>`;
      }

      if (session.role === "admin") {
        buttons += `<button class="btn btn-delete" onclick="deleteMember('${p.id}')">🗑️ Hapus</button>`;
      }

      html += `
        <div class="card">
          <img src="${photo}">
          <div><b>${p.name}</b><br>${p.relationship || ""}</div>
          <div style="min-width:120px;">${buttons}</div>
        </div>
      `;
    });

    document.getElementById("list").innerHTML = html;

  } catch (err) {
    console.error(err);
    document.getElementById("list").innerHTML = "❌ Kesalahan koneksi server saat memuat data.";
  }
}

// ------------------------------------------
// 👉 NAVIGASI HALAMAN
// ------------------------------------------
function viewDetail(id) {
  location.href = `detail.html?id=${id}`;
}

function editMember(id) {
  location.href = `edit.html?id=${id}`;
}

// ------------------------------------------
// 🗑 HAPUS DATA
// ------------------------------------------
async function deleteMember(id) {
  if (!confirm("⚠️ Hapus anggota ini?")) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "delete", id: id, token: session.token })
    });

    const j = await res.json();

    if (j.status === "success") {
      alert("🗑️ Berhasil dihapus.");
      loadData();
    } else {
      alert("❌ Gagal menghapus data: " + (j.message || ""));
    }

  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi saat menghapus data.");
  }
}

// ------------------------------------------
// 🚪 LOGOUT
// ------------------------------------------
function logout() {
  localStorage.removeItem("familyUser");
  location.href = "login.html";
}

// ------------------------------------------
// 🚀 MULAI DASHBOARD
// ------------------------------------------
document.addEventListener("DOMContentLoaded", validateToken);
