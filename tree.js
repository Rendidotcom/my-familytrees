const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

loadTree();

/* =====================================================
   JSONP LOAD
===================================================== */
function loadTree() {
  const cb = "cbTree_" + Date.now();

  window[cb] = (res) => {
    buildTree(res.data);
    delete window[cb];
  };

  const s = document.createElement("script");
  s.src = GAS_URL + "?mode=getData&callback=" + cb;
  document.body.appendChild(s);
}

/* =====================================================
   BUILD TREE
===================================================== */
function buildTree(data) {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "";

  const people = {};
  data.forEach(p => people[Number(p.index)] = p);

  /* -----------------------
     Buat mapping ORANG TUA → ANAK
  ------------------------- */
  const childrenMap = {};
  data.forEach(child => {
    const a = Number(child.parentIdAyah) || 0;
    const i = Number(child.parentIdIbu) || 0;
    const key = `${a}-${i}`;
    if (!childrenMap[key]) childrenMap[key] = [];
    childrenMap[key].push(child.index);
  });

  /* -----------------------
     Cari root → orang tanpa AYAH & IBU
  ------------------------- */
  const roots = data.filter(p => !p.parentIdAyah && !p.parentIdIbu);

  if (roots.length === 0) {
    container.innerHTML = "Tidak ada data root.";
    return;
  }

  roots.forEach(r => {
    const dom = renderRecursive(r.index, people, childrenMap);
    container.appendChild(dom);
  });
}

/* =====================================================
   RECURSIVE RENDER
===================================================== */
function renderRecursive(id, people, childrenMap) {
  const person = people[id];
  if (!person) return document.createTextNode("");

  const wrapper = document.createElement("div");
  wrapper.className = "generation-level";

  // Tentukan pasangan berdasarkan ANAK (lebih akurat)
  const spouse = findSpouseByParentRelation(person.index, people);

  /* -----------------------
     RENDER PASANGAN
  ------------------------- */
  const pair = document.createElement("div");
  pair.className = "pair";

  if (spouse) {
    pair.innerHTML = `
      ${nodeHTML(person)}
      <div class="line"></div>
      ${nodeHTML(spouse)}
    `;
  } else {
    pair.innerHTML = nodeHTML(person);
  }

  wrapper.appendChild(pair);

  /* -----------------------
     RENDER ANAK
  ------------------------- */
  const key = spouse
    ? `${person.index === spouse.index ? spouse.index : person.index}-${spouse.index}`
    : `${person.index}-0`;

  const kids = childrenMap[key] || [];

  if (kids.length > 0) {
    const vline = document.createElement("div");
    vline.className = "vertical-line";
    wrapper.appendChild(vline);

    const childWrap = document.createElement("div");
    childWrap.className = "children";

    kids.forEach(cid => {
      childWrap.appendChild(renderRecursive(cid, people, childrenMap));
    });

    wrapper.appendChild(childWrap);
  }

  return wrapper;
}

/* =====================================================
   MENENTUKAN PASANGAN DARI ORANG TUA ANAK
===================================================== */
function findSpouseByParentRelation(id, people) {
  // Cari anak yang memiliki id ini sebagai AYAH atau IBU
  const children = Object.values(people).filter(
    c => Number(c.parentIdAyah) === id || Number(c.parentIdIbu) === id
  );

  if (children.length === 0) return null;

  const c = children[0];

  const spouseId =
    Number(c.parentIdAyah) === id
      ? Number(c.parentIdIbu)
      : Number(c.parentIdAyah);

  return people[spouseId] || null;
}

/* =====================================================
   NODE HTML (Foto + Nama)
===================================================== */
function nodeHTML(p) {
  const url = fixDriveURL(p.photoURL);
  return `
    <div class="node">
      <img src="${url}">
      <div class="name">${p.name}</div>
      <div class="rel">${p.relationship || ""}</div>
    </div>
  `;
}

/* =====================================================
   FIX URL GOOGLE DRIVE
===================================================== */
function fixDriveURL(url) {
  if (!url) return "https://via.placeholder.com/100";

  if (url.includes("drive.google.com")) {
    const idMatch = url.match(/[-\w]{25,}/);
    if (idMatch) return `https://drive.google.com/uc?export=view&id=${idMatch[0]}`;
  }

  return url;
}
