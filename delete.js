/* =====================================================
   DELETE.JS — FINAL SYNC WITH GAS API
   Supports: getById, softDelete, delete
===================================================== */

// ====================================
// 1. Ambil Session
// ====================================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

const API_URL = window.API_URL || "";
if (!API_URL) console.error("❌ API_URL tidak ditemukan.");


// ====================================
// 2. Ambil ID dari URL
// ====================================
const urlParams = new URLSearchParams(location.search);
const id = urlParams.get("id");

if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}


// ====================================
// 3. Load Detail Member
// ====================================
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  try {
    const res = await fetch(`${API_URL}?mode=getById&id=${id}&token=${session.token}`);
    const json = await res.json();

    console.log("DETAIL:", json);

    if (json.status !== "success" || !json.data) {
      box.innerHTML = "❌ Data tidak ditemukan.";
      return;
    }

    const p = json.data;

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

  } catch (err) {
    console.error(err);
    box.innerHTML = "❌ Gagal memuat data";
  }
}

loadDetail();


// ====================================
// 4. Soft Delete
// ====================================
async function softDelete() {
  if (!confirm("Yakin ingin melakukan SOFT DELETE?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.innerHTML = "⏳ Menghapus...";

  try {
    const res = await fetch(`${API_URL}?mode=softDelete&id=${id}&token=${session.token}`);
    const json = await res.json();

    out.innerHTML = JSON.stringify(json, null, 2);

    if (json.status === "success") {
      alert("Soft delete berhasil.");
      location.href = "dashboard.html";
    }

  } catch (err) {
    out.innerHTML = "❌ Error koneksi";
  }
}


// ====================================
// 5. Hard Delete
// ====================================
async function hardDelete() {
  if (!confirm("⚠ HARD DELETE = PERMANEN! Lanjutkan?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.innerHTML = "⏳ Menghapus permanen...";

  try {
    const res = await fetch(`${API_URL}?mode=delete&id=${id}&token=${session.token}`);
    const json = await res.json();

    out.innerHTML = JSON.stringify(json, null, 2);

    if (json.status === "success") {
      alert("Data berhasil dihapus permanen.");
      location.href = "dashboard.html";
    }

  } catch (err) {
    out.innerHTML = "❌ Error koneksi";
  }
}
