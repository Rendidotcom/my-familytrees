/* ============================================================
   DELETE.JS — DEBUG MODE (untuk menemukan kenapa data tidak load)
============================================================= */

console.log("DELETE.JS LOADED");

/* -------------------------
   1. SESSION VALIDATION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session) {
  alert("Sesi habis. Silakan login kembali.");
  location.href = "login.html";
}

const SESSION_ID = session.id;
const SESSION_ROLE = session.role;
const SESSION_TOKEN = session.token;

/* -------------------------
   2. Elemen
---------------------------- */
const deleteArea = document.getElementById("deleteArea");
const userInfo = document.getElementById("userInfo");
const btnDelete = document.getElementById("btnDelete");

userInfo.innerHTML = `
  <b>Login sebagai:</b> ${session.nama} <br>
  Role: ${SESSION_ROLE} <br>
  ID: ${SESSION_ID}
`;

/* -------------------------
   3. LOAD USER LIST
---------------------------- */
async function loadUsers() {
  const url = `${API_URL}?mode=list&token=${SESSION_TOKEN}`;

  console.log("%c[LOAD USERS] URL:", "color:yellow", url);

  try {
    const res = await fetch(url);
    const text = await res.text();

    console.log("%c[RAW RESPONSE]", "color:cyan", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("[JSON PARSE ERROR]", e);
      deleteArea.innerHTML = `<div class="error">GAS respon bukan JSON:<br>${text}</div>`;
      return;
    }

    console.log("%c[PARSED JSON]", "color:lime", json);

    if (json.status !== "success") {
      deleteArea.innerHTML = `
        <div class="error">
          GAGAL LOAD DATA:<br>
          <b>${json.message || "Unknown error"}</b>
        </div>`;
      return;
    }

    const users = json.data;

    if (!Array.isArray(users)) {
      deleteArea.innerHTML = `<div class="error">Format data GAS salah.</div>`;
      return;
    }

    if (SESSION_ROLE === "admin") {
      renderTable(users);
    } else {
      const me = users.find(u => u.id == SESSION_ID);
      if (!me) {
        deleteArea.innerHTML = `<div class="error">Data user tidak ditemukan.</div>`;
        return;
      }
      renderSingleUser(me);
    }

  } catch (err) {
    console.error("[LOAD ERROR]", err);
    deleteArea.innerHTML = `<div class="error">Fetch error: ${err}</div>`;
  }
}

loadUsers();

/* -------------------------
   4. RENDER USER BIASA
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
  document.querySelector(".delCheck").onchange = () => {
    btnDelete.disabled = !document.querySelector(".delCheck:checked");
  };
}

/* -------------------------
   5. RENDER ADMIN TABLE
---------------------------- */
function renderTable(users) {
  let html = `
    <table class="table">
    <thead><tr>
      <th>Pilih</th><th>ID</th><th>Nama</th><th>Role</th><th>Email</th>
    </tr></thead><tbody>
  `;

  users.forEach(u => {
    html += `
      <tr>
        <td><input type="checkbox" class="delCheck" value="${u.id}"></td>
        <td>${u.id}</td>
        <td>${u.nama}</td>
        <td>${u.role}</td>
        <td>${u.email}</td>
      </tr>`;
  });

  html += `</tbody></table>`;
  deleteArea.innerHTML = html;

  document.querySelectorAll(".delCheck").forEach(c => {
    c.onchange = () => {
      btnDelete.disabled = !document.querySelector(".delCheck:checked");
    };
  });
}
