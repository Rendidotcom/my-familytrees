/* =====================================================
   DELETE.JS — FINAL VERSION (GET METHOD ONLY)
   - Auto detect API mode: getById / getOne / get / id-only
   - Compatible GAS v1–v4
   - Soft Delete + Hard Delete
===================================================== */

/* -------------------------
   SESSION
---------------------------- */
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

const API_URL = window.API_URL || "";
if (!API_URL) console.error("❌ API_URL tidak ditemukan di config.js.");


/* -------------------------
   GET ID DARI URL
---------------------------- */
const id = new URLSearchParams(location.search).get("id");
if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}


/* -------------------------
   HELPER FETCH
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
   LOAD DETAIL MEMBER
---------------------------- */
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  // Semua kemungkinan endpoint GAS
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
      console.log("✔ Menggunakan endpoint:", url);
      break;
    }
  }

  if (!json || (!json.data && !json.member && !json.result)) {
    box.innerHTML = `<span style="color:#c62828;font-weight:bold">❌ Data tidak ditemukan.</span>`;
    return;
  }

  const p = json.data || json.member || json.result;

  box.innerHTML = `
    <b>Nama:</b> ${p.name || "-"}<br>
    <b>Domisili:</b> ${p.domisili || p.Domisili || "-"}<br>
    <b>Relationship:</b> ${p.relationship || p.Relationship || "-"}<br>
    <b>Ayah ID:</b> ${p.parentIdAyah || "-"}<br>
    <b>Ibu ID:</b> ${p.parentIdIbu || "-"}<br>
    <b>Spouse ID:</b> ${p.spouseId || "-"}<br>
    <b>Status:</b> ${p.status || "-"}<br>
    <b>Urutan Anak:</b> ${p.orderChild || "-"}<br>
    <b>Foto:</b> ${
      p.photoURL
        ? `<a href="${p.photoURL}" target="_blank">Lihat Foto</a>`
        : "-"
    }
  `;
}

loadDetail();


/* -------------------------
   SOFT DELETE
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
   HARD DELETE
---------------------------- */
async function hardDelete() {
  if (!confirm("⚠ HARD DELETE = PERMANEN! Yakin ingin melanjutkan?")) return;

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
