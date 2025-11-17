const GAS_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

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

  result.data.forEach((row, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><img src="${row.photoURL}" class="thumb"></td>
      <td>${row.name}</td>
      <td>${row.domisili}</td>
      <td>${row.relationship}</td>
      <td>
        <button class="btn-detail">Detail</button>
        <button class="btn-edit">Edit</button>
        <button class="btn-delete">Hapus</button>
      </td>
    `;

    tbody.appendChild(tr);

    // Detail
    tr.querySelector(".btn-detail").addEventListener("click", () => {
      localStorage.setItem("selectedMember", JSON.stringify(row));
      window.location.href = "detail.html";
    });

    // Edit
    tr.querySelector(".btn-edit").addEventListener("click", () => {
      localStorage.setItem("editMember", JSON.stringify({ ...row, index: i + 2 })); 
      // +2 karena Sheet baris pertama = header, array index mulai 0
      window.location.href = "edit.html";
    });

    // Hapus
    tr.querySelector(".btn-delete").addEventListener("click", async () => {
      if (confirm(`Hapus data ${row.name}?`)) {
        try {
          const response = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ mode: "delete", rowIndex: i + 2 })
          });
          const result = await response.json();
          if (result.status === "success") {
            alert("✔ Data berhasil dihapus!");
            loadData(); 
          } else {
            alert("❌ Error: " + result.message);
          }
        } catch (err) {
          alert("❌ Fetch error: " + err.message);
        }
      }
    });
  });
}

loadData();
