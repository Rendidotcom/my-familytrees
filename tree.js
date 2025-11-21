// ===============================
// KONFIGURASI
// ===============================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzRg74Zyz9ox0gy0se3CS_QWWzkzmJyUk2524KO6C0zAARDO1f5pj4w75dXAr8RoP7LzA/exec";

// ===============================
// KONVERSI URL FOTO GOOGLE DRIVE
// ===============================
function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/85";

  if (url.includes("drive.google.com")) {
    const id = url.match(/[-\w]{25,}/)?.[0];
    if (!id) return url;
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }

  return url;
}

// ===============================
// BUAT NODE ORANG
// ===============================
function createNode(person) {
  const div = document.createElement("div");
  div.className = "node";

  const img = document.createElement("img");
  img.src = convertDriveURL(person.photoURL);
  img.alt = person.name || "-";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = person.name || "-";

  const rel = document.createElement("div");
  rel.className = "rel";
  rel.textContent = person.relationship || "";

  div.appendChild(img);
  div.appendChild(name);
  div.appendChild(rel);

  return div;
}

// ===============================
// RENDER REKURSIF
// (anti infinite-loop)
// ===============================
function renderMember(person, data, idMap, visited) {
  if (!person) return document.createElement("div");
  if (visited.has(person.id)) return document.createElement("div");

  visited.add(person.id);

  const wrapper = document.createElement("div");
  wrapper.className = "generation-level";

  // === pasangan ===
  const pairDiv = document.createElement("div");
  pairDiv.className = "pair";

  pairDiv.appendChild(createNode(person));

  const spouse = idMap[person.spouseId];
  if (spouse && !visited.has(spouse.id)) {
    const line = document.createElement("div");
    line.className = "line";

    pairDiv.appendChild(line);
    pairDiv.appendChild(createNode(spouse));

    visited.add(spouse.id);
  }

  wrapper.appendChild(pairDiv);

  // === anak-anak ===
  const children = data.filter(
    (p) => p.parentIdAyah === person.id || p.parentIdIbu === person.id
  );

  if (children.length > 0) {
    const v = document.createElement("div");
    v.className = "vertical-line";
    wrapper.appendChild(v);

    const childContainer = document.createElement("div");
    childContainer.className = "children";

    children.forEach((child) => {
      childContainer.appendChild(
        renderMember(child, data, idMap, visited)
      );
    });

    wrapper.appendChild(childContainer);
  }

  return wrapper;
}

// ===============================
// MUAT DATA DARI GOOGLE SHEETS
// ===============================
async function loadTree() {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "⏳ Memuat pohon keluarga...";

  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const json = await res.json();
    const data = json.data || [];

    if (!data.length) {
      container.innerHTML = "<p>Tidak ada data ditemukan.</p>";
      return;
    }

    // Map ID → objek person
    const idMap = {};
    data.forEach((p) => (idMap[p.id] = p));

    // Root = orang tanpa ayah & ibu
    const roots = data.filter(
      (p) => !p.parentIdAyah && !p.parentIdIbu
    );

    container.innerHTML = "";

    const visited = new Set();
    roots.forEach((root) => {
      container.appendChild(renderMember(root, data, idMap, visited));
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:red;">Gagal memuat data.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadTree);
