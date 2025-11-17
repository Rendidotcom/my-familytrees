const GAS_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

async function loadTree() {
  const callbackName = "jsonpCallback_" + Date.now();
  window[callbackName] = function(result){
    if(result.status==="success"){
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

function renderTree(data){
  const nodes = [];
  const edges = [];

  data.forEach((m,i)=>{
    nodes.push({id:i+1, label:m.name, shape:'circularImage', image:m.photoURL || 'https://via.placeholder.com/80'});
  });

  data.forEach((m,i)=>{
    const from = i+1;

    // Anak -> Ayah/Ibu
    if(m.relationship.toLowerCase() === "anak"){
      data.forEach((p,j)=>{
        if(p.relationship.toLowerCase() === "ayah" || p.relationship.toLowerCase() === "ibu"){
          edges.push({from: j+1, to: from});
        }
      });
    }

    // Pasangan menikah
    if(m.spouse){
      const spouseIndex = data.findIndex(d=>d.name===m.spouse);
      if(spouseIndex!==-1){
        edges.push({from: from, to: spouseIndex+1, dashes:true, color:{color:'#FF5733'}});
      }
    }
  });

  const container = document.getElementById('treeContainer');
  const network = new vis.Network(container, {nodes:nodes, edges:edges}, {
    layout: { hierarchical: { direction: 'UD', sortMethod: 'hubsize' } },
    nodes: { shape: 'circularImage', size:50 },
    edges: { arrows: 'to' },
    physics: false
  });
}

loadTree();
