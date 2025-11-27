// dashboard.js — full clean fixed
import { API_URL } from "./config.js";
import { getSession, saveSession, validateToken, createNavbar, doLogout } from "./session.js";

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => {
  createNavbar("dashboard");

  const box = document.getElementById("familyBox");
  const list = document.getElementById("familyList");
  const status = document.getElementById("statusMsg");

  status.textContent = "Loading data...";

  const session = getSession();
  if (!session || !session.token) {
    status.textContent = "Session expired. Please login again.";
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  // Validate token via GAS
  const v = await validateToken(session.token);
  if (!v.valid) {
    status.textContent = "Session expired. Please login again.";
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  // Update user info in navbar
  document.getElementById("userInfo").textContent = v.data.email || "User";

  // Fetch family list
  try {
    const res = await fetch(`${API_URL}?mode=list&token=${encodeURIComponent(session.token)}`);
    const j = await res.json();

    if (j.status !== "success") {
      status.textContent = "Failed to load data.";
      return;
    }

    status.textContent = "";
    list.innerHTML = "";

    j.data.forEach((m) => {
      const div = document.createElement("div");
      div.style.padding = "8px 0";
      div.style.borderBottom = "1px solid #eee";
      div.textContent = `${m.name} (${m.gender})`;
      list.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    status.textContent = "Failed to load data.";
  }
});
