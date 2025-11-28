// edit.js — FINAL (attach to edit.html via module or regular script)
import { API_URL } from "./config.js";
import { getSession, validateToken, createNavbar } from "./session.js";

createNavbar();

const params = new URLSearchParams(location.search);
const ID = params.get("id");

const form = document.getElementById("formEdit");
const msgEl = document.getElementById("msg");

async function protect() {
  const s = getSession();
  if (!s || !s.token) return location.href = "login.html";
  const v = await validateToken(s.token);
  if (!v.valid) {
    // expired
    localStorage.removeItem("familyUser");
    return location.href = "login.html";
  }
  // show user in navbar
  const ui = document.getElementById("userInfo");
  if (ui) ui.textContent = `${v.data.name || s.name} (${v.data.role || s.role})`;
  return s;
}

async function loadDetail() {
  if (!ID) return alert("Missing id");
  try {
    const res = await fetch(`${API_URL}?mode=getOne&id=${encodeURIComponent(ID)}`);
    const j = await res.json();
    if (!j || j.status !== "success") {
      alert("Gagal memuat data: " + (j && j.message ? j.message : ""));
      return;
    }
    const p = j.data;
    document.getElementById("name").value = p.name || "";
    document.getElementById("domisili").value = p.domisili || "";
    document.getElementById("relationship").value = p.relationship || "";
    document.getElementById("notes").value = p.notes || "";
    document.getElementById("photoURL").value = p.photoURL || "";
  } catch (err) {
    console.error("loadDetail error:", err);
    alert("Error memuat data.");
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const s = getSession();
  if (!s || !s.token) return location.href = "login.html";

  msgEl.textContent = "Menyimpan...";
  try {
    const payload = {
      mode: "update",
      token: s.token,
      id: ID,
      name: document.getElementById("name").value.trim(),
      domisili: document.getElementById("domisili").value.trim(),
      relationship: document.getElementById("relationship").value,
      notes: document.getElementById("notes").value,
      photoURL: document.getElementById("photoURL").value.trim()
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (j && j.status === "success") {
      msgEl.textContent = "✔️ Berhasil disimpan";
      setTimeout(()=> location.href = `detail.html?id=${ID}`, 900);
    } else {
      msgEl.textContent = "❌ Gagal menyimpan: " + (j && j.message ? j.message : "");
    }
  } catch (err) {
    console.error("update error:", err);
    msgEl.textContent = "❌ Error: " + err.message;
  }
});

(async function init() {
  await protect();
  await loadDetail();
})();
