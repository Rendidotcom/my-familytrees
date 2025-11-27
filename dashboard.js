// ============================
//  DASHBOARD.JS — FINAL STABLE
// ============================

// Pastikan navbar muncul
createNavbar();

// Pastikan API_URL sudah didefinisikan global (di config.js)
console.log("Dashboard loaded, API:", API_URL);

// Cek session token
const token = localStorage.getItem("token");
if (!token) {
  // Jika belum login → lempar ke login
  location.href = "index.html";
}

// ============================
// LOAD DATA FAMILY MEMBERS
// ============================
async function loadFamily() {
  const container = document.getElementById("familyList");
  container.innerHTML = `<p>Loading data...</p>`;

  try {
    const res = await fetch(`${API_URL}?mode=getAll`, {
      headers: { Authorization: token }
    });

    const j = await res.json();
    console.log("Response getAll:", j);

    if (j.status !== "success") {
      container.innerHTML = `<p>Gagal memuat data.</p>`;
      return;
    }

    let html = "";
    j.data.forEach((p) => {
      html += `
        <div class="card-item">
          <div>
            <b>${p.name}</b><br>
            <small>${p.relationship ?? ""}</small>
          </div>

          <div class="actions">
            <button onclick="gotoDetail('${p.id}')">Detail</button>
            <button onclick="gotoEdit('${p.id}')">Edit</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html || `<p>Belum ada data.</p>`;

  } catch (err) {
    console.error("Error loadFamily:", err);
    container.innerHTML = `<p>Error saat memuat data.</p>`;
  }
}

// ============================
// NAVIGASI DETAIL + EDIT
// ============================
function gotoDetail(id) {
  location.href = `detail.html?id=${id}`;
}

function gotoEdit(id) {
  // FIX TERPENTING — kirim ID benar
  location.href = `edit.html?id=${id}`;
}

// ============================
// LOGOUT
// ============================
window.logoutUser = function () {
  localStorage.removeItem("token");
  location.href = "index.html";
};

// START
loadFamily();
