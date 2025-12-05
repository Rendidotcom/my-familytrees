console.log("DELETE.JS LOADED");

/* ============================================================
   0. SESSION CHECK
============================================================ */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi habis. Silakan login kembali.");
  location.href = "login.html";
}

const SESSION_ID = String(session.id);
const IS_ADMIN = session.role === "admin";
const TOKEN = session.token;

/* ============================================================
   1. UI HOOK
============================================================ */
const tbody = document.querySelector("#userTable tbody");
const loader = document.getElementById("loader");
const btnRefresh = document.getElementById("btnRefresh");
const btnDeleteSelected = document.getElementById("btnDeleteSelected");
const btnDeleteAll = document.getElementById("btnDeleteAll");

function setLoading(state) {
  loader.style.display = state ? "block" : "none";
  btnRefresh.disabled = state;
  btnDeleteSelected.disabled = state;
  btnDeleteAll.disabled = state;
}

/* ============================================================
   2. SAFE GET JSON + DEBUG
============================================================ */
async function debugGet(url) {
  console.log("%c[FETCH] URL:", "color:yellow", url);

  const res = await fetch(url);
  const text = await res.text();

  console.log("%c[RAW RESPONSE]", "color:cyan", text);

  try {
    const json = JSON.parse(text);
    console.log("%c[PARSED JSON]", "color:lime", json);
    return json;
  } catch (e) {
    console.log("%c[JSON ERROR]", "color:red", e);
    return { error: true, raw: text };
  }
}

/* ============================================================
   3. LOAD USERS
============================================================ */
async function loadUsers() {
  setLoading(true);
  tbody.innerHTML = `<tr><td colspan="4">Memuat data...</td></tr>`;

  const url = `${API_URL}?mode=list&token=${TOKEN}`;
  const res = await debugGet(url);

  if (!res || res.error) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="color:red">
        ERROR MEMUAT DATA:<br>${res.raw}
      </td></tr>`;
    setLoading(false);
    return;
  }

  if (res.status !== "success") {
    tbody.innerHTML = `
      <tr><td colspan="4" style="color:red">
         ${res.message || "Gagal load data"}
      </td></tr>`;
    setLoading(false);
    return;
  }

  let users = res.data;

  if (!IS_ADMIN) {
    users = users.filter(u => String(u.id) === SESSION_ID);
  }

  if (!Array.isArray(users) || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Tidak ada data.</td></tr>`;
    setLoading(false);
    return;
  }

  // RENDER TABEL
  tbody.innerHTML = "";
  users.forEach(u => {
    const row = `
      <tr>
        <td><input class="chkUser" type="checkbox" value="${u.id}"></td>
        <td>${u.id}</td>
        <td>${u.nama}</td>
        <td>${u.email}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", row);
  });

  if (!IS_ADMIN) btnDeleteAll.style.display = "none";

  setLoading(false);
}

/* ============================================================
   4. DELETE FUNCTION (DEBUG)
============================================================ */
async function deleteUser(id) {
  const url = `${API_URL}?mode=delete&id=${id}&token=${TOKEN}`;
  return await debugGet(url);
}

/* ============================================================
   5. DELETE SELECTED
============================================================ */
async function deleteSelected() {
  const selected = [...document.querySelectorAll(".chkUser:checked")].map(x => x.value);

  if (selected.length === 0) {
    alert("Tidak ada user dipilih.");
    return;
  }

  if (!IS_ADMIN && selected[0] !== SESSION_ID) {
    alert("Anda hanya boleh menghapus akun Anda sendiri.");
    return;
  }

  if (!confirm(`Hapus ${selected.length} akun?`)) return;

  setLoading(true);

  for (const id of selected) {
    const res = await deleteUser(id);

    if (id === SESSION_ID && res.status === "success") {
      alert("Akun Anda terhapus. Logout otomatis...");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }
  }

  alert("Penghapusan selesai.");
  await loadUsers();
  setLoading(false);
}

/* ============================================================
   6. DELETE ALL (ADMIN)
============================================================ */
async function deleteAll() {
  if (!IS_ADMIN) {
    alert("Hanya admin.");
    return;
  }

  const ids = [...document.querySelectorAll(".chkUser")].map(x => x.value);

  if (ids.length === 0) {
    alert("Tidak ada user.");
    return;
  }

  if (!confirm(`Hapus semua (${ids.length}) user?`)) return;

  setLoading(true);

  for (const id of ids) {
    const res = await deleteUser(id);

    if (id === SESSION_ID && res.status === "success") {
      alert("Akun admin terhapus. Logout.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }
  }

  alert("Semua user dihapus.");
  await loadUsers();
  setLoading(false);
}

/* ============================================================
   7. EVENT
============================================================ */
btnRefresh.onclick = loadUsers;
btnDeleteSelected.onclick = deleteSelected;
btnDeleteAll.onclick = deleteAll;

/* ============================================================
   8. INIT
============================================================ */
loadUsers();
