const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

// Load data memakai JSONP
function loadTree() {
  const cb = "treeCallback_" + Date.now();

  window[cb] = function(result) {
    buildFamilyTree(result.data);
    delete window[cb];
  };

  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + cb;
  document.body.appendChild(script);
}


// ==============================
//  BUILD "AYAH – IBU – ANAK"
// ==============================
function buildFamilyTree(data) {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = "Belum ada data anggota keluarga.";
    return;
  }

  // Convert array → map (ID → object)
  const map = {};
  data.forEach(p => map[p.id] = p);

  // Temukan pasangan (Ayah–Ibu)
  const couples = [];
  const paired = new Set();

  data.forEach(p => {
    if (p.spouseId && map[p.spouseId]) {
      if (!paired.has(p.id) && !paired.has(p.spouseId)) {
        couples.push([p, map[p.spouseId]]);
        paired.add(p.id);
        paired.add(p.spouseId);
      }
    }
  });

  // Buat diagram untuk setiap pasangan
  couples.forEach(([ayah, ibu]) => {
    const block = document.createElement("div");
    block.style.textAlign = "center";
    block.style.marginBottom = "70px";

    // Pasangan (Ayah - Ibu)
    block.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; gap:40px;">
        ${renderNode(ayah)}
        <div style="width:60px; height:2px; background:#F39C12;"></div>
        ${renderNode(ibu)}
      </div>
    `;

    // Cari anak-anak
    const children = data.filter(child =>
      Number(child.parentIdAyah) === ayah.id &&
      Number(child.parentIdIbu) === ibu.id
    );

    if (children.length > 0) {
      // Garis vertikal dari pasangan ke anak-anak
      block.innerHTML += `
        <div style="width:2px; height:25px; background:#4A90E2; margin:10px auto;"></div>
      `;

      const childContainer = document.createElement("div");
      childContainer.className = "children";
      childContainer.style.display = "flex";
      childContainer.style.justifyContent = "center";
      childContainer.style.gap = "30px";

      children.forEach(c => {
        childContainer.innerHTML += renderNode(c);
      });

      block.appendChild(childContainer);
    }

    container.appendChild(block);
  });
}


// ==============================
//  NODE KELUARGA (Foto + Nama)
// ==============================
function renderNode(p) {
  return `
    <div class="node" style="text-align:center;">
      <img src="${p.photoURL}" style="
        width:75px; height:75px; border-radius:50%;
        object-fit:cover; border:3px solid #4A90E2;
      ">
      <div style="font-weight:bold; margin-top:5px;">${p.name}</div>
      <div style="font-size:12px; color:#777;">${p.relationship}</div>
    </div>
  `;
}


// Mulai
loadTree();
