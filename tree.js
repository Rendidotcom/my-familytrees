// ===============================
// KONFIGURASI
// ===============================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzRg74Zyz9ox0gy0se3CS_QWWzkzmJyUk2524KO6C0zAARDO1f5pj4w75dXAr8RoP7LzA/exec";

const container = document.getElementById("treeContainer");

// ===============================
// UTILITAS
// ===============================
function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/85";
  if (url.includes("drive.google.com")) {
    const id = url.match(/[-\w]{25,}/);
    return id ? `https://drive.google.com/uc?export=view&id=${id[0]}` : url;
  }
  return url;
}

function createNode(person) {
  const div = document.createElement("div");
  div.className = "node";
  div.innerHTML = `
    <img src="${convertDriveURL(person.photoURL)}" alt="${person.name}" />
    <div class="name">${person.name}</div>
    <div class="rel">${person.relationship}</div>
  `;
  return div;
}

// ===============================
// BANGUN STRUKTUR POHON
// ===============================
function buildTree(data) {
  if (!data || !data.length) {
    container.innerHTML = `<div>Tidak ada data ditemukan.</div>`;
    return;
  }

  const idMap = {};
  data.forEach((p) => (idMap[p.id] = p));

  // Cari root: orang yang tidak punya parent (ayah & ibu kosong)
  const roots = data.filter(
    (p) => !p.parentIdAyah && !p.parentIdIbu
  );

  if (!roots.length) {
    container.innerHTML = `<div>Struktur keluarga tidak lengkap (tidak ada root).</div>`;
    return;
  }

  container.innerHTML = ""; // Kosongkan container

  roots.forEach((root) => {
    const treeEl = renderMember(root, data, idMap);
    container.appendChild(treeEl);
  });
}

// Rekursif render orang tua + pasangan + anak-anak
function renderMember(person, data, idMap) {
  const wrapper = document.createElement("div");
  wrapper.className = "generation-level";

  // tampilkan pasangan (jika ada)
  let spouseEl = null;
  const spouse = idMap[person.spouseId];

  const pairDiv = document.createElement("div");
  pairDiv.className = "pair";

  pairDiv.appendChild(createNode(person));

  if (spouse) {
    const line = document.createElement("div");
    line.className = "line";
    pairDiv.appendChild(line);
    spouseEl = createNode(spouse);
    pairDiv.appendChild(spouseEl);
  }

  wrapper.appendChild(pairDiv);

  // cari anak-anak dari pasangan ini
  const children = data.filter(
    (p) => p.parentIdAyah === person.id || p.parentIdIbu === person.id
  );

  if (children.length) {
    const vertical = document.createElement("div");
    vertical.className = "vertical-line";
    wrapper.appendChild(vertical);

    const childContainer = document.createElement("div");
    childContainer.className = "children";

    children.forEach((child) => {
      const childNode = renderMember(child, data, idMap);
      childContainer.appendChild(childNode);
    });

    wrapper.appendChild(childContainer);
  }

  return wrapper;
}

// ===============================
// LOAD DATA DARI GAS
// ===============================
async function loadTree() {
  container.innerHTML = "🔄 Memuat data dari server...";

  try {
    const res = await fetch(API_URL + "?mode=getData");
    const json = await res.json();
    const data = json.data || [];

    console.log("DATA TREE:", data);
    buildTree(data);

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div style="color:red;">Gagal memuat data: ${err.message}</div>`;
  }
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", loadTree);
