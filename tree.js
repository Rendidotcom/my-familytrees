const API_URL =
  "https://script.google.com/macros/s/AKfycbzRg74Zyz9ox0gy0se3CS_QWWzkzmJyUk2524KO6C0zAARDO1f5pj4w75dXAr8RoP7LzA/exec";

// Convert Foto Drive
function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/85";
  const id = url.match(/[-\w]{25,}/)?.[0];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}

// Buat Node
function createNode(person) {
  const div = document.createElement("div");
  div.className = "node";
  div.dataset.status = person.status || "alive";

  div.style.background = person.status === "meninggal" ? "#d9d9d9" : "#d0ffd8";

  div.innerHTML = `
    <img src="${convertDriveURL(person.photoURL)}">
    <div><b>${person.name || "-"}</b></div>
    <div style="font-size:12px;color:#555">${person.relationship || ""}</div>
  `;

  return div;
}

// Expand Mertua
function renderParents(person, data, idMap, parentBox, drawn) {
  const parents = data.filter(
    (p) => p.id === person.parentIdAyah || p.id === person.parentIdIbu
  );

  if (!parents.length) return;

  const box = document.createElement("div");
  box.className = "generation-level";
  box.style.marginTop = "10px";

  parents.forEach((p) => {
    box.appendChild(renderMember(p, data, idMap, drawn));
  });

  parentBox.appendChild(box);
}


// Render Recursive
function renderMember(person, data, idMap, drawn = new Map()) {
  if (!person) return document.createElement("div");

  if (drawn.has(person.id)) return drawn.get(person.id).cloneNode(true);

  const wrapper = document.createElement("div");
  wrapper.className = "generation-level";
  drawn.set(person.id, wrapper);

  const pairDiv = document.createElement("div");
  pairDiv.className = "pair";
  pairDiv.appendChild(createNode(person));

  const spouse = idMap[person.spouseId];

  if (spouse) {
    pairDiv.appendChild(document.createElement("div")).className = "line";
    pairDiv.appendChild(createNode(spouse));

    const btn = document.createElement("button");
    btn.textContent = "Lihat Orang Tua Pasangan";
    btn.className = "expand-btn";

    btn.onclick = () => {
      if (!btn.clicked) {
        renderParents(spouse, data, idMap, wrapper, drawn);
        btn.textContent = "Sembunyikan";
        btn.clicked = true;
      } else {
        wrapper.lastChild.remove();
        btn.textContent = "Lihat Orang Tua Pasangan";
        btn.clicked = false;
      }
    };

    pairDiv.appendChild(btn);
  }

  wrapper.appendChild(pairDiv);

  const children = data.filter(
    (p) => p.parentIdAyah === person.id || p.parentIdIbu === person.id
  );

  if (children.length) {
    wrapper.appendChild(document.createElement("div")).className = "vertical-line";

    const childWrap = document.createElement("div");
    childWrap.className = "children";

    children.forEach((c) =>
      childWrap.appendChild(renderMember(c, data, idMap, drawn))
    );

    wrapper.appendChild(childWrap);
  }

  return wrapper;
}

// Filter Status Tombol
function toggleStatus(mode) {
  document.querySelectorAll(".node").forEach((node) => {
    if (mode === "all") node.style.opacity = "1";
    else if (mode === "alive" && node.dataset.status === "meninggal")
      node.style.opacity = "0.2";
    else if (mode === "dead" && node.dataset.status !== "meninggal")
      node.style.opacity = "0.2";
    else node.style.opacity = "1";
  });
}


// Load Data
async function loadTree() {
  const container = document.getElementById("treeContainer");

  const res = await fetch(`${API_URL}?mode=getData`);
  const json = await res.json();
  const data = json.data || [];

  const idMap = Object.fromEntries(data.map((p) => [p.id, p]));
  const roots = data.filter((p) => !p.parentIdAyah && !p.parentIdIbu);

  container.innerHTML = "";

  roots.forEach((root) => {
    container.appendChild(renderMember(root, data, idMap));
  });
}

document.addEventListener("DOMContentLoaded", loadTree);
