// =====================================================
// SESSION CHECK
// =====================================================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu.");
  location.href = "login.html";
}

// API_URL dari config.js
if (!window.API_URL) {
  console.error("❌ API_URL tidak ditemukan. Pastikan config.js sudah diload.");
  alert("Kesalahan konfigurasi API.");
}


// =====================================================
// Ambil ID dari URL
// =====================================================
const params = new URLSearchParams(location.search);
const memberId = params.get("id");

if (!memberId) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("ID not found");
}


// =====================================================
// LOAD DETAIL ANGGOTA
// =====================================================
async function loadDetail() {
  try {
    const res = await fetch(`${API_URL}?mode=getOne&id=${memberId}&nocache=${Date.now()}`);
    const json = await res.json();

    if (json.status !== "success") {
      document.getElementById("detail").innerHTML = "❌ Data tidak ditemukan.";
      return;
    }

    const d = json.data;

    document.getElementById("detail").innerHTML = `
      <div class="info-box">
        <b>Nama:</b> ${d.name}<br>
        <b>Domisili:</b> ${d.domisili || "-"}<br>
        <b>Relationship:</b> ${d.relationship || "-"}<br><br>
        <b>ID:</b> ${d.id}
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById("detail").innerHTML = "❌ Error koneksi server.";
  }
}

loadDetail();


// =====================================================
// DELETE FINAL (HARD DELETE)
// =====================================================
async function hapusSekarang() {
  if (!confirm("⚠ PERINGATAN!\nData ini akan dihapus PERMANEN.\nLanjutkan?"))
    return;

  const body = {
    mode: "delete",
    id: memberId,
    token: session.token,
    deletedBy: session.name,
    time: new Date().toISOString()
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await res.json();

    // -----------------------
    // TOKEN EXPIRED
    // -----------------------
    if (json.message === "Invalid token" || json.status === "expired") {
      alert("⚠ Sesi login kadaluarsa, silakan login ulang.");
      localStorage.removeItem("familyUser");
      return (location.href = "login.html");
    }

    // -----------------------
    // SUCCESS
    // -----------------------
    if (json.status === "success") {
      alert("✅ Data berhasil dihapus permanen.");
      return (location.href = "dashboard.html");
    }

    // -----------------------
    // FAILED
    // -----------------------
    alert("❌ Gagal: " + (json.message || "Tidak diketahui."));

  } catch (err) {
    console.error(err);
    alert("❌ Error koneksi ke server.");
  }
}
