/* ================================
   DELETE.JS — FINAL STABLE
================================ */

const user = getSession();
if (!user) {
  location.href = "login.html";
}

const token = user.token;
const memberId = new URLSearchParams(location.search).get("id");

const detailBox = document.getElementById("detail");
const output = document.getElementById("jsonOutput");
const msg = document.getElementById("msg");

const btnSoft = document.getElementById("btnSoft");
const btnHard = document.getElementById("btnHard");
const btnSelf = document.getElementById("btnSelf");


/* ================================
   1. LOAD DETAIL
================================ */
async function loadDetail() {
  detailBox.innerHTML = "Memuat...";

  const url = `${API_URL}?mode=getById&id=${memberId}&token=${token}`;

  const r = await fetch(url);
  const j = await r.json();

  if (!j || !j.data) {
    detailBox.innerHTML = "<b style='color:red'>Data tidak ditemukan.</b>";
    return;
  }

  const m = j.data;

  detailBox.innerHTML = `
    <b>ID:</b> ${m.ID}<br>
    <b>Nama:</b> ${m.name}<br>
    <b>Status:</b> ${m.status}<br>
  `;
}


/* ================================
   2. ATUR TOMBOL SESUAI ROLE
================================ */
function applyRole() {
  const isAdmin = user.role === "admin";
  const isSelf = user.id === memberId;

  // Admin: full akses
  if (isAdmin) {
    btnSoft.style.display = "inline-block";
    btnHard.style.display = "inline-block";
    return;
  }

  // User biasa hanya boleh hapus akun sendiri
  if (isSelf) {
    btnSelf.style.display = "inline-block";
  } else {
    msg.textContent = "Anda tidak boleh menghapus user lain.";
  }
}


/* ================================
   3. SOFT DELETE (admin)
================================ */
async function softDelete() {
  if (!confirm("Soft delete?")) return;

  output.style.display = "block";
  output.textContent = "⏳ Soft deleting...";

  const url = `${API_URL}?mode=softDelete&id=${memberId}&token=${token}`;
  const r = await fetch(url);
  const j = await r.json();

  output.textContent = JSON.stringify(j, null, 2);

  if (j.status === "success") {
    alert("Soft delete berhasil.");
    location.href = "dashboard.html";
  }
}


/* ================================
   4. HARD DELETE (admin)
================================ */
async function hardDelete() {
  if (!confirm("Hapus permanen?")) return;

  output.style.display = "block";
  output.textContent = "⏳ Hard deleting...";

  const url = `${API_URL}?mode=delete&id=${memberId}&token=${token}`;
  const r = await fetch(url);
  const j = await r.json();

  output.textContent = JSON.stringify(j, null, 2);

  if (j.status === "success") {
    alert("Data terhapus permanen.");
    location.href = "dashboard.html";
  }
}


/* ================================
   5. USER DELETE DIRI SENDIRI
================================ */
async function deleteSelf() {
  if (!confirm("Hapus akun Anda sendiri?")) return;

  output.style.display = "block";
  output.textContent = "⏳ Menghapus akun...";

  const url = `${API_URL}?mode=delete&id=${user.id}&token=${token}`;
  const r = await fetch(url);
  const j = await r.json();

  output.textContent = JSON.stringify(j, null, 2);

  if (j.status === "success") {
    alert("Akun Anda telah dihapus.");
    clearSession();
    location.href = "login.html";
  }
}


/* ================================
   EVENT LISTENERS
================================ */
btnSoft.onclick = softDelete;
btnHard.onclick = hardDelete;
btnSelf.onclick = deleteSelf;


/* ================================
   GO
================================ */
loadDetail();
applyRole();
