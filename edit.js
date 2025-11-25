// ================================
// EDIT.JS FINAL (SYNC WITH GAS)
// ================================

// === CONFIG ===
const API_URL = "https://script.google.com/macros/s/AKfycbzRg74Zyz9ox0gy0se3CS_QWWzkzmJyUk2524KO6C0zAARDO1f5pj4w75dXAr8RoP7LzA/exec";
const memberId = new URLSearchParams(window.location.search).get("id");
const activeUser = localStorage.getItem("activeUser");

let allMembers = [];

// === SECURITY: MUST LOGIN ===
if (!activeUser) {
  alert("⚠ Anda harus login dahulu!");
  window.location.href = "login.html";
}

// === SECURITY: ONLY OWNER CAN EDIT ===
if (memberId !== activeUser) {
  alert("🚫 Anda hanya boleh mengedit profil sendiri!");
  window.location.href = "dashboard.html";
}


// ================================
// LOAD DATA UTAMA
// ================================
async function loadData() {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const json = await res.json();
    allMembers = json.data || [];

    const person = allMembers.find(p => p.id === memberId);

    if (!person) {
      alert("❌ Data tidak ditemukan!");
      window.location.href = "dashboard.html";
      return;
    }

    fillForm(person);
    fillDropdowns(person);

  } catch (err) {
    console.error(err);
    alert("❌ Gagal memuat data.");
  }
}


// ================================
// ISI FORM DATA LAMA
// ================================
function fillForm(p) {
  name.value = p.name;
  domisili.value = p.domisili;
  relationship.value = p.relationship;
  notes.value = p.notes || "";
  orderChild.value = p.orderChild || "";
  status.value = p.status || "";
}


// ================================
// ISI DROPDOWN RELASI
// ================================
function fillDropdowns(p) {
  parentIdAyah.innerHTML = `<option value="">-- Tidak Ada --</option>`;
  parentIdIbu.innerHTML  = `<option value="">-- Tidak Ada --</option>`;
  spouseId.innerHTML     = `<option value="">-- Tidak Ada --</option>`;

  allMembers.forEach(m => {
    if (m.id !== p.id) {
      parentIdAyah.innerHTML += `<option value="${m.id}">${m.name}</option>`;
      parentIdIbu.innerHTML  += `<option value="${m.id}">${m.name}</option>`;
      spouseId.innerHTML     += `<option value="${m.id}">${m.name}</option>`;
    }
  });

  // set selected
  parentIdAyah.value = p.parentIdAyah || "";
  parentIdIbu.value = p.parentIdIbu || "";
  spouseId.value = p.spouseId || "";

  toggleParentFields();
}


// ================================
// TAMPILKAN FIELD AYAH/IBU JIKA "Anak"
// ================================
function toggleParentFields() {
  const rel = relationship.value;
  document.getElementById("parentSelectors").style.display = rel === "Anak" ? "block" : "none";
}

relationship.addEventListener("change", toggleParentFields);


// ================================
// SAVE UPDATE
// ================================
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = photo.files[0];
  let base64 = "";
  let fileType = "";

  if (file) {
    base64 = await toBase64(file);
    fileType = file.type;
  }

  const payload = {
    mode: "update",
    id: memberId,
    name: name.value,
    domisili: domisili.value,
    relationship: relationship.value,
    parentIdAyah: parentIdAyah.value,
    parentIdIbu: parentIdIbu.value,
    spouseId: spouseId.value,
    notes: notes.value,
    orderChild: orderChild.value,
    status: status.value,
    photo_base64: base64 ? base64.split(",")[1] : "",
    photo_type: fileType
  };

  try {
    const sending = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const json = await sending.json();

    if (json.status === "success") {
      alert("✅ Data berhasil diperbarui!");
      window.location.href = "dashboard.html";
    } else {
      alert("❌ Error: " + json.message);
    }

  } catch (err) {
    alert("❌ Gagal update: " + err.message);
  }
});


// ================================
// HELPER: FILE → BASE64
// ================================
function toBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}


// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", loadData);
