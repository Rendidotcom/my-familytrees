// =====================================================
// Pastikan login valid
// =====================================================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) location.href = "login.html";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";


// =====================================================
// Ambil data dari GAS
// =====================================================
async function loadTree() {
  const container = document.getElementById("tree");
  container.innerHTML = "⏳ Memuat pohon keluarga...";

  try {
    const res = await fetch(API_URL + "?mode=getData");
    const json = await res.json();

    if (!json.success) {
      container.innerHTML = "❌ Gagal mengambil data pohon.";
      return;
    }

    buildTree(json.data);

  } catch (e) {
    container.innerHTML = "❌ Error koneksi server.";
  }
}

loadTree();


// =====================================================
// Build tree → kelompokkan berdasarkan parent
// =====================================================
function buildTree(data) {
  const container = document.getElementById("tree");
  container.innerHTML = "";

  const idMap = Object.fromEntries(data.map(p => [p.id, p]));

  // find root(s)
  const roots = data.filter(p => !p.parentIdAyah && !p.parentIdIbu);

  if (roots.length === 0) {
    container.innerHTML = "⚠ Tidak ada data root keluarga.";
    return;
  }

  const rootWrapper = document.createElement("div");
  rootWrapper.style.textAlign = "center";

  roots.forEach(root => {
    rootWrapper.appendChild(buildNode(root, data, idMap));
  });

  container.appendChild(rootWrapper);
}


// =====================================================
// Build node individual + children
// =====================================================
function buildNode(person, data, idMap) {
  const wrapper = document.createElement("div");
  wrapper.style.margin = "0 20px";

  const node = document.createElement("div");
  node.className = "node";

  const photo = person.photoURL
    ? person.photoURL
    : "https://via.placeholder.com/70?text=👤";

  node.innerHTML = `
    <img src="${photo}">
    <div><b>${person.name}</b></div>
    <div style="font-size:12px;color:#666">${person.relationship || ""}</div>
  `;

  wrapper.appendChild(node);

  // find children
  const children = data.filter(
    c => c.parentIdAyah === person.id || c.parentIdIbu === person.id
  );

  if (children.length > 0) {
    const line = document.createElement("div");
    line.className = "line";
    wrapper.appendChild(line);

    const level = document.createElement("div");
    level.className = "level";

    children.forEach(ch => {
      level.appendChild(buildNode(ch, data, idMap));
    });

    wrapper.appendChild(level);
  }

  return wrapper;
}
