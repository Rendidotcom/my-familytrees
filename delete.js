// ==============================
// DELETE.JS — CLEAN UI VERSION
// Sinkron dengan UI delete.html
// Support ADMIN: lihat semua, hapus banyak
// Support USER: hanya lihat diri sendiri & hapus akun sendiri
// Mode: GET only
// ==============================

console.log("DELETE.JS CLEAN LOADED");

// -------------------------------
// 1. LOAD SESSION
// -------------------------------
let session = null;
try {
  session = JSON.parse(localStorage.getItem("familyUser") || "null");
  console.log("SESSION LOADED:", session);
} catch (e) {
  console.error("SESSION PARSE ERROR", e);
}

if (!session) {
  alert("Sesi berakhir. Silakan login kembali.");
  location.href = "login.html";
}

const { id: sessionId, role, token } = session;

// -------------------------------
// 2. DOM TARGETS
// -------------------------------
const tableBody = document.getElementById("userTableBody");
const roleBadge = document.getElementById("roleBadge");

if (roleBadge) roleBadge.textContent = role.toUpperCase();

// -------------------------------
// 3. FETCH USER LIST
// -------------------------------
async function loadUsers() {
  console.log("LOAD USERS...");

  if (!tableBody) {
    console.error("TABEL BODY NULL");
    return;
  }

  tableBody.innerHTML =
    '<tr><td colspan="4" style="text-align:center">Memuat...</td></tr>';

  const url = `${API_URL}?mode=list&token=${token}`;
  console.log("[FETCH] →", url);

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !Array.isArray(data.users)) {
      throw new Error("Response tidak valid");
    }

    let users = data.users;

    // Jika USER → hanya tampilkan dirinya sendiri
    if (role !== "admin") {
      users = users.filter(u => u.id === sessionId);
    }

    // Jika hasil kosong
    if (users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:#666">Tidak ada data</td>
        </tr>`;
      return;
    }

    // Render
    tableBody.innerHTML = users
      .map(u => `
        <tr>
          <td><input type="checkbox" class="chkUser" value="${u.id}"></td>
          <td>${u.id}</td>
          <td>${u.name || "-"}</td>
          <td>${u.email || "-"}</td>
        </tr>
      `)
      .join("");
  } catch (e) {
    console.error("LOAD ERROR", e);
    tableBody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:red">Gagal memuat data</td></tr>';
  }
}

// -------------------------------
// 4. HAPUS TERPILIH
// -------------------------------
async function deleteSelected() {
  const items = [...document.querySelectorAll(".chkUser:checked")].map(
    el => el.value
  );

  if (items.length === 0) return alert("Tidak ada user yang dipilih.");

  // USER hanya boleh hapus dirinya sendiri
  if (role !== "admin") {
    if (items.length > 1 || items[0] !== sessionId) {
      return alert("Kamu hanya boleh menghapus akun milik sendiri.");
    }
  }

  if (!confirm(`Yakin ingin menghapus ${items.length} akun?`)) return;

  for (const uid of items) {
    await deleteUser(uid);
  }

  await loadUsers();
}

// -------------------------------
// 5. HAPUS SEMUA (ADMIN ONLY)
// -------------------------------
async function deleteAll() {
  if (role !== "admin") return alert("Akses ditolak.");
  if (!confirm("Hapus SEMUA user? Aksi tidak dapat dibatalkan!")) return;

  const allChk = [...document.querySelectorAll(".chkUser")].map(
    el => el.value
  );

  for (const uid of allChk) {
    await deleteUser(uid);
  }

  await loadUsers();
}

// -------------------------------
// 6. KIRIM DELETE KE GAS
// -------------------------------
async function deleteUser(uid) {
  const delURL = `${API_URL}?mode=delete&id=${uid}&token=${token}`;
  console.log("DELETE →", delURL);

  try {
    const res = await fetch(delURL);
    const out = await res.json();
    console.log("DELETE RESULT", out);

    if (out.success && uid === sessionId) {
      alert("Akunmu berhasil dihapus. Keluar...");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    }
  } catch (e) {
    console.error("DELETE ERROR", e);
  }
}

// -------------------------------
// 7. AUTO LOAD
// -------------------------------
document.addEventListener("DOMContentLoaded", loadUsers);

// Expose functions ke HTML
window.loadUsers = loadUsers;
window.deleteSelected = deleteSelected;
window.deleteAll = deleteAll;
