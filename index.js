// index.js FINAL – Sinkron GAS Sheet1
// Pastikan window.API_URL sudah di-set dari config.js

createNavbar();

async function saveData() {
  const name = document.getElementById("name").value.trim();
  const relationship = document.getElementById("relationship").value.trim();
  const domisili = document.getElementById("domisili").value.trim();
  const notes = document.getElementById("notes").value.trim();
  const photoURL = document.getElementById("photoURL").value.trim();

  if (!name) {
    alert("Nama wajib diisi.");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: "insert",   // MODE sesuai GAS
        token: getSession().token, // WAJIB untuk admin
        name: name,
        relationship: relationship,
        domisili: domisili,
        notes: notes,
        photoURL: photoURL
      })
    });

    const j = await res.json();

    if (j.status === "success") {
      alert("Data berhasil ditambahkan.");
      window.location.href = "dashboard.html";
    } else {
      console.error("GAS Response:", j);
      alert("Gagal menambah data: " + (j.message || ""));
    }

  } catch (err) {
    console.error("Error:", err);
    alert("Kesalahan koneksi ke server.");
  }
}
