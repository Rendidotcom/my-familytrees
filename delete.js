/* ============================================================
   DELETE.JS — FINAL SYNC + SELF DELETE FIXED
============================================================= */

/* -------------------------
   1. SESSION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;
const sessionRole = session.role;

/* -------------------------
   2. API URL
---------------------------- */
const API_URL = window.API_URL || "";
if (!API_URL) console.error("❌ API_URL kosong!");


/* -------------------------
   3. Ambil ID dari URL
---------------------------- */
const id = new URLSearchParams(location.search).get("id");
const detailBox = document.getElementById("detail");
const jsonBox = document.getElementById("jsonOutput");

if (!id) {
  detailBox.innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}


/* -------------------------
   4. Helper GET JSON
---------------------------- */
async function getJSON(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    return { status: "error", message: e.message };
  }
}


/* -------------------------
   5. Normalize GAS result
---------------------------- */
function normalize(json) {
  if (!json) return null;
  let d = json.data || json.member || json.row || json.item || json.result || json;
  if (!d) return null;
  d._id = d.id || d.ID || d.Id || d._id || null;
  return d;
}


/* -------------------------
   6. LOAD DETAIL
---------------------------- */
async function loadDetail() {

  detailBox.innerHTML = "⏳ Memuat data...";

  // ⚡ FIX: GAS kamu pakai "mode=get"
  const url = `${API_URL}?mode=get&id=${id}&token=${token}`;
  const raw = await getJSON(url);

  if (raw.status === "error") {
    detailBox.innerHTML = `<span style="color:red;font-weight:bold">Data tidak ditemukan.</span>`;
    jsonBox.style.display = "block";
    jsonBox.textContent = JSON.stringify(raw, null, 2);
    return;
  }

  const data = normalize(raw);

  if (!data || !data._id) {
    detailBox.innerHTML = `<span style="color:red;font-weight:bold">Data tidak ditemukan.</span>`;
    jsonBox.style.display = "block";
    jsonBox.textContent = JSON.stringify(raw, null, 2);
    return;
  }

  detailBox.innerHTML = `
    <b>ID:</b> ${data._id}<br>
    <b>Nama:</b> ${data.name || "-"}<br>
    <b>Ayah ID:</b> ${data.parentIdAyah || "-"}<br>
    <b>Ibu ID:</b> ${data.parentIdIbu || "-"}<br>
    <b>Spouse ID:</b> ${data.spouseId || "-"}<br>
    <b>Status:</b> ${data.status || "-"}<br>
    <b>Urutan Anak:</b> ${data.orderChild || "-"}<br>
    <b>Foto:</b> ${
      data.photoURL
        ? `<a href="${data.photoURL}" target="_blank">Lihat Foto</a>`
        : "-"
    }
  `;
}

loadDetail();


/* -------------------------
   7. SOFT DELETE
---------------------------- */
async function softDelete() {
  if (!confirm("Yakin melakukan SOFT DELETE?")) return;

  jsonBox.style.display = "block";
  jsonBox.textContent = "⏳ Soft deleting...";

  const url = `${API_URL}?mode=softDelete&id=${id}&token=${token}`;
  const j = await getJSON(url);
  jsonBox.textContent = JSON.stringify(j, null, 2);

  if (j.status === "success") {
    alert("Soft delete berhasil.");
    location.href = "dashboard.html";
  }
}


/* -------------------------
   8. HARD DELETE
      Admin → boleh hapus siapa saja
      User  → hanya boleh hapus dirinya sendiri
---------------------------- */
async function hardDelete() {

  const isOwner = id === sessionId;
  const isAdmin = sessionRole === "admin";

  if (!isAdmin && !isOwner) {
    alert("Anda tidak memiliki izin untuk hard delete data ini.");
    return;
  }

  if (!confirm("⚠ PERMANEN! Yakin ingin HARD DELETE?")) return;

  jsonBox.style.display = "block";
  jsonBox.textContent = "⏳ Hard deleting...";

  const url = `${API_URL}?mode=delete&id=${id}&token=${token}`;
  const j = await getJSON(url);

  jsonBox.textContent = JSON.stringify(j, null, 2);

  if (j.status === "success") {
    alert("Data terhapus permanen.");

    if (isOwner) {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    location.href = "dashboard.html";
  }
}


/* -------------------------
   9. SHOW “Hapus Akun Saya”
---------------------------- */
window.onload = () => {
  const selfBtn = document.getElementById("btnSelfDelete");

  if (!selfBtn) return;

  if (id === sessionId) {
    selfBtn.style.display = "block";
  } else {
    selfBtn.style.display = "none";
  }
};


/* -------------------------
   10. USER SELF DELETE BUTTON
---------------------------- */
async function deleteMyAccount() {
  if (id !== sessionId) {
    alert("Ini bukan akun Anda.");
    return;
  }

  if (!confirm("⚠ PERMANEN! Hapus akun Anda sendiri?")) return;

  const url = `${API_URL}?mode=delete&id=${sessionId}&token=${token}`;
  const j = await getJSON(url);

  jsonBox.style.display = "block";
  jsonBox.textContent = JSON.stringify(j, null, 2);

  if (j.status === "success") {
    alert("Akun Anda berhasil dihapus.");
    localStorage.removeItem("familyUser");
    location.href = "login.html";
  }
}
