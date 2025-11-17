const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

async function loadData() {
  try {
    const response = await fetch(GAS_URL + "?mode=getData");
    const result = await response.json();

    if (result.status !== "success") {
      alert("Gagal memuat data!");
      return;
    }

    const tableBody = document.querySelector("#familyTable tbody");
    tableBody.innerHTML = "";

    result.data.forEach(row => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><img src="${row.photoURL}" class="thumb"></td>
        <td>${row.name}</td>
        <td>${row.domisili}</td>
        <td>${row.relationship}</td>
        <td><button class="btn-detail">Detail</button></td>
      `;

      tableBody.appendChild(tr);
    });
  } catch (err) {
    alert("Error load data: " + err.message);
  }
}

loadData();
