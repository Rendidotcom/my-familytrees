import { API_URL } from "./config.js";
import { requireLogin, createNavbar } from "./auth.js";

const user = requireLogin();
createNavbar("dashboard");

const params = new URLSearchParams(location.search);
const id = params.get("id");

// Load old data
(async () => {
  const res = await fetch(`${API_URL}?mode=get&id=${id}`);
  const j = await res.json();

  if (j.status !== "success") return alert("❌ Tidak ditemukan");

  const p = j.data;

  document.getElementById("name").value = p.name;
  document.getElementById("relationship").value = p.relationship || "";
})();

// Submit update
document.getElementById("editForm").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    mode: "update",
    id: id,
    name: document.getElementById("name").value,
    relationship: document.getElementById("relationship").value,
    token: user.token
  };

  const res = await fetch(API_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });

  const j = await res.json();
  if (j.status === "success") {
    alert("✔ Disimpan.");
    location.href = "dashboard.html";
  } else alert("❌ " + j.message);
});
