/****************************************************
 🌳 TREE.JS — FINAL SYNC WITH GAS (LOGIN READY)
****************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbzRg74Zyz9ox0gy0se3CS_QWWzkzmJyUk2524KO6C0zAARDO1f5pj4w75dXAr8RoP7LzA/exec";

const ACTIVE_USER = localStorage.getItem("activeUser");

// Jika belum login → redirect
if (!ACTIVE_USER) {
  alert("⚠ Anda harus login untuk melihat pohon keluarga.");
  window.location.href = "login.html";
}

// Convert Foto Drive → direct preview
function convertDriveURL(url) {
  if (!url) return "https://via.placeholder.com/100?text=Foto";
  const id = url.match(/[-\w]{25,}/)?.[0];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}

// Generate node UI
function createNode(person) {
  const div = document.createElement("div");
  div.className = "node";
  div.dataset.status = person.status || "alive";

  // Status warna
  div.style.background = person.status === "meninggal" ? "#dcdcdc" : "#c9ffd2";

  // Highlight user login
  if (person.id === ACTIVE_USER) {
    div.style.border = "4px solid gold";
    div.style.boxShadow = "0 0 15px orange";
  }

  div.innerHTML = `
    <img src="${convertDriveURL(person.photoURL)}">
    <strong>${person.name}</strong>
    <small>${person.relationship || "-"}</small>
  `;

  return div;
}

// Recursive Builder
function buildTree(person, data, idMap, drawn = new Map()) {

  // Hindari loop
  if (drawn.has(person.id)) return drawn.get(person.id).cloneNode(true);

  const wrapper = document.createElement("div");
  wrapper.className = "generation";

  drawn.set(person.id, wrapper);

  // pasangan (jika ada)
  const pair = document.createElement("div");
  pair.className = "pair";

  const spouse = idMap[person.spouseId];
  pair.appendChild(createNode(person));

  if (spouse) {
    const line = document.createElement("div");
    line.className = "line";
    pair.appendChild(line);
    pair.appendChild(createNode(spouse));
  }

  wrapper.appendChild(pair);

  // anak-anak
  const children = data.filter(
    p => p.parentIdAyah === person.id || p.parentIdIbu === person.id
  );

  // urutkan anak
  children.sort((a,b)=>Number(a.orderChild||999)-Number(b.orderChild||999));

  if (children.length) {
    const vline = document.createElement("div");
    vline.className = "vertical-line";
    wrapper.appendChild(vline);

    const childWrap = document.createElement("div");
    childWrap.className = "children";

    children.forEach(c => {
      childWrap.appendChild(buildTree(c, data, idMap, drawn));
    });

    wrapper.appendChild(childWrap);
  }

  return wrapper;
}

// Filtering (hidup/meninggal)
function toggleStatus(mode) {
  document.querySelectorAll(".node").forEach(n => {
    if (mode === "all") n.style.opacity = "1";
    else if (mode === "alive" && n.dataset.status === "meninggal") n.style.opacity = ".2";
    else if (mode === "dead" && n.dataset.status !== "meninggal") n.style.opacity = ".2";
    else n.style.opacity = "1";
  });
}

// Load Tree
async function loadTree() {
  const box = document.getElementById("treeContainer");
  box.innerHTML = "⏳ Memuat data...";

  const res = await fetch(`${API_URL}?mode=getData`);
  const json = await res.json();

  if (json.status !== "success") {
    box.innerHTML = "❌ Gagal memuat data";
    return;
  }

  const data = json.data;
  const idMap = Object.fromEntries(data.map(p => [p.id, p]));

  // Gunakan akun login sebagai root
  const root = idMap[ACTIVE_USER];

  box.innerHTML = "";
  box.appendChild(buildTree(root, data, idMap));
}

document.addEventListener("DOMContentLoaded", loadTree);
