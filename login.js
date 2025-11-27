/**************************************************************
 🔐 LOGIN SYSTEM — FINAL MATCHING session.js (KEY: familyUser)
**************************************************************/

import { API_URL } from "./config.js";
import { saveSession } from "./session.js";

async function login() {
  const id = document.getElementById("id").value.trim();
  const pin = document.getElementById("pin").value.trim();

  if (!id || !pin) {
    alert("Masukkan ID dan PIN.");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "login",
        id: id,
        pin: pin
      })
    });

    if (!res.ok) {
      alert("Gagal menghubungi server.");
      return;
    }

    const j = await res.json();
    console.log(j);

    if (j.status !== "success") {
      alert(j.message || "ID atau PIN salah.");
      return;
    }

    /**********************************************************
     🟩 Simpan SESSION (KEY = familyUser)
    **********************************************************/
    saveSession({
      id: j.id,
      name: j.name,
      role: j.role,
      token: j.token,
      tokenExpiry: j.tokenExpiry
    });

    /**********************************************************
     🔄 Redirect ke Dashboard
    **********************************************************/
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi server saat login.");
  }
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") login();
});
