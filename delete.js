/* ============================================================
   DELETE.JS — FINAL STABIL UNTUK GAS
============================================================= */

/* -------------------------
   1. SESSION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

const API_URL = window.API_URL || "";
if (!API_URL) console.error("❌ API_URL kosong!");

/* -------------------------
   2. Ambil ID dari URL
---------------------------- */
const id = new URLSearchParams(location.search).get("id");
if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}

/* -------------------------
   3. Helper Fetch GET
---------------------------- */
async function getJSON(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    console.error("Fetch Error:", e);
    return null;
  }
}

/* -------------------------
   4. Normalisasi Data GAS (universal)
---------------------------- */
function normalize(json) {
  if (!json) return null;

  let d =
    json.data ||
    json.member ||
    json.row ||
    json.item ||
    json.result ||
    json; // fallback

  if (!d) return null;

  d._id = d.ID || d.id || d.Id || d._id || d.recordId || null;

  return d;
}

/* -------------------------
   5. Load Detail Member
---------------------------- */
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  const URLS = [
    `${API_URL}?mode=getById&id=${id}&token=${session.token}`,
    `${API_URL}?action=getOne&id=${id}&token=${session.token}`,
    `${API_URL}?id=${id}&token=${session.token}`,
  ];

  let found = null;

  for (let u of URLS) {
    const j = await getJSON(u);
    const nm = normalize(j);

    if (nm && nm._id) {
      found = nm;
      console.log("✔ Data ditemukan melalui:", u);
      break;
    }
  }

  if (!found) {
    box.innerHTML = `<span style="color:red;font-weight:bold">❌ Data tidak ditemukan.</span>`;
    return;
  }

  box.innerHTML = `
    <b>ID:</b> ${found._id}<br>
    <b>Nama:</b> ${found.name || "-"}<br>
    <b>Ayah ID:</b> ${found.parentIdAyah || "-"}<br>
    <b>Ibu ID:</b> ${found.parentIdIbu || "-"}<br>
    <b>Spouse ID:</b> ${found.spouseId || "-"}<br>
    <b>Status:</b> ${found.status || "-"}<br>
    <b>Urutan Anak:</b> ${found.orderChild || "-"}<br>
    <b>Foto:</b> ${
      found.photoURL
        ? `<a href="${found.photoURL}" target="_blank">Lihat Foto</a>`
        : "-"
    }
  `;
}

loadDetail();

/* -------------------------
   6. Soft Delete
---------------------------- */
async function softDelete() {
  if (!confirm("Yakin melakukan SOFT DELETE?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.textContent = "⏳ Proses soft delete...";

  const url = `${API_URL}?mode=softDelete&id=${id}&token=${session.token}`;
  const j = await getJSON(url);

  out.textContent = JSON.stringify(j, null, 2);

  if (j && j.status === "success") {
    alert("Soft delete berhasil.");
    location.href = "dashboard.html";
  }
}

/* -------------------------
   7. Hard Delete (Permanent)
---------------------------- */
async function hardDelete() {
  if (!confirm("⚠ PERMANEN! Yakin ingin HARD DELETE?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.textContent = "⏳ Menghapus permanen...";

  const url = `${API_URL}?mode=delete&id=${id}&token=${session.token}`;
  const j = await getJSON(url);

  out.textContent = JSON.stringify(j, null, 2);

  if (j && j.status === "success") {
    alert("Data berhasil dihapus permanen.");
    location.href = "dashboard.html";
  }
}
