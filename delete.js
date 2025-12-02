/* =====================================================
   DELETE.JS — FINAL VERSION
   - Fully compatible with ALL GAS API versions
   - Mode GET only (soft & hard delete)
   - Auto-detect structure: data / member / result
   - Clean, stable, production safe
===================================================== */

/* -------------------------
   1. Ambil Session
---------------------------- */
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session || !session.token) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

/* Ambil API URL dari config.js */
const API_URL = window.API_URL || "";
if (!API_URL) console.error("❌ API_URL tidak ditemukan (config.js?).");


/* -------------------------
   2. Ambil ID dari URL
---------------------------- */
const id = new URLSearchParams(location.search).get("id");
if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID in query");
}


/* -------------------------
   3. Helper Fetch JSON
---------------------------- */
async function tryFetch(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}


/* -------------------------
   4. Load Detail Data
---------------------------- */
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  // Uji semua endpoint lama/baru GAS
  const possible = [
    `${API_URL}?mode=getById&id=${id}&token=${session.token}`,
    `${API_URL}?action=getOne&id=${id}&token=${session.token}`,
    `${API_URL}?mode=get&id=${id}&token=${session.token}`,
    `${API_URL}?id=${id}&token=${session.token}`,
  ];

  let json = null;

  for (let link of possible) {
    const res = await tryFetch(link);

    if (res && (res.data || res.member || res.result)) {
      console.log("✔ Endpoint cocok:", link);
      json = res;
      break;
    }
  }

  if (!json) {
    box.innerHTML = `<span style="color:#c62828;font-weight:bold">❌ Data tidak ditemukan.</span>`;
    return;
  }

  // Normalisasi struktur GAS
  const p = json.data || json.member || json.result;

  box.innerHTML = `
    <b>Nama:</b> ${p.name || "-"}<br>
    <b>Domisili:</b> ${p.Domisili || p.domisili || "-"}<br>
    <b>Relationship:</b> ${p.Relationship || p.relationship || "-"}<br>
    <b>Ayah ID:</b> ${p.parentIdAyah || "-"}<br>
    <b>Ibu ID:</b> ${p.parentIdIbu || "-"}<br>
    <b>Pasangan:</b> ${p.spouseId || "-"}<br>
    <b>Status:</b> ${p.status || "-"}<br>
    <b>Urutan Anak:</b> ${p.orderChild || "-"}<br>
    <b>Foto:</b> ${
      p.photoURL ? `<a href="${p.photoURL}" target="_blank">Lihat Foto</a>` : "-"
    }
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
  out.innerHTML = "⏳ Memproses soft delete...";

  const url = `${API_URL}?mode=softDelete&id=${id}&token=${session.token}`;
  const json = await tryFetch(url);

  out.innerHTML = JSON.stringify(json, null, 2);

  if (json && json.status === "success") {
    alert("Soft delete berhasil!");
    location.href = "dashboard.html";
  }
}


/* -------------------------
   6. Hard Delete
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
    alert("Data berhasil dihapus PERMANEN.");
    location.href = "dashboard.html";
  }
}
