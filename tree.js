const GAS_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

function loadTreeData() {
  const callbackName = "jsonpCallback_" + Date.now();
  window[callbackName] = function(result){
    if(result.status==="success"){
      buildTree(result.data);
    } else {
      document.getElementById("treeContainer").innerText = "Gagal memuat data.";
    }
    delete window[callbackName];
  };
  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + callbackName;
  document.body.appendChild(script);
}

function buildTree(data){
  const container = document.getElementById("treeContainer");
  container.innerHTML = "";

  // index data by Sheet index for lookup
  const membersById = {};
  data.forEach(m => { membersById[m.index] = m; });

  // cari root (orang tua yang tidak punya parent)
  const roots = data.filter(m => !m.parentIdAyah && !m.parentIdIbu);

  roots.forEach(root => {
    container.appendChild(renderMember(root, membersById));
  });
}

// render node beserta anak
function renderMember(member, membersById){
  const nodeDiv = document.createElement("div");
  nodeDiv.className = "node";

  const img = document.createElement("img");
  img.src = member.photoURL || "https://via.placeholder.com/60";
  const nameSpan = document.createElement("span");
  nameSpan.innerText = member.name;

  nodeDiv.appendChild(img);
  nodeDiv.appendChild(nameSpan);

  // pasangan
  if(member.spouseId && membersById[member.spouseId]){
    const spouse = membersById[member.spouseId];
    const spouseDiv = document.createElement("div");
    spouseDiv.className = "node";
    const sImg = document.createElement("img");
    sImg.src = spouse.photoURL || "https://via.placeholder.com/60";
    const sName = document.createElement("span");
    sName.innerText = spouse.name;
    spouseDiv.appendChild(sImg);
    spouseDiv.appendChild(sName);

    const spouseContainer = document.createElement("div");
    spouseContainer.style.display="flex";
    spouseContainer.style.alignItems="center";
    spouseContainer.style.gap="10px";
    spouseContainer.appendChild(nodeDiv.cloneNode(true));
    spouseContainer.appendChild(spouseDiv);
    const wrapper = document.createElement("div");
    wrapper.appendChild(spouseContainer);
    nodeDiv.innerHTML=""; // clear
    nodeDiv.appendChild(wrapper);
  }

  // cari anak
  const children = Object.values(membersById).filter(m => m.parentIdAyah==member.index || m.parentIdIbu==member.index);
  if(children.length>0){
    const childrenDiv = document.createElement("div");
    childrenDiv.className="children";
    children.forEach(c => {
      childrenDiv.appendChild(renderMember(c, membersById));
    });
    nodeDiv.appendChild(childrenDiv);
  }

  return nodeDi
