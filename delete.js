/* ============================================================
   DELETE.JS — FINAL SYNC, SUPPORT USER DELETE OWN ACCOUNT
   Improved Version — Reliability + UI/UX Fix + Error Handling
============================================================= */

/* -------------------------
   1. SESSION CHECK
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;
const isAdmin = session.role === "admin";

/* -------------------------
   2. API URL
---------------------------- */
const API_URL = window.API_URL || "";
if (!API_URL) console.warn("⚠ API_URL kosong! Pastikan global API_URL sudah didefinisikan.");

/* -------------------------
   3. PARAM ID
---------------------------- */
const id = new URLSearchParams(location.search).get("id");
const detailBox = document.getElementById("detail");
const jsonBox = document.getElementById("jsonOutput");

if (!id) {
  detailBox.innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("Missing ID");
}

/* -------------------------
   4. Simple Fetch Handler
---------------------------- */
async function getJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) {
      return { status: "error", message: "HTTP " + r.status };
    }
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

  const d =
    json.data ||
    json.member ||
    json.row ||
    json.item ||
    json.result ||
    json;

  if (!d) return null;

  d._id = d.id || d.ID || d.Id || d._id || null;
  return d;
}

/* -------------------------
   6. LOAD DETAIL
---------------------------- */
async function loadDetail() {
  detailBox.innerHTML = "⏳ Memuat data...";
  jsonBox.style.display = "none";

  const url = `${API_URL}?mode=getById&id=${id}&token=${token}`;
  const raw = await getJSON(url);

  // Forbidden — tetap tampilkan JSON agar mudah debug
  if (raw.status === "error" && raw.message === "Forbidden") {
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
   8. HARD DELETE (ADMIN or SELF)
---------------------------- */
async function hardDelete() {
  const isOwner = id === sessionId;

  if (!isAdmin && !isOwner) {
    alert("Anda tidak memiliki izin melakukan hard delete data ini.");
    return;
  }

  if (!confirm("⚠ PERMANEN!\nYakin ingin HARD DELETE?")) return;

  jsonBox.style.display = "block";
  jsonBox.textContent = "⏳ Hard deleting...";

  const url = `${API_URL}?mode=delete&id=${id}&token=${token}`;
  const j = await getJSON(url);

  jsonBox.textContent = JSON.stringify(j, null, 2);

  if (j.status === "success") {
    alert("Data terhapus permanen.");

    // jika user menghapus dirinya sendiri
    if (isOwner) {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    location.href = "dashboard.html";
  }
}

/* -------------------------
   9. SHOW SELF-DELETE BUTTON
---------------------------- */
window.onload = () => {
  const selfBtn = document.getElementById("deleteSelfBtn");
  if (!selfBtn) return;

  // hanya tampilkan saat id == session id
  selfBtn.style.display = id === sessionId ? "block" : "none";
};
