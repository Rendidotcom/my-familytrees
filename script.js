async function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById("mftForm");
  const fileInput = document.getElementById("photo");
  const file = fileInput.files[0];

  let base64Photo = "";
  let mimeType = "";

  // Konversi foto ke Base64
  if (file) {
    mimeType = file.type;
    base64Photo = await fileToBase64(file);
    base64Photo = base64Photo.split(",")[1]; // hanya ambil bagian Base64
  }

  // Payload dikirim ke GAS
  const payload = {
    name: form.name.value,
    domisili: form.domisili.value,
    relationship: form.relationship.value,
    photo_base64: base64Photo,
    photo_type: mimeType
  };

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // Pastikan respons valid JSON
    const result = await response.json();

    if (result.status === "success") {
      alert("✔ Data berhasil disimpan!\nFoto URL: " + result.photoURL);
      form.reset();
    } else {
      alert("❌ ERROR dari server: " + result.message);
    }

  } catch (err) {
    alert("❌ ERROR: " + err.message);
  }
}


// Konversi blob → Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
