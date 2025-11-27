/**************************************************
 *  LOGIN.JS — FINAL CLEAN (SYNC GAS 2025)
 **************************************************/

// ==========================
// 🔧 API CONFIG
// ==========================
const API_URL =
  "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";


// ==========================
// 🔐 CEK SUDAH LOGIN?
// ==========================
const existing = JSON.parse(localStorage.getItem("familyUser") || "null");
if (existing && existing.token) {
  location.href = "dashboard.html";
}


// ==========================
// 🔍 CEK USER SAAT KETIK NAMA
// ==========================
async function checkUser() {
  const name = document.getElementById("name").value.trim();
  const info = document.getElementById("info");

  if (!name) {
    info.textContent = "";
    return;
  }

  try {
    const res = await fetch(`${API_URL}?mode=checkUser&name=${encodeURIComponent(name)}`);
    const json = await res.json();

    if (json.status !== "success") {
      info.textContent = "❌ Error cek user.";
      return;
    }

    if (!json.exists) {
      info.innerHTML = `🆕 Nama belum terdaftar. <b>Akan dibuat baru.</b>`;
      return;
    }

    if (json.exists && !json.pinSet) {
      info.innerHTML = `🔑 User ditemukan. <b>PIN pertama kali</b> akan diset.`;
      return;
    }

    info.textContent = "✔ User ditemukan. Silakan masuk PIN.";

  } catch (err) {
    info.textContent = "❌ Koneksi error.";
  }
}


// ==========================
// 🔐 LOGIN / REGISTER
// ==========================
async function loginSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const pin = document.getElementById("pin").value.trim();
  const info = document.getElementById("info");

  if (!name || !pin) {
    alert("Nama & PIN wajib diisi.");
    return;
  }

  try {
    // Cek dulu apakah user sudah ada
    const check = await fetch(`${API_URL}?mode=checkUser&name=${encodeURIComponent(name)}`);
    const checkJson = await check.json();

    if (checkJson.status !== "success") {
      alert("Gagal cek user.");
      return;
    }

    // ==========================
    // REGISTER BARU
    // ==========================
    if (!checkJson.exists) {
      if (!confirm(`Nama "${name}" belum ada.\nDaftarkan user baru?`)) return;

      const reg = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "register",
          name: name,
          pin: pin
        })
      });

      const data = await reg.json();

      if (data.status === "success") {
        saveSession(data.user, data.token);
        return location.href = "dashboard.html";
      }

      alert("Gagal register: " + data.message);
      return;
    }

    // ==========================
    // LOGIN EXISTING USER
    // ==========================
    const loginRes = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "login",
        name: name,
        pin: pin
      })
    });

    const loginJson = await loginRes.json();

    if (loginJson.status !== "success") {
      alert(loginJson.message || "Login gagal.");
      return;
    }

    saveSession(loginJson.user, loginJson.token);
    location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    alert("❌ Error koneksi ke server.");
  }
}


// ==========================
// 💾 SIMPAN SESSION LOCAL
// ==========================
function saveSession(user, token) {
  const obj = {
    id: user.id,
    name: user.name,
    role: user.role,
    token: token
  };

  localStorage.setItem("familyUser", JSON.stringify(obj));
}


// ==========================
// 🔘 EVENT HANDLER
// ==========================
document.getElementById("name").addEventListener("input", checkUser);
document.getElementById("loginForm").addEventListener("submit", loginSubmit);
