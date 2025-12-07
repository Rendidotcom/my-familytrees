/* ============================================================
   DELETE.JS — PREMIUM V5
   Sinkron penuh dengan Sheet1 GAS
   Admin = lihat + hapus semua
   User  = hanya lihat + hapus diri sendiri
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
const sessionId = session.id;
const sessionRole = session.role;


/* -------------------------
   1. DOM GETTERS
---------------------------- */
const tbody = document.getElementById("userTableBody");
const refreshBtn = document.getElementById("refreshBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const roleBadge = document.getElementById("roleBadge");


/* -------------------------
   2. SMALL UTILS
---------------------------- */
function escapeHtml(str) {
  return String(str)
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
   3. FETCH DATA FROM GAS
---------------------------- */
async function loadUsers() {
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:#666">Memuat data...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}?mode=getAll&token=${encodeURIComponent(token)}`);
    const json = await res.json();

    if (!json.success) throw new Error(json.message || "Gagal memuat data.");

    // GAS response -> array user family tree
    let data = json.data || [];

    // Admin melihat semua
    // Non-admin hanya melihat dirinya sendiri
    if (sessionRole !== "admin") {
      data = data.filter(u => String(u.ID) === String(sessionId));
      deleteAllBtn.style.display = "none"; // user tidak bisa hapus semua
    }

    renderRows(data);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:red">${escapeHtml(err.message)}</td></tr>`;
  }
}


/* -------------------------
   4. RENDER TABLE
---------------------------- */
function renderRows(list) {
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:#666">Tidak ada data.</td></tr>`;
    return;
  }

  let html = "";

  list.forEach(u => {
    const id = u.ID ?? u.id ?? "";
    const name = u.name ?? "-";

    // Premium V5 → Domisili adalah kolom utama (email fallback)
    const domisili = u.domisili ?? u.email ?? "-";

    html += `
      <tr>
        <td style="text-align:center">
          <input type="checkbox" class="selectRow" value="${escapeHtml(id)}" />
        </td>
        <td>${escapeHtml(id)}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(domisili)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}


/* -------------------------
   5. DELETE FUNCTIONS
---------------------------- */
async function deleteByIds(ids = []) {
  if (!ids.length) return;

  const body = new FormData();
  body.append("mode", "delete");
  body.append("token", token);
  body.append("ids", JSON.stringify(ids));

  const res = await fetch(API_URL, { method: "POST", body });
  const json = await res.json();

  if (!json.success) throw new Error(json.message || "Gagal menghapus data.");

  return json;
}

async function deleteSelected() {
  const checkboxes = [...document.querySelectorAll(".selectRow:checked")];
  const ids = checkboxes.map(c => c.value);

  if (!ids.length) {
    alert("Pilih minimal 1 user.");
    return;
  }

  if (!confirmBox("Yakin hapus user terpilih?")) return;

  try {
    await deleteByIds(ids);

    // jika user menghapus dirinya sendiri → auto logout
    if (ids.includes(String(sessionId))) {
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

  if (!confirmBox("⚠️ PERINGATAN: Ini akan menghapus SEMUA user!\nLanjutkan?"))
    return;

  try {
    await deleteByIds(["*ALL"]); // GAS handler V5 kamu mendukung wildcard ALL
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
