/* ============================================================
   DELETE.JS — FINAL WORKING VERSION (SYNC GAS SHEET1)
   - Admin : lihat semua user (mode=getAll)
   - User biasa : hanya lihat dirinya sendiri (mode=getdata)
   - FULL COMPATIBLE dengan GAS endpoint Anda
============================================================= */

/**************************************************************
 * 0. SESSION CHECK
 **************************************************************/
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi habis. Silakan login.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;
const role = session.role || "user";

/**************************************************************
 * 1. KONFIG API
 **************************************************************/
const API_URL =
  "https://script.google.com/macros/s/AKfycbxZrjgvYfCE5Z23gxBgwge8J2X8wKBSLWR7CvRKaX4b5bQ6qEI95VMZEfXLQzlngZ/execc";

/**************************************************************
 * 2. ELEMEN DOM
 **************************************************************/
const tbody = document.getElementById("tbody");
const logBox = document.getElementById("clientLog");

/**************************************************************
 * 3. LOG HELPER
 **************************************************************/
function addLog(text) {
  logBox.value += text + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

/**************************************************************
 * 4. LOAD DATA AWAL
 **************************************************************/
async function loadData() {
  tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
  addLog("Load data…");

  let mode = role === "admin" ? "getAll" : "getdata";

  const url = `${API_URL}?mode=${mode}&token=${token}`;
  addLog("Fetch: " + url);

  try {
    const res = await fetch(url);
    const text = await res.text();
    addLog("Raw Response: " + text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="4">Gagal parsing JSON</td></tr>`;
      return;
    }

    if (!json || !json.data) {
      tbody.innerHTML = `<tr><td colspan="4">Gagal memuat data (data null)</td></tr>`;
      return;
    }

    const rows = Array.isArray(json.data) ? json.data : [json.data];

    renderTable(rows);
  } catch (err) {
    addLog("ERROR: " + err);
    tbody.innerHTML = `<tr><td colspan="4">Gagal memuat data (cek console)</td></tr>`;
  }
}

/**************************************************************
 * 5. TAMPILKAN TABEL
 **************************************************************/
function renderTable(rows) {
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4">Tidak ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td><input type="checkbox" class="chk" value="${r.id}"></td>
      <td>${r.id}</td>
      <td>${r.nama || ""}</td>
      <td>${r.domisili || ""}</td>
    </tr>`
    )
    .join("");
}

/**************************************************************
 * 6. DELETE AKSI
 **************************************************************/
document.getElementById("btnDelete").addEventListener("click", async () => {
  const ids = [...document.querySelectorAll(".chk:checked")].map((x) => x.value);

  if (!ids.length) {
    alert("Belum ada yang dipilih.");
    return;
  }

  if (!confirm("Yakin menghapus data terpilih?")) return;

  addLog("Delete: " + ids.join(", "));

  const fd = new FormData();
  fd.append("mode", "delete");
  fd.append("token", token);
  fd.append("ids", JSON.stringify(ids));

  try {
    const res = await fetch(API_URL, { method: "POST", body: fd });
    const text = await res.text();
    addLog("Delete Response: " + text);

    alert("Sukses dihapus.");
    loadData();
  } catch (err) {
    addLog("ERROR Delete: " + err);
    alert("Gagal hapus (lihat log).");
  }
});

/**************************************************************
 * 7. JALANKAN SAAT HALAMAN DIBUKA
 **************************************************************/
loadData();
addLog("READY…");
