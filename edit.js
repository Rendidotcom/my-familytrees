// edit.js (FINAL CLEAN 2025)

import { API_URL } from "./config.js";

const nameEl = document.getElementById("name");
const domEl = document.getElementById("domisili");
const relEl = document.getElementById("relationship");
const photoEl = document.getElementById("photo");
const msg = document.getElementById("msg");

const form = document.getElementById("formEdit");

// Ambil ID yang mau diedit
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get("id");

// Ambil session dari localStorage
const session = JSON.parse(localStorage.getItem("session")) || {};
const token = session.token;
const userId = session.id;
const userRole = session.role;

/* ======================================================
   1. Proteksi ROLE
   ======================================================*/
if (!token) {
  alert("Session expired. Silakan login kembali");
  window.location = "login.html";
}

if (userRole !== "admin" && userId !== editId) {
  alert("❌ Anda tidak boleh mengedit data orang lain!");
  window.location = "dashboard.html";
}

/* ======================================================
   2. Load data anggota
   ======================================================*/
async function loadData() {
  try {
    const res = await fetch(`${API_URL}?mode=getOne&id=${editId}`);
    const json = await res.json();

    if (json.status !== "success") {
      msg.innerText = "Gagal memuat data";
      return;
    }

    const d = json.data;

    nameEl.value = d.name || "";
    domEl.value = d.domisili || "";
    relEl.value = d.relationship || "";

  } catch (err) {
    msg.innerText = "Load error";
  }
}

loadData();

/* ======================================================
   3. Convert File → Base64
   ======================================================*/
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

/* ======================================================
   4. Submit EDIT
   ======================================================*/
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.innerText = "Memproses...";

  const photoFile = photoEl.files[0];
  const photoBase64 = await fileToBase64(photoFile);

  const payload = {
    mode: "update",
    token: token,
    id: editId,
    name: nameEl.value,
    domisili: domEl.value,
    relationship: relEl.value,
  };

  if (photoBase64) {
    payload.photo_base64 = photoBase64;
    payload.photo_type = photoFile.type;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (json.status === "success") {
      msg.innerText = "✔ Berhasil disimpan!";
      setTimeout(() => {
        window.location = "dashboard.html";
      }, 800);
    } else {
      msg.innerText = json.message || "Gagal menyimpan";
    }

  } catch (err) {
    msg.innerText = "Gagal koneksi ke server!";
  }
});

/* ======================================================
   5. Logout
   ======================================================*/
document.getElementById("btnLogout").onclick = async () => {
  await fetch(`${API_URL}?mode=logout&token=${token}`);
  localStorage.removeItem("session");
  window.location = "login.html";
};
