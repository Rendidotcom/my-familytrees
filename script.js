// -----------------------------------------
// Konversi file ke Base64
// -----------------------------------------
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject("Gagal membaca file!");
    reader.readAsDataURL(file);
  });
}

// -----------------------------------------
// SUBMIT FORM DATA ANGGOTA KELUARGA
// -----------------------------------------
async function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById("mftForm");
  const file = document.getElementById("photo").files[0];

  let base64Photo = "";
  let mimeType = "";

  // Jika ada file foto → ubah ke Base64
  if (file) {
    mimeType = file.type;
    let encoded = await toBase64(file);
    base64Photo = encoded.split(",")[1];
  }

  // Payload yang dikirim ke GAS
  const payload = {
    action: "add",                  // ← penting untuk GAS routing
    name: form.name.value,
    domisili: form.domisili.value,
    relationship: form.relationship.value,
    parentIdAyah: form.parentIdAyah.value,
    parentIdIbu: form.parentIdIbu.value,
    spouseId: form.spouseId.value,
    notes: form.notes.value,
    photo_base64: base64Photo,
    photo_type: mimeType
  };

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec",
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      alert("✔ Data berhasil disimpan!\nID: " + result.id);
      form.reset();
      document.getElementById("photo").value = "";
    } else {
      alert("❌ Server error: " + result.message);
    }

  } catch (err) {
    alert("❌ Gagal terhubung ke server:\n" + err.message);
  }
}
