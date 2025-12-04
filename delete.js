(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession } = window;

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

  // -------------------------------------------------------------
  async function init() {
    session = getSession(); // ← ERROR hilang karena auth.js sudah dimuat
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
  async function loadDetail() {
    detailEl.innerHTML = "Memuat data...";

    try {
      const res = await fetch(`${API_URL}?action=get&id=${memberId}`);
      const data = await res.json();

      if (!data.success || !data.member) {
        detailEl.innerHTML = `<span style="color:red;">Data tidak ditemukan.</span>`;
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
  function applyRoleVisibility() {
    const isAdmin = currentUser.role === "admin";
    const isSelf = String(currentUser.id) === String(memberId);

    if (isAdmin) {
      btnSoft.style.display = "inline-block";
      btnHard.style.display = "inline-block";

      if (isSelf) {
        btnDeleteSelf.style.display = "inline-block";
      }
      return;
    }

    // USER BIASA
    if (isSelf) {
      btnDeleteSelf.style.display = "inline-block";
    } else {
      msg.textContent = "Anda tidak diizinkan menghapus user lain.";
    }

    btnSoft.style.display = "none";
    btnHard.style.display = "none";
  }

  // -------------------------------------------------------------
  async function softDelete() {
    msg.textContent = "Soft delete...";
    try {
      const res = await fetch(`${API_URL}?action=softDelete&id=${memberId}`);
      const data = await res.json();
      msg.textContent = data.success ? "Soft delete berhasil!" : "Gagal soft delete.";
    } catch {
      msg.textContent = "Error soft delete.";
    }
  }

  async function hardDelete() {
    if (!confirm("Yakin hapus permanen?")) return;

    msg.textContent = "Hard delete...";
    try {
      const res = await fetch(`${API_URL}?action=hardDelete&id=${memberId}`);
      const data = await res.json();
      msg.textContent = data.success ? "Hard delete berhasil!" : "Gagal hard delete.";
    } catch {
      msg.textContent = "Error hard delete.";
    }
  }

  async function deleteSelf() {
    if (!confirm("Hapus akun Anda sendiri?")) return;

    msg.textContent = "Menghapus akun Anda...";
    try {
      const res = await fetch(`${API_URL}?action=deleteSelf&id=${currentUser.id}`);
      const data = await res.json();

      if (data.success) {
        msg.textContent = "Akun Anda dihapus.";
        setTimeout(() => {
          clearSession();
          window.location.href = "login.html";
        }, 1200);
      } else {
        msg.textContent = "Gagal menghapus akun.";
      }
    } catch {
      msg.textContent = "Error menghapus akun.";
    }
  }

  // -------------------------------------------------------------
  btnSoft.addEventListener("click", softDelete);
  btnHard.addEventListener("click", hardDelete);
  btnDeleteSelf.addEventListener("click", deleteSelf);

  init();
})();
