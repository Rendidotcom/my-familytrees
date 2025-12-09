// EDIT INI SAJA ↓ (masukkan URL WEB APP kamu)
const GAS_SHELL = "YOUR_SCRIPT_URL?shell=1"; 
const API_URL = "https://script.google.com/macros/s/AKfycbxZFjqYNCFc5E3zXgBGwg2X8uYkSXr8BbLW7TRVcrVaKx4bKs6QEgIl95VMEfXZLGN2lg/exec"; // endpoint asli (exec)

async function submitForm() {
  const name = document.getElementById("name").value;
  const domisili = document.getElementById("domisili").value;
  const relationship = document.getElementById("relationship").value;
  const parentIdAyah = document.getElementById("parentIdAyah").value;
  const parentIdIbu = document.getElementById("parentIdIbu").value;
  const spouseId = document.getElementById("spouseId").value;
  const orderChild = document.getElementById("orderChild").value;
  const status = document.getElementById("status").value;
  const notes = document.getElementById("notes").value;
  const token = document.getElementById("token").value;

  const photoFile = document.getElementById("photo").files[0];

  let photoBase64 = "";
  let photoType = "";

  if (photoFile) {
    const base64 = await fileToBase64(photoFile);
    photoBase64 = base64.split(",")[1];
    photoType = photoFile.type;
  }

  // FORM DATA – TANPA HEADER → ANTI-CORS
  const fd = new FormData();
  fd.append("mode", "insert");
  fd.append("token", token);
  fd.append("name", name);
  fd.append("domisili", domisili);
  fd.append("relationship", relationship);
  fd.append("parentIdAyah", parentIdAyah);
  fd.append("parentIdIbu", parentIdIbu);
  fd.append("spouseId", spouseId);
  fd.append("orderChild", orderChild);
  fd.append("status", status);
  fd.append("notes", notes);

  if (photoBase64) {
    fd.append("photo_base64", photoBase64);
    fd.append("photo_type", photoType);
  }

  try {
    // CORS-FREE: fetch ke GAS API langsung
    const res = await fetch(API_URL, { method: "POST", body: fd });

    const txt = await res.text();

    document.getElementById("result").textContent = txt;

  } catch (err) {
    document.getElementById("result").textContent = "ERROR: " + err;
  }
}

/* Convert file to base64 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}