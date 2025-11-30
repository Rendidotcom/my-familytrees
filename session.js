// session.js — non-module (load AFTER config.js)
(function(){
  const API_URL = window.API_URL;
  const KEY = "familyUser";

  function saveSession(obj){
    try{ localStorage.setItem(KEY, JSON.stringify(obj)); } catch(e){ console.error(e); }
  }
  function getSession(){
    try{ const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch(e){ console.error(e); return null; }
  }
  function clearSession(){
    try{ localStorage.removeItem(KEY); } catch(e){ console.error(e); }
  }
  async function validateToken(token){
    if(!token) return { valid:false, reason:"no token" };
    try{
      const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if(!res.ok) return { valid:false, reason:"network" };
      const j = await res.json();
      if(j && j.status === "success"){
        return { valid:true, data:{ id: j.id || null, name: j.name || null, role: j.role || "user" } };
      }
      return { valid:false, reason: j && j.message ? j.message : "invalid" };
    }catch(err){
      console.error("validateToken error", err);
      return { valid:false, reason:"error" };
    }
  }
  function doLogout(){
    try{
      const s = getSession();
      if(s && s.token){
        fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(s.token)}`).catch(()=>{});
      }
    }catch(e){}
    clearSession();
    window.location.href = "login.html";
  }
  function createNavbar(active){
    if(document.getElementById("__app_nav")) return;
    const nav = document.createElement("div");
    nav.id="__app_nav";
    nav.style.cssText = "width:100%;background:#1976d2;color:#fff;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;";
    nav.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <a href="dashboard.html" style="color:white;text-decoration:none">📋 Dashboard</a>
        <a href="tree.html" style="color:white;text-decoration:none">🌳 Tree</a>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <span id="userInfo" style="font-weight:600"></span>
        <button id="logoutBtn" style="background:#ff7043;border:0;padding:6px 10px;border-radius:6px;color:white;cursor:pointer">🚪 Logout</button>
      </div>
    `;
    document.body.prepend(nav);
    document.getElementById("logoutBtn").addEventListener("click", doLogout);
    try{ if(active === "dashboard") nav.querySelector('a[href="dashboard.html"]').style.textDecoration="underline"; }catch(e){}
  }

  // export to window
  window.saveSession = saveSession;
  window.getSession = getSession;
  window.clearSession = clearSession;
  window.validateToken = validateToken;
  window.doLogout = doLogout;
  window.createNavbar = createNavbar;

  console.log("📡 session.js loaded (non-module)");
})();
