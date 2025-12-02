/* =====================================================
   DELETE.JS — AUTO COMPAT WITH OLD GAS API
   Mendukung: getById / getOne / get / direct id
===================================================== */

/* -------------------------
   1. Ambil Session
---------------------------- */
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

const API_URL = window.API_URL || "";


/* -------------------------
   2. ID dari URL
---------------------------- */
const id = new URLSearchParams(location.search).get("id");

if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}


/* -------------------------
   3. Loader Helper
---------------------------- */
async function tryFetch(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    return null;
  }
}


/* -------------------------
   4. Load Detail Member
---------------------------- */
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  // Coba semua kemungkinan endpoint API GAS
  const endpoints = [
    `${API_URL}?mode=getById&id=${id}&token=${session.token}`,
    `${API_URL}?action=getOne&id=${id}&token=${session.token}`,
    `${API_URL}?mode=get&id=${id}&token=${session.token}`,
    `${API_URL}?id=${id}&token=${session.token}`,
  ];

  let json = null;

  for (let url of endpoints) {
    json = await tryFetch(url);

    if (json && (json.data || json.member || json.result)) {
      console.log("✔ Endpoint cocok:", url);
      break;
    }
  }

  // Tidak ada yang cocok
  if (!json || (!json.data && !json.member && !json.result)) {
    box.innerHTML = "❌ Data tidak ditemukan.";
    return;
  }

  // Normalisasi data
  const p = json.data || json.member || json.result;

  box.innerHTML = `
    <b>Nama:</b> ${p.name || "-"}<br>
    <b>Domisili:</b> ${p.Domisili || "-"}<br>
    <b>Relationship:</b> ${p.Relationship || "-"}<br>
    <b>Ayah ID:</b> ${p.parentIdAyah || "-"}<br>
    <b>Ibu ID:</b> ${p.parentIdIbu || "-"}<br>
    <b>Spouse ID:</b> ${p.spouseId || "-"}<br>
    <b>Status:</b> ${p.status || "-"}<br>
    <b>Order Anak:</b> ${p.orderChild || "-"}<br>
    <b>Photo:</b> ${p.photoURL ? `<a href="${p.photoURL}" target="_blank">Lihat Foto</a>` : "-"}
  `;
}

loadDetail();


/* -------------------------
   5. Soft Delete
---------------------------- */
async function softDelete() {
  if (!confirm("Yakin ingin melakukan SOFT DELETE?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.innerHTML = "⏳ Menghapus...";

  const url = `${API_URL}?mode=softDelete&id=${id}&token=${session.token}`;
  const json = await tryFetch(url);

  out.innerHTML = JSON.stringify(json, null, 2);

  if (json && json.status === "success") {
    alert("Soft delete berhasil.");
    location.href = "dashboard.html";
  }
}


/* -------------------------
   6. Hard Delete
---------------------------- */
async function hardDelete() {
  if (!confirm("⚠ HARD DELETE = PERMANEN! Lanjutkan?")) return;

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
