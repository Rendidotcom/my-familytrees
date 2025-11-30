// edit.js — non-module (start after config.js + session.js loaded)
(function(){
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;
  createNavbar();

  const msg = document.getElementById("msg");
  const editForm = document.getElementById("editForm");
  const idEl = document.getElementById("memberId");
  const nameEl = document.getElementById("name");
  const fatherEl = document.getElementById("father");
  const motherEl = document.getElementById("mother");
  const spouseEl = document.getElementById("spouse");
  const birthOrderEl = document.getElementById("birthOrder");
  const statusEl = document.getElementById("status");
  const notesEl = document.getElementById("notes");
  const photoEl = document.getElementById("photo");
  const previewEl = document.getElementById("preview");
  const btnDelete = document.getElementById("btnDelete");

  function getIdFromUrl(){ return new URLSearchParams(location.search).get("id"); }

  async function protect(){
    const s = getSession();
    if(!s || !s.token){ msg.textContent = "Sesi hilang"; setTimeout(()=> location.href="login.html",700); return null; }
    const v = await validateToken(s.token);
    if(!v.valid){ clearSession(); setTimeout(()=> location.href="login.html",700); return null; }
    return s;
  }

  // load members
  async function fetchAllMembers(){
    const res = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`);
    const j = await res.json();
    if(j.status !== "success") throw new Error("Gagal load");
    return j.data;
  }

  function fillSelect(el, members, selfId){
    el.innerHTML = `<option value="">(Tidak ada)</option>`;
    members.forEach(m=>{
      if(m.id !== selfId){
        const op = document.createElement("option"); op.value = m.id; op.textContent = m.name; el.appendChild(op);
      }
    });
  }

  function toBase64(file){
    return new Promise((resolve,reject)=>{
      const r = new FileReader();
      r.onload = ()=> resolve(r.result.split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function loadMember(){
    const id = getIdFromUrl();
    if(!id) { msg.textContent = "ID tidak ada"; return; }
    msg.textContent = "Memuat...";
    const members = await fetchAllMembers();
    const target = members.find(m=>m.id === id);
    if(!target){ msg.textContent = "Tidak ditemukan"; return; }

    idEl.value = target.id;
    nameEl.value = target.name||"";
    birthOrderEl.value = target.orderChild || "";
    statusEl.value = target.status || "hidup";
    notesEl.value = target.notes || "";

    fillSelect(fatherEl, members, id);
    fillSelect(motherEl, members, id);
    fillSelect(spouseEl, members, id);

    fatherEl.value = target.parentIdAyah || "";
    motherEl.value = target.parentIdIbu || "";
    spouseEl.value = target.spouseId || "";

    if(target.photoURL){
      const m = target.photoURL.match(/[-\w]{25,}/);
      if(m){ previewEl.src = `https://drive.google.com/uc?export=view&id=${m[0]}`; previewEl.style.display="block"; }
    }
    msg.textContent = "Siap diedit";
  }

  photoEl.addEventListener("change", ()=>{
    const f = photoEl.files[0];
    if(f){ previewEl.src = URL.createObjectURL(f); previewEl.style.display = "block"; }
  });

  editForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    msg.textContent = "Menyimpan...";
    const s = await protect(); if(!s) return;

    let photo_base64 = "";
    let photo_type = "";
    const file = photoEl.files[0];
    if(file){
      photo_base64 = await toBase64(file);
      photo_type = file.type || "image/jpeg";
    }

    const payload = {
      mode: "update",           // IMPORTANT: matches GAS handleUpdate -> updateMember
      token: s.token,
      id: idEl.value,
      updatedBy: s.name,
      name: nameEl.value,
      domisili: "", // if you have domisili field, add it here
      relationship: "", // add if needed
      parentIdAyah: fatherEl.value,
      parentIdIbu: motherEl.value,
      spouseId: spouseEl.value,
      orderChild: birthOrderEl.value,
      status: statusEl.value,
      notes: notesEl.value,
      photo_base64: photo_base64,
      photo_type: photo_type
    };

    try{
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const j = await res.json();
      if(j.status === "success"){
        msg.textContent = "Berhasil disimpan";
        setTimeout(()=> location.href = "dashboard.html", 700);
      } else {
        msg.textContent = "Gagal: " + (j.message || "unknown");
      }
    }catch(err){
      console.error("save err", err);
      msg.textContent = "Error menyimpan: " + err.message;
    }
  });

  btnDelete.addEventListener("click", async ()=>{
    if(!confirm("Yakin hapus?")) return;
    const s = await protect(); if(!s) return;
    msg.textContent = "Menghapus...";
    try{
      const res = await fetch(`${API_URL}?mode=delete&id=${encodeURIComponent(idEl.value)}&token=${encodeURIComponent(s.token)}`);
      const j = await res.json();
      if(j.status === "success"){ msg.textContent = "Terhapus"; setTimeout(()=> location.href="dashboard.html",800); }
      else msg.textContent = "Gagal hapus: " + (j.message || "");
    }catch(err){ msg.textContent = "Error hapus"; }
  });

  document.getElementById("btnLogout").addEventListener("click", ()=>{
    clearSession(); location.href = "login.html";
  });

  (async function init(){ await protect(); await loadMember(); })();

})();
