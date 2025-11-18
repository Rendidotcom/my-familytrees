async function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById("mftForm");
  const file = document.getElementById("photo").files[0];

  let base64Photo = "";
  let mimeType = "";

  if (file) {
    mimeType = file.type;
    base64Photo = await toBase64(file);
    base64Photo = base64Photo.split(",")[1];
  }

  const payload = {
    name: form.name.value,
    domisili: form.domisili.value,
    relationship: form.relationship.value,
    notes: form.notes.value,
    parentIdAyah: form.parentIdAyah.value,
    parentIdIbu: form.parentIdIbu.value,
    spouseId: form.spouseId.value,
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
      alert("✔ Data berhasil disimpan! ID = " + result.index);
      form.reset();
    } else {
      alert("❌ Server error: " + result.message);
    }

  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
