// login.js — FINAL sinkron session.js & dashboard.js

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
      body: JSON.stringify({ mode: "login", id, pin })
    });

    const j = await res.json();
    if (j.status !== "success") {
      alert(j.message || "ID atau PIN salah.");
      return;
    }

    // SIMPAN SESSION (harus key: "session")
    saveSession({
      id: j.id,
      name: j.name,
      role: j.role,
      token: j.token
    });

    window.location.href = "dashboard.html";

  } catch (e) {
    console.error(e);
    alert("Kesalahan koneksi server.");
  }
}

document.getElementById("btnLogin").onclick = login;
document.addEventListener("keydown", e => { if (e.key === "Enter") login(); });
