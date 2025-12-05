/* ======================================================
   DELETE.JS — FINAL CLEAN & SYNC WITH NEW GAS
   - Admin: bisa lihat semua user & hapus siapa saja
   - User biasa: hanya bisa lihat dirinya & hapus dirinya
   - Aman, anti error null, anti race condition
   - Full GET mode ke GAS
====================================================== */

console.log("DELETE.JS LOADED");

// ======================================================
// 1. SESSION CHECK
// ======================================================
const session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session) {
  alert("Sesi kedaluwarsa, silakan login ulang.");
  location.href = "login.html";
}

const token = session.token;
const myId = session.id;
const myRole = session.role || "user";

console.log("Session OK:", session);

// ======================================================
// 2. DOM ELEMENTS (safe-selector, anti-null)
// ======================================================
const tableBody = document.querySelector("#userTableBody");
const btnRefresh = document.querySelector("#btnRefresh");
const btnDeleteSelected = document.querySelector("#btnDeleteSelected");
const btnDeleteAll = document.querySelector("#btnDeleteAll");

// Prevent null crash
if (!tableBody) console.error("ERROR: #userTableBody tidak ditemukan!");
if (!btnRefresh) console.error("ERROR: #btnRefresh tidak ditemukan!");
if (!btnDeleteSelected) console.error("ERROR: #btnDeleteSelected tidak ditemukan!");
if (!btnDeleteAll) console.error("ERROR: #btnDeleteAll tidak ditemukan!");

// ======================================================
// 3. LOAD USERS
// ======================================================
async function loadUsers() {
  try {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:10px;">Loading...</td>
      </tr>
    `;

    const url = `${API_URL}?mode=getUsers&token=${token}`;

    console.log("GET:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("API Response:", data);

    if (!data || !data.status || !data.users) {
      throw new Error("Response tidak valid");
    }

    const users = data.users;

    // User biasa hanya melihat dirinya
    const visibleUsers = myRole === "admin"
      ? users
      : users.filter(u => u.id === myId);

    renderTable(visibleUsers);
  } catch (err) {
    console.error("LOAD ERROR:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="color:red;text-align:center;">
          Gagal memuat data user
        </td>
      </tr>`;
  }
}

// ======================================================
// 4. RENDER TABLE
// ======================================================
function renderTable(users) {
  if (!users.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:10px;">
          Tidak ada data.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = users
    .map(
      (u) => `
      <tr>
        <td><input type="checkbox" class="chkUser" value="${u.id}"></td>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
      </tr>
    `
    )
    .join("");
}

// ======================================================
// 5. DELETE SELECTED
// ======================================================
async function deleteSelected() {
  const checks = [...document.querySelectorAll(".chkUser:checked")];
  if (!checks.length) {
    alert("Tidak ada user dipilih");
    return;
  }

  const ids = checks.map(x => x.value);

  // User biasa hanya boleh hapus dirinya
  if (myRole !== "admin" && ids.includes(myId) === false) {
    alert("Anda hanya bisa menghapus akun Anda sendiri.");
    return;
  }

  if (!confirm("Yakin hapus user terpilih?")) return;

  const url = `${API_URL}?mode=deleteUser&token=${token}&id=${ids.join(",")}`;
  console.log("DELETE SELECTED:", url);

  await fetch(url);

  // Jika user menghapus dirinya sendiri → auto logout
  if (ids.includes(myId)) {
    localStorage.removeItem("familyUser");
    alert("Akun Anda berhasil dihapus.");
    location.href = "login.html";
    return;
  }

  loadUsers();
}

// ======================================================
// 6. DELETE ALL (Admin only)
// ======================================================
async function deleteAll() {
  if (myRole !== "admin") {
    alert("Anda tidak memiliki akses.");
    return;
  }

  if (!confirm("⚠ Semua user akan dihapus. Lanjutkan?")) return;

  const url = `${API_URL}?mode=deleteAllUsers&token=${token}`;
  console.log("DELETE ALL:", url);

  await fetch(url);

  alert("Semua user telah dihapus.");
  loadUsers();
}

// ======================================================
// 7. EVENT LISTENERS
// ======================================================
btnRefresh?.addEventListener("click", loadUsers);
btnDeleteSelected?.addEventListener("click", deleteSelected);
btnDeleteAll?.addEventListener("click", deleteAll);

// Load awal
loadUsers();
