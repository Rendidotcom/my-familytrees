// =======================
// URL GAS
// =======================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

// =======================
// LOAD DATA
// =======================
async function loadData() {
  const list = document.getElementById("list");
  list.innerHTML = "Memuat data...";

  try {
    const res = await fetch(API_URL + "?action=getAll");
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:20px;color:#777;">
          Belum ada data
        </div>`;
      return;
    }

    let html = "";
    json.data.forEach(item => {
      const photoURL = item.photoId
        ? `https://drive.google.com/uc?export=view&id=${item.photoId}`
        : "https://via.placeholder.com/70";

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
    console.error(err);
    list.innerHTML = "Gagal memuat data.";
  }
}

// =======================
// OPEN DETAIL
// =======================
function openDetail(id) {
  window.location.href = "detail.html?id=" + id;
}

// =======================
// OPEN EDIT
// =======================
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
      body: JSON.stringify({
        action: "delete",
        id: id
      })
    });

    const json = await res.json();
    alert(json.message || "Berhasil menghapus");

    loadData();
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus data");
  }
}

loadData();
