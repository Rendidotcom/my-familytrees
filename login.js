// login.js — FINAL (paste ke login.html page script)
// Expects config.js export const API_URL = "...";

import { API_URL } from "./config.js";

/**
 * form fields with id="loginName" and id="loginPin" or adapt as needed.
 * This version supports GAS login response shapes:
 * - {status:"success", token: "...", user: {id,name,role}} OR
 * - {status:"success", user:{...}, token:"..."} OR older {status:"success", id, name, role, token}
 */

async function doLogin() {
  const name = (document.getElementById("loginName")?.value || "").trim();
  const pin = (document.getElementById("loginPin")?.value || "").trim();

  if (!name) return alert("Nama wajib diisi.");
  if (!pin) return alert("PIN wajib diisi.");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "login", name: name, pin: pin })
    });
    if (!res.ok) throw new Error("Network");
    const j = await res.json();

    if (!j || j.status !== "success") {
      return alert(j && j.message ? j.message : "Login gagal");
    }

    // Try to find token + user info in possible response shapes
    const token = j.token || j.data?.token || j?.token || j.token;
    const userObj = j.user || (j.id ? { id: j.id, name: j.name, role: j.role } : j.data?.user) || null;

    if (!token || !userObj) {
      // Some older endpoints returned token directly at same level
      // try alternate keys
      const altUser = userObj || { id: j.id || j.userId || null, name: j.name || (j.user && j.user.name) || name, role: j.role || (j.user && j.user.role) || "user" };
      const finalToken = token || j.token || j.sessionToken || null;
      if (!finalToken) return alert("Login: token tidak ditemukan dari response");
      const session = { id: altUser.id, name: altUser.name, role: altUser.role || "user", token: finalToken, tokenExpiry: Date.now() + (24*60*60*1000)};
      localStorage.setItem("familyUser", JSON.stringify(session));
      window.location.href = "dashboard.html";
      return;
    }

    const session = {
      id: userObj.id || userObj.userId || null,
      name: userObj.name || userObj.fullname || name,
      role: userObj.role || "user",
      token: token,
      tokenExpiry: j.tokenExpiry || (Date.now() + 24*60*60*1000)
    };

    localStorage.setItem("familyUser", JSON.stringify(session));
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("login error:", err);
    alert("Gagal login: " + (err.message || "cek koneksi"));
  }
}

// Attach to UI
document.getElementById("btnLogin")?.addEventListener("click", doLogin);
document.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
