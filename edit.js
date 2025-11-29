// edit.js (module)
import { API_URL } from "./config.js"; // must exist and export API_URL

// Elements
const statusLine = document.getElementById("statusLine");
const msgEl = document.getElementById("msg");
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
const btnLogout = document.getElementById("btnLogout");

// Basic session check
if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// read id from URL
const params = new URLSearchParams(location.search);
const ID = params.get("id");
if (!ID) {
  msgEl.innerText = "ID anggota tidak ditemukan pada URL.";
  msgEl.classList.add("error");
  throw new Error("Missing id");
}

// small helper to fetch + json
async function fetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    return await res.json();
  } catch (err) {
    // rethrow so caller can display guidance
    throw err;
  }
}

// validate token (client-side check). Server (GAS) still enforces role rules.
async function validateToken() {
  try {
    const j = await fetchJson(`${(window.API_URL || API_URL)}?mode=validate&token=${session.token}`);
    if (j.status !== "success") {
      alert("Sesi berakhir. Silakan login lagi.");
      logout();
      return false;
    }
    // if user is not admin, they may still edit their own record (server enforces)
    return true;
  } catch (err) {
    console.error("validateToken error:", err);
    msgEl.innerText = "Gagal memeriksa sesi. Periksa koneksi atau API_URL.";
    msgEl.classList.add("error");
    return false;
  }
}

// load all members for dropdowns
async function loadMembersForDropdowns() {
  const api = (window.API_URL || API_URL);
  const j = await fetchJson(`${api}?mode=getData`);
  if (j.status !== "success") throw new Error("getData failed");
  const members = j.data || [];
  const selects = ["parentIdAyah","parentIdIbu","spouseId"];
  selects.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.innerHTML = `<option value="">-- Pilih --</option>`;
  });
  members.forEach(m=>{
    selects.forEach(id=>{
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

// load single member and populate
async function loadMemberDetailAndPopulate() {
  const api = (window.API_URL || API_URL);
  try {
    statusLine.innerText = "⏳ Memuat data...";
    const detail = await fetchJson(`${api}?mode=getOne&id=${encodeURIComponent(ID)}`);
    if (detail.status !== "success") {
      msgEl.innerText = "❌ Gagal memuat data: " + (detail.message || "not found");
      msgEl.classList.add("error");
      statusLine.innerText = "";
      return;
    }
    const d = detail.data || {};

    // load dropdowns, then set selected
    await loadMembersForDropdowns();

    document.getElementById("name").value = d.name || "";
    document.getElementById("domisili").value = d.domisili || "";
    document.getElementById("relationship").value = d.relationship || "";
    document.getElementById("parentIdAyah").value = d.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = d.parentIdIbu || "";
    document.getElementById("spouseId").value = d.spouseId || "";
    document.getElementById("orderChild").value = d.orderChild || "";
    document.getElementById("status").value = d.status || "";
    document.getElementById("notes").value = d.notes || "";

    statusLine.innerText = "";
    msgEl.innerText = "";
  } catch (err) {
    console.error("loadMemberDetailAndPopulate err:", err);
    msgEl.innerText = "❌ Gagal memuat data! Periksa API_URL dan deployment Web App GAS.";
    msgEl.classList.add("error");
    statusLine.innerText = "";
  }
}

// helper: file -> dataURL
function toBase64(file) {
  return new Promise((resolve,reject)=>{
    if(!file) return resolve("");
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// submit update handling
document.getElementById("formEdit").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  msgEl.className = "small";
  msgEl.innerText = "⏳ Menyimpan perubahan...";

  // re-validate token
  const ok = await validateToken();
  if(!ok) return;

  try {
    const photoFile = document.getElementById("photo").files[0];
    let base64 = "";
    if (photoFile) {
      const dataUrl = await toBase64(photoFile);
      base64 = (dataUrl || "").split(",")[1] || "";
    }

    const payload = {
      mode: "update",            // IMPORTANT: match GAS (doPost switch)
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
      photo_type: photoFile ? photoFile.type : ""
    };

    // POST JSON
    const api = (window.API_URL || API_URL);
    const res = await fetch(api, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // network-level errors produce throw earlier; check http response
    const j = await res.json();

    if (j.status === "success") {
      msgEl.innerText = "✅ Perubahan berhasil disimpan!";
      msgEl.classList.remove("error");
      msgEl.classList.add("success");
      setTimeout(()=> location.href = `detail.html?id=${ID}`, 700);
    } else {
      msgEl.innerText = "❌ Gagal menyimpan: " + (j.message || "unknown");
      msgEl.classList.add("error");
    }
  } catch (err) {
    console.error("submit err:", err);
    // Give actionable advice if it's a network / CORS issue:
    const advice = (err && err.message && err.message.includes("Failed to fetch"))
      ? " — Periksa API_URL dan deployment Web App GAS (harus dipublikasikan & permission 'Anyone, even anonymous' jika akses publik)."
      : "";
    msgEl.innerText = "❌ Error saat menyimpan: " + (err.message || err) + advice;
    msgEl.classList.add("error");
  }
});

// logout binding
btnLogout.addEventListener("click", (ev) => {
  ev.preventDefault();
  logout();
});

function logout() {
  try {
    fetch(`${(window.API_URL || API_URL)}?mode=logout&token=${session.token}`)
      .finally(()=>{
        localStorage.removeItem("familyUser");
        location.href = "login.html";
      });
  } catch(e) {
    localStorage.removeItem("familyUser");
    location.href = "login.html";
  }
}

// init
(async function init() {
  statusLine.innerText = "⏳ Memeriksa sesi...";
  const ok = await validateToken();
  if (!ok) return;
  statusLine.innerText = "";
  await loadMemberDetailAndPopulate();
})();
