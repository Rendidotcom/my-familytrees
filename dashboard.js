const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

const listBox = document.getElementById("list");

// =========================
// JSONP LOAD DATA
// =========================
function loadMembers() {
  const cb = "dashCB_" + Date.now();
  window[cb] = function (result) {
    renderMembers(result);
    delete window[cb];
  };

  const s = document.createElement("script");
  s.src = GAS_URL + "?mode=getData&callback=" + cb;
  document.body.appendChild(s);
}

// =========================
// RENDER LIST
// =========================
function renderMembers(result) {
  if (result.status !== "success") {
    listBox.innerHTML = "Gagal memuat data.";
    return;
  }

  let data = result.data;

  if (data.length === 0) {
    listBox.innerHTML = "Belum ada anggota.";
    return;
  }

  listBox.innerHTML = "";

  data.forEach(m => {
    const row = document.createElement("div");
    row.className = "member";

    row.innerHTML = `
      <img src="${m.photoURL || 'https://via.placeholder.com/60'}">
      <div class="member-info">
        <div><b>${m.name}</b></div>
        <div>${m.relationship}</div>
        <div style="font-size:12px; color:#666">${m.domisili}</div>
      </div>

      <div class="member-buttons">
        <button class="btn-detail" onclick='showDetail(${JSON.stringify(m)})'>Detail</button>
        <button class="btn-relasi" onclick='editMember(${JSON.stringify(m)})'>Edit</button>
        <button class="btn-delete" onclick='deleteMember(${m.index})'
        style="background:#e74c3c;color:white;">Hapus</button>
      </div>
    `;

    listBox.appendChild(row);
  });
}

// =========================
// DETAIL POPUP
// =========================
function showDetail(m) {
  const popup = document.getElementById("popupDetail");
  const box = document.getElementById("detailContent");

  box.innerHTML = `
    <img src="${m.photoURL || 'https://via.placeholder.com/150'}" 
         style="width:120px;height:120px;border-radius:50%;display:block;margin:auto;">
    <h3 style="text-align:center">${m.name}</h3>
    <p style="text-align:center">${m.relationship}</p>
    <p style="text-align:center">${m.domisili}</p>
    <p style="text-align:center"><i>${m.notes || '-'}</i></p>
  `;

  popup.style.display = "flex";
}

function closeDetail() {
  document.getElementById("popupDetail").style.display = "none";
}

// =========================
// EDIT (redirect ke edit.html)
// =========================
function editMember(member) {
  localStorage.setItem("editMember", JSON.stringify(member));
  window.location.href = "edit.html";
}

// =========================
// DELETE MEMBER
// =========================
function deleteMember(index) {
  if (!confirm("Yakin ingin menghapus anggota ini?")) return;

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({
      mode: "delete",
      rowIndex: index
    })
  })
    .then(r => r.json())
    .then(res => {
      if (res.status === "success") {
        alert("✔ Berhasil dihapus");
        loadMembers(); // reload
      } else {
        alert("❌ Error: " + res.message);
      }
    })
    .catch(err => alert("❌ Fetch error: " + err.message));
}

// Jalankan
loadMembers();
