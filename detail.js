// ==========================================================
// detail.js — FINAL
// Mengambil detail 1 anggota menggunakan mode=getTree
// dan mencari item berdasarkan ID
// ==========================================================

// Pastikan API_URL dari config.js sudah terbaca
if (!window.API_URL) {
  console.error("❌ ERROR: API_URL tidak ditemukan. Pastikan config.js diload sebelum detail.js");
  alert("Konfigurasi API tidak valid. Muat ulang halaman.");
}

// ----------------------------------------------------------
// Ambil parameter ID dari URL
// ----------------------------------------------------------
const urlParams = new URLSearchParams(window.location.search);
const personId = urlParams.get("id");

if (!personId) {
  alert("ID anggota tidak ditemukan.");
  location.href = "tree.html";
}

// ----------------------------------------------------------
// Fetch semua data tree, lalu ambil detail berdasarkan id
// ----------------------------------------------------------
async function loadDetail() {
  try {
    document.getElementById("loading").style.display = "block";

    const response = await fetch(`${API_URL}?mode=getTree`);
    const result = await response.json();

    if (!result.success) throw new Error("Gagal memuat data dari server");

    const list = result.data;

    // Temukan anggota berdasarkan ID
    const person = list.find((x) => x.id === personId);

    if (!person) {
      alert("Data anggota tidak ditemukan.");
      location.href = "tree.html";
      return;
    }

    // Render data ke UI
    renderDetail(person);

  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat memuat data detail.");
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// ----------------------------------------------------------
// Render Detail ke Tampilan
// ----------------------------------------------------------
function renderDetail(p) {
  document.getElementById("name").innerText = p.name || "-";
  document.getElementById("gender").innerText = p.gender || "-";
  document.getElementById("birth").innerText = p.birth || "-";
  document.getElementById("death").innerText = p.death || "-";
  document.getElementById("notes").innerText = p.notes || "-";

  document.getElementById("father").innerText = p.father || "-";
  document.getElementById("mother").innerText = p.mother || "-";

  document.getElementById("status").innerHTML =
    p.is_deleted === "1"
      ? `<span style="color:red;font-weight:bold">Deleted</span>`
      : `<span style="color:green;font-weight:bold">Active</span>`;

  // Foto
  const img = document.getElementById("photo");
  img.src = p.photo || "https://via.placeholder.com/120?text=No+Image";
}

// ----------------------------------------------------------
// Menuju halaman edit
// ----------------------------------------------------------
function goEdit() {
  location.href = `edit.html?id=${personId}`;
}

// ----------------------------------------------------------
// Menuju halaman delete.html
// ----------------------------------------------------------
function goDelete() {
  location.href = `delete.html?id=${personId}`;
}

// Jalankan
loadDetail();
