createNavbar();

const params = new URLSearchParams(location.search);
const ID = params.get("id");

async function loadDetail() {
  const res = await fetch(`${API_URL}?mode=getDetail&id=${ID}`);
  const j = await res.json();

  if (j.status !== "success") {
    document.getElementById("detail").innerHTML = "Data tidak ditemukan.";
    return;
  }

  const p = j.data;

  const img = p.photoURL || "https://via.placeholder.com/120?text=👤";

  document.getElementById("detail").innerHTML = `
    <img src="${img}" width="130">
    <h2>${p.name}</h2>
    <p><b>Relationship:</b> ${p.relationship}</p>
    <p><b>Domisili:</b> ${p.domisili}</p>
    <p><b>Notes:</b> ${p.notes}</p>

    <br>
    <button onclick="location.href='edit.html?id=${p.id}'">✏️ Edit</button>
    <button onclick="location.href='dashboard.html'">⬅ Kembali</button>
  `;
}

loadDetail();
