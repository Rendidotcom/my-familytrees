// =======================
// URL GAS
// =======================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

let MEMBER_ID = null;
let ALL_DATA = [];

// =======================
// GET PARAMETER ID
// =======================
function getQueryParam(key) {
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

// =======================
// PARSE JSONP
// =======================
function extractJSONP(text) {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  return JSON.parse(text.substring(start + 1, end));
}

// =======================
// LOAD DATA AWAL
// =======================
async function loadDataToForm() {
  MEMBER_ID = getQueryParam("id");
  if (!MEMBER_ID) {
    alert("ID tidak ditemukan");
    return;
  }

  const res = await fetch(API_URL + "?mode=getData&callback=callback");
  const text = await res.text();
  const json = extractJSONP(text);

  ALL_DATA = json.data;
  const item = ALL_DATA.find(x => Number(x.index) === Number(MEMBER_ID));

  if (!item) {
    alert("Data tidak ditemukan");
    return;
  }

  document.querySelector("input[name='name']").value = item.name;
  document.querySelector("input[name='domisili']").value = item.domisili;
  document.querySelector("select[name='relationship']").value = item.relationship;
  document.querySelector("input[name='notes']").value = item.notes;
  document.querySelector("#spouseId").value = item.spouseId;

  loadParentOptions(item);
}

// =======================
// LOAD AYAH / IBU / PASANGAN
// =======================
function loadParentOptions(current) {
  const ayahSelect = document.getElementById("parentIdAyah");
  const ibuSelect = document.getElementById("parentIdIbu");
  const spouseSelect = document.getElementById("spouseId");

  ayahSelect.innerHTML = "<option value=''>Tidak Ada</option>";
  ibuSelect.innerHTML = "<option value=''>Tidak Ada</option>";
  spouseSelect.innerHTML = "<option value=''>Tidak Ada</option>";

  ALL_DATA.forEach(p => {
    if (p.index != current.index) {
      ayahSelect.innerHTML += `<option value="${p.index}">${p.name}</option>`;
      ibuSelect.innerHTML += `<option value="${p.index}">${p.name}</option>`;
      spouseSelect.innerHTML += `<option value="${p.index}">${p.name}</option>`;
    }
  });

  ayahSelect.value = current.parentIdAyah;
  ibuSelect.value = current.parentIdIbu;
  spouseSelect.value = current.spouseId;

  handleRelationshipChange();
}

// =======================
// SHOW/HIDE AYAH-IBU FORM
// =======================
function handleRelationshipChange() {
  const rel = document.getElementById("relationship").value;
  const parents = document.getElementById("parentSelectors");

  if (rel === "Anak") parents.style.display = "block";
  else parents.style.display = "none";
}

document.getElementById("relationship").addEventListener("change", handleRelationshipChange);

// =======================
// SUBMIT FORM
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

  // FOTO JIKA ADA
  const photoFile = document.getElementById("photo").files[0];
  let photo_base64 = "";
  let photo_type = "";

  if (photoFile) {
    const base64 = await fileToBase64(photoFile);
    photo_base64 = base64.split(",")[1];
    photo_type = photoFile.type;
  }

  const payload = {
    mode: "update",
    rowIndex: Number(MEMBER_ID),
    name, domisili, relationship, notes,
    parentIdAyah, parentIdIbu, spouseId,
    photo_base64,
    photo_type
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  alert(json.message || "Berhasil disimpan");

  window.location.href = "dashboard.html";
});

// =======================
// UTILITY BASE64
// =======================
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

loadDataToForm();
