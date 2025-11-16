async function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById("mftForm");
  const fileInput = document.getElementById("photo");
  const file = fileInput.files[0];

  let base64Photo = "";
  let mimeType = "";

  // Convert foto ke Base64 jika ada
  if (file) {
    mimeType = file.type;
    base64Photo = await fileToBase64(file);
    base64Photo = base64Photo.split(",")[1]; 
  }

  // DATA sesuai HTML BARU
  const payload = {
    name: form.name.value,
    domisili: form.domisili.value,
    relationship: form.relationship.value,
    photo_base64: base64Photo,
    photo_type: mimeType
  };

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbwHLagORX5q6W4m1XHeEn4H4TWjEqrvlyqICueJDhDyIBD4Rko10MwUudNrl2XOdUu0SA/exec",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      alert("✔ Data tersimpan!\nFoto URL: " + result.photoURL);
      form.reset();
    } else {
      alert("❌ ERROR: " + result.message);
    }

  } catch (err) {
    alert("❌ ERROR: " + err);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
