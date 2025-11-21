const API_URL = "https://script.google.com/macros/s/AKfycbzRg74Zyz9ox0gy0se3CS_QWWzkzmJyUk2524KO6C0zAARDO1f5pj4w75dXAr8RoP7LzA/exec";

function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/85";
  if (url.includes("drive.google.com")) {
    const id = url.match(/[-\w]{25,}/)?.[0];
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
  }
  return url;
}

function createNode(person) {
  const div = document.createElement("div");
  div.className = "node";

  const img = document.createElement("img");
  img.src = convertDriveURL(person.photoURL);
  img.alt = person.name;

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

function renderMember(person, data, idMap, visited = new Set()) {
  if (!person || visited.has(person.id)) return document.createElement("div");
  visited.add(person.id);

  const wrapper = document.createElement("div");
  wrapper.className = "generation-level";

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

  const children = data.filter(
    (p) => p.parentIdAyah === person.id || p.parentIdIbu === person.id
  );

  if (children.length > 0) {
    const vertical = document.createElement("div");
    vertical.className = "vertical-line";
    wrapper.appendChild(vertical);

    const childContainer = document.createElement("div");
    childContainer.className = "children";

    children.forEach((child) => {
      childContainer.appendChild(renderMember(child, data, idMap, visited));
    });

    wrapper.appendChild(childContainer);
  }

  return wrapper;
}

async function loadTree() {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "⏳ Memuat data...";

  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const json = await res.json();
    const data = json.data || [];

    if (!data.length) {
      container.innerHTML = "❌ Tidak ada data ditemukan.";
      return;
    }

    const idMap = {};
    data.forEach((p) => (idMap[p.id] = p));

    const roots = data.filter((p) => !p.parentIdAyah && !p.parentIdIbu);

    container.innerHTML = "";
    roots.forEach((root) => {
      container.appendChild(renderMember(root, data, idMap));
    });

  } catch (err) {
    container.innerHTML = `<span style='color:red;'>⚠️ Error koneksi GAS</span>`;
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadTree);
