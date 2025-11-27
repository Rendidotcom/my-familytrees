// =======================================================
// 🌳 DASHBOARD FINAL 2025
// Memanggil GAS Sheet1, token tidak kadaluarsa, data muncul
// =======================================================

// Ambil session dari localStorage (sesuai login yang berhasil)
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠️ Tidak ada session. Silakan login ulang.");
  location.href = "login.html";
}

// Update menu tambah jika admin
function setupMenu() {
  if (session.role === "admin") {
    document.getElementById("addMenu").innerHTML =
      `<a href="index.html">➕ Tambah</a>`;
  }
}
setupMenu();

// =======================================================
// VALIDASI TOKEN (tidak kadaluarsa)
// =======================================================
async function validateToken() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "validateToken",
        token: session.token,
        id: session.id
      })
    });
    const j = await res.json();

    if (j.status !== "success") {
      alert("⚠️ Sesi kadaluarsa. Silakan login ulang.");
      logout();
      return;
    }

    // Update info session
    session.name = j.name;
    session.role = j.role;
    session.id   = j.id;
    localStorage.setItem("familyUser", JSON.stringify(session));

    document.getElementById("userInfo").textContent =
      `${session.name} (${session.role})`;

    // Load data keluarga
    loadData();

  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi server.");
    logout();
  }
}

// =======================================================
// LOAD DATA KELUARGA
// =======================================================
async function loadData() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "getData",
        token: session.token
      })
    });

    const j = await res.json();

    if (j.status !== "success" || !j.data || !j.data.length) {
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
        buttons += `<button class="btn btn-delete" onclick="deleteMember('${p.id}')">🗑 Hapus</button>`;
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
    document.getElementById("list").innerHTML =
      "❌ Kesalahan koneksi server.";
  }
}

// =======================================================
// BUTTON ACTIONS
// =======================================================
function viewDetail(id) { location.href = `detail.html?id=${id}`; }
function editMember(id) { location.href = `edit.html?id=${id}`; }

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
      alert("❌ Gagal dihapus: " + (j.message || ""));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi server saat menghapus.");
  }
}

// =======================================================
// LOGOUT
// =======================================================
function logout() {
  localStorage.removeItem("familyUser");
  location.href = "login.html";
}

// =======================================================
// INIT
// =======================================================
validateToken();
