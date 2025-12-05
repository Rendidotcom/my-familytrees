/* ============================================================
   DELETE.JS — CLEAN MODE (SYNC GAS + ROLE SAFE)
============================================================= */

console.log("DELETE.JS CLEAN LOADED");

/**************************************************************
 * 1. SAFE SESSION
 **************************************************************/
function safeGetSession() {
  try {
    const raw = localStorage.getItem("familyUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("SESSION CORRUPT:", e);
    return null;
  }
}

const session = safeGetSession();
if (!session) {
  alert("Sesi berakhir, silakan login ulang.");
  location.href = "login.html";
}

const token = session.token;
const myId = session.id;
const role = session.role;

/**************************************************************
 * 2. SAFE FETCH (GET ONLY)
 **************************************************************/
async function safeFetch(url) {
  console.log("[FETCH] →", url);

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      console.error("HTTP Error:", res.status);
      return { error: true };
    }

    try {
      return await res.json();
    } catch (e) {
      console.error("JSON parse error:", e);
      return { error: true };
    }

  } catch (e) {
    console.error("NETWORK error:", e);
    return { error: true };
  }
}

/**************************************************************
 * 3. LOAD USER LIST
 **************************************************************/
window.loadUsers = async function () {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat...</td></tr>`;

  const url = `${API_URL}?mode=list&token=${token}`;
  const data = await safeFetch(url);

  tbody.innerHTML = "";

  if (data.error || !data.data) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Gagal memuat data</td></tr>`;
    return;
  }

  data.data.forEach(user => {
    // user biasa hanya boleh lihat dirinya sendiri
    if (role !== "admin" && user.id !== myId) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="chk" value="${user.id}"></td>
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email || "-"}</td>
    `;
    tbody.appendChild(tr);
  });

  // jika user biasa → otomatis centang dirinya
  if (role !== "admin") {
    const chk = document.querySelector(".chk");
    if (chk) chk.checked = true;
  }
};

/**************************************************************
 * 4. DELETE BY ID (GET MODE)
 **************************************************************/
async function deleteById(id) {
  const url = `${API_URL}?mode=delete&id=${id}&token=${token}`;
  return await safeFetch(url);
}

/**************************************************************
 * 5. DELETE SELECTED (ADMIN ONLY)
 **************************************************************/
window.deleteSelected = async function () {
  if (role !== "admin") {
    alert("Anda tidak memiliki hak akses.");
    return;
  }

  const selected = [...document.querySelectorAll(".chk:checked")];

  if (selected.length === 0) {
    alert("Tidak ada user yang dipilih.");
    return;
  }

  if (!confirm(`Hapus ${selected.length} user terpilih?`)) return;

  for (const s of selected) {
    const res = await deleteById(s.value);
    if (res.error) {
      alert(`Gagal menghapus ID: ${s.value}`);
      return;
    }
  }

  alert("Berhasil menghapus user terpilih.");
  loadUsers();
};

/**************************************************************
 * 6. DELETE ALL (ADMIN ONLY)
 **************************************************************/
window.deleteAll = async function () {
  if (role !== "admin") {
    alert("Anda tidak memiliki akses.");
    return;
  }

  if (!confirm("Yakin ingin menghapus SEMUA user?")) return;

  const url = `${API_URL}?mode=clear&token=${token}`;
  const res = await safeFetch(url);

  if (res.error) {
    alert("Gagal menghapus semua user.");
    return;
  }

  alert("Semua user berhasil dihapus.");
  loadUsers();
};

/**************************************************************
 * 7. DELETE MY ACCOUNT (USER ONLY)
 **************************************************************/
window.deleteMyAccount = async function () {
  // hanya user biasa (admin tidak boleh hapus diri sendiri)
  if (role === "admin") {
    alert("Admin tidak boleh hapus akun sendiri.");
    return;
  }

  if (!confirm("Yakin ingin menghapus akun Anda sendiri?")) return;

  const res = await deleteById(myId);

  if (res.error) {
    alert("Gagal menghapus akun.");
    return;
  }

  // logout otomatis
  localStorage.removeItem("familyUser");

  alert("Akun Anda berhasil dihapus.");
  location.href = "login.html";
};
