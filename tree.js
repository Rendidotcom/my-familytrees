import { API_URL } from "./config.js";
import { requireLogin, createNavbar } from "./auth.js";

requireLogin();
createNavbar("tree");

(async () => {
  const res = await fetch(`${API_URL}?mode=getData`);
  const j = await res.json();

  document.getElementById("treeContainer").textContent =
    "Tree will render here (" + j.data.length + " anggota)";
})();
