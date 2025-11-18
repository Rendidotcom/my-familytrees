const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

function loadTree() {
  const callback = "cb_" + Date.now();

  window[callback] = function (result) {
    buildTree(result.data);
    delete window[callback];
  };

  const s = document.createElement("script");
  s.src = GAS_URL + "?mode=getData&callback=" + callback;
  document.body.appendChild(s);
}

function buildTree(data) {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "";

  const persons = {};
  data.forEach(p => persons[p.index] = p);

  // Cari semua pasangan
  const spousePairs = [];
  data.forEach(p => {
    if (p.spouseId && persons[p.spouseId]) {
      if (!spousePairs.some(s => s.includes(p.index))) {
        spousePairs.push([p.index, p.spouseId]);
      }
    }
  });

  // Tampilkan pasangan sebagai satu unit
  spousePairs.forEach(pair => {
    const [a, b] = pair;
    const Ay = persons[a];
    const Ib = persons[b];

    const unit = document.createElement("div");
    unit.style.display = "flex";
    unit.style.alignItems = "center";
    unit.style.marginBottom = "30px";

    unit.innerHTML = `
      <div class="node">
        <img src="${Ay.photoURL}"/>
        <span>${Ay.name}</span>
      </div>
      <div class="spouseLine" style="width:40px;height:2px;background:#444;margin:0 10px;"></div>
      <div class="node">
        <img src="${Ib.photoURL}"/>
        <span>${Ib.name}</span>
      </div>
    `;

    // Cari anak mereka
    const anak = data.filter(
      x => Number(x.parentIdAyah) === a && Number(x.parentIdIbu) === b
    );

    if (anak.length > 0) {
      const children = document.createElement("div");
      children.className = "children";

      anak.forEach(child => {
        children.innerHTML += `
          <div class="node">
            <img src="${child.photoURL}"/>
            <span>${child.name}</span>
          </div>
        `;
      });

      unit.appendChild(children);
    }

    container.appendChild(unit);
  });
}

loadTree();
