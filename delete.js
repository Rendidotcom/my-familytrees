/* ============================================================
   DELETE.JS — FINAL VERSION
   ID Sinkron, Auto Normalisasi Struktur GAS Lama & Baru
   Soft Delete & Hard Delete via GET
============================================================= */

/* -------------------------
   1. SESSION
---------------------------- */
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

const API_URL = window.API_URL || "";
if (!API_URL) console.error("❌ API_URL tidak ditemukan.");


/* -------------------------
   2. Ambil ID dari URL
---------------------------- */
const id = new URLSearchParams(location.search).get("id");

if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}


/* -------------------------
   3. Helper GET JSON
---------------------------- */
async function tryFetch(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    console.error("Fetch error:", e);
    return null;
  }
}


/* -------------------------
   4. Normalisasi Data
---------------------------- */
function normalizeData(json) {
  if (!json) return null;

  let d =
    json.data ||
    json.member ||
    json.result ||
    json.row ||
    json.item ||
    json; // fallback if GAS returns raw object

  if (!d) return null;

  // Normalisasi ID (mendeteksi berbagai kemungkinan)
  d._id =
    d.ID ||
    d.id ||
    d.Id ||
    d.rowId ||
    d.recordId ||
    d._id ||
    null;

  return d;
}


/* -------------------------
   5. Load Detail Member
---------------------------- */
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  const endpoints = [
    `${API_URL}?mode=getById&id=${id}&token=${session.token}`,
    `${API_URL}?action=getOne&id=${id}&token=${session.token}`,
    `${API_URL}?mode=get&id=${id}&token=${session.token}`,
    `${API_URL}?id=${id}&token=${session.token}`,
  ];

  let finalData = null;

  for (let url of endpoints) {
    const json = await tryFetch(url);
    const normalized = normalizeData(json);

    if (normalized && normalized._id) {
      console.log("✔ Endpoint cocok:", url);
      finalData = normalized;
      break;
    }
  }

  if (!finalData) {
    box.innerHTML = `
      <span style="color:#c62828;font-weight:bold">
        ❌ Data tidak ditemukan.
      </span>
    `;
    return;
  }

  box.innerHTML = `
    <b>ID:</b> ${finalData._id}<br>
    <b>Nama:</b> ${finalData.name || "-"}<br>
    <b>Domisili:</b> ${finalData.Domisili || finalData.domisili || "-"}<br>
    <b>Relationship:</b> ${finalData.Relationship || finalData.relationship || "-"}<br>
    <b>Ayah ID:</b> ${finalData.parentIdAyah || "-"}<br>
    <b>Ibu ID:</b> ${finalData.parentIdIbu || "-"}<br>
    <b>Spouse ID:</b> ${finalData.spouseId || "-"}<br>
    <b>Status:</b> ${finalData.status || "-"}<br>
    <b>Urutan Anak:</b> ${finalData.orderChild || "-"}<br>
    <b>Photo:</b> ${
      finalData.photoURL
        ? `<a href="${finalData.photoURL}" target="_blank">Lihat Foto</a>`
        : "-"
    }
  `;
}

loadDetail();


/* -------------------------
   6. Soft Delete (GET)
---------------------------- */
async function softDelete() {
  if (!confirm("Yakin ingin melakukan SOFT DELETE?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.innerHTML = "⏳ Memproses soft delete...";

  const url = `${API_URL}?mode=softDelete&id=${id}&token=${session.token}`;
  const json = await tryFetch(url);

  out.innerHTML = JSON.stringify(json, null, 2);

  if (json && json.status === "success") {
    alert("Soft delete berhasil.");
    location.href = "dashboard.html";
  }
}


/* -------------------------
   7. Hard Delete (GET)
---------------------------- */
async function hardDelete() {
  if (!confirm("⚠ HARD DELETE = PERMANEN! Yakin ingin lanjut?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.innerHTML = "⏳ Menghapus permanen...";

  const url = `${API_URL}?mode=delete&id=${id}&token=${session.token}`;
  const json = await tryFetch(url);

  out.innerHTML = JSON.stringify(json, null, 2);

  if (json && json.status === "success") {
    alert("Data berhasil dihapus permanen.");
    location.href = "dashboard.html";
  }
}
