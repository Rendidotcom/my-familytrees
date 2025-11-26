// ======================================================
// 🔧 CONFIG
// ======================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";

// ======================================================
// 🔐 PROTECT PAGE
// ======================================================
const user = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!user) {
  window.location.href = "login.html";
}

// Parsed user object
const USER_ID = user.id;
const USER_ROLE = user.role;


// ======================================================
// 🖼 Convert Google Drive Link → Direct Image
// ======================================================
function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/70";
  const id = url.match(/[-\w]{25,}/)?.[0];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}


// ======================================================
// 📥 LOAD DATA FROM GAS
// ======================================================
async function loadData() {
  const list = document.getElementById("list");
  list.innerHTML = "⏳ Memuat data...";

  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`);
    const json = await res.json();

    if (json.status !== "success") {
      list.innerHTML = "❌ Gagal memuat data.";
      return;
    }

    const data = json.data || [];

    // Sort berdasarkan urutan anak
    data.sort((a, b) => Number(a.orderChild || 999) - Number(b.orderChild || 999));

    renderList(data);

  } catch (err) {
    list.innerHTML = "❌ Error koneksi!";
    console.error(err);
  }
}


// ======================================================
// 🎨 RENDER UI
// ======================================================
function renderList(data) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const idMap = Object.fromEntries(data.map(p => [p.id, p]));

  data.forEach(person => {
    const photo = convertDriveURL(person.photoURL);
    const ayah = idMap[person.parentIdAyah]?.name || "-";
    const ibu = idMap[person.parentIdIbu]?.name || "-";
    const pasangan = idMap[person.spouseId]?.name || "-";

    const anak = data
      .filter(p => p.parentIdAyah === person.id || p.parentIdIbu === person.id)
      .map(c => c.name)
      .join(", ") || "-";

    const statusTag = person.status === "meninggal"
      ? `<span class="status-tag status-dead">☠ Meninggal</span>`
      : `<span class="status-tag status-alive">🟢 Hidup</span>`;

    const orderBadge = person.orderChild
      ? `<span class="order-badge">#${person.orderChild}</span>`
      : "";

    const pinStatus = person.pinSet
      ? `<small style="color:green;">✔ PIN Aktif</small>`
      : `<small style="color:red;">⚠ Belum Set PIN</small>`;

    // Admin bisa edit siapapun
    // User biasa hanya bisa edit dirinya
    let buttons = `
      <button class="btn-detail" onclick="openDetail('${person.id}')">🔍 Detail</button>
    `;

    if (USER_ROLE === "admin" || USER_ID === person.id) {
      buttons += `<button class="btn-edit" onclick="openEdit('${person.id}')">✏️ Edit</button>`;
    }

    if (USER_ROLE === "admin") {
      buttons += `<button class="btn-del" onclick="deleteMember('${person.id}')">🗑 Hapus</button>`;
    }

    list.innerHTML += `
      <div class="member">
        <img src="${photo}" alt="${person.name}">
        
        <div class="member-info">
          <h4>${person.name} ${statusTag} ${orderBadge}</h4>
          <p>${person.relationship || ""} • ${person.domisili || ""}</p>

          <p><b>Ayah:</b> ${ayah}</p>
          <p><b>Ibu:</b> ${ibu}</p>
          <p><b>Pasangan:</b> ${pasangan}</p>
          <p><b>Anak:</b> ${anak}</p>

          <p>${pinStatus}</p>
        </div>

        <div class="member-buttons">${buttons}</div>
      </div>
    `;
  });
}


// ======================================================
// 🛠 ACTIONS
// ======================================================
function openDetail(id) {
  window.location.href = `detail.html?id=${id}`;
}

function openEdit(id) {
  if (USER_ROLE !== "admin" && id !== USER_ID) {
    alert("❌ Anda hanya bisa mengedit profil diri sendiri.");
    return;
  }
  window.location.href = `edit.html?id=${id}`;
}

async function deleteMember(id) {
  if (USER_ROLE !== "admin") {
    alert("❌ Hanya admin yang bisa menghapus.");
    return;
  }

  if (!confirm("⚠ Yakin ingin menghapus data anggota ini?")) return;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "delete",
      id: id,
      token: user.token
    })
  });

  const json = await res.json();

  if (json.status === "success") {
    alert("🗑 Data berhasil dihapus.");
    loadData();
  } else {
    alert("❌ Error: " + json.message);
  }
}


// ======================================================
// 🚀 INIT
// ======================================================
document.addEventListener("DOMContentLoaded", loadData);
