createNavbar();

async function saveData() {
  const name = document.getElementById("name").value.trim();
  const rel = document.getElementById("relationship").value.trim();
  const dom = document.getElementById("domisili").value.trim();
  const notes = document.getElementById("notes").value.trim();
  const photo = document.getElementById("photoURL").value.trim();

  if (!name) {
    alert("Nama wajib diisi.");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"   // WAJIB untuk GAS
      },
      body: JSON.stringify({
        mode: "addData",
        name: name,
        relationship: rel,
        domisili: dom,
        notes: notes,
        photoURL: photo     // Pastikan nama variabel sama dengan GAS
      })
    });

    const j = await res.json();

    if (j.status === "success") {
      alert("Data berhasil ditambahkan.");
      location.href = "dashboard.html";
    } else {
      console.log("Response GAS:", j);
      alert("Gagal menambah data.");
    }

  } catch (err) {
    console.error("Error:", err);
    alert("Terjadi kesalahan koneksi.");
  }
}
