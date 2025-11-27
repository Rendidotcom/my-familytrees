// ============================
// Dashboard JS — Family Tree 2025
// ============================

// Ambil session dari localStorage
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("Sesi tidak ditemukan. Silakan login ulang.");
  location.href = "login.html";
}

// Tampilkan nama user sementara
document.getElementById("userInfo").textContent = "Memuat...";

// Tombol logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("familyUser");
  location.href = "login.html";
});

// Tambahkan menu tambah jika admin
function renderAddMenu() {
  if (session.role === "admin") {
    document.getElementById("addMenu").innerHTML = `<a href="index.html">➕ Tambah</a>`;
  }
}

// ============================
// Validasi token
// ============================
async function validateToken() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({mode:"validateToken", token: session.token, id: session.id})
    });
    const j = await res.json();

    if (j.status !== "success") {
      alert("Sesi kadaluarsa. Silakan login ulang.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    // Update session agar selalu fresh
    session.name = j.name;
    session.role = j.role;
    session.id   = j.id;
    localStorage.setItem("familyUser", JSON.stringify(session));

    document.getElementById("userInfo").textContent = `${session.name} (${session.role})`;
    renderAddMenu();
    loadData();

  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi server.");
  }
}

// ============================
// Load data keluarga
// ============================
async function loadData() {
  try {
    const res = await fetch(API_URL, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({mode:"getData", token: session.token})
    });

    const j = await res.json();
    if (j.status !== "success") {
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
          <div>${buttons}</div>
        </div>
      `;
    });

    document.getElementById("list").innerHTML = html;

  } catch(e) {
    console.error(e);
    document.getElementById("list").innerHTML = "❌ Kesalahan koneksi server.";
  }
}

// ============================
// Aksi tombol
// ============================
window.viewDetail = function(id) { location.href=`detail.html?id=${id}`; };
window.editMember = function(id) { location.href=`edit.html?id=${id}`; };
window.deleteMember = async function(id) {
  if (!confirm("⚠️ Hapus anggota ini?")) return;
  try {
    const res = await fetch(API_URL, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({mode:"delete", token: session.token, id:id})
    });
    const j = await res.json();
    if (j.status==="success") {
      alert("🗑️ Berhasil dihapus.");
      loadData();
    } else {
      alert("❌ Gagal dihapus: "+(j.message||""));
    }
  } catch(e) {
    console.error(e);
    alert("❌ Kesalahan koneksi saat menghapus.");
  }
};

// ============================
// Mulai proses
// ============================
validateToken();
