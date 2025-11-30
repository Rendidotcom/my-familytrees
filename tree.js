// =====================================================
// tree.js — FINAL SINKRON (config.js + session.js + GAS)
// =====================================================

// Ambil API_URL dari config.js
const API_URL = window.API_URL;

// Ambil session API dari session.js
const { getSession, validateToken, clearSession, createNavbar } = window;

console.log("📌 tree.js loaded, API =", API_URL);

// Elemen UI
const container = document.getElementById("tree");

// =====================================================
// 1) PROTECT SESSION
// =====================================================
async function protect() {
  const s = getSession();
  if (!s || !s.token) {
    container.innerHTML = "Sesi hilang. Mengalihkan ke login...";
    setTimeout(() => location.href = "login.html", 800);
    return null;
  }

  const v = await validateToken(s.token);
  if (!v.valid) {
    clearSession();
    container.innerHTML = "Sesi kadaluarsa. Login ulang...";
    setTimeout(() => location.href = "login.html", 900);
    return null;
  }

  // tampilkan navbar
  createNavbar("tree");
  document.getElementById("userInfo").textContent = `${v.data.name} (${v.data.role})`;

  return s;
}

// =====================================================
// 2) Ambil data keluarga dari GAS
// =====================================================
async function loadTree() {
  container.innerHTML = "⏳ Memuat pohon keluarga...";

  try {
    const res = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`, { cache: "no-store" });
    const json = await res.json();

    if (json.status !== "success") {
      container.innerHTML = "❌ Gagal memuat data pohon.";
      return;
    }

    buildTree(json.data);

  } catch (e) {
    console.error("tree load error:", e);
    container.innerHTML = "❌ Error koneksi server.";
  }
}

// =====================================================
// 3) Bangun struktur tree (father/mother)
// =====================================================
function buildTree(data) {
  container.innerHTML = "";

  const idMap = Object.fromEntries(data.map(p => [p.id, p]));

  // Root = orang yang tidak punya father & mother
  const roots = data.filter(p => !p.father && !p.mother);

  if (roots.length === 0) {
    container.innerHTML = "⚠ Tidak ada root keluarga (ayah & ibu kosong).";
    return;
  }

  const rootWrapper = document.createElement("div");
  rootWrapper.style.textAlign = "center";

  roots.forEach(root => {
    rootWrapper.appendChild(buildNode(root, data));
  });

  container.appendChild(rootWrapper);
}

// =====================================================
// 4) Build Node (Foto + Nama + Anak)
// =====================================================
function buildNode(person, data) {
  const wrapper = document.createElement("div");
  wrapper.style.margin = "0 20px";

  const node = document.createElement("div");
  node.className = "node";

  // Foto Google Drive
  let photo = "https://via.placeholder.com/70?text=👤";
  if (person.photoURL) {
    const match = person.photoURL.match(/[-\w]{25,}/);
    if (match) photo = `https://drive.google.com/uc?export=view&id=${match[0]}`;
  }

  node.innerHTML = `
    <img src="${photo}">
    <div><b>${person.name}</b></div>
    <div style="font-size:12px;color:#666">${person.status || ""}</div>
  `;

  wrapper.appendChild(node);

  // Cari anak: father == parent.id OR mother == parent.id
  const children = data.filter(c => c.father == person.id || c.mother == person.id);

  if (children.length > 0) {
    const line = document.createElement("div");
    line.className = "line";
    wrapper.appendChild(line);

    const level = document.createElement("div");
    level.className = "level";

    children.forEach(ch => {
      level.appendChild(buildNode(ch, data));
    });

    wrapper.appendChild(level);
  }

  return wrapper;
}

// =====================================================
// 5) INIT
// =====================================================
(async function init() {
  const s = await protect();
  if (!s) return;

  await loadTree();
})();
