// Sesuai session.js: pastikan user login
ensureLogin();

// API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";

// Ambil ID dari URL
const params = new URLSearchParams(location.search);
const ID = params.get("id");

// Ambil elemen
const nameEl = document.getElementById("name");
const relationshipEl = document.getElementById("relationship");
const domisiliEl = document.getElementById("domisili");
const notesEl = document.getElementById("notes");
const photoURLEl = document.getElementById("photoURL");

// --- LOAD DATA DETAIL ---
async function loadDetail() {
  try {
    const res = await fetch(`${API_URL}?mode=getDetail&id=${ID}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Gagal memuat data.");
      return;
    }

    const p = j.data;

    nameEl.value = p.name;
    relationshipEl.value = p.relationship;
    domisiliEl.value = p.domisili;
    notesEl.value = p.notes;
    photoURLEl.value = p.photoURL;

  } catch (e) {
    alert("Koneksi gagal saat load data.");
  }
}

// --- UPDATE DATA ---
async function updateData() {
  const fd = new FormData();
  fd.append("mode", "updateData");
  fd.append("id", ID);
  fd.append("name", nameEl.value);
  fd.append("relationship", relationshipEl.value);
  fd.append("domisili", domisiliEl.value);
  fd.append("notes", notesEl.value);
  fd.append("photoURL", photoURLEl.value);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: fd
    });

    const j = await res.json();

    if (j.status === "success") {
      alert("Perubahan berhasil disimpan.");
      location.href = `detail.html?id=${ID}`;
    } else {
      alert("Gagal menyimpan data.");
    }

  } catch (e) {
    alert("Koneksi gagal saat menyimpan.");
  }
}

// Jalankan load
loadDetail();
