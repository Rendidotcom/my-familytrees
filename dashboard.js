// =======================
// URL Google Apps Script FINAL
// =======================
const API_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

// =======================
// LOAD DATA
// =======================
async function loadData() {
  const list = document.getElementById("list");
  if (!list) return;
  list.innerHTML = "Memuat data...";

  try {
    const res = await fetch(API_URL + "?action=getAll");
    const json = await res.json();

    const data = json.data || [];

    if (!data.length) {
      list.innerHTML = `<div class="empty">Belum ada data</div>`;
      return;
    }

    let html = "";
    data.forEach(item => {
      const photoURL = item.photoURL || "https://via.placeholder.com/70";

      html += `
        <div class="member">
          <img src="${photoURL}">
          <div class="member-info">
            <h4>${item.name}</h4>
            <p>${item.relationship} • ${item.domisili}</p>
          </div>
          <div class="member-buttons">
            <button class="btn-detail" onclick="openDetail('${item.id}')">Detail</button>
            <button class="btn-edit" onclick="openEdit('${item.id}')">Edit</button>
            <button class="btn-del" onclick="deleteMember('${item.id}')">Hapus</button>
          </div>
        </div>
      `;
    });

    list.innerHTML = html;

  } catch (err) {
    console.error("Gagal memuat data:", err);
    list.innerHTML = `<div class="empty">Gagal memuat data</div>`;
  }
}

// =======================
// NAVIGASI DETAIL & EDIT
// =======================
function openDetail(id) {
  window.location.href = "detail.html?id=" + id;
}

function openEdit(id) {
  window.location.href = "edit.html?id=" + id;
}

// =======================
// DELETE DATA
// =======================
async function deleteMember(id) {
  if (!confirm("Yakin ingin menghapus anggota ini?")) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "delete", id })
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
