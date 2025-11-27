// =======================================================
//  DASHBOARD.JS — FINAL CLEAN 2025
//  Load data dari GAS, token tidak kadaluarsa, CORS aman
// =======================================================
export async function validateTokenAndLoad() {
  let session = JSON.parse(localStorage.getItem("familyUser") || "null");
  if (!session || !session.token) {
    console.warn("Tidak ada session.");
    location.href = "login.html";
    return;
  }

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
      console.warn("Token invalid/expired:", j);
      logout();
      return;
    }

    // update session agar token tetap valid
    session.name = j.name;
    session.role = j.role;
    session.id   = j.id;
    localStorage.setItem("familyUser", JSON.stringify(session));

    document.getElementById("userInfo").textContent = `${session.name} (${session.role})`;

    if (session.role === "admin") {
      document.getElementById("addMenu").innerHTML = `<a href="index.html">➕ Tambah</a>`;
    }

    loadData(session);

  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi ke server.");
    logout();
  }
}

// =======================================================
//  LOAD DATA
// =======================================================
async function loadData(session) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "getData", token: session.token })
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

  } catch (e) {
    console.error(e);
    document.getElementById("list").innerHTML = "❌ Gagal memuat data.";
  }
}

// =======================================================
//  AKSI NAVIGASI
// =======================================================
window.viewDetail = id => { location.href = `detail.html?id=${id}` };
window.editMember = id => { location.href = `edit.html?id=${id}` };

// =======================================================
//  HAPUS DATA
// =======================================================
window.deleteMember = async id => {
  if (!confirm("⚠️ Hapus anggota ini?")) return;

  let session = JSON.parse(localStorage.getItem("familyUser") || "null");
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "delete", id: id, token: session.token })
    });

    const j = await res.json();
    if (j.status === "success") {
      alert("🗑️ Berhasil dihapus.");
      loadData(session);
    } else {
      alert("❌ Gagal: " + (j.message || ""));
    }

  } catch (e) {
    console.error(e);
    alert("❌ Kesalahan koneksi saat menghapus data.");
  }
}

// =======================================================
//  LOGOUT
// =======================================================
function logout() {
  localStorage.removeItem("familyUser");
  location.href = "login.html";
}
window.logout = logout;
