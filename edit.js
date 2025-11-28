// edit.js (module)
import { API_URL } from "./config.js";

// DOM
const statusLine = document.getElementById("statusLine");
const msgEl = document.getElementById("msg");
const form = document.getElementById("formEdit");
const btnLogout = document.getElementById("btnLogout");

// SESSION
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if(!session || !session.token){
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// ambil id di URL
const params = new URLSearchParams(location.search);
const ID = params.get("id");
if(!ID){
  msgEl.textContent = "ID anggota tidak ditemukan pada URL.";
  msgEl.className = "msg error";
  throw new Error("Missing id in URL");
}

// helper fetch -> parse json w/ error
async function fetchJson(url, opts){
  try{
    const r = await fetch(url, opts);
    const j = await r.json();
    return j;
  } catch(e){
    console.error("fetchJson failed:", e, url, opts);
    throw e;
  }
}

// validate session & permission (server authoritative)
async function validateSession(){
  try{
    const j = await fetchJson(`${API_URL}?mode=validate&token=${session.token}`);
    if(j.status !== "success"){
      return { ok:false, message:"token invalid" };
    }
    // j contains id, name, role
    return { ok:true, server: j };
  } catch(e){
    return { ok:false, message: e.message || String(e) };
  }
}

// load dropdown members
async function loadMembersDropdown(){
  const j = await fetchJson(`${API_URL}?mode=getData`);
  if(j.status !== "success") throw new Error("getData failed");
  const members = j.data || [];
  const selects = ["parentIdAyah","parentIdIbu","spouseId"];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.innerHTML = `<option value="">-- Pilih --</option>`;
  });
  members.forEach(m => {
    selects.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      el.appendChild(opt);
    });
  });
  return members;
}

// load single member details
async function loadMember(){
  try{
    statusLine.textContent = "⏳ Memuat data...";
    const j = await fetchJson(`${API_URL}?mode=getOne&id=${encodeURIComponent(ID)}`);
    if(j.status !== "success"){
      msgEl.textContent = "❌ Gagal memuat data: " + (j.message || "not found");
      msgEl.className = "msg error";
      statusLine.textContent = "";
      return;
    }
    const d = j.data;
    // populate form after loading dropdowns
    await loadMembersDropdown();
    document.getElementById("name").value = d.name || "";
    document.getElementById("domisili").value = d.domisili || "";
    document.getElementById("relationship").value = d.relationship || "";
    document.getElementById("parentIdAyah").value = d.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = d.parentIdIbu || "";
    document.getElementById("spouseId").value = d.spouseId || "";
    document.getElementById("orderChild").value = d.orderChild || "";
    document.getElementById("status").value = d.status || "";
    document.getElementById("notes").value = d.notes || "";
    statusLine.textContent = "";
    msgEl.textContent = "";
  } catch(err){
    console.error("loadMember err", err);
    msgEl.textContent = "❌ Gagal memuat data!";
    msgEl.className = "msg error";
    statusLine.textContent = "";
  }
}

// file -> base64 string (dataURL)
function toBase64(file){
  return new Promise((resolve,reject)=>{
    if(!file) return resolve("");
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// submit update
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  msgEl.textContent = "⏳ Menyimpan perubahan...";
  msgEl.className = "msg";

  try{
    // validate token server-side
    const v = await validateSession();
    if(!v.ok){
      msgEl.textContent = "⚠ Sesi tidak valid. Silakan login ulang.";
      msgEl.className = "msg error";
      logout();
      return;
    }

    // enforce permission on client as UX: user can edit only their own ID unless admin
    // server also enforces this.
    const serverInfo = v.server;
    if(serverInfo.role !== "admin" && String(serverInfo.id) !== String(ID)){
      msgEl.textContent = "⛔ Anda tidak berhak mengedit data ini.";
      msgEl.className = "msg error";
      return;
    }

    // handle optional photo
    const photoFile = document.getElementById("photo").files[0];
    let base64 = "";
    let photoType = "";
    if(photoFile){
      const dataUrl = await toBase64(photoFile);
      base64 = dataUrl.split(",")[1] || "";
      photoType = photoFile.type || "";
    }

    const payload = {
      mode: "update",
      token: session.token,
      id: ID,
      name: document.getElementById("name").value.trim(),
      domisili: document.getElementById("domisili").value.trim(),
      relationship: document.getElementById("relationship").value,
      parentIdAyah: document.getElementById("parentIdAyah").value,
      parentIdIbu: document.getElementById("parentIdIbu").value,
      spouseId: document.getElementById("spouseId").value,
      orderChild: document.getElementById("orderChild").value,
      status: document.getElementById("status").value,
      notes: document.getElementById("notes").value.trim(),
      photo_base64: base64,
      photo_type: photoType
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const j = await res.json();
    if(j.status === "success"){
      msgEl.textContent = "✅ Perubahan berhasil disimpan!";
      msgEl.className = "msg success";
      setTimeout(()=> location.href = `detail.html?id=${ID}`, 700);
    } else {
      msgEl.textContent = "❌ Gagal menyimpan: " + (j.message || "unknown");
      msgEl.className = "msg error";
    }

  } catch(err){
    console.error("submit err:", err);
    msgEl.textContent = "❌ Error saat menyimpan: " + (err.message || String(err));
    msgEl.className = "msg error";
  }
});

// logout
btnLogout.addEventListener("click", (ev) => {
  ev.preventDefault();
  logout();
});
function logout(){
  fetch(`${API_URL}?mode=logout&token=${session.token}`).finally(()=>{
    localStorage.removeItem("familyUser");
    location.href = "login.html";
  });
}

// init
(async function init(){
  statusLine.textContent = "⏳ Memeriksa sesi...";
  const v = await validateSession();
  if(!v.ok){
    msgEl.textContent = "Sesi tidak valid. Silakan login ulang.";
    msgEl.className = "msg error";
    logout();
    return;
  }
  // client-side check: if user is not admin and isn't editing own record, disallow
  if(v.server.role !== "admin" && String(v.server.id) !== String(ID)){
    msgEl.textContent = "⛔ Anda hanya boleh melihat data lain. Pengeditan dibatasi.";
    msgEl.className = "msg error";
    // optionally redirect to detail view
    setTimeout(()=> location.href = `detail.html?id=${ID}`, 1200);
    return;
  }

  statusLine.textContent = "";
  await loadMember();
})();
