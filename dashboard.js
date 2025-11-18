const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

loadDashboard();

function loadDashboard() {
  const callback = "cbDash_" + Date.now();

  window[callback] = function (response) {
    renderDashboard(response.data);
    delete window[callback];
  };

  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + callback;
  document.body.appendChild(script);
}

function renderDashboard(data) {
  const list = document.getElementById("list");

  if (!data || data.length === 0) {
    list.innerHTML = "Belum ada data.";
    return;
  }

  list.innerHTML = "";

  data.forEach(p => {
    const row = document.createElement("div");
    row.className = "member";

    row.innerHTML = `
      <img src="${p.photoURL || "https://via.placeholder.com/60"}">
      <div>
        <b>${p.name}</b><br>
        ${p.relationship} · ${p.domisili}<br>
        <small>ID: ${p.index}</small>
      </div>
    `;
    list.appendChild(row);
  });
}
