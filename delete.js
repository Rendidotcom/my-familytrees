/* ============================================================
   DELETE.JS — REPAIR VERSION (FULL JSON + TOKEN + SYNC ROUTE)
   - Fully compatible with your 800 lines code.gs
   - Admin: bisa lihat semua user
   - User biasa: hanya lihat diri sendiri
   - POST JSON only (no FormData)
============================================================= */

/**************************************************************
 * 0. SESSION CHECK
 **************************************************************/
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi habis. Silakan login ulang.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;

/**************************************************************
 * 1. UI ELEMENTS
 **************************************************************/
const tableBody = document.getElementById("delete-list");
const btnDelete = document.getElementById("btn-delete");
let selectedId = null;

/**************************************************************
 * 2. LOAD DATA FROM SERVER
 **************************************************************/
async function loadData() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ mode: "list" }) // sesuai code.gs
    });

    const json = await res.json();
    if (!json.success) {
      alert("Gagal memuat data!");
      return;
    }

    renderTable(json.data);
  } catch (err) {
    console.error(err);
    alert("Error mengambil data.");
  }
}

function renderTable(data) {
  tableBody.innerHTML = "";
  selectedId = null;
  btnDelete.disabled = true;

  data.forEach((item) => {
    // Hak akses:
    // admin = bisa melihat semua
    // user biasa = hanya lihat dirinya sendiri
    if (session.role !== "admin" && item.id !== sessionId) return;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-red-50 cursor-pointer";
    tr.dataset.id = item.id;

    tr.innerHTML = `
      <td class="px-4 py-2 border">${item.id}</td>
      <td class="px-4 py-2 border">${item.nama}</td>
      <td class="px-4 py-2 border">${item.domisili}</td>
      <td class="px-4 py-2 border">${item.status}</td>
    `;

    tr.addEventListener("click", () => {
      document.querySelectorAll("tr").forEach(r => r.classList.remove("bg-red-200"));
      tr.classList.add("bg-red-200");
      selectedId = item.id;
      btnDelete.disabled = false;
    });

    tableBody.appendChild(tr);
  });
}

loadData();

/**************************************************************
 * 3. DELETE USER
 **************************************************************/
btnDelete.addEventListener("click", async () => {
  if (!selectedId) return;

  const allow = confirm(`Hapus data dengan ID: ${selectedId}?`);
  if (!allow) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        mode: "delete",     // PENTING: sesuai code.gs
        id: selectedId
      })
    });

    const json = await res.json();
    if (!json.success) {
      alert("Gagal menghapus data!");
      return;
    }

    alert("Data berhasil dihapus!");

    // Jika user menghapus dirinya sendiri:
    if (selectedId === sessionId) {
      alert("Akun Anda telah dihapus. Anda akan logout.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    // Reload table
    loadData();

  } catch (err) {
    console.error(err);
    alert("Error menghapus data.");
  }
});
