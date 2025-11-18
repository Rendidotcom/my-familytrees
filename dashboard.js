// =======================
// URL GAS
// =======================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

// =======================
// LOAD DATA DARI GAS
// =======================
async function loadData() {
  const list = document.getElementById("list");
  list.innerHTML = "Memuat data...";

  try {
    const res = await fetch(API_URL + "?mode=getData&callback=callback");
    const text = await res.text();

    const json = extractJSONP(text);

    if (!json.data || json.data.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:20px;color:#777;">
        Belum ada data
      </div>`;
      return;
    }

    let html = "";

    json.data.forEach(item => {
      html += `
        <div class="member">
          <img src="${item.photoURL || 'https://via.placeholder.com/70'}">

          <div class="member-info">
            <h4>${item.name}</h4>
            <p>${item.relationship} • ${item.domisili}</p>
          </div>

          <div class="member-buttons">
            <button class="btn-detail" onclick="openDetail('${item.index}')">Detail</button>
            <button class="btn-edit" onclick="openEdit('${item.index}')">Edit</button>
            <button class="btn-del" onclick="deleteMember('${item.index}')">Hapus</button>
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
// PARSE JSONP dari GAS
// =======================
function extractJSONP(text) {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  const jsonString = text.substring(start + 1, end);
  return JSON.parse(jsonString);
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
        mode: "delete",
        rowIndex: Number(id)
      })
    });

    const json = await res.json();
    alert(json.message || "Berhasil menghapus");

    loadData();
  } catch (err) {
    alert("Gagal menghapus data");
  }
}

loadData();
