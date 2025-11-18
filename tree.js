const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

loadTree();

function loadTree() {
  const callback = "cbTree_" + Date.now();

  window[callback] = function (res) {
    buildTree(res.data);
    delete window[callback];
  };

  const s = document.createElement("script");
  s.src = GAS_URL + "?mode=getData&callback=" + callback;
  document.body.appendChild(s);
}

function buildTree(data) {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "";

  const people = {};
  data.forEach(p => people[p.index] = p);

  // Cari pasangan
  const pairs = [];
  data.forEach(p => {
    if (p.spouseId && people[p.spouseId]) {
      const exists = pairs.some(
        pair => pair.includes(p.index)
      );
      if (!exists) pairs.push([p.index, p.spouseId]);
    }
  });

  pairs.forEach(([a, b]) => {
    const Ay = people[a];
    const Ib = people[b];

    const block = document.createElement("div");

    block.className = "pair";

    block.innerHTML = `
      <div class="node"><img src="${Ay.photoURL}"><br>${Ay.name}</div>
      <div class="line"></div>
      <div class="node"><img src="${Ib.photoURL}"><br>${Ib.name}</div>
    `;

    container.appendChild(block);

    // Cari anak dari pasangan ini
    const children = data.filter(
      c => Number(c.parentIdAyah) === a && Number(c.parentIdIbu) === b
    );

    if (children.length > 0) {
      const kidsBlock = document.createElement("div");
      kidsBlock.className = "children";

      children.forEach(child => {
        kidsBlock.innerHTML += `
          <div class="node">
            <img src="${child.photoURL}">
            <br>${child.name}
          </div>
        `;
      });

      container.appendChild(kidsBlock);
    }
  });
}
