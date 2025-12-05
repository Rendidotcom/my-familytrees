/**************************************************************
 * DELETE.JS — FINAL, TAHAN BENTURAN, AUTO LOGOUT SELF DELETE
 **************************************************************/
console.log("DELETE.JS LOADED");

// Pastikan config.js sudah loaded
if (typeof API_URL === "undefined") {
  console.error("❌ API_URL tidak ditemukan! Pastikan config.js diload sebelum delete.js");
}

/**************************************************************
 * 1. LOAD SESSION
 **************************************************************/
const session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session) {
  alert("Sesi habis. Silakan login ulang.");
  location.href = "login.html";
}

const token = session.token || "";
const role  = session.role  || "user";
const selfId = session.id    || "";


/**************************************************************
 * 2. DOM SAFE GETTER
 **************************************************************/
function el(id) {
  const x = document.getElementById(id);
  if (!x) console.warn(`⚠️ Elemen #${id} tidak ditemukan`);
  return x;
}

// Cache elemen
const tbody = el("userTableBody");
const btnDelSelected = el("btn-delete-selected");
const btnDelAll = el("btn-delete-all");
const btnRefresh = el("btn-refresh");


/**************************************************************
 * 3. LOAD DATA USER
 **************************************************************/
async function loadUserData() {

  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

  const url = `${API_URL}?mode=list&token=${encodeURIComponent(token)}`;
  console.log("[FETCH] URL:", url);

  try {
    const res = await fetch(url);
    const raw = await res.text();
    console.log("[RAW RESPONSE]", raw);

    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error("❌ ERROR PARSING JSON:", err);
      tbody.innerHTML = `<tr><td colspan="4">Gagal parse JSON dari API</td></tr>`;
      return;
    }

    console.log("[PARSED JSON]", json);

    // Validasi struktur response
    if (!json || !json.data || !Array.isArray(json.data)) {
      tbody.innerHTML = `<tr><td colspan="4">Tidak ada data user (API Ready saja)</td></tr>`;
      return;
    }

    let users = json.data;

    // User non-admin hanya bisa melihat dirinya sendiri
    if (role !== "admin") {
      users = users.filter(u => u.id === selfId);
    }

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">Tidak ada data</td></tr>`;
      return;
    }

    // Render table
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><input type="checkbox" class="rowcheck" data-id="${u.id}"></td>
        <td>${u.id}</td>
        <td>${u.name || "-"}</td>
        <td>${u.email || "-"}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("❌ FETCH ERROR:", err);
    tbody.innerHTML = `<tr><td colspan="4">Gagal menghubungi server</td></tr>`;
  }
}


/**************************************************************
 * 4. DELETE FUNCTION
 **************************************************************/
async function deleteUserList(ids) {

  if (!Array.isArray(ids) || ids.length === 0) {
    alert("Tidak ada user yang dipilih.");
    return;
  }

  // User hanya boleh hapus dirinya sendiri
  if (role !== "admin") {
    if (ids.length > 1 || ids[0] !== selfId) {
      alert("Kamu hanya boleh menghapus akunmu sendiri.");
      return;
    }
  }

  const c = confirm(`Yakin menghapus ${ids.length} user?`);
  if (!c) return;

  const url = `${API_URL}?mode=delete&token=${encodeURIComponent(token)}`;

  console.log("[DELETE][URL]", url);
  console.log("[DELETE][IDS]", ids);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ ids })
    });

    const raw = await res.text();
    console.log("[DELETE RAW]", raw);

    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      alert("Gagal parse respon server.");
      return;
    }

    if (json.status !== "success") {
      alert("Gagal menghapus: " + (json.message || "Unknown error"));
      return;
    }

    alert("Penghapusan berhasil!");

    // Jika user menghapus dirinya sendiri → auto logout
    if (ids.includes(selfId)) {
      localStorage.removeItem("familyUser");
      alert("Akun terhapus. Kamu akan logout.");
      location.href = "login.html";
      return;
    }

    // Reload data
    loadUserData();

  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    alert("Gagal menghubungi server.");
  }
}


/**************************************************************
 * 5. EVENT HANDLERS
 **************************************************************/
if (btnRefresh) {
  btnRefresh.onclick = () => loadUserData();
}

if (btnDelSelected) {
  btnDelSelected.onclick = () => {
    const checks = document.querySelectorAll(".rowcheck:checked");
    const ids = [...checks].map(c => c.dataset.id);
    deleteUserList(ids);
  };
}

// Admin only — Hapus semua
if (btnDelAll) {
  if (role !== "admin") {
    btnDelAll.style.display = "none";
  } else {
    btnDelAll.onclick = () => {
      const checks = document.querySelectorAll(".rowcheck");
      const ids = [...checks].map(c => c.dataset.id);
      deleteUserList(ids);
    };
  }
}


/**************************************************************
 * 6. INITIAL LOAD
 **************************************************************/
window.onload = loadUserData;
