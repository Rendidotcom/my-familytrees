/* ============================================================
   DELETE.JS — FINAL VERSION
   - Load user list
   - Delete selected
   - Delete all
   - Support self-delete
   - Auto logout if needed
============================================================= */

/* -------------------------
   CHECK SESSION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;

/* -------------------------
   ELEMENT
---------------------------- */
const tbody = document.querySelector("#userTable tbody");
const loader = document.querySelector("#loader");
const btnRefresh = document.querySelector("#btnRefresh");
const btnDeleteSelected = document.querySelector("#btnDeleteSelected");
const btnDeleteAll = document.querySelector("#btnDeleteAll");

/* -------------------------
   LOAD USERS
---------------------------- */
async function loadUsers() {
  loader.style.display = "block";
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}?mode=getUsers&token=${token}`);
    const data = await res.json();

    if (!data.users || data.users.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="4" style="text-align:center;color:#999;">
        Tidak ada user.
        </td></tr>
      `;
      loader.style.display = "none";
      return;
    }

    data.users.forEach((u) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><input type="checkbox" class="userCheck" value="${u.id}"></td>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    alert("Gagal memuat data.");
  }

  loader.style.display = "none";
}

/* -------------------------
   DELETE BY IDS
---------------------------- */
async function deleteUsers(ids) {
  loader.style.display = "block";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        mode: "deleteUser",
        token,
        ids, // array
      }),
    });

    const data = await res.json();

    if (data.status !== "success") {
      alert("Gagal menghapus user.");
      loader.style.display = "none";
      return;
    }

    // Jika user menghapus dirinya sendiri → logout
    if (ids.includes(sessionId)) {
      alert("Akun Anda sendiri telah dihapus. Anda akan logout.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return;
    }

    alert("Berhasil menghapus user.");
    await loadUsers();

  } catch (err) {
    console.error(err);
    alert("Error menghapus user.");
  }

  loader.style.display = "none";
}

/* -------------------------
   DELETE SELECTED
---------------------------- */
btnDeleteSelected.addEventListener("click", () => {
  const checks = [...document.querySelectorAll(".userCheck:checked")];

  if (checks.length === 0) {
    alert("Pilih user yang ingin dihapus.");
    return;
  }

  const ids = checks.map((c) => c.value);

  if (!confirm(`Hapus ${ids.length} user terpilih?`)) return;

  deleteUsers(ids);
});

/* -------------------------
   DELETE ALL USERS
---------------------------- */
btnDeleteAll.addEventListener("click", () => {
  const all = [...document.querySelectorAll(".userCheck")];
  if (all.length === 0) {
    alert("Tidak ada user untuk dihapus.");
    return;
  }

  const ids = all.map((c) => c.value);

  if (!confirm("Yakin ingin menghapus SEMUA user?")) return;

  deleteUsers(ids);
});

/* -------------------------
   REFRESH
---------------------------- */
btnRefresh.addEventListener("click", loadUsers);

/* -------------------------
   AUTO LOAD
---------------------------- */
loadUsers();
