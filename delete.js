/* ============================================================
   DELETE.JS — FINAL VERSION
   - Ambil detail user berdasarkan ID query
   - Admin: bisa soft/hard delete siapa saja
   - User biasa: hanya bisa soft/hard delete dirinya sendiri
   - Sinkron dengan GAS 700 baris (mode=softDelete | hardDelete)
============================================================= */

/* -------------------------------------------------------------
  0. SESSION CHECK
------------------------------------------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const TOKEN = session.token;
const SESSION_ID = session.id;
const ROLE = session.role;

/* -------------------------------------------------------------
  1. Ambil ID dari URL
------------------------------------------------------------- */
const urlParams = new URLSearchParams(window.location.search);
const targetId = urlParams.get("id");

if (!targetId) {
  document.getElementById("detail").innerHTML = "ID tidak ditemukan.";
}

/* -------------------------------------------------------------
  2. Load detail user
------------------------------------------------------------- */
async function loadDetail() {
  try {
    const res = await fetch(`${API_URL}?mode=getById&id=${targetId}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    const data = await res.json();
    if (!data || !data.user) {
      document.getElementById("detail").innerHTML = "Data tidak ditemukan.";
      return;
    }

    const u = data.user;
    document.getElementById("detail").innerHTML = `
      <b>Nama:</b> ${u.name || "-"}<br>
      <b>ID:</b> ${u.id}<br>
      <b>Email:</b> ${u.email || "-"}<br>
      <b>Status:</b> ${u.status}
    `;

    document.getElementById("jsonOutput").innerText = JSON.stringify(u, null, 2);
    document.getElementById("jsonOutput").style.display = "block";

    adjustButtons();

  } catch (err) {
    console.error(err);
    document.getElementById("detail").innerText = "Gagal memuat data.";
  }
}

loadDetail();

/* -------------------------------------------------------------
  3. Atur tombol delete sesuai role
------------------------------------------------------------- */
function adjustButtons() {
  const btnSoft = document.getElementById("btnSoft");
  const btnHard = document.getElementById("btnHard");
  const btnSelf = document.getElementById("btnSelfDelete");

  if (ROLE === "admin") {
    // Admin melihat semua tombol
    btnSoft.style.display = "block";
    btnHard.style.display = "block";
    btnSelf.style.display = (targetId === SESSION_ID ? "block" : "none");
  } else {
    // User biasa: hanya boleh hapus dirinya
    if (targetId !== SESSION_ID) {
      btnSoft.style.display = "none";
      btnHard.style.display = "none";
      btnSelf.style.display = "none";
      document.getElementById("detail").innerHTML +=
        `<p style="color:red;">Anda tidak berhak menghapus user lain.</p>`;
    } else {
      // user sedang menghapus dirinya sendiri
      btnSoft.style.display = "block";
      btnHard.style.display = "block";
      btnSelf.style.display = "block";
    }
  }
}

/* -------------------------------------------------------------
  4. Soft Delete
------------------------------------------------------------- */
async function softDelete() {
  if (!confirm("Yakin ingin melakukan SOFT DELETE?")) return;

  await doDelete("softDelete");
}

/* -------------------------------------------------------------
  5. Hard Delete
------------------------------------------------------------- */
async function hardDelete() {
  if (!confirm("Yakin ingin HARD DELETE (permanen)?")) return;

  await doDelete("hardDelete");
}

/* -------------------------------------------------------------
  6. Delete diri sendiri — otomatis logout
------------------------------------------------------------- */
async function deleteMyAccount() {
  if (!confirm("Akun Anda akan DIHAPUS PERMANEN. Lanjutkan?")) return;

  await doDelete("hardDelete", true);
}

/* -------------------------------------------------------------
  7. Core function — kirim ke GAS
------------------------------------------------------------- */
async function doDelete(mode, self = false) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode,
        id: targetId
      })
    });

    const json = await res.json();
    console.log(json);

    if (json.status !== "success") {
      alert("Gagal: " + json.message);
      return;
    }

    if (self) {
      alert("Akun Anda berhasil dihapus. Anda akan logout.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    alert("Berhasil: " + json.message);
    location.href = "users.html";

  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat delete.");
  }
}
