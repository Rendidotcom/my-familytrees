(function () {
  const API_URL = window.API_URL;

  const detailEl = document.getElementById("detail");
  const msg = document.getElementById("msg");
  const jsonOutput = document.getElementById("jsonOutput");

  const btnSoft = document.getElementById("btnSoft");
  const btnHard = document.getElementById("btnHard");
  const btnDeleteSelf = document.getElementById("btnDeleteSelf");

  const urlParams = new URLSearchParams(window.location.search);
  const memberId = urlParams.get("id");

  let session = null;
  let currentUser = null;

  // -----------------------------
  async function init() {
    session = window.getSession();
    if (!session || !session.token) {
      window.location.href = "login.html";
      return;
    }

    currentUser = await window.validateToken(session.token);
    if (!currentUser || !currentUser.success) {
      window.clearSession();
      window.location.href = "login.html";
      return;
    }

    currentUser = currentUser.user; // GAS result {success:true, user:{...}}

    await loadDetail();
    applyRoleVisibility();
  }

  // -----------------------------
  async function loadDetail() {
    detailEl.textContent = "Memuat data...";

    try {
      const res = await fetch(`${API_URL}?action=get&id=${memberId}`, {
        headers: { Authorization: "Bearer " + session.token }
      });

      const data = await res.json();
      if (!data.success) {
        detailEl.textContent = "Data tidak ditemukan.";
        return;
      }

      const m = data.member;

      detailEl.innerHTML = `
        <p><b>ID:</b> ${m.id}</p>
        <p><b>Nama:</b> ${m.nama}</p>
        <p><b>Email:</b> ${m.email}</p>
        <p><b>Role:</b> ${m.role}</p>
        <p><b>Status:</b> ${m.deleted ? "DELETED" : "ACTIVE"}</p>
      `;

      jsonOutput.style.display = "block";
      jsonOutput.textContent = JSON.stringify(m, null, 2);

    } catch {
      detailEl.textContent = "Gagal memuat.";
    }
  }

  // -----------------------------
  function applyRoleVisibility() {
    const isAdmin = currentUser.role === "admin";
    const isSelf = String(currentUser.id) === String(memberId);

    if (isAdmin) {
      btnSoft.style.display = "inline-block";
      btnHard.style.display = "inline-block";
      if (isSelf) btnDeleteSelf.style.display = "inline-block";
      return;
    }

    // User biasa
    if (isSelf) {
      btnDeleteSelf.style.display = "inline-block";
    } else {
      msg.textContent = "Anda tidak diizinkan menghapus user lain.";
    }

    btnSoft.style.display = "none";
    btnHard.style.display = "none";
  }

  // -----------------------------
  async function softDelete() {
    msg.textContent = "Menghapus...";
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + session.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "softDelete", id: memberId }),
    });

    const data = await res.json();
    msg.textContent = data.success ? "Soft delete berhasil!" : "Gagal soft delete.";
  }

  async function hardDelete() {
    if (!confirm("Hapus PERMANEN?")) return;
    msg.textContent = "Menghapus...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + session.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "hardDelete", id: memberId }),
    });

    const data = await res.json();
    msg.textContent = data.success ? "Hard delete berhasil!" : "Gagal hard delete.";
  }

  async function deleteSelf() {
    if (!confirm("Hapus akun Anda sendiri?")) return;

    msg.textContent = "Menghapus akun...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + session.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "deleteSelf", id: currentUser.id }),
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Akun Anda telah dihapus.";
      setTimeout(() => {
        window.clearSession();
        window.location.href = "login.html";
      }, 1500);
    } else {
      msg.textContent = "Gagal menghapus akun.";
    }
  }

  // -----------------------------
  btnSoft.addEventListener("click", softDelete);
  btnHard.addEventListener("click", hardDelete);
  btnDeleteSelf.addEventListener("click", deleteSelf);

  init();
})();
