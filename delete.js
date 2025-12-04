(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;

  if (typeof createNavbar === "function") createNavbar();

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
  let target = null;  // <— PENYELAMAT! (sinkron dengan edit.js)

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

  // ================================================
  // LOAD DETAIL (FORMAT SAMA PERSIS DENGAN edit.js)
  // ================================================
  async function loadDetail() {
    detailEl.innerHTML = "Memuat data...";

    try {
      const res = await fetch(`${API_URL}?action=get&id=${memberId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      const data = await res.json();

      if (!data.success || !data.member) {
        detailEl.innerHTML = "<p style='color:red'>Data tidak ditemukan.</p>";
        return;
      }

      target = data.member;    // <— INI KUNCI! SAMA DENGAN EDIT.JS

      detailEl.innerHTML = `
        <p><b>ID:</b> ${target.id}</p>
        <p><b>Nama:</b> ${target.nama}</p>
        <p><b>Email:</b> ${target.email}</p>
        <p><b>Role:</b> ${target.role}</p>
        <p><b>Status:</b> ${target.deleted ? "DELETED" : "ACTIVE"}</p>
      `;

      jsonOutput.style.display = "block";
      jsonOutput.textContent = JSON.stringify(target, null, 2);

    } catch (e) {
      detailEl.innerHTML = "<p style='color:red'>Gagal memuat data.</p>";
    }
  }

  // ================================================
  // VISIBILITY BUTTONS
  // ================================================
  function applyRoleVisibility() {
    const isAdmin = currentUser.role === "admin";
    const isSelf = String(currentUser.id) === String(memberId);

    if (!target) return;

    if (isAdmin) {
      btnSoft.style.display = "inline-block";
      btnHard.style.display = "inline-block";
      btnDeleteSelf.style.display = isSelf ? "inline-block" : "none";
      return;
    }

    if (isSelf) {
      btnDeleteSelf.style.display = "inline-block";
    } else {
      btnDeleteSelf.style.display = "none";
      msg.textContent = "Anda tidak diizinkan menghapus user lain.";
    }

    btnSoft.style.display = "none";
    btnHard.style.display = "none";
  }

  // ================================================
  // SOFT DELETE
  // ================================================
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

      msg.style.color = data.success ? "green" : "red";
      msg.textContent = data.success
        ? "Soft delete berhasil!"
        : (data.message || "Gagal soft delete.");

    } catch (e) {
      msg.textContent = "Error soft delete.";
    }
  }

  // ================================================
  // HARD DELETE
  // ================================================
  async function hardDelete() {
    if (!confirm("Yakin menghapus permanen?")) return;

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

      msg.style.color = data.success ? "green" : "red";
      msg.textContent = data.success
        ? "Hard delete berhasil!"
        : (data.message || "Gagal hard delete.");

    } catch (e) {
      msg.textContent = "Error hard delete.";
    }
  }

  // ================================================
  // DELETE SELF
  // ================================================
  async function deleteSelf() {
    if (!confirm("Hapus akun Anda sendiri?")) return;

    msg.textContent = "Menghapus akun...";

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

        setTimeout(() => {
          clearSession();
          window.location.href = "login.html";
        }, 1500);
      } else {
        msg.textContent = data.message || "Gagal menghapus akun.";
      }

    } catch (e) {
      msg.textContent = "Error menghapus akun.";
    }
  }

  btnSoft.addEventListener("click", softDelete);
  btnHard.addEventListener("click", hardDelete);
  btnDeleteSelf.addEventListener("click", deleteSelf);

  init();
})();
