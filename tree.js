const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

loadTree();

/* -----------------------------------------------------
   LOAD DATA via JSONP
----------------------------------------------------- */
function loadTree() {
  const callback = "cbTree_" + Date.now();
  window[callback] = function (res) {
    if (res && res.data) buildTree(res.data);
    delete window[callback];
  };

  const s = document.createElement("script");
  s.src = GAS_URL + "?mode=getData&callback=" + callback;
  document.body.appendChild(s);
}

/* -----------------------------------------------------
   BUILD TREE UTAMA
----------------------------------------------------- */
function buildTree(data) {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "";

  // Index agar mudah diakses
  const people = {};
  data.forEach(p => (people[Number(p.index)] = p));

  // --- Bangun mapping anak ---
  const childrenMap = {};
  data.forEach(p => {
    const ayah = Number(p.parentIdAyah);
    const ibu = Number(p.parentIdIbu);

    const key = ayah + "-" + ibu;
    if (!childrenMap[key]) childrenMap[key] = [];
    childrenMap[key].push(p.index);
  });

  // Temukan root candidate: orang tanpa ayah & ibu
  const roots = data.filter(p => !p.parentIdAyah && !p.parentIdIbu);

  if (roots.length === 0) {
    container.innerHTML = "Tidak ada data akar (root).";
    return;
  }

  // Render tiap root
  roots.forEach(r => {
    const treeElement = buildNodeRecursive(r.index, people, childrenMap);
    container.appendChild(treeElement);
  });
}

/* -----------------------------------------------------
   RENDER NODE RECURSIVE
----------------------------------------------------- */
function buildNodeRecursive(id, people, childrenMap) {
  const person = people[id];
  if (!person) return document.createTextNode("");

  const wrapper = document.createElement("div");
  wrapper.className = "generation-level";

  const spouse = person.spouseId ? people[Number(person.spouseId)] : null;
  const isPrimary = !spouse || Number(id) < Number(spouse.index);

  // Pasangan agar tidak double–render
  if (spouse && !isPrimary) return document.createTextNode("");

  // === Render pasangan bila ada ===
  const pair = document.createElement("div");
  pair.className = "pair";

  if (spouse) {
    pair.innerHTML = `
      ${renderNodeHTML(person)}
      <div class="line"></div>
      ${renderNodeHTML(spouse)}
    `;
  } else {
    pair.innerHTML = `${renderNodeHTML(person)}`;
  }

  wrapper.appendChild(pair);

  // === Cari anak-anak berdasarkan pasangan ===
  const key =
    Number(person.index) + "-" + (spouse ? Number(spouse.index) : "");

  const kids = childrenMap[key] || [];

  if (kids.length > 0) {
    const vline = document.createElement("div");
    vline.className = "vertical-line";
    wrapper.appendChild(vline);

    const childrenBlock = document.createElement("div");
    childrenBlock.className = "children";

    kids.forEach(cid => {
      const childElement = buildNodeRecursive(cid, people, childrenMap);
      childrenBlock.appendChild(childElement);
    });

    wrapper.appendChild(childrenBlock);
  }

  return wrapper;
}

/* -----------------------------------------------------
   NODE HTML (Foto, Nama, Relationship)
----------------------------------------------------- */
function renderNodeHTML(p) {
  return `
    <div class="node">
      <img src="${p.photoURL || "https://via.placeholder.com/80"}">
      <div class="name">${p.name}</div>
      <div class="rel">${p.relationship || ""}</div>
    </div>
  `;
}
