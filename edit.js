// edit.js — FINAL VERSION (aman, sinkron dengan GAS & session.js)

import { API_URL } from "./config.js";
import { getSession, validateToken, createNavbar } from "./session.js";

/* ---------------------------------------------
   1. NAVBAR
--------------------------------------------- */
createNavbar("dashboard"); // tampilkan navbar sama seperti halaman lain

/* ---------------------------------------------
   2. PROTECT PAGE (CEK TOKEN LOGIN)
--------------------------------------------- */
async function protectPage() {
  const session = getSession();
  if (!session || !session.token) {
    return (window.location.href = "login.html");
  }

  const check = await validateToken(session.token);
  if (!check.valid) {
    return (window.location.href = "login.html");
  }

  // tampilkan user di navbar
  const ui = document.getElementById("userInfo");
  if (ui) ui.textContent = check.data?.email || "User";
}

await protectPage();

/* ---------------------------------------------
   3. AMBIL ID DARI URL
--------------------------------------------- */
const params = new URLSearchParams(location.search);
const ID = params.get("id");

if (!ID) {
  alert("ID tidak valid");
  window.location.href = "dashboard.html";
}

/* ---------------------------------------------
   4. LOAD DETAIL DATA
--------------------------------------------- */
async function loadDetail() {
  try {
    const res = await fetch(`${API_URL}?mode=getDetail&id=${ID}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Data tidak ditemukan.");
      window.location.href = "dashboard.html";
      return;
    }

    const p = j.data;

    document.getElementById("name").value = p.name || "";
    document.getElementById("relationship").value = p.relationship || "";
    document.getElementById("domisili").value = p.domisili || "";
    document.getElementById("notes").value = p.notes || "";
    document.getElementById("photoURL").value = p.photoURL || "";

  } catch (e) {
    alert("Gagal memuat data.");
    console.error(e);
  }
}

loadDetail();

/* ---------------------------------------------
   5. SIMPAN UPDATE
--------------------------------------------- */
document.getElementById("formEdit").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("msg");
  msg.textContent = "⏳ Menyimpan...";

  const payload = {
    mode: "updateData",
    id: ID,
    name: document.getElementById("name").value.trim(),
    relationship: document.getElementById("relationship").value,
    domisili: document.getElementById("domisili").value.trim(),
    notes: document.getElementById("notes").value,
    photoURL: document.getElementById("photoURL").value.trim(),
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();

    if (j.status === "success") {
      msg.textContent = "✔️ Berhasil disimpan!";
      setTimeout(() => {
        window.location.href = `detail.html?id=${ID}`;
      }, 900);
    } else {
      msg.textContent = "❌ Gagal menyimpan: " + (j.message || "");
    }
  } catch (err) {
    msg.textContent = "❌ Error: " + err.message;
  }
});

/* ---------------------------------------------
   6. LOGOUT
--------------------------------------------- */
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("familyUser");
  window.location.href = "login.html";
});
