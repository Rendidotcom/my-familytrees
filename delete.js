// ===============================
// DELETE.JS FINAL – kompatibel dengan auth.js kamu
// ===============================
(function () {

  const API_URL = window.API_URL;

  // auth.js style
  const user = JSON.parse(localStorage.getItem("familyUser") || "null");
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (typeof createNavbar === "function") createNavbar("dashboard");

  // elemen
  const detailEl = document.getElementById("detail");
  const msg = document.getElementById("msg");
  const btnSoft = document.getElementById("btnSoft");
  const btnHard = document.getElementById("btnHard");
  const btnDeleteSelf = document.getElementById("btnDeleteSelf");

  // query id = user target
  const urlParams = new URLSearchParams(window.location.search);
  const memberId = urlParams.get("id");

  // ===============================
  // 1) LOAD DATA MEMBER
  // ===============================
  async function loadDetail() {
    detailEl.innerHTML = "Memuat...";

    try {
      const res = await fetch(`${API_URL}?mode=get&id=${memberId}`);
      const data = await res.json();

      if (!data.success || !data.member) {
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

      applyRoleVisibility(m);

    } catch (e) {
      detailEl.innerHTML = "Gagal memuat data.";
    }
  }

  // ===============================
  // 2) VISIBILITY BUTTONS
  // ===============================
  function applyRoleVisibility(member) {
    const isAdmin = user.role === "admin";
    const isSelf = user.id === member.id;

    if (isAdmin) {
      btnSoft.style.display = "inline-block";
      btnHard.style.display = "inline-block";
      btnDeleteSelf.style.display = isSelf ? "inline-block" : "none";
      return;
    }

    // user biasa
    if (isSelf) {
      btnDeleteSelf.style.display = "inline-block";
    } else {
      msg.textContent = "Anda tidak punya izin menghapus user lain.";
    }

    btnSoft.style.display = "none";
    btnHard.style.display = "none";
  }

  // ===============================
  // 3) SOFT DELETE (ADMIN SAJA)
  // ===============================
  async function softDelete() {
    msg.textContent = "Menghapus (soft)...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "softDelete",
        id: memberId,
        token: user.token
      })
    });

    const data = await res.json();
    msg.textContent = data.success ? "Soft delete berhasil!" : data.message;
  }

  // ===============================
  // 4) HARD DELETE (ADMIN SAJA)
  // ===============================
  async function hardDelete() {
    if (!confirm("Yakin hapus permanen?")) return;

    msg.textContent = "Menghapus permanen...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: memberId,
        token: user.token
      })
    });

    const data = await res.json();
    msg.textContent = data.success ? "Hard delete berhasil!" : data.message;
  }

  // ===============================
  // 5) USER DELETE DIRI SENDIRI
  // ===============================
  async function deleteSelf() {
    if (!confirm("Yakin hapus akun Anda sendiri?")) return;

    msg.textContent = "Menghapus akun...";

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "delete",
        id: user.id,     // <- tidak boleh memberId karena user hanya hapus dirinya sendiri
        token: user.token
      })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Akun berhasil dihapus.";
      setTimeout(() => {
        localStorage.removeItem("familyUser");
        window.location.href = "login.html";
      }, 1200);
    } else {
      msg.textContent = data.message || "Gagal menghapus akun.";
    }
  }

  // EVENT LISTENER
  btnSoft.onclick = softDelete;
  btnHard.onclick = hardDelete;
  btnDeleteSelf.onclick = deleteSelf;

  // GO
  loadDetail();
})();
