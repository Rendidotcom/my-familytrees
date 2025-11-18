// =======================
// URL Web App GAS
// =======================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

// =======================
// LOAD DATA
// =======================
async function loadData() {
  const container = document.getElementById("listContainer");
  container.innerHTML = "Memuat data...";

  try {
    const res = await fetch(GAS_URL + "?action=getAll");
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      container.innerHTML = "<p>Belum ada data</p>";
      return;
    }

    let html = "";
    json.data.forEach(item => {
      const photoURL = item.photoId
        ? `https://drive.google.com/uc?export=view&id=${item.photoId}`
        : "https://via.placeholder.com/70";

      html += `
        <div class="itemCard">
          <img src="${photoURL}" class="photo"/>
          <div class="info">
            <h3>${item.name}</h3>
            <p>Domisili: ${item.domisili}</p>
            <p>Hubungan: ${item.relationship}</p>
          </div>
          <div class="buttons">
            <button onclick="openDetail('${item.id}')">Detail</button>
            <button onclick="openEdit('${item.id}')">Edit</button>
            <button onclick="deleteItem('${item.id}')">Hapus</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error("Gagal memuat data:", err);
    container.innerHTML = "<p>Gagal memuat data</p>";
  }
}

// =======================
// NAVIGASI DETAIL & EDIT
// =======================
function openDetail(id) {
  window.location.href = `detail.html?id=${id}`;
}

function openEdit(id) {
  window.location.href = `edit.html?id=${id}`;
}

// =======================
// DELETE DATA
// =======================
async function deleteItem(id) {
  if (!confirm("Yakin ingin menghapus anggota ini?")) return;

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: id })
    });

    const json = await res.json();
    alert(json.message || "Berhasil menghapus");
    loadData();

  } catch (err) {
    console.error("Gagal menghapus data:", err);
    alert("Gagal menghapus data");
  }
}

// =======================
// LOAD DATA SAAT PAGE READY
// =======================
document.addEventListener("DOMContentLoaded", loadData);
