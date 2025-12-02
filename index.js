createNavbar();

// ================================
// SESSION CHECK
// ================================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// ================================
// FILE → BASE64
// ================================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]); // clean
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ================================
// SAVE DATA
// ================================
async function saveData() {
  const name = document.getElementById("name").value.trim();
  const rel = document.getElementById("relationship").value.trim();
  const dom = document.getElementById("domisili").value.trim();
  const notes = document.getElementById("notes").value.trim();
  const file = document.getElementById("photoURL").files[0];

  if (!name) {
    alert("Nama wajib diisi.");
    return;
  }

  let base64 = "";
  let fileType = "";

  if (file) {
    base64 = await toBase64(file);
    fileType = file.type;
  }

  const formData = new FormData();
  formData.append("mode", "insert");
  formData.append("token", session.token);
  formData.append("createdBy", session.name);

  formData.append("name", name);
  formData.append("relationship", rel);
  formData.append("domisili", dom);
  formData.append("notes", notes);

  formData.append("photo_base64", base64);
  formData.append("photo_type", fileType);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: formData
    });
    const j = await res.json();

    if (j.status === "success") {
      alert("✓ Data berhasil ditambahkan.");
      location.href = "dashboard.html";
    } else {
      alert("Gagal menambah data: " + j.message);
    }

  } catch (err) {
    alert("Error: " + err.message);
  }
}
