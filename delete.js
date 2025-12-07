/* ================================
   DELETE.JS — FINAL FIXED
   Sinkron GAS + Self Delete OK
================================ */

const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

const token = session.token;
const sessionId = session.id;
const role = session.role;

const urlParams = new URLSearchParams(window.location.search);
const targetId = urlParams.get("id");

/* -----------------------------------
   1. LOAD USER DETAIL
----------------------------------- */
async function loadUser() {
  try {
    const res = await fetch(`${API_URL}?mode=getUser&id=${targetId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    console.log("DATA:", data);

    if (data.status !== "success") {
      document.getElementById("detail").innerHTML = "Gagal memuat data.";
      return;
    }

    const u = data.user;

    document.getElementById("detail").innerHTML = `
      <b>ID:</b> ${u.ID}<br>
      <b>Nama:</b> ${u.name}<br>
      <b>Status:</b> ${u.status}
    `;

    // Jika user biasa, hide tombol delete selain self
    if (role !== "admin" && targetId !== sessionId) {
      document.getElementById("btnSoft").style.display = "none";
      document.getElementById("btnHard").style.display = "none";
    }

    // Tampilkan tombol self-delete
    if (targetId === sessionId) {
      document.getElementById("btnSelfDelete").style.display = "block";
    }

  } catch (e) {
    console.error(e);
    document.getElementById("detail").innerHTML = "Error memuat data.";
  }
}
loadUser();

/* -----------------------------------
   2. SOFT DELETE
----------------------------------- */
async function softDelete() {
  if (!confirm("Yakin soft delete user ini?")) return;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: "softDelete",
      id: targetId
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    alert("Berhasil soft delete.");
    location.href = "users.html";
  } else {
    alert(data.message);
  }
}

/* -----------------------------------
   3. HARD DELETE
----------------------------------- */
async function hardDelete() {
  if (!confirm("⚠️ Hapus permanen user ini?")) return;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: "hardDelete",
      id: targetId
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    alert("User dihapus permanen.");
    location.href = "users.html";
  } else {
    alert(data.message);
  }
}

/* -----------------------------------
   4. SELF DELETE
----------------------------------- */
async function deleteMyAccount() {
  if (!confirm("⚠️ Yakin ingin hapus akun Anda sendiri?")) return;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: "hardDelete",
      id: sessionId
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    localStorage.removeItem("familyUser");
    alert("Akun Anda berhasil dihapus.");
    location.href = "login.html";
  } else {
    alert(data.message);
  }
}
