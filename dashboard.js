createNavbar("dashboard");

async function validateToken() {
  try {
    const url = `${API_URL}?mode=validate&token=${encodeURIComponent(session.token)}`;
    const res = await fetch(url);
    const j = await res.json();

    if (j.status !== "success") {
      alert("⚠️ Sesi kadaluarsa, silakan login ulang.");
      logout();
      return;
    }

    // Update display name-role
    document.getElementById("userInfo").textContent =
      `${j.name} (${j.role})`;

    loadData();

  } catch (e) {
    alert("Kesalahan koneksi server saat validasi token.");
    logout();
  }
}

async function loadData() {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const j = await res.json();

    if (j.status !== "success") {
      document.getElementById("list").innerHTML = "Tidak ada data.";
      return;
    }

    const data = j.data;
    let html = "";

    data.forEach(p => {
      const photo = p.photoURL || "https://via.placeholder.com/60?text=👤";

      let buttons = `
        <button onclick="viewDetail('${p.id}')">👁 Detail</button>
      `;

      if (session.role === "admin" || session.id === p.id) {
        buttons += `<button onclick="editMember('${p.id}')">✏️ Edit</button>`;
      }

      if (session.role === "admin") {
        buttons += `<button onclick="deleteMember('${p.id}')">🗑 Hapus</button>`;
      }

      html += `
        <div class="card">
          <img src="${photo}">
          <div><b>${p.name}</b><br>${p.relationship || ""}</div>
          <div>${buttons}</div>
        </div>
      `;
    });

    document.getElementById("list").innerHTML = html;

  } catch (e) {
    document.getElementById("list").innerHTML =
      "❌ Kesalahan koneksi server.";
  }
}

function viewDetail(id) {
  location.href = `detail.html?id=${id}`;
}

function editMember(id) {
  location.href = `edit.html?id=${id}`;
}

async function deleteMember(id) {
  if (!confirm("Hapus data ini?")) return;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      mode: "deleteData",
      id: id
    })
  });

  const j = await res.json();
  if (j.status === "success") {
    alert("Berhasil dihapus");
    loadData();
  } else {
    alert("Gagal hapus");
  }
}

validateToken();
