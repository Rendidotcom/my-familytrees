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
        <button class="btn-detail" onclick="goDetail(${p.index})">Detail</button>
        <button class="btn-relasi" onclick="goEdit(${p.index})">Edit</button>
      </div>
    `;

    list.appendChild(row);
  });
}

//////////////////////////////////////////////////////////
//  DETAIL PAGE
//////////////////////////////////////////////////////////
function goDetail(id) {
  const member = globalData.find(m => m.index === id);

  localStorage.setItem("selectedMember", JSON.stringify(member));
  window.location.href = "detail.html";
}

//////////////////////////////////////////////////////////
//  EDIT PAGE
//////////////////////////////////////////////////////////
function goEdit(id) {
  const member = globalData.find(m => m.index === id);

  localStorage.setItem("editMember", JSON.stringify(member));
  window.location.href = "edit.html";
}
