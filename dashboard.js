// dashboard.js — non-module (load after config.js and session.js)
(function(){
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;
  createNavbar("dashboard");

  const statusMsg = document.getElementById("statusMsg");
  const listEl = document.getElementById("list");

  async function protect(){
    const s = getSession();
    if(!s || !s.token){ statusMsg.textContent = "Sesi tidak ditemukan"; setTimeout(()=> location.href="login.html",700); return null; }
    statusMsg.textContent = "Memvalidasi sesi...";
    const v = await validateToken(s.token);
    if(!v.valid){ clearSession(); statusMsg.textContent = "Sesi kadaluarsa"; setTimeout(()=> location.href="login.html",800); return null; }
    statusMsg.textContent = `Halo, ${v.data.name} (${v.data.role})`;
    const ui = document.getElementById("userInfo"); if(ui) ui.textContent = `${v.data.name} (${v.data.role})`;
    return s;
  }

  async function fetchMembers(){
    statusMsg.textContent = "Memuat anggota...";
    try{
      const res = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`);
      const j = await res.json();
      if(j.status !== "success") throw new Error(j.message||"Invalid");
      return j.data;
    }catch(err){
      console.error("fetchMembers", err);
      statusMsg.textContent = "Gagal memuat data.";
      return [];
    }
  }

  function driveViewUrl(url){
    if(!url) return "https://via.placeholder.com/60";
    const m = url.match(/[-\w]{25,}/);
    return m ? `https://drive.google.com/uc?export=view&id=${m[0]}` : url;
  }

  function render(members){
    listEl.innerHTML = "";
    if(!members || members.length === 0){ listEl.innerHTML = `<div class="center muted">Belum ada anggota.</div>`; return; }
    members.forEach(m=>{
      const wrapper = document.createElement("div");
      wrapper.className = "member-card";
      wrapper.innerHTML = `
        <img src="${driveViewUrl(m.photoURL)}" alt="">
        <div>
          <div><strong>${m.name||"-"}</strong></div>
          <div class="muted">${m.relationship||""}</div>
        </div>
        <div class="member-actions">
          <button class="btn btn-edit" data-id="${m.id}">Edit</button>
          <button class="btn btn-del" data-id="${m.id}">Hapus</button>
          <button class="btn" data-id="${m.id}" data-detail>Detail</button>
        </div>
      `;
      listEl.appendChild(wrapper);
    });
    // event delegation
    listEl.querySelectorAll(".btn-edit").forEach(b=>b.addEventListener("click", e=> location.href=`edit.html?id=${encodeURIComponent(e.currentTarget.dataset.id)}`));
    listEl.querySelectorAll(".btn-del").forEach(b=>b.addEventListener("click", e=> { if(confirm("Hapus?")) location.href=`delete.html?id=${encodeURIComponent(e.currentTarget.dataset.id)}`; }));
    listEl.querySelectorAll("[data-detail]").forEach(b=>b.addEventListener("click", e=> location.href=`detail.html?id=${encodeURIComponent(e.currentTarget.dataset.id)}`));
  }

  (async function init(){
    await protect();
    const members = await fetchMembers();
    render(members);
  })();

})();
