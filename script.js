// SCRIPT.JS — SINKRON FULL GAS 2025 (TOKEN + MODE) KE SHEET1
// ===========================================================
// Sheet1 Header:
// 1 Timestamp
// 2 name
// 3 Domisili
// 4 Relationship
// 5 PhotoURL
// 6 Notes
// 7 parentIdAyah
// 8 parentIdIbu
// 9 uniqueId
// ===========================================================

const API_URL = "https://script.google.com/macros/s/AKfycbyjR22fuPOGgHsyVHxxxxx/exec"; // ← GANTI DENGAN PUNYA ANDA

// ==========================
// Ambil token login
// ==========================
function getToken() {
  return localStorage.getItem("token") || "";
}

// ==========================
// Ambil semua data dari Sheet1
// ==========================
async function loadFamilyData() {
  try {
    const token = getToken();
    if (!token) return alert("Silakan login dulu!");

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ mode: "getData", token })
    });

    const data = await res.json();

    if (data.status !== "success") {
      console.error(data);
      return alert("Gagal memuat data keluarga");
    }

    renderFamilyList(data.data);
  } catch (e) {
    console.error(e);
    alert("Gagal terhubung ke server");
  }
}

// ==========================
// Tampilkan daftar anggota
// ==========================
function renderFamilyList(list) {
  const area = document.getElementById("familyList");
  if (!area) return;

  area.innerHTML = "";

  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "card-item";
    div.innerHTML = `
      <img src="${item.PhotoURL || "https://via.placeholder.com/80"}" class="photo">
      <div class="info">
        <b>${item.name}</b><br>
        <span>Domisili: ${item.Domisili || "-"}</span><br>
        <span>Relasi: ${item.Relationship || "-"}</span>
      </div>
      <button onclick="editMember('${item.uniqueId}')">Edit</button>
      <button onclick="deleteMember('${item.uniqueId}')" class="danger">Hapus</button>
    `;
    area.appendChild(div);
  });
}

// ==========================
// Ambil satu orang berdasarkan uniqueId
// ==========================
async function editMember(id) {
  const token = getToken();
  if (!token) return alert("Login dulu!");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ mode: "getOne", token, uniqueId: id })
  });

  const data = await res.json();

  if (data.status !== "success") return alert("Data tidak ditemukan");

  const d = data.data;

  // Isi form
  document.getElementById("uniqueId").value = d.uniqueId;
  document.getElementById("name").value = d.name;
  document.getElementById("Domisili").value = d.Domisili;
  document.getElementById("Relationship").value = d.Relationship;
  document.getElementById("PhotoURL").value = d.PhotoURL;
  document.getElementById("Notes").value = d.Notes;
  document.getElementById("parentIdAyah").value = d.parentIdAyah;
  document.getElementById("parentIdIbu").value = d.parentIdIbu;

  document.getElementById("formTitle").innerText = "Edit Anggota";
}

// ==========================
// Tambah atau update data
// ==========================
async function saveMember() {
  try {
    const token = getToken();
    if (!token) return alert("Login dulu!");

    const payload = {
      mode: "addData", // addData otomatis update jika uniqueId ada
      token,
      uniqueId: document.getElementById("uniqueId").value,
      name: document.getElementById("name").value,
      Domisili: document.getElementById("Domisili").value,
      Relationship: document.getElementById("Relationship").value,
      PhotoURL: document.getElementById("PhotoURL").value,
      Notes: document.getElementById("Notes").value,
      parentIdAyah: document.getElementById("parentIdAyah").value,
      parentIdIbu: document.getElementById("parentIdIbu").value
    };

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status !== "success") {
      console.error(result);
      return alert("Gagal menyimpan data");
    }

    alert("Data berhasil disimpan!");
    loadFamilyData();
    resetForm();

  } catch (e) {
    console.error(e);
    alert("Gagal terhubung ke server");
  }
}

// ==========================
// Hapus data
// ==========================
async function deleteMember(uniqueId) {
  if (!confirm("Hapus anggota ini?")) return;

  const token = getToken();
  if (!token) return alert("Login dulu!");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ mode: "deleteData", token, uniqueId })
  });

  const data = await res.json();

  if (data.status !== "success") return alert("Gagal menghapus data");

  alert("Data dihapus!");
  loadFamilyData();
}

// ==========================
// Reset form input
// ==========================
function resetForm() {
  document.getElementById("formTitle").innerText = "Tambah Anggota";
  document.getElementById("uniqueId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("Domisili").value = "";
  document.getElementById("Relationship").value = "";
  document.getElementById("PhotoURL").value = "";
  document.getElementById("Notes").value = "";
  document.getElementById("parentIdAyah").value = "";
  document.getElementById("parentIdIbu").value = "";
}

// ==========================
// Jalankan saat halaman dibuka
// ==========================
window.onload = () => {
  loadFamilyData();
};
