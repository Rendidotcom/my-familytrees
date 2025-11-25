/****************************************************
  🔧 KONFIGURASI
****************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";
let ALL_MEMBERS = [];

/****************************************************
  🔐 CEK LOGIN (berlaku di semua halaman)
****************************************************/
if (!localStorage.getItem("activeUser")) {
  if (window.location.pathname.includes("login") === false) {
    alert("⚠ Anda harus login.");
    window.location.href = "login.html";
  }
}

/****************************************************
  🔄 KONVERSI FILE → BASE64
****************************************************/
function fileToBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
}

/****************************************************
  📌 LOAD DATA KE DROPDOWN (RELASI)
****************************************************/
async function loadDropdownRelations() {
  try {
    const res = await fetch(`${API_URL}?action=getData`);
    const json = await res.json();
    ALL_MEMBERS = json.data || [];

    const parentAyah = document.getElementById("parentIdAyah");
    const parentIbu = document.getElementById("parentIdIbu");
    const spouse = document.getElementById("spouseId");

    if (!parentAyah || !parentIbu || !spouse) return;

    parentAyah.innerHTML = "<option value=''>Tidak Ada</option>";
    parentIbu.innerHTML = "<option value=''>Tidak Ada</option>";
    spouse.innerHTML = "<option value=''>Tidak Ada</option>";

    ALL_MEMBERS.forEach(m => {
      parentAyah.innerHTML += `<option value="${m.id}">${m.name}</option>`;
      parentIbu.innerHTML += `<option value="${m.id}">${m.name}</option>`;
      spouse.innerHTML += `<option value="${m.id}">${m.name}</option>`;
    });

  } catch (err) {
    console.error("Dropdown error:", err);
  }
}

/****************************************************
  🧍‍♂️ LOAD DATA DETAIL SATU ORANG
****************************************************/
async function loadSingleMember(id) {
  const res = await fetch(`${API_URL}?action=getOne&id=${id}`);
  const json = await res.json();
  return json.data || null;
}

/****************************************************
  ✍️ SIMPAN DATA ANGGOTA BARU
****************************************************/
async function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById("mftForm");
  const file = document.getElementById("photo").files[0];

  let photo = "";
  let mime = "";

  if (file) {
    photo = await fileToBase64(file);
    mime = file.type;
  }

  const payload = {
    action: "add",
    name: form.name.value,
    domisili: form.domisili.value,
    relationship: form.relationship.value,
    parentIdAyah: form.parentIdAyah.value,
    parentIdIbu: form.parentIdIbu.value,
    spouseId: form.spouseId.value,
    notes: form.notes.value,
    status: "hidup",
    orderChild: form.orderChild?.value || "",
    photo_base64: photo,
    photo_type: mime
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status === "success") {
      alert("🎉 Data berhasil disimpan!");
      form.reset();
      loadDropdownRelations(); // refresh relasi auto update
    } else {
      alert("❌ Error: " + result.message);
    }
  } catch (err) {
    alert("⚠ Gagal terhubung server: " + err.message);
  }
}

/****************************************************
  🔧 UPDATE DATA
****************************************************/
async function updateMember(payload) {
  payload.action = "update";
  
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const json = await res.json();

  if (json.status === "success") {
    alert("✔ Profil diperbarui");
    window.location.href = "dashboard.html";
  } else {
    alert("❌ Gagal update: " + json.message);
  }
}

/****************************************************
  🗑 HAPUS DATA
****************************************************/
async function deleteMember(id) {
  if (!confirm("⚠ Yakin menghapus akun ini?")) return;

  const res = await fetch(`${API_URL}?action=delete&id=${id}`);
  const json = await res.json();

  alert(json.message || "✔ Berhasil dihapus");

  localStorage.clear();
  window.location.href = "login.html";
}

/****************************************************
  📌 LOGOUT
****************************************************/
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

/****************************************************
  🚀 INIT
****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("parentIdAyah")) {
    loadDropdownRelations();
  }
});
