// dashboard.js (module)
import { API_URL } from "./config.js";
import { getSession, saveSession, validateToken, createNavbar, doLogout } from "./session.js";

// create navbar
createNavbar("dashboard");

// elements
const statusEl = document.getElementById("statusMsg");
const listEl = document.getElementById("list");

// bootstrap
(async function init(){
  statusEl.textContent = "Loading data...";
  const sessionRaw = localStorage.getItem("familyUser");
  if(!sessionRaw){
    statusEl.textContent = "Session not found. Redirecting to login...";
    setTimeout(()=> location.href = "login.html", 900);
    return;
  }

  let session;
  try { session = JSON.parse(sessionRaw); }
  catch(e){ session = null; }

  if(!session || !session.token){
    statusEl.textContent = "Session expired. Redirecting to login...";
    setTimeout(()=> location.href = "login.html", 900);
    return;
  }

  // validate token with GAS
  const v = await validateToken(session.token);
  if(!v.valid){
    statusEl.textContent = "Session expired. Please login again.";
    // remove bad session
    localStorage.removeItem("familyUser");
    setTimeout(()=> location.href = "login.html", 1200);
    return;
  }

  // update navbar user info
  const navNameEl = document.getElementById("nav_userInfo");
  if(navNameEl) navNameEl.textContent = `${v.data.name || session.name} (${v.data.role || session.role || "user"})`;

  // fetch data
  await loadData(session.token);
})();

async function loadData(token){
  statusEl.textContent = "Loading data...";
  try{
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`);
    if(!res.ok) throw new Error("Fetch failed");
    const j = await res.json();
    if(!j || j.status !== "success" || !Array.isArray(j.data)){
      statusEl.textContent = "Tidak ada data.";
      listEl.innerHTML = "";
      return;
    }
    renderList(j.data);
    statusEl.textContent = "";
  }catch(err){
    console.error("loadData error", err);
    statusEl.textContent = "Gagal memuat data. Periksa koneksi atau token.";
    listEl.innerHTML = `<div class="center muted">Gagal memuat data.</div>`;
  }
}

function renderList(data){
  listEl.innerHTML = "";
  if(!data.length){
    listEl.innerHTML = `<div class="center muted">Belum ada anggota.</div>`;
    return;
  }

  const session = (() => {
    try { return JSON.parse(localStorage.getItem("familyUser")||"null"); } catch { return null; }
  })();

  data.forEach(p=>{
    const photo = p.photoURL ? p.photoURL : "https://via.placeholder.com/60?text=👤";
    const div = document.createElement("div");
    div.className = "member-card";

    div.innerHTML = `
      <img src="${photo}" alt="${escapeHtml(p.name)}">
      <div>
        <div><b>${escapeHtml(p.name)}</b></div>
        <div class="muted">${escapeHtml(p.relationship || "")}</div>
      </div>
      <div class="member-actions">
        <button class="btn btn-edit" data-id="${p.id}">✏️ Edit</button>
        <button class="btn btn-del" data-id="${p.id}">🗑 Hapus</button>
        <button class="btn" data-id="${p.id}" data-view>👁 Detail</button>
      </div>
    `;

    listEl.appendChild(div);
  });

  // wire actions
  listEl.querySelectorAll("[data-view]").forEach(b => {
    b.addEventListener("click", (e)=>{
      const id = e.currentTarget.dataset.id;
      location.href = `detail.html?id=${id}`;
    });
  });

  listEl.querySelectorAll(".btn-edit").forEach(b => {
    b.addEventListener("click", (e)=>{
      const id = e.currentTarget.dataset.id;
      location.href = `edit.html?id=${id}`;
    });
  });

  listEl.querySelectorAll(".btn-del").forEach(b => {
    b.addEventListener("click", async (e)=>{
      const id = e.currentTarget.dataset.id;
      if(!confirm("Yakin ingin menghapus data ini?")) return;
      try{
        const sess = JSON.parse(localStorage.getItem("familyUser")||"null");
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ mode: "delete", id, token: sess.token })
        });
        const j = await res.json();
        if(j.status === "success"){
          alert("Berhasil dihapus");
          loadData(sess.token);
        } else {
          alert("Gagal: " + (j.message || "unknown"));
        }
      }catch(err){
        console.error("delete error", err);
        alert("Kesalahan koneksi saat menghapus");
      }
    });
  });
}

function escapeHtml(s){
  if(!s) return "";
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}
