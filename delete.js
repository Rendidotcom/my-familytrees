/* ============================================================
   DELETE.JS — FINAL VERSION + UI FIX
   - Admin dapat hapus siapa saja
   - User biasa hanya dapat hapus dirinya sendiri
   - UI otomatis menyesuaikan
   ============================================================ */

/* -------------------------
   1. SESSION
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;
const isAdmin = session.role === "admin";

/* -------------------------
   2. GET PARAM ID
---------------------------- */
const urlParams = new URLSearchParams(window.location.search);
const targetId = urlParams.get("id");

if (!targetId) {
  document.getElementById("memberInfo").innerHTML = `<p class='text-danger'>ID tidak valid.</p>`;
}

/* -------------------------
   3. UI ELEMENTS
---------------------------- */
const btnSoft = document.getElementById("btnSoftDelete");
const btnHard = document.getElementById("btnHardDelete");
const infoBox = document.getElementById("memberInfo");

/* -------------------------
   4. PERMISSION CHECK (UI)
---------------------------- */
if (!isAdmin && targetId !== sessionId) {
  // User biasa tidak boleh hapus orang lain
  btnSoft.style.display = "none";
  btnHard.style.display = "none";
  infoBox.innerHTML = `<p class='text-danger'>Anda tidak memiliki akses untuk menghapus anggota ini.</p>`;
}

/* -------------------------
   5. LOAD MEMBER DATA (UI)
---------------------------- */
async function loadMember() {
  try {
    const res = await fetch(`${API_URL}?mode=getMember&id=${targetId}&token=${token}`);
    const data = await res.json();

    if (data.status !== "success") {
      infoBox.innerHTML = `<p class='text-danger'>Tidak dapat mengambil data. (${data.message})</p>`;
      return;
    }

    const m = data.member;
    infoBox.innerHTML = `
      <div class='border p-3 rounded'>
        <p><strong>Nama:</strong> ${m.name}</p>
        <p><strong>Email:</strong> ${m.email}</p>
        <p><strong>Status:</strong> ${m.status}</p>
      </div>
    `;
  } catch (e) {
    infoBox.innerHTML = `<p class='text-danger'>Gagal memuat data anggota.</p>`;
  }
}
loadMember();

/* -------------------------
   6. GENERIC DELETE FUNCTION
---------------------------- */
async function deleteMember(type) {
  if (!confirm(`Yakin ingin melakukan ${type.toUpperCase()} delete?`)) return;

  try {
    const res = await fetch(`${API_URL}?mode=deleteMember&type=${type}&id=${targetId}&token=${token}`);
    const data = await res.json();

    if (data.status === "success") {
      alert(data.message || "Berhasil dihapus.");

      // Jika user menghapus diri sendiri
      if (targetId === sessionId) {
        localStorage.removeItem("familyUser");
        alert("Akun Anda telah dihapus.");
        location.href = "login.html";
        return;
      }

      location.href = "members.html";
    } else if (data.status === "error") {
      alert(`Gagal: ${data.message}`);
    }
  } catch (e) {
    alert("Terjadi kesalahan saat menghapus.");
  }
}

/* -------------------------
   7. BUTTON HANDLER
---------------------------- */
btnSoft.addEventListener("click", () => deleteMember("soft"));
btnHard.addEventListener("click", () => deleteMember("hard"));