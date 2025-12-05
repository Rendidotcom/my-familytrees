/* ============================================================
   DELETE.JS — FINAL VERSION (200+ lines)
   SUPPORT ADMIN + USER-SELF DELETE
   GAS SYNC — NO ERRORS
============================================================= */

/* ------------------------------------------------------------
   1. SESSION + CONFIG
------------------------------------------------------------- */
import { API_URL } from "./config.js";
import { requireLogin, logout } from "./auth.js";

const session = requireLogin();
if (!session) return;

const token = session.token;
const sessionId = session.id;
const sessionRole = session.role; // "admin" | "user"

console.log("SESSION:", session);
console.log("CONFIG API_URL:", API_URL);


/* ------------------------------------------------------------
   2. UI ELEMENTS
------------------------------------------------------------- */
const tableBody = document.getElementById("data-body");
const btnDeleteSelected = document.getElementById("btn-delete-selected");
const btnDeleteAll = document.getElementById("btn-delete-all");
const loading = document.getElementById("loading");


/* ------------------------------------------------------------
   3. BLOCK BUTTONS FOR NON-ADMIN
------------------------------------------------------------- */
if (sessionRole !== "admin") {
  btnDeleteAll.style.display = "none";
  btnDeleteSelected.style.display = "none";
}


/* ------------------------------------------------------------
   4. FETCH DATA DARI GAS
------------------------------------------------------------- */
async function loadData() {
  loading.style.display = "block";
  tableBody.innerHTML = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "getData", token })
    });

    const json = await res.json();
    console.log("GET DATA RAW: ", json);

    if (!json.success) throw new Error(json.message || "Gagal mengambil data");

    let rows = json.data;

    // ==========================
    // FILTER UNTUK ROLE USER BIASA
    // ==========================
    if (sessionRole !== "admin") {
      rows = rows.filter(r => String(r.id) === String(sessionId));
    }

    renderTable(rows);

  } catch (err) {
    console.error(err);
    alert("Gagal memuat data: " + err.message);
  } finally {
    loading.style.display = "none";
  }
}


/* ------------------------------------------------------------
   5. RENDER TABEL + UI
------------------------------------------------------------- */
function renderTable(rows) {
  tableBody.innerHTML = "";

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");

    const cbox = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "row-check";
    checkbox.dataset.id = row.id;

    // user biasa = HANYA 1 ROW = hide checkbox
    if (sessionRole !== "admin") {
      cbox.style.display = "none";
    }

    cbox.appendChild(checkbox);

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.id}</td>
      <td>${row.name}</td>
      <td>${row.email}</td>
      <td>${row.role}</td>
      <td>${row.timestamp || ""}</td>
    `;

    tr.prepend(cbox);
    tableBody.appendChild(tr);
  });
}


/* ------------------------------------------------------------
   6. DELETE: MENAMPUNG ID TERPILIH
------------------------------------------------------------- */
function getSelectedIds() {
  return Array.from(document.querySelectorAll(".row-check:checked"))
    .map(cb => cb.dataset.id);
}


/* ------------------------------------------------------------
   7. DELETE SELECTED
------------------------------------------------------------- */
btnDeleteSelected.addEventListener("click", async () => {
  if (sessionRole !== "admin") {
    alert("Akses ditolak — hanya admin.");
    return;
  }

  const ids = getSelectedIds();
  if (ids.length === 0) return alert("Pilih minimal satu data.");

  if (!confirm(`Hapus ${ids.length} data terpilih?`)) return;

  await deleteRequest(ids);
});


/* ------------------------------------------------------------
   8. DELETE ALL
------------------------------------------------------------- */
btnDeleteAll.addEventListener("click", async () => {
  if (sessionRole !== "admin") {
    alert("Akses ditolak — hanya admin.");
    return;
  }

  if (!confirm("Hapus SEMUA data?")) return;

  const allIds = Array.from(document.querySelectorAll(".row-check"))
    .map(cb => cb.dataset.id);

  await deleteRequest(allIds);
});


/* ------------------------------------------------------------
   9. SELF DELETE (AUTO UNTUK USER BIASA)
------------------------------------------------------------- */
document.getElementById("btn-delete-self")?.addEventListener("click", async () => {
  if (sessionRole !== "user") {
    alert("Admin tidak dapat menggunakan Self Delete.");
    return;
  }

  if (!confirm("Yakin hapus akun Anda sendiri?")) return;

  await deleteRequest([sessionId], true);
});


/* ------------------------------------------------------------
   10. FUNGSI DELETE REQUEST
------------------------------------------------------------- */
async function deleteRequest(idList, isSelf = false) {
  try {
    loading.style.display = "block";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        token,
        ids: idList
      })
    });

    const json = await res.json();
    console.log("DELETE RESULT:", json);

    if (!json.success) throw new Error(json.message || "Gagal menghapus data");

    alert("Berhasil menghapus " + idList.length + " data.");

    // Jika self delete → logout total
    if (isSelf) {
      localStorage.removeItem("familyUser");
      alert("Akun Anda telah dihapus.");
      location.href = "login.html";
      return;
    }

    // reload tabel
    await loadData();

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    loading.style.display = "none";
  }
}


/* ------------------------------------------------------------
   11. INIT LOAD
------------------------------------------------------------- */
loadData();
