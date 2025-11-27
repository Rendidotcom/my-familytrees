/**************************************************************
 🌳 DASHBOARD SYSTEM — FAMILY TREE 2025  
 Full fixed, stable untuk Vercel + GAS
**************************************************************/

// Ambil session dari localStorage
const session = JSON.parse(localStorage.getItem("session")) || {};
if (!session.token) {
  alert("Sesi tidak ditemukan. Silakan login ulang.");
  location.href = "login.html";
}

// Pastikan API_URL tersedia
if (typeof API_URL === "undefined" || !API_URL) {
  alert("API_URL tidak ditemukan. Pastikan config.js dimuat.");
}

// Validasi token sekali saat load
async function validateToken() {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(session.token)}`);
    if (!res.ok) throw new Error("Fetch gagal");
    const j = await res.json();

    if (j.status !== "success") {
      alert("⚠️ Sesi kadaluarsa. Silakan login ulang.");
      localStorage.removeItem("session");
      location.href = "login.html";
      return;
    }

    // Simpan role & id
    session.role = j.role;
    session.id = j.id;
    session.name = j.name;
    localStorage.setItem("session", JSON.stringify(session));

    document.getElementById("userInfo").textContent = `${session.name} (${session.role})`;

    // Setelah valid → load data
    loadData();

  } catch (e) {
    console.error(e);
    alert("❌ Kesalahan koneksi server saat validasi token.");
  }
}

// Load data anggota keluarga dari GAS
async function loadData() {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    if (!res.ok) throw new Error("Fetch gagal");
    const j = await res.json();
    if (j.status !== "success") {
      document.getElementById("list").innerHTML = "Tidak ada data.";
      return;
    }

    const data = j.data;
    let html = "";

    data.forEach(p => {
      const photo = p.photoURL || "https://via.placeholder.com/60?text=👤";
      let buttons = `<button onclick="viewDetail('${p.id}')">👁 Detail</button>`;
      if (session.role === "admin" || session.id === p.id) {
        buttons += `<button onclick="editMember('${p.id}')">✏️ Edit</button>`;
      }
      if (session.role === "admin") {
        buttons += `<button onclick="deleteMember('${p.id}')">🗑 Hapus</button>`;
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

  } catch (e) {
    console.error(e);
    document.getElementById("list").innerHTML = "❌ Kesalahan koneksi server.";
  }
}

// Navigasi halaman
window.viewDetail = id => location.href = `detail.html?id=${id}`;
window.editMember = id => location.href = `edit.html?id=${id}`;

// Hapus data (POST ke GAS)
window.deleteMember = async id => {
  if (!confirm("Hapus data ini?")) return;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode:"delete", id:id, token:session.token })
    });
    const j = await res.json();
    if (j.status === "success") {
      alert("Berhasil dihapus.");
      loadData();
    } else {
      alert("Gagal menghapus data.");
    }
  } catch(e) {
    console.error(e);
    alert("Kesalahan koneksi saat menghapus data.");
  }
}

// Mulai proses dashboard
validateToken();
