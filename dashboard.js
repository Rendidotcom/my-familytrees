// ===============================
// DASHBOARD SYSTEM — FAMILY TREE 2025
// Full fixed: validasi token tidak kadaluarsa, load data GAS Sheet1, CORS aman
// ===============================

// ---------------------------
// NAVBAR
// ---------------------------
function createNavbar() {
  const nav = document.getElementById("navbar");
  nav.innerHTML = `
    <a href="dashboard.html">Dashboard</a> |
    <a href="#" id="logoutBtn">Logout</a>
  `;
  document.getElementById("logoutBtn").addEventListener("click", logout);
}
createNavbar();

// ---------------------------
// Ambil session
// ---------------------------
const session = JSON.parse(localStorage.getItem("session")) || {};

if (!session.token) {
  alert("Sesi tidak ditemukan. Silakan login ulang.");
  location.href = "login.html";
}

// ---------------------------
// Validasi token
// ---------------------------
async function validateToken() {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(session.token)}`);
    if (!res.ok) throw new Error("Fetch gagal");

    const j = await res.json();
    if (j.status !== "success") {
      alert("⚠️ Sesi kadaluarsa. Silakan login ulang.");
      logout();
      return;
    }

    // Update session
    session.role = j.role;
    session.id = j.id;
    localStorage.setItem("session", JSON.stringify(session));

    document.getElementById("userInfo").textContent = `${j.name} (${j.role})`;

    // Load data
    loadData();

  } catch (e) {
    console.error(e);
    alert("❌ Kesalahan koneksi server saat validasi token.");
  }
}

// ---------------------------
// Load data keluarga
// ---------------------------
async function loadData() {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    if (!res.ok) throw new Error("Fetch gagal");

    const j = await res.json();
    if (j.status !== "success" || !j.data.length) {
      document.getElementById("list").innerHTML = "Tidak ada data.";
      return;
    }

    const data = j.data;
    const list = document.getElementById("list");
    list.innerHTML = "";

    data.forEach(p => {
      const photo = p.photoURL || "https://via.placeholder.com/60?text=👤";
      const card = document.createElement("div");
      card.className = "card";

      let buttons = `<button onclick="viewDetail('${p.id}')">👁 Detail</button>`;
      if (session.role === "admin" || session.id === p.id) {
        buttons += `<button onclick="editMember('${p.id}')">✏️ Edit</button>`;
      }
      if (session.role === "admin") {
        buttons += `<button onclick="deleteMember('${p.id}')">🗑 Hapus</button>`;
      }

      card.innerHTML = `
        <img src="${photo}">
        <div><b>${p.name}</b><br>${p.relationship || ""}</div>
        <div>${buttons}</div>
      `;

      list.appendChild(card);
    });

  } catch (e) {
    console.error(e);
    document.getElementById("list").innerHTML = "❌ Kesalahan koneksi server.";
  }
}

// ---------------------------
// Navigasi halaman
// ---------------------------
function viewDetail(id) { location.href = `detail.html?id=${id}`; }
function editMember(id) { location.href = `edit.html?id=${id}`; }

// ---------------------------
// Hapus data
// ---------------------------
async function deleteMember(id) {
  if (!confirm("Hapus data ini?")) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id,
        token: session.token
      })
    });
    const j = await res.json();
    if (j.status === "success") {
      alert("Berhasil dihapus.");
      loadData();
    } else {
      alert("Gagal menghapus data.");
    }
  } catch (e) {
    console.error(e);
    alert("Kesalahan koneksi saat menghapus data.");
  }
}

// ---------------------------
// Logout
// ---------------------------
function logout() {
  localStorage.removeItem("session");
  location.href = "login.html";
}

// ---------------------------
// Mulai dashboard
// ---------------------------
validateToken();
