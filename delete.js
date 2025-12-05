/* ============================================================
   DELETE.JS — FINAL SYNC WITH NEW GAS API
   - Admin: lihat semua + hapus siapa saja
   - User biasa: lihat diri sendiri + hanya bisa delete self
   - Auto logout setelah self-delete
   - Toast sukses & error, spinner, disable tombol
============================================================= */

/* -------------------------
   1. SESSION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const BASE_URL = YOUR_API_URL; // ← ganti
const token = session.token;
const sessionId = session.id;
const sessionRole = session.role;

/* -------------------------
   2. ELEMENTS
---------------------------- */
const tableBody = document.getElementById("user-table-body");

/* -------------------------
   3. TOAST
---------------------------- */
function toast(msg, type = "info") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

/* -------------------------
   4. LOAD USERS
---------------------------- */
async function loadUsers() {
  try {
    tableBody.innerHTML = `<tr><td colspan="5" class="loading">Loading...</td></tr>`;

    const url = `${BASE_URL}?mode=getdata`;
    const res = await fetch(url);

    const txt = await res.text();
    const json = JSON.parse(txt);

    if (json.status !== "success") {
      throw new Error(json.message);
    }

    let users = json.data;

    // User biasa hanya bisa melihat dirinya sendiri
    if (sessionRole !== "admin") {
      users = users.filter(u => u.id === sessionId);
    }

    renderTable(users);

  } catch (err) {
    console.error("LOAD ERROR", err);
    toast("Error load data: " + err.message, "error");
    tableBody.innerHTML = `<tr><td colspan="5" class="error">Gagal memuat</td></tr>`;
  }
}

/* -------------------------
   5. RENDER TABLE
---------------------------- */
function renderTable(users) {
  if (!users.length) {
    tableBody.innerHTML = `<tr><td colspan="5">Tidak ada data</td></tr>`;
    return;
  }

  tableBody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${u.name}</td>
      <td>${u.role}</td>
      <td>${u.status}</td>
      <td>
        <button 
          class="btn-delete" 
          onclick="confirmDelete('${u.id}', '${u.name}')">
          Delete
        </button>
      </td>
    </tr>
  `).join("");
}

/* -------------------------
   6. CONFIRM DELETE
---------------------------- */
function confirmDelete(id, name) {
  if (sessionRole !== "admin" && id !== sessionId) {
    return toast("Anda tidak punya izin menghapus user lain", "error");
  }

  if (!confirm(`Yakin ingin menghapus "${name}"?`)) return;
  doDelete(id);
}

/* -------------------------
   7. DO DELETE (HARD DELETE)
---------------------------- */
async function doDelete(id) {
  try {
    const btn = document.querySelector(`button[onclick="confirmDelete('${id}','`); 
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Deleting...";
    }

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: id,
        token: token
      })
    });

    const txt = await res.text();
    let json;
    try { json = JSON.parse(txt); }
    catch (e) { throw new Error("Response tidak valid"); }

    if (json.status !== "success") {
      throw new Error(json.message);
    }

    toast("Delete berhasil!", "success");

    // self delete → logout otomatis
    if (id === sessionId) {
      setTimeout(() => {
        localStorage.removeItem("familyUser");
        location.href = "login.html";
      }, 600);
      return;
    }

    // reload table
    loadUsers();

  } catch (err) {
    console.error(err);
    toast("Delete gagal: " + err.message, "error");
  }
}

/* -------------------------
   8. INIT
---------------------------- */
loadUsers();
