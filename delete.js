/* ============================================================
   DELETE.JS — PREMIUM V3
   Sinkron 100% dengan struktur Sheet1 GAS
   Admin: full control
   User : hanya hapus diri sendiri
============================================================= */

/**************************************************************
 * 0. SESSION CHECK
 **************************************************************/
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Sesi habis. Silakan login ulang.");
  location.href = "login.html";
}
const sessionId = session.id;
const sessionRole = session.role;
const token = session.token;

/**************************************************************
 * 1. GET ELEMENTS (AMAN DARI ERROR)
 **************************************************************/
const elTableBody = document.querySelector("#userTableBody");
const btnRefresh = document.querySelector("#btnRefresh");
const btnDeleteSelected = document.querySelector("#btnDeleteSelected");
const btnDeleteAll = document.querySelector("#btnDeleteAll");

function safeEl(el, name) {
  if (!el) console.warn(`⚠️ Element ${name} tidak ditemukan!`);
}
safeEl(btnRefresh, "#btnRefresh");
safeEl(btnDeleteSelected, "#btnDeleteSelected");
safeEl(btnDeleteAll, "#btnDeleteAll");

/**************************************************************
 * 2. LOAD USERS (sinkron struktur kolom Sheet1)
 **************************************************************/
async function loadUsers() {
  if (!elTableBody) return;

  elTableBody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}?mode=list`, {
      headers: { Authorization: token }
    });
    const data = await res.json();

    if (!data || !Array.isArray(data.users)) throw new Error("Response tidak valid");

    let list = data.users;

    // User biasa hanya lihat diri sendiri
    if (sessionRole !== "admin") {
      list = list.filter(u => u.ID === sessionId);
      if (btnDeleteAll) btnDeleteAll.style.display = "none";
    }

    // Render table
    renderTable(list);

  } catch (err) {
    console.error("LOAD ERROR:", err);
    elTableBody.innerHTML =
      `<tr><td colspan="5" style="color:red;">Gagal load data</td></tr>`;
  }
}

/**************************************************************
 * 3. RENDER TABLE
 **************************************************************/
function renderTable(list) {
  elTableBody.innerHTML = "";

  if (!list.length) {
    elTableBody.innerHTML =
      `<tr><td colspan="5">Tidak ada data.</td></tr>`;
    return;
  }

  list.forEach((u) => {
    const isSelf = u.ID === sessionId;
    const allowDelete = sessionRole === "admin" || isSelf;

    elTableBody.innerHTML += `
      <tr>
        <td><input type="checkbox" class="chkRow" value="${u.ID}" ${allowDelete ? "" : "disabled"}></td>
        <td>${u.ID}</td>
        <td>${u.name}</td>
        <td>${u.Role}</td>
        <td>
            ${allowDelete
              ? `<button class="btnDeleteSingle" data-id="${u.ID}">Delete</button>`
              : `<span style="opacity:.4">Not Allowed</span>`}
        </td>
      </tr>
    `;
  });

  attachDeleteSingle();
}

/**************************************************************
 * 4. DELETE SINGLE
 **************************************************************/
function attachDeleteSingle() {
  document.querySelectorAll(".btnDeleteSingle").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      if (!confirm(`Hapus ID: ${id}?`)) return;

      await deleteUsers([id]);
    });
  });
}

/**************************************************************
 * 5. DELETE MULTI
 **************************************************************/
if (btnDeleteSelected) {
  btnDeleteSelected.addEventListener("click", async () => {
    const selected = [...document.querySelectorAll(".chkRow:checked")].map(c => c.value);

    if (!selected.length) return alert("Tidak ada yang dipilih!");

    if (!confirm(`Hapus ${selected.length} data terpilih?`)) return;

    await deleteUsers(selected);
  });
}

/**************************************************************
 * 6. DELETE ALL (Admin Only)
 **************************************************************/
if (btnDeleteAll) {
  btnDeleteAll.addEventListener("click", async () => {
    if (sessionRole !== "admin") {
      return alert("Akses ditolak!");
    }

    if (!confirm("Yakin hapus SEMUA data?")) return;

    await deleteUsers(["__all__"]);
  });
}

/**************************************************************
 * 7. DELETE HANDLER (API SYNC)
 **************************************************************/
async function deleteUsers(idList) {
  try {
    const res = await fetch(`${API_URL}?mode=delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ ids: idList })
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Gagal delete");

    alert("Delete berhasil!");

    // Jika user delete dirinya → logout otomatis
    if (idList.includes(sessionId)) {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    loadUsers();

  } catch (err) {
    console.error("DELETE ERROR:", err);
    alert("Gagal hapus data.");
  }
}

/**************************************************************
 * 8. REFRESH BUTTON
 **************************************************************/
if (btnRefresh) {
  btnRefresh.addEventListener("click", loadUsers);
}

/**************************************************************
 * AUTO LOAD
 **************************************************************/
loadUsers();
