/* =====================================================
   TREE.JS — FINAL VERSION (mode = getTree)
   Fully synced with new GAS endpoint
===================================================== */

// ====================================
// 1. Cek Login
// ====================================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) location.href = "login.html";


// ====================================
// 2. Endpoint dari config.js
// ====================================
const API_URL = window.API_URL || "";  
if (!API_URL) console.error("❌ API_URL tidak ditemukan dari config.js");


// ====================================
// 3. LOAD TREE dari GAS (mode=getTree)
// ====================================
async function loadTree() {
  const wrap = document.getElementById("treeContainer");
  wrap.innerHTML = `<div style="padding:20px;font-size:18px;">⏳ Memuat...</div>`;

  try {
    const res = await fetch(`${API_URL}?mode=getTree&token=${session.token}`);
    const json = await res.json();

    console.log("DATA pohon:", json);

    if (json.status !== "success") {
      wrap.innerHTML = `<div style="color:red;">❌ Gagal memuat tree.</div>`;
      return;
    }

    // Penyesuaian fleksibel: GAS bisa mengirim 'tree', 'roots', atau 'data'
    const treeData =
      json.tree ||
      json.roots ||
      json.data ||
      null;

    if (!treeData) {
      wrap.innerHTML = `<div style="color:red;">❌ Format data pohon tidak valid.</div>`;
      return;
    }

    renderTree(treeData);

  } catch (err) {
    wrap.innerHTML = `<div style="color:red">❌ Error koneksi</div>`;
    console.error(err);
  }
}

loadTree();


// =====================================================
// 4. RENDER TREE STRUCTURE
// Format universal: root + spouse + children
// =====================================================
function renderTree(rootData) {
  const wrap = document.getElementById("treeContainer");
  wrap.innerHTML = "";

  // Jika GAS mengirim beberapa root
  const roots = Array.isArray(rootData) ? rootData : [rootData];

  roots.forEach(root => {
    wrap.appendChild(buildFamilyUnit(root));
  });
}


// =====================================================
// 5. MEMBANGUN SATU KELUARGA (Ayah + Ibu + Anak)
// =====================================================
function buildFamilyUnit(person) {
  const box = document.createElement("div");
  box.className = "generation";

  const pair = document.createElement("div");
  pair.className = "pair";

  // FOTO OR DEFAULT
  const img = person.photoURL
    ? person.photoURL
    : "https://via.placeholder.com/100?text=👤";

  // SIMPEL NODE
  const node = `
      <div class="node">
         <img src="${img}">
         <strong>${person.name || "Tanpa Nama"}</strong>
         <div class="status">${statusIcon(person.status)}</div>
      </div>
    `;

  // Pasangan
  const spouse = person.spouse || null;

  pair.innerHTML += node;

  if (spouse) {
    const spouseImg = spouse.photoURL
      ? spouse.photoURL
      : "https://via.placeholder.com/100?text=👤";

    pair.innerHTML += `
      <div class="line"></div>
      <div class="node">
         <img src="${spouseImg}">
         <strong>${spouse.name}</strong>
         <div class="status">${statusIcon(spouse.status)}</div>
      </div>
    `;
  }

  box.appendChild(pair);

  // Anak-anak
  if (person.children && person.children.length > 0) {
    const vline = document.createElement("div");
    vline.className = "vertical-line";
    box.appendChild(vline);

    const childWrap = document.createElement("div");
    childWrap.className = "children";

    person.children.forEach(child => {
      childWrap.appendChild(buildFamilyUnit(child));
    });

    box.appendChild(childWrap);
  }

  return box;
}


// =====================================================
// 6. IKON STATUS
// =====================================================
function statusIcon(status) {
  if (!status || status === "") return "";
  if (status === "hidup") return "🟢";
  if (status === "meninggal") return "⚫";
  return "";
}


// =====================================================
// 7. FILTER (opsional tombol Semua/Hidup/Meninggal)
// =====================================================
function filterTree(type) {
  const nodes = document.querySelectorAll(".node");
  nodes.forEach(n => {
    if (type === "all") {
      n.style.opacity = "1";
      return;
    }

    const icon = n.querySelector(".status")?.innerText;
    if (type === "alive" && icon !== "🟢") n.style.opacity = "0.2";
    else if (type === "dead" && icon !== "⚫") n.style.opacity = "0.2";
    else n.style.opacity = "1";
  });
}


// =====================================================
// 8. LOGOUT
// =====================================================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}

