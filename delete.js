/* ============================================================
   DELETE.JS — PREMIUM V6 (Sinkron GAS Sheet1)
   - Admin: melihat semua user + hapus siapa saja
   - User: hanya melihat diri sendiri + hanya hapus diri sendiri
   - Fallback endpoint modes: deleteMember, delete, hardDelete, ?action=delete
   - Auto-refresh table
   - Protected confirm dialog
============================================================= */

console.log("[DELETE V6] Loaded");

/**************************************************************
 * 1. SESSION CHECK
 **************************************************************/
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi berakhir. Silakan login kembali.");
  location.href = "login.html";
}

const TOKEN = session.token;
const SESSION_ID = session.id;
const SESSION_ROLE = session.role || "user";

/**************************************************************
 * 2. DOM ELEMENTS
 **************************************************************/
const userTableBody = document.getElementById("userTableBody");
const roleBadge = document.getElementById("roleBadge");
const refreshBtn = document.getElementById("refreshBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");

roleBadge.innerText = `ROLE: ${SESSION_ROLE.toUpperCase()}`;

/**************************************************************
 * 3. FETCH USER LIST (Admin = semua, User = diri sendiri)
 **************************************************************/
async function loadUsers() {
  userTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px">Memuat data...</td></tr>`;

  try {
    const url = `${API_URL}?mode=getAll&token=${TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json || !Array.isArray(json.data)) {
      throw new Error("Format data tidak valid dari GAS");
    }

    let list = json.data;

    // Filter untuk user biasa
    if (SESSION_ROLE !== "admin") {
      list = list.filter(item => String(item.id) === String(SESSION_ID));
    }

    renderTable(list);

  } catch (err) {
    console.error("LOAD FAILED", err);
    userTableBody.innerHTML = `<tr><td colspan="4" style="color:red;text-align:center">Gagal memuat data</td></tr>`;
  }
}

/**************************************************************
 * 4. RENDER TABEL
 **************************************************************/
function renderTable(list) {
  if (!list.length) {
    userTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#777">Tidak ada data</td></tr>`;
    return;
  }

  userTableBody.innerHTML = list.map(item => `
    <tr>
      <td style="text-align:center">
        <input type="checkbox" class="chkUser" value="${item.id}">
      </td>
      <td>${item.id}</td>
      <td>${item.nama || "-"}</td>
      <td>${item.domisili || "-"}</td>
    </tr>
  `).join("");
}

/**************************************************************
 * 5. UNIVERSAL DELETE REQUEST (multi-mode fallback)
 **************************************************************/
async function multiDelete(targetId) {
  const endpoints = [
    `${API_URL}?mode=deleteMember&id=${targetId}&token=${TOKEN}`,
    `${API_URL}?mode=delete&id=${targetId}&token=${TOKEN}`,
    `${API_URL}?mode=hardDelete&id=${targetId}&token=${TOKEN}`,
    `${API_URL}?action=delete&id=${targetId}&token=${TOKEN}`,
  ];

  for (const link of endpoints) {
    try {
      const res = await fetch(link, { method: "POST" });
      const json = await res.json();

      if (json.success || json.status === "ok") {
        return true;
      }
    } catch (err) {
      console.warn("Fallback gagal", link);
    }
  }

  return false;
}

/**************************************************************
 * 6. DELETE SELECTED
 **************************************************************/
deleteSelectedBtn.addEventListener("click", async () => {
  const selected = [...document.querySelectorAll(".chkUser:checked")].map(x => x.value);

  if (!selected.length) return alert("Pilih minimal satu user");

  if (!confirm(`Yakin hapus ${selected.length} user?`)) return;

  for (const id of selected) {
    const ok = await multiDelete(id);
    console.log("DELETE", id, ok);

    // logout if self-deleted
    if (String(id) === String(SESSION_ID)) {
      alert("Akun Anda telah dihapus. Logout otomatis.");
      localStorage.removeItem("familyUser");
      return location.href = "login.html";
    }
  }

  loadUsers();
});

/**************************************************************
 * 7. DELETE ALL (Admin only)
 **************************************************************/
deleteAllBtn.addEventListener("click", async () => {
  if (SESSION_ROLE !== "admin") return alert("Hanya admin dapat menghapus semua user.");

  if (!confirm("⚠️ Hapus semua user? Tindakan ini tidak bisa dibatalkan!")) return;

  const checks = [...document.querySelectorAll(".chkUser")];

  for (const c of checks) {
    await multiDelete(c.value);
  }

  loadUsers();
});

/**************************************************************
 * 8. REFRESH BUTTON
 **************************************************************/
refreshBtn.addEventListener("click", loadUsers);

// AUTO-LOAD
loadUsers();
