// =====================================================
// SESSION CHECK
// =====================================================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu.");
  location.href = "login.html";
  throw new Error("No session");
}

// Pastikan config.js sudah memuat API_URL
if (!window.API_URL) {
  console.error("❌ API_URL tidak ditemukan. Pastikan config.js sudah diload.");
  alert("Kesalahan konfigurasi API: API_URL tidak ditemukan.");
  throw new Error("API_URL missing");
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
// Fungsi load data anggota
// =====================================================
async function loadDetail() {
  try {
    const res = await fetch(
      `${API_URL}?mode=getOne&id=${encodeURIComponent(memberId)}&nocache=${Date.now()}`
    );

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
    console.error("🚫 Error load detail:", err);
    document.getElementById("detail").innerHTML = "❌ Error koneksi server.";
  }
}

loadDetail();


// =====================================================
// HARD DELETE (POST JSON) — sinkron doPost GAS
// =====================================================
async function hapusSekarang() {
  if (!confirm("⚠ PERINGATAN!\nData ini akan DIHAPUS PERMANEN!\nLanjutkan?"))
    return;

  const payload = {
    mode: "delete",  // atau "hardDelete" jika GAS kamu menamakannya begitu
    id: memberId,
    token: session.token,
    deletedBy: session.name,
    time: new Date().toISOString()
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    console.log("🔍 delete response:", json);


    // ===========================
    // TOKEN EXPIRED / INVALID
    // ===========================
    if (
      json.status === "expired" ||
      json.message?.toLowerCase().includes("invalid token") ||
      json.message?.toLowerCase().includes("expired")
    ) {
      alert("⚠ Sesi login kedaluwarsa. Silakan login ulang.");
      localStorage.removeItem("familyUser");
      return (location.href = "login.html");
    }


    // ===========================
    // SUCCESS
    // ===========================
    if (json.status === "success") {
      alert("✅ Data berhasil dihapus permanen.");
      return (location.href = "dashboard.html");
    }


    // ===========================
    // FAILED
    // ===========================
    alert("❌ Gagal menghapus: " + (json.message || "Tidak diketahui."));

  } catch (err) {
    console.error("❌ Error koneksi:", err);
    alert("❌ Error koneksi ke server.");
  }
}
