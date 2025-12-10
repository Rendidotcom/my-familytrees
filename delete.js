// ======================================================
// DELETE.JS — CLEAN SYNC WITH GAS
// ======================================================

// Baca parameter URL
const url = new URL(window.location.href);
const memberId = url.searchParams.get("id") || null;
const memberNama = url.searchParams.get("nama") || "";
const memberDomisili = url.searchParams.get("domisili") || "";

// Render ke halaman
document.getElementById("nama").textContent = memberNama;
document.getElementById("domisili").textContent = memberDomisili;

if (!memberId) {
  alert("ID tidak ditemukan! Halaman tidak valid.");
}

// Tombol hapus
document.getElementById("btnHapus").addEventListener("click", async () => {
  if (!confirm("Yakin ingin menghapus anggota ini?")) return;

  const payload = {
    mode: "deleteMember",
    id: memberId,
    token: window.ADMIN_TOKEN,
  };

  try {
    const res = await fetch(window.API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    const json = await res.json();

    if (json.status === "success") {
      alert("✔ Berhasil dihapus!");
      location.href = "index.html";
    } else {
      alert("✖ Gagal menghapus: " + json.message);
    }

  } catch (error) {
    alert("✖ ERROR: " + error);
  }
});
