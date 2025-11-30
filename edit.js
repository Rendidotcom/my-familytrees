// =====================
// edit.js — FINAL FIX
// =====================

// Ambil API_URL dari config.js
const API_URL = window.API_URL;

// Ambil session API dari session.js (non-module)
const { getSession, validateToken, clearSession } = window;

console.log("📌 edit.js loaded, API =", API_URL);

// Element
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

function getIdFromUrl() {
  const p = new URLSearchParams(location.search);
  return p.get("id");
}

// =====================
// 2) LOAD ALL MEMBERS
// =====================
async function fetchAllMembers() {
  const res = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`, {
    cache: "no-store",
  });
  const j = await res.json();

  if (j.status !== "success") throw new Error("Gagal load data");
  return j.data;
}

// =====================
// 3) DROPDOWN FILLER
// =====================
function fillSelect(el, members, selfId) {
  el.innerHTML = `<option value="">(Tidak ada / kosong)</option>`;
  members.forEach(m => {
    if (m.id !== selfId) {
      const op = document.createElement("option");
      op.value = m.id;
      op.textContent = m.name;
      el.appendChild(op);
    }
  });
}

// =====================
// 4) LOAD TARGET MEMBER
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

  idEl.value = target.id;
  nameEl.value = target.name || "";
  birthOrderEl.value = target.birthOrder || "";
  statusEl.value = target.status || "hidup";
  notesEl.value = target.notes || "";

  fillSelect(fatherEl, members, target.id);
  fillSelect(motherEl, members, target.id);
  fillSelect(spouseEl, members, target.id);

  fatherEl.value = target.father || "";
  motherEl.value = target.mother || "";
  spouseEl.value = target.spouse || "";

  // Foto existing
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
// 5) Preview Foto
// =====================
photoEl.addEventListener("change", () => {
  const f = photoEl.files[0];
  if (f) {
    previewEl.src = URL.createObjectURL(f);
    previewEl.style.display = "block";
  }
});

// =====================
// 6) SAVE DATA
// =====================
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.innerHTML = "Mengirim...";

  const fd = new FormData();
  fd.append("mode", "updateMember");
  fd.append("id", idEl.value);
  fd.append("name", nameEl.value);
  fd.append("father", fatherEl.value);
  fd.append("mother", motherEl.value);
  fd.append("spouse", spouseEl.value);
  fd.append("birthOrder", birthOrderEl.value);
  fd.append("status", statusEl.value);
  fd.append("notes", notesEl.value);

  if (photoEl.files[0]) fd.append("photo", photoEl.files[0]);

  const res = await fetch(API_URL, {
    method: "POST",
    body: fd,
  });

  const j = await res.json();

  if (j.status === "success") {
    msg.innerHTML = "✔ Berhasil disimpan!";
    setTimeout(() => location.href = "dashboard.html", 700);
  } else {
    msg.innerHTML = "❌ Gagal: " + j.message;
  }
});

// =====================
// 7) DELETE MEMBER
// =====================
btnDelete.addEventListener("click", async () => {
  if (!confirm("Yakin hapus anggota ini?")) return;

  msg.innerHTML = "Menghapus...";

  const res = await fetch(`${API_URL}?mode=deleteMember&id=${idEl.value}`);
  const j = await res.json();

  if (j.status === "success") {
    msg.innerHTML = "✔ Anggota terhapus";
    setTimeout(() => location.href = "dashboard.html", 800);
  } else {
    msg.innerHTML = "❌ Gagal hapus: " + j.message;
  }
});

// =====================
// 8) LOGOUT
// =====================
document.getElementById("btnLogout").onclick = () => {
  clearSession();
  location.href = "login.html";
};

// =====================
// 9) INIT
// =====================
(async function init() {
  msg.innerHTML = "Memeriksa sesi...";
  const s = await protect();
  if (!s) return;

  await loadMember();
})();
