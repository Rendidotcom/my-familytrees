/* ============================================================
   DELETE.JS — ULTRA SAFE EDITION (ANTI ERROR BENTURAN)
============================================================= */

console.log("DELETE.JS LOADED (ANTI ERROR MODE)");

/**************************************************************
 * 0. SAFE GET SESSION
 **************************************************************/
function safeGetSession() {
  try {
    const raw = localStorage.getItem("familyUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("[ERROR] Session corrupt:", e);
    return null;
  }
}

const session = safeGetSession();
if (!session) {
  alert("Sesi hilang. Silakan login kembali.");
  location.href = "login.html";
}

const token = session?.token || "";
const sessionId = session?.id || "";
const role = session?.role || "user";

// Jika token kosong → langsung out
if (!token) {
  alert("Token tidak valid. Login ulang.");
  location.href = "login.html";
}

/**************************************************************
 * 1. AMBIL PARAMETER ID DARI URL
 **************************************************************/
const params = new URLSearchParams(window.location.search);
const targetId = params.get("id");

if (!targetId) {
  alert("ID tidak ditemukan di URL.");
  location.href = "index.html";
}

/**************************************************************
 * 2. LOAD CONFIG SAFE
 **************************************************************/
let API_URL = "";
try {
  API_URL = window.API_URL;
  console.log("API_URL loaded:", API_URL);
} catch (e) {
  console.error("CONFIG ERROR:", e);
  alert("Konfigurasi tidak ditemukan.");
  location.href = "index.html";
}

/**************************************************************
 * 3. FETCH WRAPPER (ANTI ERROR)
 **************************************************************/
async function safeFetch(url) {
  console.log("[FETCH] URL:", url);

  try {
    const res = await fetch(url, { method: "GET" });

    // Jika bukan 200
    if (!res.ok) {
      console.error("[FETCH ERROR] Status:", res.status);
      return { error: true, status: res.status };
    }

    // Parse JSON aman
    try {
      return await res.json();
    } catch (e) {
      console.error("[JSON ERROR] Response bukan JSON:", e);
      return { error: true, jsonError: true };
    }

  } catch (e) {
    console.error("[NETWORK ERROR]", e);
    return { error: true, network: true };
  }
}

/**************************************************************
 * 4. LOAD USER TARGET DARI API
 **************************************************************/
async function loadUser() {
  const url = `${API_URL}?mode=list&token=${token}`;
  const data = await safeFetch(url);

  if (data.error || !Array.isArray(data.data)) {
    alert("Gagal memuat data user.");
    return;
  }

  const allUsers = data.data;
  const user = allUsers.find(u => u.id === targetId);

  if (!user) {
    alert("User tidak ditemukan.");
    location.href = "index.html";
    return;
  }

  document.getElementById("deleteName").innerText = user.name;

  // User biasa tidak boleh menghapus orang lain
  if (role !== "admin" && targetId !== sessionId) {
    alert("Anda tidak diizinkan menghapus akun lain.");
    location.href = "index.html";
    return;
  }
}

loadUser();

/**************************************************************
 * 5. DELETE ACTION
 **************************************************************/
document.getElementById("btnDelete").addEventListener("click", async () => {
  if (!confirm("Yakin ingin menghapus data ini?")) return;

  const url = `${API_URL}?mode=delete&id=${targetId}&token=${token}`;
  const res = await safeFetch(url);

  if (res.error) {
    alert("Gagal menghapus data. Periksa koneksi / server.");
    return;
  }

  if (res?.success !== true) {
    alert("API menolak penghapusan.");
    return;
  }

  // Jika user hapus diri sendiri
  if (targetId === sessionId) {
    localStorage.removeItem("familyUser");
    alert("Akun Anda berhasil dihapus. Logout otomatis.");
    location.href = "login.html";
    return;
  }

  alert("Berhasil menghapus user.");
  location.href = "index.html";
});

/**************************************************************
 * 6. CANCEL BUTTON
 **************************************************************/
document.getElementById("btnCancel").addEventListener("click", () => {
  location.href = "index.html";
});
