// =======================
// URL GAS
// =======================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

let MEMBER_ID = null;
let ALL_DATA = [];

// =======================
// GET PARAMETER ?id=
// =======================
function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// =======================
// LOAD DATA SATU ORANG
// =======================
async function loadDataToForm() {
  MEMBER_ID = getQueryParam("id");
  if (!MEMBER_ID) {
    alert("ID tidak ditemukan");
    return;
  }

  // Ambil seluruh data
  const resAll = await fetch(`${API_URL}?action=getData`);
  const jsonAll = await resAll.json();
  ALL_DATA = jsonAll.data || [];

  // Ambil data satu anggota
  const res = await fetch(`${API_URL}?action=getOne&id=${MEMBER_ID}`);
  const json = await res.json();

  if (!json.data) {
    alert("Data tidak ditemukan");
    return;
  }

  const item = json.data;

  // Isi form
  document.querySelector("input[name='name']").value = item.name;
  document.querySelector("input[name='domisili']").value = item.domisili;
  document.querySelector("select[name='relationship']").value = item.relationship;
  document.querySelector("input[name='notes']").value = item.notes || "";

  document.querySelector("#spouseId").value = item.spouseId || "";

  // Load dropdown parent/pasangan
  loadParentOptions(item);
}

// =======================
// LOAD DROPDOWN AYAH / IBU / PASANGAN
// =======================
function loadParentOptions(current) {
  const ayah = document.getElementById("parentIdAyah");
  const ibu = document.getElementById("parentIdIbu");
  const spouse = document.getElementById("spouseId");

  ayah.innerHTML = "<option value=''>Tidak Ada</option>";
  ibu.innerHTML = "<option value=''>Tidak Ada</option>";
  spouse.innerHTML = "<option value=''>Tidak Ada</option>";

  ALL_DATA.forEach(p => {
    if (p.id !== current.id) {
      ayah.innerHTML += `<option value="${p.id}">${p.name}</option>`;
      ibu.innerHTML += `<option value="${p.id}">${p.name}</option>`;
      spouse.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    }
  });

  ayah.value = current.parentIdAyah || "";
  ibu.value = current.parentIdIbu || "";
  spouse.value = current.spouseId || "";

  handleRelationshipChange();
}

// =======================
// SHOW/HIDE FORM AYAH-IBU
// =======================
function handleRelationshipChange() {
  const rel = document.getElementById("relationship").value;
  const parentBlock = document.getElementById("parentSelectors");

  if (rel === "Anak") parentBlock.style.display = "block";
  else parentBlock.style.display = "none";
}

document.getElementById("relationship")
        .addEventListener("change", handleRelationshipChange);

// =======================
// SUBMIT EDIT
// =======================
document.getElementById("editForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.querySelector("input[name='name']").value;
  const domisili = document.querySelector("input[name='domisili']").value;
  const relationship = document.querySelector("select[name='relationship']").value;
  const notes = document.querySelector("input[name='notes']").value;

  const parentIdAyah = document.querySelector("#parentIdAyah").value;
  const parentIdIbu = document.querySelector("#parentIdIbu").value;
  const spouseId = document.querySelector("#spouseId").value;

  // FOTO
  const photoFile = document.getElementById("photo").files[0];
  let photo_base64 = "";
  let photo_type = "";

  if (photoFile) {
    const base64 = await fileToBase64(photoFile);
    photo_base64 = base64.split(",")[1];
    photo_type = photoFile.type;
  }

  // Payload FINAL
  const payload = {
    action: "update",
    id: MEMBER_ID,
    name,
    domisili,
    relationship,
    notes,
    parentIdAyah,
    parentIdIbu,
    spouseId,
    photo_base64,
    photo_type
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  alert(json.message || "Berhasil diperbarui");

  window.location.href = "dashboard.html";
});

// =======================
// FILE → BASE64
// =======================
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

loadDataToForm();
