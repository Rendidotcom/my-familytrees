// edit.js — FINAL 2025

import { API_URL } from "./config.js";
import { getSession } from "./session.js";

createNavbar();

const session = getSession();
if (!session) {
  alert("Sesi habis, silakan login ulang.");
  window.location.href = "login.html";
}

const params = new URLSearchParams(location.search);
const ID = params.get("id");

/* ---------------------- Load Detail ---------------------- */
async function loadDetail() {
  const res = await fetch(`${API_URL}?mode=getDetail&id=${ID}`);
  const j = await res.json();

  if (j.status !== "success") {
    alert("Gagal memuat data.");
    return;
  }

  const p = j.data;

  document.getElementById("name").value = p.name;
  document.getElementById("relationship").value = p.relationship;
  document.getElementById("domisili").value = p.domisili;
  document.getElementById("notes").value = p.notes;
  document.getElementById("photoURL").value = p.photoURL;
}

/* ---------------------- Update ---------------------- */
async function updateData() {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      mode: "updateData",
      id: ID,
      name: document.getElementById("name").value,
      relationship: document.getElementById("relationship").value,
      domisili: document.getElementById("domisili").value,
      notes: document.getElementById("notes").value,
      photoURL: document.getElementById("photoURL").value
    })
  });

  const j = await res.json();

  if (j.status === "success") {
    alert("Berhasil disimpan.");
    location.href = `detail.html?id=${ID}`;
  } else {
    alert("Gagal menyimpan.");
  }
}

document.getElementById("btnSave").onclick = updateData;

loadDetail();
