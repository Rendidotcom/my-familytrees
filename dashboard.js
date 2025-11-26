import { API_URL } from "./config.js";
import { requireLogin, logout, createNavbar } from "./auth.js";

const user = requireLogin();
createNavbar("dashboard");

// Validate Token
async function validate() {
  const res = await fetch(`${API_URL}?mode=validate&token=${user.token}`);
  const j = await res.json();

  if (j.status !== "success") {
    alert("⚠ Sesi kadaluarsa. Silakan login ulang.");
    logout();
  }
}
validate();

// Convert Google Drive → direct link
function driveURL(url) {
  if (!url) return "https://via.placeholder.com/80";
  const match = url.match(/[-\w]{25,}/);
  return match ? `https://drive.google.com/uc?id=${match[0]}` : url;
}

// Load List
async function loadData() {
  const container = document.getElementById("list");
  container.innerHTML = "⏳ Memuat...";

  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`);
    const j = await res.json();

    if (j.status !== "success") {
      container.innerHTML = "❌ Error memuat data.";
      return;
    }

    const data = j.data || [];
    const map = Object.fromEntries(data.map(p => [p.id, p]));

    let html = "";
    data.forEach(p => {

      html += `
        <div class="card">
          <img src="${driveURL(p.photoURL)}">
          <div class="info">
            <b>${p.name}</b><br>
            ${p.relationship || ""}<br>
            <small>Ayah: ${map[p.parentIdAyah]?.name || "-"}</small><br>
            <small>Ibu: ${map[p.parentIdIbu]?.name || "-"}</small><br>
          </div>

          <div class="btns">
            <button onclick="detail('${p.id}')">👁 Detail</button>
            <button onclick="edit('${p.id}')">✏️ Edit</button>
            <button onclick="hapus('${p.id}')">🗑 Hapus</button>
          </div>
        </div>`;
    });

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = "❌ Koneksi gagal.";
  }
}

window.detail = id => location.href = "detail.html?id="+id;
window.edit   = id => location.href = "edit.html?id="+id;

// Delete
window.hapus = async id => {
  if (!confirm("Yakin hapus?")) return;

  const res = await fetch(API_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ mode:"delete", id:id, token:user.token })
  });

  const j = await res.json();
  if (j.status === "success") {
    alert("🗑 Dihapus");
    loadData();
  } else alert("❌ " + j.message);
};

document.addEventListener("DOMContentLoaded", loadData);
