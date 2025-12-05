/* ======================================================
   DELETE.JS — AUTO-DETECT VERSION (NO ID REQUIRED)
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

// ======================================================
// 2. AUTO-DETECT DOM ELEMENTS
// ======================================================
const tableBody = document.querySelector("#userTableBody");

function findButton(text) {
  return [...document.querySelectorAll("button")]
    .find(btn => btn.textContent.trim().toLowerCase() === text.toLowerCase());
}

const btnRefresh = findButton("Refresh Data");
const btnDeleteSelected = findButton("Hapus Terpilih");
const btnDeleteAll = findButton("Hapus Semua");

// Log jika tidak ketemu (tidak crash)
if (!btnRefresh) console.warn("WARNING: Tombol 'Refresh Data' tidak ditemukan");
if (!btnDeleteSelected) console.warn("WARNING: Tombol 'Hapus Terpilih' tidak ditemukan");
if (!btnDeleteAll) console.warn("WARNING: Tombol 'Hapus Semua' tidak ditemukan");

// ======================================================
// 3. LOAD USERS
// ======================================================
async function loadUsers() {
  try {
    tableBody.innerHTML = `
      <tr><td colspan="4" style="text-align:center;">Loading...</td></tr>
    `;

    const res = await fetch(`${API_URL}?mode=getUsers&token=${token}`);
    const data = await res.json();

    console.log("API Response:", data);

    if (!data || !data.status || !Array.isArray(data.users)) {
      throw new Error("Response tidak valid");
    }

    const users = myRole === "admin"
      ? data.users
      : data.users.filter(u => u.id === myId);

    renderTable(users);

  } catch (err) {
    console.error("LOAD ERROR:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:red;">
          Gagal memuat data user
        </td>
      </tr>
    `;
  }
}

// ======================================================
// 4. RENDER TABLE
// ======================================================
function renderTable(users) {
  if (!users.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;">
          Tidak ada user.
        </td>
      </tr>`;
    return;
  }

  tableBody.innerHTML = users.map(u => `
    <tr>
      <td><input type="checkbox" class="chkUser" value="${u.id}"></td>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
    </tr>
  `).join("");
}

// ======================================================
// 5. DELETE SELECTED
// ======================================================
async function deleteSelected() {
  const selected = [...document.querySelectorAll(".chkUser:checked")].map(x => x.value);
  if (!selected.length) return alert("Tidak ada user dipilih.");

  // User biasa hanya boleh hapus diri sendiri
  if (myRole !== "admin" && !selected.includes(myId)) {
    return alert("Anda hanya boleh menghapus akun Anda sendiri.");
  }

  if (!confirm("Hapus user yang dipilih?")) return;

  await fetch(`${API_URL}?mode=deleteUser&token=${token}&id=${selected.join(",")}`);

  // Auto logout jika hapus diri sendiri
  if (selected.includes(myId)) {
    localStorage.removeItem("familyUser");
    alert("Akun Anda telah dihapus.");
    return location.href = "login.html";
  }

  loadUsers();
}

// ======================================================
// 6. DELETE ALL (ADMIN ONLY)
// ======================================================
async function deleteAll() {
  if (myRole !== "admin") return alert("Akses ditolak.");

  if (!confirm("⚠ Menghapus semua user?")) return;

  await fetch(`${API_URL}?mode=deleteAllUsers&token=${token}`);

  alert("Semua user dihapus.");
  loadUsers();
}

// ======================================================
// 7. EVENT LISTENERS (AUTO)
// ======================================================
btnRefresh?.addEventListener("click", loadUsers);
btnDeleteSelected?.addEventListener("click", deleteSelected);
btnDeleteAll?.addEventListener("click", deleteAll);

// Load awal
loadUsers();
