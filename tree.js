/* tree.js — compatible with GAS mode=getData (Sheet1)
   - Builds nested family tree from flat list
   - POV explorer (click node to change POV)
   - Filters: all / alive / deleted
   - Spouse shown; in-laws hidden until requested
*/

(function(){
  // -----------------------
  // 1) session + API_URL check
  // -----------------------
  let session = null;
  try { session = JSON.parse(localStorage.getItem("familyUser") || "null"); } catch(e){ session = null; }
  if(!session || !session.token){
    // not logged in -> go to login
    location.href = "login.html";
    return;
  }

  if(!window.API_URL){
    console.error("API_URL missing — ensure config.js sets window.API_URL (non-module).");
    alert("API error: API_URL tidak ditemukan. Periksa config.js.");
    return;
  }
  const API = window.API_URL;

  // -----------------------
  // 2) state containers
  // -----------------------
  let flat = [];      // raw members array from GAS
  let mapById = {};   // id -> member
  let currentPOV = session.id;   // id string
  let expanded = new Set();      // expanded parents
  const rootContainerId = "treeContainer"; // expected element id in HTML

  // -----------------------
  // 3) helpers
  // -----------------------
  const safePhoto = (url) => {
    if(!url) return "https://via.placeholder.com/60?text=👤";
    const m = String(url).match(/[-\w]{25,}/);
    return m ? `https://drive.google.com/uc?export=view&id=${m[0]}` : url;
  };

  const isDeleted = (m) => String((m && m.status) || "").toLowerCase() === "deleted";
  const toId = (v) => v == null ? "" : String(v);
  const orderNum = (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  function q(id){ return document.getElementById(id); }

  // -----------------------
  // 4) Fetch and prepare data
  // -----------------------
  async function loadData(){
    const wrap = q(rootContainerId);
    if(!wrap) { console.error("Container element not found:", rootContainerId); return; }
    wrap.innerHTML = "<div style='padding:18px'>⏳ Memuat data...</div>";

    try {
      const res = await fetch(`${API}?mode=getData&nocache=${Date.now()}`);
      const j = await res.json();
      if(!j || j.status !== "success"){
        wrap.innerHTML = `<div style="color:red;padding:18px">❌ Gagal memuat data: ${j?.message || "unknown"}</div>`;
        console.error("getData failed:", j);
        return;
      }

      flat = (j.data || []).map(m => ({
        // normalize keys to expected names (tolerant)
        timestamp: m.timestamp,
        name: m.name,
        domisili: m.domisili,
        relationship: m.relationship,
        photoURL: m.photoURL,
        notes: m.notes,
        parentIdAyah: m.parentIdAyah || m.parentidayah || m.parent_ayah || "",
        parentIdIbu: m.parentIdIbu || m.parentidibu || m.parent_ibu || "",
        spouseId: m.spouseId || m.spouseid || m.spouse || "",
        id: m.id || m.ID || m.Id || "",
        orderChild: m.orderChild || m.orderchild || m.order || "",
        status: m.status || "",
        role: m.role || m.Role || "user"
      }));

      // build map
      mapById = {};
      flat.forEach(x => { mapById[toId(x.id)] = x; });

      // init currentPOV: if session id missing in data -> fallback to first root
      if(!mapById[toId(currentPOV)]){
        const first = flat[0];
        if(first) currentPOV = toId(first.id);
      }

      // populate pov select if exists
      populatePOV();

      // finally render
      render("all");
    } catch (err){
      wrap.innerHTML = `<div style="color:red;padding:18px">❌ Error koneksi: ${err.message || err}</div>`;
      console.error(err);
    }
  }

  // -----------------------
  // 5) Build nested structure on the fly
  //    - We'll build children arrays for convenience
  // -----------------------
  function attachChildren(){
    // clear
    flat.forEach(m => { m.children = []; });
    flat.forEach(m => {
      const pa = toId(m.parentIdAyah);
      const pi = toId(m.parentIdIbu);
      if(pa && mapById[pa]) mapById[pa].children.push(m);
      if(pi && mapById[pi] && pa !== pi) mapById[pi].children.push(m);
    });
    // sort children by orderChild
    flat.forEach(m => {
      if(m.children && m.children.length) {
        m.children.sort((a,b) => orderNum(a.orderChild) - orderNum(b.orderChild));
      }
    });
  }

  // -----------------------
  // 6) Render functions
  // -----------------------
  function clearContainer(){
    const wrap = q(rootContainerId);
    if(wrap) wrap.innerHTML = "";
  }

  function render(filter = "all"){
    const wrap = q(rootContainerId);
    if(!wrap) return console.error("No container", rootContainerId);
    clearContainer();
    attachChildren();

    const pov = mapById[toId(currentPOV)];
    if(!pov){
      wrap.innerHTML = "<div style='padding:18px'>❌ POV tidak ditemukan.</div>";
      return;
    }

    const rootBox = buildUnit(pov, filter);
    const outer = document.createElement("div");
    outer.style.display = "flex";
    outer.style.justifyContent = "center";
    outer.style.flexWrap = "wrap";
    outer.appendChild(rootBox);
    wrap.appendChild(outer);
  }

  function createNodeElement(member, small=false){
    const n = document.createElement("div");
    n.className = "node";
    if(isDeleted(member)) n.classList.add("deleted");
    n.style.display = "flex";
    n.style.alignItems = "center";
    n.style.gap = "10px";
    n.style.padding = "8px 10px";
    n.style.borderRadius = "10px";
    n.style.border = "1px solid #e6e9ee";
    n.style.background = "#fff";
    n.style.minWidth = "160px";
    n.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = safePhoto(member.photoURL);
    img.style.width = small ? "44px" : "56px";
    img.style.height = small ? "44px" : "56px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";
    img.style.border = "3px solid #eee";
    n.appendChild(img);

    const txt = document.createElement("div");
    txt.style.textAlign = "left";
    txt.innerHTML = `<div style="font-weight:700">${member.name || "—"}</div>
                     <div style="font-size:12px;color:#666">${member.domisili || ""} ${member.relationship ? "• " + member.relationship : ""}</div>`;
    n.appendChild(txt);

    // small actions area
    const actions = document.createElement("div");
    actions.style.marginLeft = "auto";
    actions.style.display = "flex";
    actions.style.flexDirection = "column";
    actions.style.gap = "6px";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "Toggle anak";
    toggleBtn.style.fontSize = "12px";
    toggleBtn.style.padding = "6px";
    toggleBtn.style.borderRadius = "8px";
    toggleBtn.style.border = "1px solid #e2e6ea";
    toggleBtn.style.background = "#f7fafc";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.onclick = (ev) => {
      ev.stopPropagation();
      const id = toId(member.id);
      const childWrap = document.querySelector(`[data-childwrap="${id}"]`);
      if(!childWrap) return;
      if(childWrap.style.display === "flex"){ childWrap.style.display = "none"; expanded.delete(id); }
      else { childWrap.style.display = "flex"; expanded.add(id); }
    };
    actions.appendChild(toggleBtn);

    if(!small && member.spouseId && mapById[toId(member.spouseId)]){
      const inlawsBtn = document.createElement("button");
      inlawsBtn.textContent = "Show in-laws";
      inlawsBtn.style.fontSize = "12px";
      inlawsBtn.style.padding = "6px";
      inlawsBtn.style.borderRadius = "8px";
      inlawsBtn.style.border = "1px solid #e2e6ea";
      inlawsBtn.style.background = "#fff";
      inlawsBtn.style.cursor = "pointer";
      inlawsBtn.onclick = (ev) => {
        ev.stopPropagation();
        const spouse = mapById[toId(member.spouseId)];
        showInlaws(spouse);
      };
      actions.appendChild(inlawsBtn);
    }

    n.appendChild(actions);

    // click => change POV to this member
    n.onclick = () => {
      currentPOV = toId(member.id);
      populatePOV();
      render(currentFilter);
    };

    return n;
  }

  function buildUnit(person, filter){
    const box = document.createElement("div");
    box.className = "generation";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.alignItems = "center";
    box.style.margin = "18px 8px";

    // pair
    const pair = document.createElement("div");
    pair.className = "pair";
    pair.style.display = "flex";
    pair.style.alignItems = "center";
    pair.style.gap = "10px";

    const personNode = createNodeElement(person);
    pair.appendChild(personNode);

    const spouse = mapById[toId(person.spouseId)];
    if(spouse){
      const sep = document.createElement("div");
      sep.style.margin = "0 6px";
      sep.style.fontSize = "18px";
      sep.textContent = "❤";
      pair.appendChild(sep);
      // spouse node smaller
      const spouseNode = createNodeElement(spouse, true);
      pair.appendChild(spouseNode);
    }

    box.appendChild(pair);

    // children
    const kids = (person.children || []).slice();
    if(kids.length){
      const childWrap = document.createElement("div");
      childWrap.className = "children";
      childWrap.style.display = expanded.has(toId(person.id)) ? "flex" : "none";
      childWrap.style.gap = "16px";
      childWrap.style.marginTop = "10px";
      childWrap.style.justifyContent = "center";
      childWrap.setAttribute("data-childwrap", toId(person.id));

      kids.forEach(k => {
        if(filter === "alive" && isDeleted(k)) return;
        if(filter === "deleted" && !isDeleted(k)) return;
        childWrap.appendChild(buildUnit(k, filter));
      });

      box.appendChild(childWrap);
    }

    return box;
  }

  // -----------------------
  // 7) show in-laws overlay
  // -----------------------
  function showInlaws(spouse){
    if(!spouse) return alert("No spouse data");
    const father = mapById[toId(spouse.parentIdAyah)];
    const mother = mapById[toId(spouse.parentIdIbu)];

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.left = "8%";
    overlay.style.right = "8%";
    overlay.style.top = "12%";
    overlay.style.bottom = "12%";
    overlay.style.background = "#fff";
    overlay.style.padding = "18px";
    overlay.style.borderRadius = "10px";
    overlay.style.boxShadow = "0 10px 40px rgba(0,0,0,0.2)";
    overlay.style.overflow = "auto";
    overlay.style.zIndex = 9999;

    const close = document.createElement("button");
    close.textContent = "Close";
    close.style.float = "right";
    close.onclick = () => overlay.remove();
    overlay.appendChild(close);

    const title = document.createElement("h3");
    title.textContent = `In-laws of ${spouse.name || "—"}`;
    overlay.appendChild(title);

    const cont = document.createElement("div");
    cont.style.display = "flex";
    cont.style.gap = "12px";
    cont.style.marginTop = "12px";

    if(father){
      const card = document.createElement("div");
      card.style.padding = "12px";
      card.style.border = "1px solid #eee";
      card.style.borderRadius = "8px";
      card.style.flex = "1";
      card.innerHTML = `<div style="font-weight:700">${father.name}</div><div style="font-size:12px">${father.domisili||""}</div>`;
      card.onclick = () => { currentPOV = toId(father.id); overlay.remove(); render(currentFilter); };
      cont.appendChild(card);
    }
    if(mother){
      const card = document.createElement("div");
      card.style.padding = "12px";
      card.style.border = "1px solid #eee";
      card.style.borderRadius = "8px";
      card.style.flex = "1";
      card.innerHTML = `<div style="font-weight:700">${mother.name}</div><div style="font-size:12px">${mother.domisili||""}</div>`;
      card.onclick = () => { currentPOV = toId(mother.id); overlay.remove(); render(currentFilter); };
      cont.appendChild(card);
    }
    if(!father && !mother){
      cont.innerHTML = "<i>No in-law data available</i>";
    }

    overlay.appendChild(cont);
    document.body.appendChild(overlay);
  }

  // -----------------------
  // 8) POV population UI (if select exists)
  // -----------------------
  function populatePOV(){
    const sel = document.getElementById("povSelect");
    if(!sel) return;
    sel.innerHTML = "";
    const opts = flat.slice().sort((a,b)=> (a.name||"").localeCompare(b.name||""));
    opts.forEach(o=>{
      const op = document.createElement("option");
      op.value = toId(o.id);
      op.textContent = o.name || o.id;
      if(toId(o.id) === toId(currentPOV)) op.selected = true;
      sel.appendChild(op);
    });
  }

  // -----------------------
  // 9) Filter state + controls API
  // -----------------------
  let currentFilter = "all"; // all | alive | deleted
  window.render = (filterArg) => {
    currentFilter = filterArg || currentFilter || "all";
    render(currentFilter);
  };
  window.changePOV = (id) => { currentPOV = toId(id); populatePOV(); render(currentFilter); };

  // attach optional select onchange if present on page
  const sel = document.getElementById("povSelect");
  if(sel) sel.onchange = function(){ changePOV(this.value); };

  // attach quick filter buttons if exist
  const btnAll = document.querySelector("[data-filter='all']");
  if(btnAll) btnAll.onclick = ()=> render("all");
  const btnAlive = document.querySelector("[data-filter='alive']");
  if(btnAlive) btnAlive.onclick = ()=> render("alive");
  const btnDead = document.querySelector("[data-filter='deleted']");
  if(btnDead) btnDead.onclick = ()=> render("deleted");

  // -----------------------
  // expose minimal API for console
  // -----------------------
  window._tree = {
    reload: loadData,
    data: () => flat,
    map: () => mapById,
    setPOV: (id) => { currentPOV = toId(id); render(currentFilter); },
    expandAll: () => { flat.forEach(m => expanded.add(toId(m.id))); render(currentFilter); },
    collapseAll: () => { expanded = new Set(); render(currentFilter); }
  };

  // load
  loadData();
})();
