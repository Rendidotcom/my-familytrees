// ==============================
// DELETE.JS FINAL (Cocok dengan auth.js kamu)
// ==============================

(async function () {

  // Ambil user login dari auth.js
  const user = requireLogin();
  if (!user) return; // sudah di-redirect oleh auth.js

  const detailEl = document.getElementById("detail");
  const msg = document.getElementById("msg");
  const urlParams = new URLSearchParams(window.location.search);
  const memberId = urlParams.get("id");

  // Render navbar
  createNavbar();

  // ========================================
  // 1) LOAD DATA MEMBER
  // ========================================
  async function loadDetail() {
    detailEl.innerHTML = "Memuat data...";

    try {
      const res = await fetch(`${API_URL}?mode=get&id=${memberId}`);
      const data = await res.json();

      if (!data.success || !data.member) {
        detailEl.innerHTML = `<span style="color:red">Data tidak ditemukan.</span>`;
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

    } catch (e) {
      detailEl.innerHTML = `<span style="color:red">Gagal memuat data.</span>`;
    }
  }

  // ========================================
  // 2) ADMIN / USER RULE
  // ========================================
  function applyVisibility() {
    const isAdmin = user.role === "admin";
    const isSelf = user.id === memberId;

    const btnSoft = document.getElementById("btnSoft");
    const btnHard = document.getElementById("btnHard");
    const btnSelf = document.getElementById("btnDeleteSelf");

    // Reset
    btnSoft.style.display = "none";
    btnHard.style.display = "none";
    btnSelf.style.display = "none";

    // ADMIN → bisa hapus semuanya
    if (isAdmin) {
      btnSoft.style.display = "inline-block";
      btnHard.style.display = "inline-block";
      return;
    }

    // USER BIASA → hanya boleh hapus diri sendiri
    if (isSelf) {
      btnSelf.style.display = "inline-block";
    } else {
      msg.textContent = "Anda tidak diizinkan menghapus user lain.";
    }
  }

  // ========================================
  // 3) SOFT DELETE
  // ========================================
  async function softDelete() {
    msg.textContent = "Soft deleting...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "softDelete",
        id: memberId
      })
    });

    const data = await res.json();
    msg.textContent = data.success ? "Soft delete berhasil." : "Gagal soft delete.";
  }

  // ========================================
  // 4) HARD DELETE
  // ========================================
  async function hardDelete() {
    if (!confirm("Yakin hapus permanen?")) return;

    msg.textContent = "Hard deleting...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: memberId
      })
    });

    const data = await res.json();
    msg.textContent = data.success ? "Hard delete berhasil." : "Gagal hard delete.";
  }

  // ========================================
  // 5) DELETE SELF
  // ========================================
  async function deleteSelf() {
    if (!confirm("Hapus akun Anda sendiri?")) return;

    msg.textContent = "Menghapus akun...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: user.id
      })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Akun Anda telah dihapus.";
      setTimeout(() => {
        localStorage.removeItem("familyUser");
        window.location.href = "login.html";
      }, 1200);
    } else {
      msg.textContent = "Gagal menghapus akun.";
    }
  }

  // ========================================
  // EVENT
  // ========================================
  document.getElementById("btnSoft").onclick = softDelete;
  document.getElementById("btnHard").onclick = hardDelete;
  document.getElementById("btnDeleteSelf").onclick = deleteSelf;

  // GO
  await loadDetail();
  applyVisibility();

})();
