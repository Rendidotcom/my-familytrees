// =====================
// edit.js — FINAL FIX
// =====================

// Ambil API_URL global dari config.js
const API_URL = window.API_URL;

// Ambil fungsi session dari session.js (non-module)
const { getSession, validateToken, clearSession } = window;

console.log("📌 edit.js loaded, API =", API_URL);

// Elemen form
const msg = document.getElementById("msg");
const editForm = document.getElementById("editForm");

const idEl = document.getElementById("memberId");
const nameEl = document.getElementById("name");
const fatherEl = document.getElementById("father");
const motherEl = document.getElementById("mother");
const spouseEl = document.getElementById("spouse");
const birthOrderEl = document.getElementById("birthOrder");
const statusEl = document.getElementById("status");
const notesEl = document.getElementById("notes");
const photoEl = document.getElementById("photo");
const previewEl = document.getElementById("preview");

const btnDelete = document.getElementById("btnDelete");

// =====================
// 1) PROTECT SESSION
// =====================
async function protect() {
  const s = getSession();
  if (!s || !s.token) {
    msg.innerHTML = "Sesi hilang. Mengalihkan ke login...";
    setTimeout(() => location.href = "login.html", 800);
    return null;
  }

  const v = await validateToken(s.token);
  if (!v.valid) {
    clearSession();
    msg.innerHTML = "Sesi kadaluarsa. Login ulang...";
    setTimeout(() => location.href = "login.html", 900);
    return null;
  }

  return s;
}

// =====================
// 2) GET ID FROM URL
// =====================
function getIdFromUrl() {
  const p = new URLSearchParams(location.search);
  return p.get("id");
}

// =====================
// 3) LOAD DATA ANGGOTA
// =====================
async function fetchAllMembers() {
  const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`);
  const j = await res.json();
  if (j.status !== "success") throw new Error("Gagal load data");
  return j.data;
}

// =====================
// 4) SET DROPDOWNS
// =====================
function fillSelect(selectEl, members, currentId) {
  selectEl.innerHTML = `<option value="">(Tidak ada / kosong)</option>`;
  members.forEach(m => {
    if (m.id !== currentId) {
      const op = document.createElement("option");
      op.value = m.id;
      op.textContent = m.name;
      selectEl.appendChild(op);
    }
  });
}

// =====================
// 5) LOAD DATA UNTUK EDIT
// =====================
async function loadMember() {
  const memberId = getIdFromUrl();
  if (!memberId) {
    msg.innerHTML = "ID tidak ditemukan!";
    return;
  }

  msg.innerHTML = "Memuat data...";

  const members = await fetchAllMembers();
  const target = members.find(m => m.id == memberId);

  if (!target) {
    msg.innerHTML = "Anggota tidak ditemukan!";
    return;
  }

  // Isi field
  idEl.value = target.id;
  nameEl.value = target.name;
  fatherEl.value = target.father || "";
  motherEl.value = target.mother || "";
  spouseEl.value = target.spouse || "";
  birthOrderEl.value = target.birthOrder || "";
  notesEl.value = target.notes || "";
  statusEl.value = target.status || "hidup";

  // Fill dropdown
  fillSelect(fatherEl, members, target.id);
  fillSelect(motherEl, members, target.id);
  fillSelect(spouseEl, members, target.id);

  // Foto preview
  if (target.photoURL) {
    const idMatch = target.photoURL.match(/[-\w]{25,}/);
    if (idMatch) {
      previewEl.src = `https://drive.google.com/uc?export=view&id=${idMatch[0]}`;
      previewEl.style.display = "block";
    }
  }

  msg.innerHTML = "Data siap diedit.";
}

// =====================
// 6) PREVIEW FOTO BARU
// =====================
photoEl.addEventListener("change", () => {
  const file = photoEl.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    previewEl.src = url;
    previewEl.style.display = "block";
  }
});

// =====================
// 7) SIMPAN PERUBAHAN
// =====================
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.innerHTML = "Mengirim data...";

  const formData = new FormData();
  formData.append("mode", "updateMember");
  formData.append("id", idEl.value);
  formData.append("name", nameEl.value);
  formData.append("father", fatherEl.value);
  formData.append("mother", motherEl.value);
  formData.append("spouse", spouseEl.value);
  formData.append("birthOrder", birthOrderEl.value);
  formData.append("status", statusEl.value);
  formData.append("notes", notesEl.value);

  if (photoEl.files[0]) {
    formData.append("photo", photoEl.files[0]);
  }

  const res = await fetch(API_URL, { method: "POST", body: formData });
  const j = await res.json();

  if (j.status === "success") {
    msg.innerHTML = "✔ Perubahan berhasil disimpan!";
    setTimeout(() => location.href = "dashboard.html", 700);
  } else {
    msg.innerHTML = "❌ Gagal menyimpan: " + j.message;
  }
});

// =====================
// 8) HAPUS ANGGOTA
// =====================
btnDelete.addEventListener("click", async () => {
  if (!confirm("Yakin hapus anggota ini?")) return;

  const memberId = idEl.value;

  msg.innerHTML = "Menghapus...";

  const res = await fetch(`${API_URL}?mode=deleteMember&id=${memberId}`, {
    method: "GET",
  });

  const j = await res.json();

  if (j.status === "success") {
    msg.innerHTML = "✔ Anggota terhapus.";
    setTimeout(() => location.href = "dashboard.html", 800);
  } else {
    msg.innerHTML = "❌ Gagal hapus: " + j.message;
  }
});

// =====================
// 9) LOGOUT
// =====================
document.getElementById("btnLogout").onclick = () => {
  clearSession();
  location.href = "login.html";
};

// =====================
// 10) INIT
// =====================
(async function init() {
  msg.innerHTML = "Memeriksa sesi...";
  const s = await protect();
  if (!s) return;

  await loadMember();
})();
