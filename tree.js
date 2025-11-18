const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

function loadTree() {
  const callbackName = "treeCallback_" + Date.now();

  window[callbackName] = function(result) {
    renderTree(result);
    delete window[callbackName];
  };

  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + callbackName;
  document.body.appendChild(script);
}


function renderTree(result) {
  const container = document.getElementById("treeContainer");

  if (result.status !== "success") {
    container.innerHTML = "Gagal memuat data.";
    return;
  }

  const data = result.data;

  if (data.length === 0) {
    container.innerHTML = "Belum ada data anggota keluarga.";
    return;
  }

  container.innerHTML = ""; // Kosongkan tampilan

  // ❗ Untuk versi awal: tampilkan semua anggota secara grid
  // (Nanti bisa upgrade: hubungan Ayah–Ibu–Anak → diagram lengkap)
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexWrap = "wrap";
  wrapper.style.justifyContent = "center";
  wrapper.style.gap = "20px";

  data.forEach(person => {
    const node = document.createElement("div");
    node.className = "node";

    node.innerHTML = `
      <img src="${person.photoURL}" />
      <span>${person.name}</span>
      <div style="font-size:12px; color:#666;">${person.relationship}</div>
      <div style="font-size:12px; color:#888;">${person.domisili}</div>
    `;

    wrapper.appendChild(node);
  });

  container.appendChild(wrapper);
}

loadTree();
