(function () {

  const user = requireLogin(); // <-- AUTH LAMA YANG BERHASIL
  const API_URL = window.API_URL;

  const urlParams = new URLSearchParams(window.location.search);
  const memberId = urlParams.get("id");

  const detailEl = document.getElementById("detail");
  const msg = document.getElementById("msg");
  const btnSoft = document.getElementById("btnSoft");
  const btnHard = document.getElementById("btnHard");
  const btnDeleteSelf = document.getElementById("btnDeleteSelf");
  const jsonOutput = document.getElementById("jsonOutput");

  // =====================================
  // LOAD DETAIL
  // =====================================
  async function loadDetail() {
    try {
      const res = await fetch(`${API_URL}?mode=get&id=${memberId}`);
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

      applyRoleLogic(m);

    } catch (err) {
      detailEl.innerHTML = "Gagal memuat data.";
    }
  }

  // =====================================
  // ROLE LOGIC
  // =====================================
  function applyRoleLogic(member) {
    const isAdmin = user.role === "admin";
    const isSelf = user.id === member.id;

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
      msg.textContent = "Anda tidak boleh hapus user lain.";
    }
  }

  // =====================================
  // ACTIONS
  // =====================================

  async function softDelete() {
    msg.textContent = "Soft delete...";
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ mode: "softDelete", id: memberId })
    });

    const data = await res.json();
    msg.textContent = data.success ? "Soft delete berhasil" : "Gagal soft delete";
  }

  async function hardDelete() {
    if (!confirm("Yakin hapus permanen?")) return;

    msg.textContent = "Hard delete...";
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ mode: "delete", id: memberId })
    });

    const data = await res.json();
    msg.textContent = data.success ? "Hard delete berhasil" : "Gagal hard delete";
  }

  async function deleteSelf() {
    if (!confirm("Yakin hapus akun Anda sendiri?")) return;

    msg.textContent = "Menghapus akun...";

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ mode: "delete", id: user.id })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Akun berhasil dihapus.";
      setTimeout(() => logout(), 1200);
    } else {
      msg.textContent = "Gagal hapus akun.";
    }
  }

  // =====================================
  // EVENT
  // =====================================
  btnSoft.onclick = softDelete;
  btnHard.onclick = hardDelete;
  btnDeleteSelf.onclick = deleteSelf;

  // GO
  loadDetail();

})();
