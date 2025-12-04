// delete.js — FINAL, user hanya bisa hapus dirinya sendiri
(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession } = window;

  const delBtn = document.getElementById("deleteBtn");
  const msg = document.getElementById("msg");

  let SESSION = null;

  // tampil pesan
  function showMsg(text, danger = false) {
    msg.style.display = "block";
    msg.className = danger ? "danger" : "";
    msg.innerText = text;
  }

  // load session + validasi token
  async function init() {
    SESSION = getSession();
    if (!SESSION) return (window.location.href = "login.html");

    const isValid = await validateToken();
    if (!isValid) return (window.location.href = "login.html");
  }

  // user klik hapus diri sendiri
  delBtn.addEventListener("click", async () => {
    if (!SESSION) return showMsg("Session hilang. Silakan login ulang.", true);

    if (!confirm("Apakah Anda yakin ingin menghapus akun Anda secara permanen?")) {
      return;
    }

    showMsg("Memproses penghapusan akun...");

    try {
      const res = await fetch(API_URL + "?action=deleteSelf", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + SESSION.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: SESSION.userId }),
      });

      const data = await res.json();

      if (!data.success) {
        return showMsg(data.message || "Gagal menghapus akun.", true);
      }

      showMsg("Akun Anda berhasil dihapus.");

      // hapus session, redirect
      clearSession();
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } catch (err) {
      console.error(err);
      showMsg("Terjadi kesalahan koneksi.", true);
    }
  });

  init();
})();
