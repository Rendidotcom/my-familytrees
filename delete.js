/**************************************************************
 🌳 DELETE.JS — FINAL ANTI ERROR (2025)
 - Aman dari benturan DOM null
 - Aman dari double-session
 - Validasi token + role
 - User hanya bisa hapus diri sendiri
 - Admin bisa hapus siapa saja
 - Sinkron GAS mode=delete (GET)
**************************************************************/

console.log("DELETE.JS LOADED");

/* ---------------------------------------------
   1. LOAD SESSION SAFELY
--------------------------------------------- */
let session = null;
try {
  session = JSON.parse(localStorage.getItem("familyUser") || "null");
} catch (err) {
  console.error("SESSION PARSE ERROR:", err);
  session = null;
}

if (!session || !session.token) {
  alert("Sesi berakhir. Silakan login lagi.");
  location.href = "login.html";
}
const TOKEN = session.token;
const SESSION_ID = session.id;
const SESSION_ROLE = session.role || "user";

console.log("SESSION LOADED:", session);

/* ---------------------------------------------
   2. GET PARAMETER ID
--------------------------------------------- */
function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const targetId = getParam("id");
console.log("TARGET ID:", targetId);

if (!targetId) {
  alert("ID tidak ditemukan.");
  location.href = "index.html";
}

/* ---------------------------------------------
   3. LOAD UI ELEMENTS SAFELY
--------------------------------------------- */
function safeEl(id){
  return document.getElementById(id) || null;
}

const elInfo = safeEl("deleteInfo");
const elBtn = safeEl("btnDelete");

if (elInfo) elInfo.innerHTML = "Memuat data...";
if (elBtn) elBtn.disabled = true;

/* ---------------------------------------------
   4. VALIDASI HAK AKSES
--------------------------------------------- */
if (SESSION_ROLE !== "admin" && targetId !== SESSION_ID) {
  if (elInfo) elInfo.innerHTML =
    `<span style="color:red">Kamu tidak punya izin menghapus data ini.</span>`;
  throw new Error("FORBIDDEN DELETE: user mencoba menghapus akun orang lain");
}

/* ---------------------------------------------
   5. LOAD DATA USER (mode=getone)
--------------------------------------------- */
async function loadUser(){
  try {
    const res = await fetch(`${API_URL}?mode=getone&id=${targetId}`);
    const json = await res.json();
    console.log("GETONE RESULT:", json);

    if (!json || json.status !== "success") {
      if (elInfo) elInfo.innerHTML = "Data tidak ditemukan.";
      return;
    }

    const d = json.data;

    if (elInfo) {
      elInfo.innerHTML = `
        <b>Nama:</b> ${d.name} <br>
        <b>ID:</b> ${d.id} <br>
        <b>Status:</b> ${d.status}
      `;
    }

    if (elBtn) elBtn.disabled = false;

  } catch (err) {
    console.error("LOAD USER ERROR:", err);
    if (elInfo) elInfo.innerHTML = "Gagal memuat data.";
  }
}

loadUser();

/* ---------------------------------------------
   6. HANDLE DELETE (GET mode=delete)
--------------------------------------------- */
async function doDelete(){
  if (!confirm("Yakin ingin menghapus data ini?")) return;

  try {
    const url = `${API_URL}?mode=delete&id=${targetId}&token=${TOKEN}`;
    console.log("DELETE URL:", url);

    const res = await fetch(url);
    const json = await res.json();

    console.log("DELETE RESULT:", json);

    if (!json || json.status !== "success") {
      alert("Gagal menghapus: " + (json.message || "unknown"));
      return;
    }

    alert("Berhasil dihapus!");

    // AUTO LOGOUT bila hapus diri sendiri
    if (targetId === SESSION_ID) {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    // admin → kembali ke index
    location.href = "index.html";

  } catch (err) {
    console.error("DELETE ERROR:", err);
    alert("Terjadi kesalahan jaringan.");
  }
}

/* ---------------------------------------------
   7. REGISTER BUTTON EVENT SAFELY
--------------------------------------------- */
if (elBtn) {
  elBtn.addEventListener("click", () => {
    console.log("DELETE CLICKED");
    doDelete();
  });
}
