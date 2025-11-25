// ====================================================
// CONFIG API
// ====================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

// ====================================================
// Proteksi Login
// ====================================================
const user = localStorage.getItem("familyUser");
if (!user) {
  alert("⚠ Harus login dulu!");
  location.href = "login.html";
}

// ====================================================
// Ambil data semua anggota untuk dropdown relasi
// ====================================================
async function loadRelations() {
  const father = document.getElementById("father");
  const mother = document.getElementById("mother");
  const spouse = document.getElementById("spouse");

  father.innerHTML = `<option value="">-- Tidak ada --</option>`;
  mother.innerHTML = `<option value="">-- Tidak ada --</option>`;
  spouse.innerHTML = `<option value="">-- Belum menikah --</option>`;

  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const data = await res.json();

    if (data.status !== "success") {
      alert("❌ Gagal mengambil data relasi.");
      return;
    }

    data.data.forEach(p => {
      father.innerHTML += `<option value="${p.id}">${p.name}</option>`;
      mother.innerHTML += `<option value="${p.id}">${p.name}</option>`;
      spouse.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });

  } catch (err) {
    console.error("Load relation error:", err);
  }
}

loadRelations();


// ====================================================
// Helper: Convert image to Base64
// ====================================================
function toBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}


// ====================================================
// SUBMIT DATA KE GAS
// ====================================================
document.getElementById("formPerson").addEventListener("submit", async (e) => {
  e.preventDefault();

  const photo = document.getElementById("photo").files[0];
  let base64Photo = "";
  let mimeType = "";

  if (photo) {
    const base64 = await toBase64(photo);
    base64Photo = base64.split(",")[1];
    mimeType = photo.type;
  }

  const payload = {
    mode: "insert",
    name: document.getElementById("name").value,
    domisili: document.getElementById("domisili").value,
    parentIdAyah: document.getElementById("father").value,
    parentIdIbu: document.getElementById("mother").value,
    spouseId: document.getElementById("spouse").value,
    relationship: document.getElementById("relationship")?.value || "",
    notes: document.getElementById("notes")?.value || "",
    status: document.getElementById("status")?.value || "",
    orderChild: document.getElementById("orderChild")?.value || "",
    photo_base64: base64Photo,
    photo_type: mimeType
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();

    if (result.status === "success") {
      alert("✔ Data berhasil disimpan!");
      location.href = "dashboard.html";
    } else {
      alert("❌ Gagal menyimpan: " + result.message);
    }

  } catch (err) {
    alert("❌ ERROR: " + err.message);
  }
});
