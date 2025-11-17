const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

function loadData() {
  const callbackName = "jsonpCallback_" + Date.now();

  // Terima data
  window[callbackName] = function(result) {
    renderTable(result);
    delete window[callbackName];
  };

  // Buat script JSONP
  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + callbackName;
  document.body.appendChild(script);
}

function renderTable(result) {
  const loading = document.getElementById("loading");
  const table = document.getElementById("familyTable");
  const tbody = table.querySelector("tbody");

  if (result.status !== "success") {
    loading.innerText = "Gagal memuat data.";
    return;
  }

  loading.style.display = "none";
  table.style.display = "table";
  tbody.innerHTML = "";

  result.data.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><img src="${row.photoURL}" class="thumb"></td>
      <td>${row.name}</td>
      <td>${row.domisili}</td>
      <td>${row.relationship}</td>
      <td><button class="btn-detail">Detail</button></td>
    `;

    tbody.appendChild(tr);
  });
}

loadData();
