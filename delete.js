(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;

  if (typeof createNavbar === "function") createNavbar();

  const detailEl = document.getElementById("detail");
  const msg = document.getElementById("msg");
  const jsonOutput = document.getElementById("jsonOutput");

  // tombol
  const btnSoft = document.getElementById("btnSoft");
  const btnHard = document.getElementById("btnHard");
  const btnDeleteSelf = document.getElementById("btnDeleteSelf");

  const urlParams = new URLSearchParams(window.location.search);
  const memberId = urlParams.get("id"); // id target yang ingin dihapus

  let session = null;
  let currentUser = null;

  // -------------------------------------------------------------
  // 1) INIT SESSION
  // -------------------------------------------------------------
  async function init() {
    session = getSession();
    if (!session || !session.token) {
      window.location.href = "login.html";
      return;
    }

    currentUser = await validateToken(session.token);
    if (!currentUser) {
      clearSession();
      window.location.href = "login.html";
      return;
    }

    await loadDetail();
    applyRoleVisibility();
  }

  // -------------------------------------------------------------
  // 2) TAMPILKAN DATA ANGGOTA UNTUK DIHAPUS
  // -------------------------------------------------------------
  async function loadDetail() {
    detailEl.innerHTML = "Memuat data...";

    try {
      const res = await fetch(`${API_URL}?action=get&id=${memberId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      const data = await res.json();
      if (!data.success) {
        detailEl.innerHTML = "Data tidak ditemukan.";
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

    } catch (e) {
      detailEl.innerHTML = "Gagal memuat data.";
    }
  }

  // -------------------------------------------------------------
  // 3) ATUR TOMBOL SESUAI ROLE + KEAMANAN
  // -------------------------------------------------------------
  function applyRoleVisibility() {
    const isAdmin = currentUser.role === "admin";
    const isSelf = String(currentUser.id) === String(memberId);

    // ADMIN mode
    if (isAdmin) {
      btnSoft.style.display = "inline-block";
      btnHard.style.display = "inline-block";
      btnDeleteSelf.style.display = isSelf ? "inline-block" : "none";
      return;
    }

    // USER BIASA mode
  	if (isSelf) {
      // bisa hapus dirinya sendiri
      btnDeleteSelf.style.display = "inline-block";
    }

    // user biasa TIDAK bisa soft/hard delete orang lain
    btnSoft.style.display = "none";
    btnHard.style.display = "none";

    // kalau buka page orang lain: semua tombol hilang
    if (!isSelf) {
      btnDeleteSelf.style.display = "none";
      msg.textContent = "Anda tidak diizinkan menghapus user lain.";
    }
  }

  // -------------------------------------------------------------
  // 4) SOFT DELETE
  // -------------------------------------------------------------
  async function softDelete() {
    msg.textContent = "Menghapus (soft)...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "softDelete",
          id: memberId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        msg.style.color = "green";
        msg.textContent = "Soft delete berhasil!";
      } else {
        msg.textContent = data.message || "Gagal soft delete.";
      }
    } catch (e) {
      msg.textContent = "Error saat soft delete.";
    }
  }

  // -------------------------------------------------------------
  // 5) HARD DELETE
  // -------------------------------------------------------------
  async function hardDelete() {
    if (!confirm("Yakin hapus permanen?")) return;

    msg.textContent = "Menghapus permanen...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "hardDelete",
          id: memberId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        msg.style.color = "green";
        msg.textContent = "Hard delete berhasil!";
      } else {
        msg.textContent = data.message || "Gagal hard delete.";
      }
    } catch (e) {
      msg.textContent = "Error saat hard delete.";
    }
  }

  // -------------------------------------------------------------
  // 6) DELETE DIRI SENDIRI
  // -------------------------------------------------------------
  async function deleteSelf() {
    if (!confirm("Hapus akun Anda sendiri? Tindakan ini tidak dapat dibatalkan.")) return;

    msg.textContent = "Menghapus akun Anda...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteSelf",
          id: currentUser.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        msg.style.color = "green";
        msg.textContent = "Akun Anda telah dihapus.";

        // logout otomatis
        setTimeout(() => {
          clearSession();
          window.location.href = "login.html";
        }, 1500);

      } else {
        msg.textContent = data.message || "Gagal menghapus akun.";
      }

    } catch (e) {
      msg.textContent = "Error saat menghapus akun.";
    }
  }

  // -------------------------------------------------------------
  // 7) EVENT LISTENER
  // -------------------------------------------------------------
  btnSoft.addEventListener("click", softDelete);
  btnHard.addEventListener("click", hardDelete);
  btnDeleteSelf.addEventListener("click", deleteSelf);

  // GO
  init();
})();