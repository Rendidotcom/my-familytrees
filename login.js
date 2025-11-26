import { API_URL } from "./config.js";

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const pin   = document.getElementById("pin").value.trim();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        mode: "login",
        email: email,
        pin: pin
      })
    });

    const j = await res.json();
    console.log(j);

    if (j.status !== "success") {
      alert("❌ " + j.message);
      return;
    }

    // Simpan sesi
    localStorage.setItem("familyUser", JSON.stringify({
      id: j.id,
      name: j.name,
      role: j.role,
      token: j.token
    }));

    window.location.href = "dashboard.html";

  } catch(err) {
    alert("❌ ERROR: " + err.message);
  }
});
