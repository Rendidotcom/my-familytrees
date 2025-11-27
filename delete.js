// =====================================================
// Pastikan user login
// =====================================================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) location.href = "login.html";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";

// =====================================================
// Ambil ID dari URL
// =====================================================
const urlParams = new URLSearchParams(window.location.search);
const memberId = urlParams.get("id");

if (!memberId) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
}


// =====================================================
// Load detail anggota
// =====================================================
async function loadDetail() {
  try {
    const res = await fetch(API_URL + "?mode=getOne&id=" + memberId);
    const json = await res.json();

    if (!json.success) {
      document.getElementById("detail").innerHTML =
        "❌ Data tidak ditemukan.";
      return;
    }

    let d = json.data;

    document.getElementById("detail").innerHTML = `
      <div class="info-box">
        <b>Nama:</b> ${d.name}<br>
        <b>Domisili:</b> ${d.domisili || "-"}<br>
        <b>Relationship:</b> ${d.relationship || "-"}<br><br>
        <b>ID:</b> ${d.id}
      </div>
    `;
  } catch (e) {
    document.getElementById("detail").innerHTML = "❌ Error koneksi server.";
  }
}

loadDetail();


// =====================================================
// DELETE NOW
// =====================================================
async function hapusSekarang() {
  if (!confirm("Yakin ingin menghapus data INI? (PERMANEN)")) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: memberId,
        token: session.token
      })
    });

    const json = await res.json();

    if (json.status === "success") {
      alert("Berhasil dihapus!");
      location.href = "dashboard.html";
    } else {
      alert("Gagal: " + json.message);
    }

  } catch (e) {
    alert("Error koneksi ke server.");
  }
}
