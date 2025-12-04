/* ============================================================
   DELETE.JS — FINAL CLEAN VERSION (User Can Delete Self)
============================================================= */

/* --- Session Check --- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session || !session.token) {
  alert("Sesi kadaluarsa. Silakan login kembali.");
  location.href = "login.html";
}

const API_URL = window.API_URL;
if (!API_URL) console.error("❌ API_URL tidak ditemukan.");

/* --- Get ID From URL --- */
const id = new URLSearchParams(location.search).get("id");
if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}

/* ================================
   ONLY ADMIN CAN DELETE OTHERS
   USER CAN DELETE ONLY SELF
================================= */
function allowDelete() {
  if (session.role === "admin") return true;   // admin bebas
  return session.userId == id;                 // user hanya dirinya sendiri
}

/* --- Helper Fetch --- */
async function api(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    console.error("❌ Fetch error:", e);
    return null;
  }
}

/* --- Load Detail --- */
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  const url = `${API_URL}?mode=getById&id=${id}&token=${session.token}`;
  const json = await api(url);

  if (!json || !json.data) {
    box.innerHTML = `<span style="color:red;font-weight:bold;">❌ Data tidak ditemukan</span>`;
    return;
  }

  const d = json.data;

  box.innerHTML = `
    <b>ID:</b> ${d.ID}<br>
    <b>Nama:</b> ${d.name || "-"}<br>
    <b>Domisili:</b> ${d.domicile || "-"}<br>
    <b>Relationship:</b> ${d.relationship || "-"}<br>
    <b>Status:</b> ${d.status || "-"}<br>
    <b>Photo:</b> ${
      d.photoURL ? `<a href="${d.photoURL}" target="_blank">Lihat Foto</a>` : "-"
    }
  `;

  /* --- Control Deletion Permission --- */
  if (!allowDelete()) {
    document.getElementById("softBtn").style.display = "none";
    document.getElementById("hardBtn").style.display = "none";

    document.getElementById("notice").innerHTML = `
      <div style="color:#c62828; font-weight:bold; margin-top:10px;">
        ⚠ Anda tidak diizinkan menghapus data ini.
      </div>
    `;
  }
}

loadDetail();

/* =============================
     SOFT DELETE
============================= */
async function softDelete() {
  if (!allowDelete()) return alert("⚠ Anda tidak memiliki izin.");

  if (!confirm("Yakin ingin melakukan SOFT DELETE?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.innerHTML = "⏳ Memproses soft delete...";

  const url = `${API_URL}?mode=softDelete&id=${id}&token=${session.token}`;
  const json = await api(url);

  out.innerHTML = JSON.stringify(json, null, 2);

  if (json && json.status === "success") {
    alert("Soft delete berhasil.");
    location.href = "dashboard.html";
  }
}

/* =============================
     HARD DELETE
============================= */
async function hardDelete() {
  if (!allowDelete()) return alert("⚠ Anda tidak memiliki izin.");

  if (!confirm("⚠ HARD DELETE = PERMANEN! Yakin ingin lanjut?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.innerHTML = "⏳ Menghapus permanen...";

  const url = `${API_URL}?mode=delete&id=${id}&token=${session.token}`;
  const json = await api(url);

  out.innerHTML = JSON.stringify(json, null, 2);

  if (json && json.status === "success") {
    alert("Data berhasil dihapus permanen.");
    location.href = "dashboard.html";
  }
}
