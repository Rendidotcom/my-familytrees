/* ============================================================
   DELETE.JS — FINAL SYNC WITH NEW GAS API
   - Admin: lihat semua user + hapus siapa saja
   - User: hanya bisa lihat diri sendiri + hapus dirinya sendiri
   - Full sync dengan GAS: getdata/list + POST delete
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
const sessionRole = session.role || "user";

/* -------------------------
   2. DOM references
---------------------------- */
const tableBody = document.getElementById("userTableBody");
const btnRefresh = document.getElementById("btnReload");
const statusBox = document.getElementById("statusBox");

if (!tableBody) console.error("ERROR: #userTableBody tidak ditemukan!");
if (!btnRefresh) console.warn("WARNING: #btnReload tidak ditemukan (bukan error fatal)");
if (!statusBox) console.warn("WARNING: #statusBox tidak ditemukan (optional)");

/* -------------------------
   3. HELPER: API BASE URL
---------------------------- */
const API_URL = "YOUR_GAS_URL_HERE";  // Ganti dengan URL GAS yang benar

/* -------------------------
   4. LOAD USERS
---------------------------- */
async function loadUsers() {
  try {
    if (statusBox) statusBox.innerText = "Loading...";

    const res = await fetch(`${API_URL}?mode=getdata`);
    const json = await res.json();

    if (!json || !json.data) throw new Error("Response tidak valid");

    let data = json.data;

    // User biasa: hanya lihat dirinya sendiri
    if (sessionRole !== "admin") {
      data = data.filter(u => String(u.id) === String(sessionId));
    }

    renderTable(data);

    if (statusBox) statusBox.innerText = "Loaded";

  } catch (err) {
    console.error("LOAD ERROR:", err);
    if (statusBox) statusBox.innerText = "Load error!";
  }
}

/* -------------------------
   5. RENDER TABLE
---------------------------- */
function renderTable(list) {
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!list || list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5">Tidak ada data</td></tr>`;
    return;
  }

  list.forEach((u, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${u.name}</td>
      <td>${u.relationship || "-"}</td>
      <td>${u.role}</td>
      <td>
        <button class="btnDelete" data-id="${u.id}">Delete</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  document.querySelectorAll(".btnDelete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      confirmDelete(id);
    });
  });
}

/* -------------------------
   6. CONFIRM DELETE
---------------------------- */
function confirmDelete(id) {
  if (!id) return;

  // User biasa hanya boleh hapus dirinya sendiri
  if (sessionRole !== "admin" && String(sessionId) !== String(id)) {
    alert("Anda tidak boleh menghapus user lain.");
    return;
  }

  const ok = confirm("Yakin ingin menghapus? tindakan ini permanen.");
  if (!ok) return;

  deleteUser(id);
}

/* -------------------------
   7. DELETE USER (POST)
---------------------------- */
async function deleteUser(id) {
  try {
    if (statusBox) statusBox.innerText = "Deleting...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: id,
        token: token
      })
    });

    const json = await res.json();

    if (json.status !== "success") {
      alert("Gagal: " + json.message);
      return;
    }

    // Jika user menghapus dirinya sendiri → logout otomatis
    if (String(id) === String(sessionId)) {
      alert("Akun Anda telah dihapus. Anda akan logout.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    alert("Berhasil dihapus.");
    loadUsers();

  } catch (err) {
    console.error("DELETE ERROR:", err);
    alert("Terjadi error saat delete");
  }
}

/* -------------------------
   8. REFRESH BUTTON
---------------------------- */
if (btnRefresh) {
  btnRefresh.addEventListener("click", loadUsers);
}

/* -------------------------
   9. AUTO LOAD
---------------------------- */
loadUsers();
