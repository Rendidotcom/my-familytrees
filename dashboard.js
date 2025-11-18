const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

let globalData = [];

loadDashboard();

function loadDashboard() {
  const cb = "cbDash_" + Date.now();

  window[cb] = (res) => {
    globalData = res.data;
    renderDashboard(globalData);
    delete window[cb];
  };

  const s = document.createElement("script");
  s.src = GAS_URL + "?mode=getData&callback=" + cb;
  document.body.appendChild(s);
}

function renderDashboard(data) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(p => {
    const row = document.createElement("div");
    row.className = "member";

    row.innerHTML = `
      <img src="${p.photoURL || "https://via.placeholder.com/60"}">
      <div class="member-info">
        <b>${p.name}</b><br>
        ${p.relationship} · ${p.domisili}<br>
        <small>ID: ${p.index}</small>
      </div>
      <div class="member-buttons">
        <button class="btn-detail" onclick="openDetail(${p.index})">Detail</button>
        <button class="btn-relasi" onclick="openRelasi(${p.index})">Relasi</button>
      </div>
    `;

    list.appendChild(row);
  });
}

//////////////////////////////////////////////////////////////
// DETAIL POPUP
//////////////////////////////////////////////////////////////

function openDetail(id) {
  const p = globalData.find(x => x.index === id);

  document.getElementById("detailContent").innerHTML = `
    <img src="${p.photoURL}" style="width:80px;height:80px;border-radius:50%;">
    <p><b>${p.name}</b></p>
    <p>Domisili: ${p.domisili}</p>
    <p>Hubungan: ${p.relationship}</p>
    <p>ID: ${p.index}</p>
  `;

  document.getElementById("popupDetail").style.display = "flex";
}

function closeDetail() {
  document.getElementById("popupDetail").style.display = "none";
}

//////////////////////////////////////////////////////////////
// EDIT RELASI POPUP
//////////////////////////////////////////////////////////////

function openRelasi(id) {
  const p = globalData.find(x => x.index === id);

  document.getElementById("relasiContent").innerHTML = `
    <p><b>${p.name}</b></p>

    <label>Ayah ID:</label>
    <input type="number" value="${p.parentIdAyah || ""}">

    <label>Ibu ID:</label>
    <input type="number" value="${p.parentIdIbu || ""}">

    <label>Pasangan ID:</label>
    <input type="number" value="${p.spouseId || ""}">

    <p><small>*Fitur simpan dapat diaktifkan nanti jika Anda ingin update ke Google Sheets.</small></p>
  `;

  document.getElementById("popupRelasi").style.display = "flex";
}

function closeRelasi() {
  document.getElementById("popupRelasi").style.display = "none";
}
