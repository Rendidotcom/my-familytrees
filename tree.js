const GAS_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

async function loadTree() {
  const callbackName = "jsonpCallback_" + Date.now();

  window[callbackName] = function(result) {
    if(result.status === "success") {
      renderTree(result.data);
    } else {
      alert("Gagal memuat data pohon keluarga.");
    }
    delete window[callbackName];
  };

  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + callbackName;
  document.body.appendChild(script);
}

function renderTree(data) {
  const container = document.getElementById("treeContainer");
  container.innerHTML = "";

  // kelompokkan data berdasar hubungan
  const parents = data.filter(d => d.relationship.toLowerCase() === "ayah" || d.relationship.toLowerCase() === "ibu");
  const children = data.filter(d => d.relationship.toLowerCase() === "anak");

  // render parents
  const parentDiv = document.createElement("div");
  parentDiv.style.display = "flex";

  parents.forEach(p => {
    const node = createNode(p);
    parentDiv.appendChild(node);
  });

  container.appendChild(parentDiv);

  // render line connector
  if(children.length > 0){
    const line = document.createElement("div");
    line.className = "line";
    line.style.height = "20px";
    container.appendChild(line);

    const childDiv = document.createElement("div");
    childDiv.style.display = "flex";
    children.forEach(c => {
      const node = createNode(c);
      childDiv.appendChild(node);
    });
    container.appendChild(childDiv);
  }
}

// helper function create node
function createNode(member) {
  const div = document.createElement("div");
  div.className = "node";
  div.innerHTML = `
    <img src="${member.photoURL || 'https://via.placeholder.com/80'}" alt="Foto">
    <p>${member.name}</p>
  `;
  return div;
}

loadTree();
