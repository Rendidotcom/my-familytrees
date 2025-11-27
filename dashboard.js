/**************************************************
 *  DASHBOARD.JS — FINAL CLEAN (SYNC GAS 2025)
 **************************************************/

// ==========================
// 🔧 CONFIG API
// ==========================
const API_URL =
  "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";


// ==========================
// 🔐 LOAD SESSION
// ==========================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠ Anda harus login terlebih dahulu.");
  location.href = "login.html";
}


// ==========================
// 🔐 VALIDATE TOKEN KE GAS
// ==========================
async function validateToken() {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const json = await res.json();

    if (json.status !== "success") {
      alert("⚠ Sesi Anda kadaluarsa. Silakan login ulang.");
      logout();
      return false;
    }

    // Update session (role & id bisa berubah)
    session.id = json.id;
    session.role = json.role;
    session.name = json.name;

    localStorage.setItem("familyUser", JSON.stringify(session));

    document.getElementById("userInfo").textContent =
      `${session.name} (${session.role})`;

    // Admin punya menu tambah
    if (session.role === "admin") {
      document.getElementById("addMenu").innerHTML =
        `<a href="index.html">➕ Tambah</a>`;
    }

    return true;

  } catch (err) {
    console.error("Validate error:", err);
    alert("Gagal validasi token ke server.");
    logout();
    return false;
  }
}


// ==========================
// 📦 LOAD DATA KELUARGA
// ==========================
async function loadData() {
  const ok = await validateToken();
  if (!ok) return;

  const list = document.getElementById("list");
  list.innerHTML = "⏳ Memuat data...";

  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`);
    const json = await res.json();

    if (json.status !== "success") {
      list.innerHTML = "❌ Tidak ada data tersedia.";
      return;
    }

    renderList(json.data);

  } catch (err) {
    console.error(err);
    list.innerHTML = "❌ Error memuat data.";
  }
}


// ==========================
// 🎨 RENDER LIST KELUARGA
// ==========================
function renderList(data) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    list.innerHTML = "⚠ Data kosong.";
    return;
  }

  let html = "";

  data.forEach(p => {
    const photo = p.photoURL
      ? convertDriveURL(p.photoURL)
      : "https://via.placeholder.com/60";

    // Membuat tombol aksi
    let buttons = `
      <button class="btn btn-detail" onclick="viewDetail('${p.id}')">👁 Detail</button>
    `;

    // Admin boleh edit siapa saja – user hanya dapat edit dirinya
    if (session.role === "admin" || session.id === p.id) {
      buttons += `
        <button class="btn btn-edit" onclick="editMember('${p.id}')">✏️ Edit</button>
      `;
    }

    // Admin boleh hapus
    if (session.role === "admin") {
      buttons += `
        <button class="btn btn-delete" onclick="deleteMember('${p.id}')">🗑 Hapus</button>
      `;
    }

    html += `
      <div class="card">
        <img src="${photo}" alt="${p.name}">
        <div>
          <b>${p.name}</b><br>
          ${p.relationship || ""}
        </div>
        <div style="min-width:120px;">${buttons}</div>
      </div>
    `;
  });

  list.innerHTML = html;
}


// ==========================
// 🖼 KONVERSI FOTO DRIVE
// ==========================
function convertDriveURL(url) {
  const id = url.match(/[-\w]{25,}/)?.[0];
  return id
    ? `https://drive.google.com/uc?export=view&id=${id}`
    : url;
}


// ==========================
// 🔘 ACTION BUTTONS
// ==========================
function viewDetail(id) {
  location.href = `detail.html?id=${id}`;
}

function editMember(id) {
  location.href = `edit.html?id=${id}`;
}

async function deleteMember(id) {
  if (!confirm("⚠ Yakin ingin menghapus anggota ini?")) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: id,
        token: session.token
      })
    });

    const json = await res.json();

    if (json.status === "success") {
      alert("🗑 Data berhasil dihapus.");
      loadData();
    } else {
      alert("❌ Gagal menghapus data.");
    }

  } catch (err) {
    alert("❌ Error koneksi.");
  }
}


// ==========================
// 🚪 LOGOUT
// ==========================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}


// ==========================
// ▶ MULAI LOAD DATA
// ==========================
loadData();
