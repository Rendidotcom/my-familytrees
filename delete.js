/* ============================================================
   DELETE.JS — FINAL SINKRON GAS (ADMIN & USER)
============================================================= */

/* -------------------------
   1. SESSION VALIDATION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session) {
  alert("Sesi habis. Silakan login kembali.");
  location.href = "login.html";
}

const SESSION_ID = session.id;
const SESSION_ROLE = session.role; // admin / user
const SESSION_TOKEN = session.token;

/* -------------------------
   2. RENDER USER DATA
---------------------------- */
const deleteArea = document.getElementById("deleteArea");
const userInfo = document.getElementById("userInfo");
const btnDelete = document.getElementById("btnDelete");

userInfo.innerHTML = `
  <b>Login sebagai:</b> ${session.nama} <br>
  Role: <span style="color:green">${SESSION_ROLE}</span><br>
  ID: ${SESSION_ID}
`;

/* -------------------------
   3. GET LIST USER DARI GAS
---------------------------- */
async function loadUsers() {
  try {
    const url = `${API_URL}?mode=list&token=${SESSION_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== "success") {
      alert("Gagal memuat data user!");
      return;
    }

    const users = json.data;

    /* -------------------------
       USER BIASA → hanya dirinya
    ---------------------------- */
    if (SESSION_ROLE !== "admin") {
      const me = users.find(u => u.id == SESSION_ID);
      renderSingleUser(me);
      return;
    }

    /* -------------------------
       ADMIN → bisa lihat semua
    ---------------------------- */
    renderTable(users);

  } catch (err) {
    console.error("LOAD ERROR:", err);
  }
}

loadUsers();

/* -------------------------
   4. RENDERING NON-ADMIN
---------------------------- */
function renderSingleUser(user) {
  deleteArea.innerHTML = `
    <div class="card">
      <label>
        <input type="checkbox" class="delCheck" value="${user.id}">
        Hapus akun saya (${user.nama})
      </label>
    </div>
  `;

  document.querySelector(".delCheck").addEventListener("change", () => {
    btnDelete.disabled = !document.querySelector(".delCheck:checked");
  });
}

/* -------------------------
   5. RENDER ADMIN TABLE
---------------------------- */
function renderTable(users) {
  let html = `
    <table class="table">
      <thead>
        <tr>
          <th>Pilih</th>
          <th>ID</th>
          <th>Nama</th>
          <th>Role</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
  `;

  users.forEach(u => {
    html += `
      <tr>
        <td><input type="checkbox" class="delCheck" value="${u.id}"></td>
        <td>${u.id}</td>
        <td>${u.nama}</td>
        <td>${u.role}</td>
        <td>${u.email}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  deleteArea.innerHTML = html;

  document.querySelectorAll(".delCheck").forEach(chk => {
    chk.addEventListener("change", () => {
      btnDelete.disabled = !document.querySelector(".delCheck:checked");
    });
  });
}

/* -------------------------
   6. DELETE HANDLER
---------------------------- */
btnDelete.addEventListener("click", async () => {
  const selected = [...document.querySelectorAll(".delCheck:checked")].map(el => el.value);

  if (selected.length === 0) return;

  /** PROTECT: user biasa hanya boleh self-delete */
  if (SESSION_ROLE !== "admin" && selected[0] != SESSION_ID) {
    alert("Anda tidak memiliki akses untuk menghapus user lain!");
    return;
  }

  const yakin = confirm(`Yakin ingin menghapus ${selected.length} akun?`);
  if (!yakin) return;

  // kirim delete satu per satu ke GAS
  for (const id of selected) {
    await deleteUser(id);
  }

  // Jika user menghapus dirinya → logout
  if (selected.includes(SESSION_ID)) {
    alert("Akun Anda berhasil dihapus. Logout...");
    localStorage.removeItem("familyUser");
    location.href = "login.html";
    return;
  }

  alert("Penghapusan selesai.");
  loadUsers();
});

/* -------------------------
   7. FUNGSI DELETE KE GAS
---------------------------- */
async function deleteUser(id) {
  console.log("DELETE REQUEST:", { id });

  const form = new FormData();
  form.append("mode", "delete");
  form.append("id", id);
  form.append("token", SESSION_TOKEN);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    console.log("DELETE RESPONSE:", json);

    if (json.status !== "success") {
      alert(`Gagal menghapus ID ${id}: ${json.message}`);
    }

  } catch (err) {
    console.error("DELETE ERROR:", err);
  }
}
