/* ============================================================
   DELETE.JS — PREMIUM V6 (FINAL SINKRON SHEET1)
   Admin  = lihat + hapus semua
   User   = lihat + hapus diri sendiri
============================================================= */

/* -------------------------
   0. SESSION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi habis, silakan login lagi.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = String(session.id);
const sessionRole = session.role;


/* -------------------------
   1. DOM
---------------------------- */
const tbody = document.getElementById("userTableBody");
const refreshBtn = document.getElementById("refreshBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const roleBadge = document.getElementById("roleBadge");


/* -------------------------
   2. UTIL
---------------------------- */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function confirmBox(text) {
  return confirm(text);
}

function showRoleBadge() {
  roleBadge.innerHTML = `Peran: <b>${sessionRole}</b> (ID: ${sessionId})`;
}


/* -------------------------
   3. LOAD USER FROM GAS
---------------------------- */
async function loadUsers() {
  tbody.innerHTML = `
    <tr><td colspan="4" style="text-align:center;padding:16px;color:#666">
      Memuat data...
    </td></tr>
  `;

  try {
    const res = await fetch(`${API_URL}?mode=getAll&token=${encodeURIComponent(token)}`);
    const json = await res.json();

    if (!json.success) throw new Error(json.message || "Gagal load data.");

    let data = json.data || [];

    // Admin = semua / User = hanya dirinya sendiri
    if (sessionRole !== "admin") {
      data = data.filter(u => String(u.ID) === sessionId);
      deleteAllBtn.style.display = "none";
    }

    renderRows(data);

  } catch (err) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="text-align:center;color:red;padding:16px">
        ${escapeHtml(err.message)}
      </td></tr>
    `;
  }
}


/* -------------------------
   4. RENDER TABLE
---------------------------- */
function renderRows(list) {
  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="text-align:center;color:#666;padding:16px">
        Tidak ada user.
      </td></tr>
    `;
    return;
  }

  let html = "";

  list.forEach(u => {
    const id = escapeHtml(u.ID);
    const name = escapeHtml(u.name);
    const domisili = escapeHtml(u.Domisili); // FIX kolom GAS

    html += `
      <tr>
        <td style="text-align:center">
          <input type="checkbox" class="selectRow" value="${id}">
        </td>
        <td>${id}</td>
        <td>${name}</td>
        <td>${domisili}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}


/* -------------------------
   5. DELETE
---------------------------- */
async function deleteByIds(ids = []) {
  const body = new FormData();
  body.append("mode", "delete");
  body.append("token", token);
  body.append("ids", JSON.stringify(ids));

  const res = await fetch(API_URL, { method: "POST", body });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  return json;
}

async function deleteSelected() {
  const checks = [...document.querySelectorAll(".selectRow:checked")];
  const ids = checks.map(c => c.value);

  if (!ids.length) {
    alert("Pilih minimal 1 user.");
    return;
  }

  if (!confirmBox("Yakin ingin menghapus user terpilih?")) return;

  try {
    await deleteByIds(ids);

    // jika user hapus dirinya sendiri
    if (ids.includes(sessionId)) {
      alert("Akun Anda telah dihapus. Anda akan logout.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    loadUsers();

  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function deleteAll() {
  if (sessionRole !== "admin") return;

  if (!confirmBox("⚠️ PERINGATAN!\nIni akan menghapus SEMUA user.\nLanjutkan?")) return;

  try {
    await deleteByIds(["*ALL"]);
    alert("Semua user berhasil dihapus.");
    loadUsers();

  } catch (err) {
    alert("Error: " + err.message);
  }
}


/* -------------------------
   6. EVENTS
---------------------------- */
refreshBtn.onclick = loadUsers;
deleteSelectedBtn.onclick = deleteSelected;
deleteAllBtn.onclick = deleteAll;


/* -------------------------
   7. INIT
---------------------------- */
showRoleBadge();
loadUsers();
