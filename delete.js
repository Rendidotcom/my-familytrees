/* ============================================================
   DELETE.JS — FINAL ROLE-BASED + SELF/ADMIN DELETE + UI SAFE CONFIRM
============================================================= */

/* -------------------------
   1. SESSION CHECK
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi Anda berakhir. Silakan login kembali.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;
const sessionRole = session.role || "user"; // admin / user

/* -------------------------
   2. DOM ELEMENTS
---------------------------- */
const tbody = document.querySelector("#userTable tbody");
const loader = document.getElementById("loader");
const btnRefresh = document.getElementById("btnRefresh");
const btnDeleteSelected = document.getElementById("btnDeleteSelected");
const btnDeleteAll = document.getElementById("btnDeleteAll");

/* -------------------------
   3. LOADER CONTROL
---------------------------- */
function showLoader() {
  loader.style.display = "block";
}
function hideLoader() {
  loader.style.display = "none";
}

/* -------------------------
   4. FETCH DATA USERS
---------------------------- */
async function loadUsers() {
  showLoader();

  try {
    const res = await fetch(`${API_URL}?mode=SELECT`, {
      method: "GET",
    });

    const json = await res.json();
    tbody.innerHTML = "";

    json.data.forEach((u) => {
      const row = document.createElement("tr");

      const disabled = sessionRole !== "admin" && u.id !== sessionId ? "disabled" : "";

      row.innerHTML = `
        <td><input type="checkbox" class="chkUser" value="${u.id}" ${disabled}></td>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    alert("Gagal memuat data user!");
  }

  hideLoader();
}
loadUsers();

/* -------------------------
   5. CONFIRM SAFE
---------------------------- */
async function confirmDelete(msg) {
  return new Promise((resolve) => {
    const ok = confirm(msg);
    resolve(ok);
  });
}

/* -------------------------
   6. DELETE REQUEST
---------------------------- */
async function deleteUsers(ids) {
  showLoader();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "DELETE",
        token,
        ids,
      }),
    });

    const json = await res.json();
    console.log("Delete results", json);

    hideLoader();
    return json;
  } catch (err) {
    hideLoader();
    alert("Terjadi kesalahan pada server.");
    return null;
  }
}

/* -------------------------
   7. DELETE SELECTED
---------------------------- */
btnDeleteSelected.onclick = async () => {
  const selected = [...document.querySelectorAll(".chkUser:checked")].map(
    (c) => c.value
  );

  if (selected.length === 0) return alert("Tidak ada user yang dipilih.");

  // Role-based: user biasa hanya boleh delete dirinya sendiri
  if (sessionRole !== "admin") {
    if (selected.length > 1 || selected[0] !== sessionId) {
      return alert("Anda tidak memiliki izin menghapus user lain.");
    }
  }

  const ok = await confirmDelete(`Hapus ${selected.length} user?`);
  if (!ok) return;

  const result = await deleteUsers(selected);
  if (!result) return;

  // Auto logout jika user menghapus dirinya sendiri
  if (selected.includes(sessionId.toString())) {
    alert("Akun Anda berhasil dihapus. Anda akan logout.");
    localStorage.removeItem("familyUser");
    return (location.href = "login.html");
  }

  alert("User berhasil dihapus.");
  loadUsers();
};

/* -------------------------
   8. DELETE ALL (ADMIN ONLY)
---------------------------- */
btnDeleteAll.onclick = async () => {
  if (sessionRole !== "admin") return alert("Fitur ini hanya untuk admin.");

  const allIds = [...document.querySelectorAll(".chkUser")].map(
    (c) => c.value
  );

  if (allIds.length === 0) return alert("Tidak ada user dalam daftar.");

  const ok = await confirmDelete(`Anda yakin ingin menghapus SEMUA user (${allIds.length})?`);
  if (!ok) return;

  const result = await deleteUsers(allIds);
  if (!result) return;

  alert("Semua user berhasil dihapus.");
  loadUsers();
};

/* -------------------------
   9. REFRESH BUTTON
---------------------------- */
btnRefresh.onclick = loadUsers;
/* ============================================================
   delete.js — FINAL SINKRON / ROLE-BASED / GAS READY
   - Auto detect session
   - User non-admin hanya bisa delete dirinya sendiri
   - Admin bisa delete siapa saja
   - Konfirmasi aman
   - Auto logout jika self-delete
   ============================================================ */

/**************************************************************
 * 0. SESSION CHECK
 **************************************************************/
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi berakhir, silakan login kembali.");
  location.href = "login.html";
}

const token = session.token;
const sessionId = session.id;
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
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:10px;color:#444">Memuat data...</td></tr>`;

  const url = `${API_URL}?mode=getData&ts=${Date.now()}`;
  const res = await safeGetJSON(url);

  if (!res || res.status !== "success" || !Array.isArray(res.data)) {
    tbody.innerHTML = `<tr><td colspan="4" style='text-align:center;padding:10px;color:red'>Gagal memuat data</td></tr>`;
    setLoading(false);
    return;
  }

  let users = res.data;

  // USER BIASA → hanya lihat dirinya
  if (!isAdmin) {
    users = users.filter(u => String(u.id) === String(sessionId));
  }

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4" style='text-align:center;padding:10px;'>Tidak ada data.</td></tr>`;
    setLoading(false);
    return;
  }

  tbody.innerHTML = "";

  users.forEach(u => {
    const id = u.id || "";
    const name = escapeHtml(u.name || u.nama || "-");
    const email = escapeHtml(u.email || "-");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style='width:1%'>
        <input type="checkbox" class="chkUser" value="${id}">
      </td>
      <td style='font-family:monospace'>${id}</td>
      <td>${name}</td>
      <td>${email}</td>
    `;
    tbody.appendChild(tr);
  });

  // USER BIASA → tidak boleh delete-all
  if (!isAdmin) {
    btnDeleteAll.style.display = "none";
  }

  setLoading(false);
}

/**************************************************************
 * 4. DELETE FUNCTION (GET MODE=delete)
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

  // USER NON-ADMIN: hanya boleh delete diri sendiri
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
  loadUsers();
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
  loadUsers();
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
