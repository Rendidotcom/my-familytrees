// session.js (clean, sinkron dengan GAS)
import { API_URL } from "./config.js";

/* -------------------------
   localStorage helpers
------------------------- */
const STORAGE_KEY = "familyUser";

export function saveSession(data){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch(e){ console.error("saveSession error", e); }
}

export function getSession(){
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if(!s) return null;
    return JSON.parse(s);
  } catch(e){
    console.error("getSession parse err", e);
    return null;
  }
}

export function clearSession(){
  try { localStorage.removeItem(STORAGE_KEY); } catch(e){/*ignore*/ }
}

/* -------------------------
   Logout
------------------------- */
export function doLogout(){
  const s = getSession();
  if(s && s.token){
    // try notify server (non-blocking)
    fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(s.token)}`).catch(()=>{});
  }
  clearSession();
  window.location.href = "login.html";
}

/* -------------------------
   Validate token (GAS)
   GAS validate returns: { status:"success", id, name, role } on valid
------------------------- */
export async function validateToken(token){
  if(!token) return { valid:false };
  try{
    const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(token)}&nocache=${Date.now()}`);
    if(!res.ok) return { valid:false };
    const j = await res.json();
    if(j && j.status === "success"){
      // standardize return
      return { valid:true, data: { id: j.id, name: j.name, role: j.role } };
    }
    return { valid:false, error: j && j.message ? j.message : "invalid" };
  }catch(err){
    console.error("validateToken fetch error:", err);
    return { valid:false, error: String(err) };
  }
}

/* -------------------------
   Navbar helper
------------------------- */
export function createNavbar(active=""){
  // remove existing if any
  const existing = document.getElementById("__site_navbar");
  if(existing) existing.remove();

  const nav = document.createElement("div");
  nav.id = "__site_navbar";
  nav.style.width = "100%";
  nav.style.background = "#1976d2";
  nav.style.color = "#fff";
  nav.style.boxSizing = "border-box";
  nav.style.padding = "10px 18px";
  nav.style.display = "flex";
  nav.style.justifyContent = "space-between";
  nav.style.alignItems = "center";
  nav.style.gap = "12px";
  nav.innerHTML = `
    <div style="display:flex;gap:14px;align-items:center">
      <a href="dashboard.html" style="color:white;text-decoration:none;font-weight:600">📋 Dashboard</a>
      <a href="tree.html" style="color:white;text-decoration:none;font-weight:600">🌳 Tree</a>
    </div>
    <div style="display:flex;gap:12px;align-items:center">
      <span id="nav_userInfo" style="opacity:0.95"></span>
      <button id="nav_logout" style="background:#ff7043;border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer">🚪 Logout</button>
    </div>
  `;
  document.body.prepend(nav);

  document.getElementById("nav_logout").addEventListener("click", doLogout);
}
