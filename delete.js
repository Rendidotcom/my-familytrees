/* ============================================================
   DELETE.JS — FINAL CLEAN VERSION (NO DUPLICATES)
   - Admin: lihat semua user + delete siapa saja
   - User biasa: hanya lihat diri sendiri + hanya delete self
   - API sync GAS sheet1
   - Safe confirm
   - Auto logout ketika self-delete
============================================================= */

/**************************************************************
 * 0. SESSION CHECK
 **************************************************************/
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi berakhir, silakan login kembali.");
  location.href = "login.html";
}

const token = session.token;
const sessionId = String(session.id);
const isAdmin = session.role === "admin";

/**************************************************************
 * 1. UI ELEMENTS
 **************************************************************/
const tbody = document.querySelector("#userTable tbody");
const loader = document.querySelector("#loader");
const btnRefresh = document.querySelector("#btnRefresh");
const btnDeleteSelected = document.querySelector("#btnDeleteSelected");
const btnDeleteAll = document.querySelector("#btnDeleteAll");

function setLoading(on) {
  loader.style.display = on ? "block" : "none";
  btnRefresh.disabled = on;
  btnDeleteSelected.disabled = on;
  btnDeleteAll.disabled = on;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**************************************************************
 * 2. SAFE JSON FETCH
 **************************************************************/
async function safeGetJSON(url) {
  try {
    const r = await fetch(url);
    const t = await r.text();
    try {
      return JSON.parse(t);
    } catch (e) {
      return { status: "error", message: "Invalid JSON", raw: t };
    }
  } catch (err) {
    return { status: "error", message: String(err) };
  }
}

/**************************************************************
 * 3. LOAD USERS (ADMIN: semua, USER: hanya diri sendiri)
 **************************************************************/
async function loadUsers() {
  setLoading(true);
  tbody.innerHTML =
    `<tr><td colspan="4" style="text-align:center;padding:10px;color:#444">Memuat data...</td></tr>`;

  const url = `${API_URL}?mode=getData&ts=${Date.now()}`;
  const res = await safeGetJSON(url);

  if (!res || res.status !== "success" || !Array.isArray(res.data)) {
    tbody.innerHTML =
      `<tr><td colspan="4" style='text-align:center;padding:10px;color:red'>Gagal memuat data</td></tr>`;
    setLoading(false);
    return;
  }

  let users = res.data;

  if (!isAdmin) {
    users = users.filter(u => String(u.id) === sessionId);
  }

  if (!users.length) {
    tbody.innerHTML =
      `<tr><td colspan="4" style='text-align:center;padding:10px;'>Tidak ada data.</td></tr>`;
    setLoading(false);
    return;
  }

  tbody.innerHTML = "";

  users.forEach(u => {
    const id = String(u.id);
    const name = escapeHtml(u.name || u.nama || "-");
    const email = escapeHtml(u.email || "-");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="chkUser" value="${id}"></td>
      <td style='font-family:monospace'>${id}</td>
      <td>${name}</td>
      <td>${email}</td>
    `;
    tbody.appendChild(tr);
  });

  // hide delete-all for normal users
  if (!isAdmin) btnDeleteAll.style.display = "none";

  setLoading(false);
}

/**************************************************************
 * 4. DELETE FUNCTION
 **************************************************************/
async function deleteById(id) {
  const url = `${API_URL}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
  return await safeGetJSON(url);
}

/**************************************************************
 * 5. DELETE SELECTED
 **************************************************************/
async function deleteSelected() {
  const selected = [...document.querySelectorAll(".chkUser:checked")].map(c => c.value);

  if (!selected.length) {
    alert("Pilih user terlebih dahulu.");
    return;
  }

  // User biasa: hanya boleh hapus dirinya sendiri
  if (!isAdmin) {
    if (selected.length > 1 || selected[0] !== sessionId) {
      alert("Anda hanya dapat menghapus akun Anda sendiri.");
      return;
    }
  }

  if (!confirm(`Yakin ingin menghapus ${selected.length} akun?`)) return;

  setLoading(true);

  for (const id of selected) {
    const res = await deleteById(id);

    if (id === sessionId && res.status === "success") {
      alert("Akun Anda telah dihapus. Anda akan logout.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }
  }

  alert("Penghapusan selesai.");
  await loadUsers();
  setLoading(false);
}

/**************************************************************
 * 6. DELETE ALL (ADMIN ONLY)
 **************************************************************/
async function deleteAll() {
  if (!isAdmin) {
    alert("Hanya admin yang boleh menghapus semua user.");
    return;
  }

  const allIds = [...document.querySelectorAll(".chkUser")].map(c => c.value);
  if (!allIds.length) {
    alert("Tidak ada user.");
    return;
  }

  if (!confirm(`Yakin ingin menghapus SEMUA (${allIds.length}) user?`)) return;

  setLoading(true);

  for (const id of allIds) {
    const res = await deleteById(id);

    if (id === sessionId && res.status === "success") {
      alert("Akun admin Anda ikut terhapus. Logout...");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }
  }

  alert("Semua user berhasil dihapus.");
  await loadUsers();
  setLoading(false);
}

/**************************************************************
 * 7. EVENTS
 **************************************************************/
btnRefresh.addEventListener("click", loadUsers);
btnDeleteSelected.addEventListener("click", deleteSelected);
btnDeleteAll.addEventListener("click", deleteAll);

/**************************************************************
 * 8. INIT
 **************************************************************/
loadUsers();
