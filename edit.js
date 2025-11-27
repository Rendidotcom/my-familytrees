// edit.js — FINAL CLEAN VERSION (sinkron GAS Sheet1)

import { API_URL } from "./config.js";
import { getSession, validateToken, createNavbar } from "./session.js";

/* -------------------------------------------------------
   1. INIT NAVBAR
------------------------------------------------------- */
createNavbar("edit");

/* -------------------------------------------------------
   2. GET ID DARI URL
------------------------------------------------------- */
const params = new URLSearchParams(location.search);
const ID = params.get("id");

if (!ID) {
  alert("ID tidak ditemukan.");
  location.href = "dashboard.html";
}

/* -------------------------------------------------------
   3. PROTECT PAGE (CEK TOKEN)
------------------------------------------------------- */
async function protectPage() {
  const session = getSession();
  if (!session || !session.token) {
    location.href = "login.html";
    return false;
  }

  const check = await validateToken(session.token);
  if (!check.valid) {
    location.href = "login.html";
    return false;
  }

  return true;
}

/* -------------------------------------------------------
   4. LOAD DETAIL
------------------------------------------------------- */
async function loadDetail() {
  const res = await fetch(`${API_URL}?mode=getDetail&id=${ID}`);
  const j = await res.json();

  if (j.status !== "success") {
    alert("Gagal memuat data.");
    location.href = "dashboard.html";
    return;
  }

  const p = j.data;

  document.getElementById("name").value = p.name;
  document.getElementById("relationship").value = p.relationship;
  document.getElementById("domisili").value = p.domisili;
  document.getElementById("notes").value = p.notes;
  document.getElementById("photoURL").value = p.photoURL || "";
}

/* -------------------------------------------------------
   5. SIMPAN UPDATE
------------------------------------------------------- */
export async function updateData() {
  const payload = {
    mode: "updateData",
    id: ID,
    name: document.getElementById("name").value.trim(),
    relationship: document.getElementById("relationship").value,
    domisili: document.getElementById("domisili").value.trim(),
    notes: document.getElementById("notes").value.trim(),
    photoURL: document.getElementById("photoURL").value.trim()
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const j = await res.json();

  if (j.status === "success") {
    alert("Berhasil disimpan.");
    location.href = `detail.html?id=${ID}`;
  } else {
    alert("Gagal menyimpan.");
  }
}

/* -------------------------------------------------------
   6. INIT PAGE
------------------------------------------------------- */
(async function init() {
  if (!(await protectPage())) return;
  await loadDetail();
})();
