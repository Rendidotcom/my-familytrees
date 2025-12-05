console.log("DELETE.JS LOADED (ANTI ERROR MODE)");

/* ============================================================
   0. SESSION CHECK (ANTI ERROR)
============================================================ */
let session = null;
try {
  session = JSON.parse(localStorage.getItem("familyUser") || "null");
} catch (e) {
  console.warn("Session corrupt:", e);
}

if (!session || !session.id || !session.token) {
  alert("Sesi tidak valid. Silakan login kembali.");
  location.href = "login.html";
}

const SESSION_ID = String(session.id || "");
const IS_ADMIN   = session.role === "admin";
const TOKEN      = session.token || "";

/* ============================================================
   1. UI HOOK (SAFE MODE)
============================================================ */
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`⚠️ Elemen #${id} tidak ditemukan di DOM.`);
  return el;
}

const tbody = document.querySelector("#userTable tbody") || { innerHTML: "" };
const loader = getEl("loader") || { style: {} };
const btnRefresh = getEl("btnRefresh") || { disabled: false };
const btnDeleteSelected = getEl("btnDeleteSelected") || { disabled: false };
const btnDeleteAll = getEl("btnDeleteAll") || { disabled: false };

function setLoading(state) {
  if (loader && loader.style) loader.style.display = state ? "block" : "none";

  if (btnRefresh) btnRefresh.disabled = state;
  if (btnDeleteSelected) btnDeleteSelected.disabled = state;
  if (btnDeleteAll) btnDeleteAll.disabled = state;
}

/* ============================================================
   2. SAFE FETCH JSON WITH DEBUG
============================================================ */
async function debugGet(url) {
  console.log("%c[FETCH] URL:", "color:yellow", url);

  try {
    const res = await fetch(url);
    const text = await res.text();

    console.log("%c[RAW RESPONSE]", "color:cyan", text);

    try {
      const json = JSON.parse(text);
      console.log("%c[PARSED JSON]", "color:lime", json);
      return json;
    } catch (e) {
      console.error("[JSON ERROR]", e);
      return { status: "error", message: "JSON parse gagal", raw: text };
    }

  } catch (netErr) {
    console.error("[NETWORK ERROR]", netErr);
    return { status: "error", message: "Fetch gagal", error: netErr };
  }
}

/* ============================================================
   3. LOAD USERS (ANTI BENTURAN)
============================================================ */
async function loadUsers() {
  if (!API_URL) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:red">API_URL tidak ditemukan. Periksa config.js.</td></tr>`;
    return;
  }

  setLoading(true);
  tbody.innerHTML = `<tr><td colspan="4">Memuat data...</td></tr>`;

  const url = `${API_URL}?mode=list&token=${TOKEN}`;
  const res = await debugGet(url);

  // jika API ready tapi tidak mengembalikan data list
  if (!res || !res.status) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:red">Respon tidak valid dari server.</td></tr>`;
    setLoading(false);
    return;
  }

  // API Ready tapi bukan list
  if (res.status !== "success") {
    tbody.innerHTML = `<tr><td colspan="4">${res.message || "Gagal memuat data."}</td></tr>`;
    setLoading(false);
    return;
  }

  let users = Array.isArray(res.data) ? res.data : [];

  // filter user non admin
  if (!IS_ADMIN) {
    users = users.filter(u => String(u.id) === SESSION_ID);
  }

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Tidak ada data.</td></tr>`;
    setLoading(false);
    return;
  }

  tbody.innerHTML = "";
  users.forEach(u => {
    const id = u.id || "";
    const nama = u.nama || "(tanpa nama)";
    const email = u.email || "(tanpa email)";

    const row = `
      <tr>
        <td><input class="chkUser" type="checkbox" value="${id}"></td>
        <td>${id}</td>
        <td>${nama}</td>
        <td>${email}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", row);
  });

  if (!IS_ADMIN && btnDeleteAll) {
    btnDeleteAll.style.display = "none";
  }

  setLoading(false);
}

/* ============================================================
   4. DELETE USER
============================================================ */
async function deleteUser(id) {
  if (!API_URL) {
    return { status: "error", message: "API_URL hilang" };
  }

  const url = `${API_URL}?mode=delete&id=${id}&token=${TOKEN}`;
  return await debugGet(url);
}

/* ============================================================
   5. DELETE SELECTED
============================================================ */
async function deleteSelected() {
  const checkboxes = document.querySelectorAll(".chkUser:checked");
  const selected = [...checkboxes].map(x => x.value);

  if (selected.length === 0) {
    alert("Tidak ada user dipilih.");
    return;
  }

  // user non-admin hanya boleh delete dirinya sendiri
  if (!IS_ADMIN) {
    if (selected.some(id => id !== SESSION_ID)) {
      alert("Anda hanya boleh menghapus akun Anda sendiri.");
      return;
    }
  }

  if (!confirm(`Hapus ${selected.length} akun?`)) return;

  setLoading(true);

  for (const id of selected) {
    const res = await deleteUser(id);

    if (!res || res.status !== "success") {
      console.warn("Gagal hapus:", id, res);
    }

    // self delete logout
    if (id === SESSION_ID && res.status === "success") {
      alert("Akun Anda terhapus. Logout...");
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
   6. DELETE ALL
============================================================ */
async function deleteAll() {
  if (!IS_ADMIN) {
    alert("Hanya admin yang boleh hapus semua.");
    return;
  }

  const ids = [...document.querySelectorAll(".chkUser")].map(x => x.value);

  if (ids.length === 0) {
    alert("Tidak ada user dalam tabel.");
    return;
  }

  if (!confirm(`Hapus seluruh ${ids.length} user?`)) return;

  setLoading(true);

  for (const id of ids) {
    const res = await deleteUser(id);

    if (id === SESSION_ID && res.status === "success") {
      alert("Akun admin terhapus. Logout otomatis.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }
  }

  alert("Semua user telah dihapus.");
  await loadUsers();
  setLoading(false);
}

/* ============================================================
   7. EVENT HANDLER (SAFE)
============================================================ */
if (btnRefresh) btnRefresh.onclick = loadUsers;
if (btnDeleteSelected) btnDeleteSelected.onclick = deleteSelected;
if (btnDeleteAll) btnDeleteAll.onclick = deleteAll;

/* ============================================================
   8. INIT
============================================================ */
setTimeout(loadUsers, 80); // jeda kecil supaya HTML ready
