// ======================================================
// delete.js — FINAL (sinkron dengan GAS & perbaikan Forbidden)
// ======================================================

(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;

  if (typeof createNavbar === "function") createNavbar();

  const msg = document.getElementById("msg");
  const detailBox = document.getElementById("detailBox");
  const softBtn = document.getElementById("softDeleteBtn");
  const hardBtn = document.getElementById("hardDeleteBtn");

  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id");

  let session = null;

  // ------------------------------------------------------
  // UTIL
  // ------------------------------------------------------
  function showMessage(text, type = "error") {
    msg.innerHTML = `<div class="${type}">${text}</div>`;
  }

  function renderJSON(data) {
    detailBox.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  // ------------------------------------------------------
  // LOAD SESSION
  // ------------------------------------------------------
  async function loadSession() {
    session = getSession();
    if (!session) return redirectLogin();

    const tokenValid = await validateToken(session.token);
    if (!tokenValid) {
      clearSession();
      return redirectLogin();
    }
  }

  function redirectLogin() {
    alert("Sesi berakhir. Silakan login lagi.");
    window.location.href = "login.html";
  }

  // ------------------------------------------------------
  // CEK AKSES DELETE (FIX PERMISSION)
//  User boleh akses jika:
//    - admin → boleh ambil detail siapa pun
//    - user biasa → hanya boleh ambil detail dirinya sendiri
  // ------------------------------------------------------
  function canAccess(targetId) {
    if (!session) return false;

    if (session.role === "admin") return true; // FULL ACCESS

    // USER NON-ADMIN → hanya boleh mengakses ID miliknya
    return session.userId === targetId;
  }

  // ------------------------------------------------------
  // LOAD DETAIL ANGGOTA
  // ------------------------------------------------------
  async function loadDetail() {
    if (!memberId) {
      showMessage("Parameter ID tidak ditemukan.");
      return;
    }

    if (!canAccess(memberId)) {
      showMessage("Anda tidak memiliki izin melihat data ini.", "error");
      renderJSON({ status: "error", message: "Forbidden" });
      softBtn.disabled = true;
      hardBtn.disabled = true;
      return;
    }

    try {
      const res = await fetch(`${API_URL}?mode=get&id=${memberId}`);
      const data = await res.json();

      if (data.status !== "success") {
        showMessage("Data tidak ditemukan.");
        renderJSON(data);
        return;
      }

      showMessage("");
      renderJSON(data.data);

    } catch (err) {
      showMessage("Gagal memuat detail.");
      renderJSON({ status: "error", error: err.message });
    }
  }

  // ------------------------------------------------------
  // DELETE HANDLER
  // ------------------------------------------------------
  async function performDelete(mode) {
    if (!canAccess(memberId)) {
      alert("Anda tidak memiliki izin untuk menghapus data ini.");
      return;
    }

    if (!confirm(`Anda yakin melakukan ${mode}?`)) return;

    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("id", memberId);

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      renderJSON(data);

      if (data.status === "success") {
        alert("Berhasil dihapus!");

        // Jika user menghapus dirinya sendiri → logout & redirect ke login
        if (memberId === session.userId) {
          clearSession();
          window.location.href = "login.html";
        } else {
          window.location.href = "members.html";
        }
      } else {
        alert("Gagal: " + data.message);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  // ------------------------------------------------------
  // EVENT BINDING
  // ------------------------------------------------------
  softBtn.addEventListener("click", () => performDelete("softDelete"));
  hardBtn.addEventListener("click", () => performDelete("hardDelete"));

  // ------------------------------------------------------
  // INIT
  // ------------------------------------------------------
  (async function init() {
    await loadSession();
    loadDetail();
  })();
})();
