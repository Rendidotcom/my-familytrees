import { API_URL } from "./config.js";
import { requireLogin, createNavbar } from "./auth.js";

requireLogin();
createNavbar("dashboard");

const params = new URLSearchParams(location.search);
const id = params.get("id");

(async () => {
  const res = await fetch(`${API_URL}?mode=get&id=${id}`);
  const j = await res.json();

  if (j.status !== "success") {
    document.body.innerHTML = "❌ Data tidak ditemukan.";
    return;
  }

  const p = j.data;

  document.getElementById("name").textContent = p.name;
  document.getElementById("photo").src = p.photoURL;
  document.getElementById("relation").textContent = p.relationship;
})();
