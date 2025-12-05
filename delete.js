/* ============================================================
   DELETE LIST MANAGER — ULTRA SAFE (ANTI ERROR)
============================================================= */

console.log("DELETE.JS LOADED (LIST MODE SAFE)");

/**************************************************************
 * 0. AMBIL SESSION AMAN
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
  alert("Sesi tidak valid, silakan login ulang.");
  location.href = "login.html";
}

const token = session?.token || "";
const myId = session?.id || "";
const role = session?.role || "user";

if (!token) {
  alert("Token hilang, login ulang.");
  location.href = "login.html";
}

/**************************************************************
 * 1. FETCH WRAPPER ANTI ERROR
 **************************************************************/
async function safeFetch(url) {
  console.log("[FETCH] URL:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("HTTP ERROR:", res.status);
      return { error: true };
    }

    try {
      return await res.json();
    } catch (jsonErr) {
      console.error("JSON ERROR:", jsonErr);
      return { error: true };
    }
  } catch (netErr) {
    console.error("NETWORK ERROR:", netErr);
    return { error: true };
  }
}

/**************************************************************
 * 2. LOAD USERS
 **************************************************************/
window.loadUsers = async function() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat...</td></tr>`;

  const url = `${API_URL}?mode=list&token=${token}`;
  const data = await safeFetch(url);

  tbody.innerHTML = "";

  if (data.error || !data.data) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Gagal memuat data</td></tr>`;
    return;
  }

  const list = data.data;

  list.forEach(u => {
    // user biasa hanya boleh melihat dirinya sendiri
    if (role !== "admin" && u.id !== myId) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="chk" value="${u.id}"></td>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email || "-"}</td>
    `;
    tbody.appendChild(tr);
  });

  // Jika user biasa → otomatis centang dirinya
  if (role !== "admin") {
    const chk = document.querySelector(".chk");
    if (chk) chk.checked = true;
  }
};

/**************************************************************
 * 3. DELETE SINGLE
 **************************************************************/
async function deleteById(id) {
  const url = `${API_URL}?mode=delete&id=${id}&token=${token}`;
  return await safeFetch(url);
}

/**************************************************************
 * 4. DELETE SELECTED (ADMIN)
 **************************************************************/
window.deleteSelected = async function() {
  const chk = [...document.querySelectorAll(".chk:checked")];
  if (chk.length === 0) {
    alert("Tidak ada yang dipilih.");
    return;
  }

  if (!confirm(`Hapus ${chk.length} user terpilih?`)) return;

  for (const c of chk) {
    const res = await deleteById(c.value);
    if (res.error) {
      alert(`Gagal menghapus ID: ${c.value}`);
      return;
    }
  }

  alert("Berhasil menghapus.");
  loadUsers();
};

/**************************************************************
 * 5. DELETE ALL (ADMIN)
 **************************************************************/
window.deleteAll = async function() {
  if (!confirm("Yakin ingin menghapus SEMUA user?"))
    return;

  const res = await safeFetch(`${API_URL}?mode=clear&token=${token}`);

  if (res.error) {
    alert("Gagal menghapus semua.");
    return;
  }

  alert("Semua user berhasil dihapus.");
  loadUsers();
};

/**************************************************************
 * 6. SELF DELETE (USER BIASA)
 **************************************************************/
window.deleteMyAccount = async function() {
  if (!confirm("Yakin ingin menghapus akun Anda?")) return;

  const res = await deleteById(myId);

  if (res.error) {
    alert("Gagal menghapus akun.");
    return;
  }

  // logout otomatis
  localStorage.removeItem("familyUser");
  alert("Akun Anda telah dihapus.");
  location.href = "login.html";
};
