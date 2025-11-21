/****************************************************
 🌳 TREE.JS — LOGIN + POSISI USER + MERTUA EXPAND
****************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbzRg74Zyz9ox0gy0se3CS_QWWzkzmJyUk2524KO6C0zAARDO1f5pj4w75dXAr8RoP7LzA/exec";

// Ambil identitas user login
const ACTIVE_USER = localStorage.getItem("activeUser");
const ACTIVE_USER_NAME = localStorage.getItem("activeUserName");

// Convert Foto Drive
function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/100?text=No+Photo";
  const id = url.match(/[-\w]{25,}/)?.[0];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}

// Buat Node
function createNode(person) {
  const div = document.createElement("div");
  div.className = "node";
  div.dataset.status = person.status || "alive";

  // Warna background status hidup/meninggal
  div.style.background = person.status === "meninggal" ? "#cfcfcf" : "#c9ffd2";

  // Special style untuk user login
  if (person.id === ACTIVE_USER) {
    div.style.border = "4px solid gold";
    div.style.boxShadow = "0 0 12px orange";
  }

  div.innerHTML = `
    <img src="${convertDriveURL(person.photoURL)}">
    <div><b>${person.name || "-"}</b></div>
    <div style="font-size:12px;color:#444">${person.relationship || ""}</div>
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
  box.className = "generation-level mertua-block";
  box.style.marginTop = "15px";

  parents.forEach((p) => {
    box.appendChild(renderMember(p, data, idMap, drawn));
  });

  parentBox.appendChild(box);
}

// Render Recursive
function renderMember(person, data, idMap, drawn = new Map()) {
  if (!person) return document.createElement("div");

  // Cegah duplikasi node
  if (drawn.has(person.id)) return drawn.get(person.id).cloneNode(true);

  const wrapper = document.createElement("div");
  wrapper.className = "generation-level";
  drawn.set(person.id, wrapper);

  const pairDiv = document.createElement("div");
  pairDiv.className = "pair";
  pairDiv.appendChild(createNode(person));

  const spouse = idMap[person.spouseId];

  // Suami/Istri
  if (spouse) {
    const line = document.createElement("div");
    line.className = "line";
    pairDiv.appendChild(line);
    pairDiv.appendChild(createNode(spouse));

    // Tombol expand mertua
    const btn = document.createElement("button");
    btn.className = "expand-btn";
    btn.textContent = "Lihat Orang Tua Pasangan";

    btn.onclick = () => {
      if (!btn.clicked) {
        renderParents(spouse, data, idMap, wrapper, drawn);
        btn.textContent = "Sembunyikan";
        btn.clicked = true;
      } else {
        wrapper.removeChild(wrapper.lastChild);
        btn.textContent = "Lihat Orang Tua Pasangan";
        btn.clicked = false;
      }
    };

    pairDiv.appendChild(btn);
  }

  wrapper.appendChild(pairDiv);

  // Anak-anak
  const children = data.filter(
    (p) => p.parentIdAyah === person.id || p.parentIdIbu === person.id
  );

  if (children.length) {
    const vertical = document.createElement("div");
    vertical.className = "vertical-line";
    wrapper.appendChild(vertical);

    const childWrap = document.createElement("div");
    childWrap.className = "children";

    children.forEach((c) => {
      childWrap.appendChild(renderMember(c, data, idMap, drawn));
    });

    wrapper.appendChild(childWrap);
  }

  return wrapper;
}

// Filter Status
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

// Load Data — mulai dari user login dulu
async function loadTree() {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "⏳ Memuat data keluarga...";

  const res = await fetch(`${API_URL}?mode=getData`);
  const json = await res.json();
  const data = json.data || [];

  const idMap = Object.fromEntries(data.map((p) => [p.id, p]));

  let root = null;

  // Jika user login, mulai dari user
  if (ACTIVE_USER) {
    root = idMap[ACTIVE_USER];
  }

  // Jika user belum login, fallback cari generasi tertua
  if (!root) {
    root = data.find((p) => !p.parentIdAyah && !p.parentIdIbu);
  }

  container.innerHTML = "";
  container.appendChild(renderMember(root, data, idMap));
}

// RUN
document.addEventListener("DOMContentLoaded", loadTree);
