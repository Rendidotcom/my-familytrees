/* ============================================================
   DELETE.JS — PREMIUM V2
   - Admin: full list, checkbox, bulk delete, delete-all
   - User biasa: hanya melihat 1 data (dirinya sendiri)
   - Hard delete sesuai GAS (mode=delete)
   - Soft delete opsional (mode=softdelete)
   - UI Premium V2: checklist kiri, foto, tombol bulk-delete
============================================================= */

/* -------------------------
   0. SESSION & CONFIG
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const token = session.token;
const myId = session.id;
const myRole = session.role;

/* -------------------------
   1. DOM TARGET
---------------------------- */
const listBox = document.getElementById("delete-list");
const btnBulkDelete = document.getElementById("btnBulkDelete");
const btnDeleteAll = document.getElementById("btnDeleteAll"); // admin only

/* -------------------------
   2. LOAD USERS (getdata)
---------------------------- */
async function loadUsers() {
  listBox.innerHTML = `<div class="loading">Loading...</div>`;

  try {
    const url = `${API_URL}?mode=getdata`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== "success") {
      listBox.innerHTML = `<p class="error">Gagal memuat data</p>`;
      return;
    }

    let data = json.data;

    // User biasa hanya lihat dirinya
    if (myRole !== "admin") {
      data = data.filter(u => String(u.id) === String(myId));
      btnDeleteAll.style.display = "none"; // sembunyikan
    }

    renderList(data);
  } catch (e) {
    listBox.innerHTML = `<p class="error">Network error</p>`;
  }
}

/* -------------------------
   3. RENDER UI LIST
---------------------------- */
function renderList(arr) {
  if (!arr.length) {
    listBox.innerHTML = `<p class="empty">Tidak ada data.</p>`;
    return;
  }

  listBox.innerHTML = arr.map(u => `
    <div class="user-card" data-id="${u.id}">
      <label class="check-wrap">
        <input type="checkbox" class="row-check" data-id="${u.id}">
      </label>

      <img src="${u.photoURL || 'https://via.placeholder.com/60'}" class="user-photo">

      <div class="info">
        <div class="name">${u.name}</div>
        <div class="meta">${u.relationship || "-"} • ${u.domisili || "-"}</div>
        <div class="id">ID: ${u.id}</div>
      </div>

      <button class="btn-delete-one" data-id="${u.id}">
        ❌
      </button>
    </div>
  `).join("");

  bindRowEvents();
}

/* -------------------------
   4. BIND EACH BUTTON
---------------------------- */
function bindRowEvents() {
  // individual delete button
  document.querySelectorAll(".btn-delete-one").forEach(btn => {
    btn.onclick = () => confirmDelete(btn.dataset.id);
  });
}

/* -------------------------
   5. CONFIRM HARD DELETE
---------------------------- */
async function confirmDelete(id) {
  const allow = (myRole === "admin") || (String(id) === String(myId));
  if (!allow) {
    return alert("Tidak boleh menghapus user lain.");
  }

  if (!confirm("Yakin hapus secara permanen?")) return;

  await hardDelete([id]);
}

/* -------------------------
   6. BULK DELETE
---------------------------- */
btnBulkDelete.onclick = async () => {
  const checked = [...document.querySelectorAll(".row-check:checked")]
                    .map(c => c.dataset.id);

  if (!checked.length) return alert("Tidak ada yang dipilih.");

  // user biasa tidak boleh bulk-delete
  if (myRole !== "admin") {
    if (checked.length > 1 || checked[0] !== myId) {
      return alert("User biasa hanya boleh hapus akun sendiri.");
    }
  }

  if (!confirm(`Yakin hapus ${checked.length} data?`)) return;

  await hardDelete(checked);
};

/* -------------------------
   7. DELETE ALL (ADMIN ONLY)
---------------------------- */
btnDeleteAll.onclick = async () => {
  if (myRole !== "admin") return alert("Forbidden");

  if (!confirm("Hapus semua data? SERIUS?")) return;

  const allIds = [...document.querySelectorAll(".row-check")]
                    .map(c => c.dataset.id);

  if (!allIds.length) return;

  await hardDelete(allIds);
};

/* -------------------------
   8. HARD DELETE (mode=delete)
   GAS: handleDelete(data) → deleteMember()
---------------------------- */
async function hardDelete(idList) {
  for (const id of idList) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "delete",
          token,
          id
        })
      });

      const json = await res.json();
      if (json.status !== "success") {
        console.warn("Gagal hapus:", id, json.message);
      }
    } catch (e) {
      console.error("Error delete:", id, e);
    }
  }

  // jika user menghapus dirinya sendiri
  if (idList.includes(myId)) {
    localStorage.removeItem("familyUser");
    alert("Akun Anda sudah dihapus. Anda akan keluar.");
    location.href = "login.html";
    return;
  }

  await loadUsers();
}

/* -------------------------
   9. INIT
---------------------------- */
loadUsers();
