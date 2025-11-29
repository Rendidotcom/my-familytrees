// edit.js (module)
import { API_URL } from "./config.js";

// ====== Helpers & session ======
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
const statusLine = document.getElementById("statusLine");
const msgEl = document.getElementById("msg");
const btnSave = document.getElementById("btnSave");

// quick guard
if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
  throw new Error("not logged in");
}

// ambil id dari URL
const params = new URLSearchParams(window.location.search);
const ID = params.get("id");
if (!ID) {
  msgEl.innerText = "ID anggota tidak ditemukan pada URL.";
  msgEl.classList.add("error");
  btnSave.style.display = "none";
  throw new Error("missing id");
}

// small wrapper untuk fetch JSON
async function fetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    // handle non-JSON responses
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      // try to parse JSON error
      if (ct.indexOf("application/json") !== -1) {
        const j = await res.json().catch(()=>null);
        throw new Error((j && j.message) ? j.message : `HTTP ${res.status}`);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    }
    if (ct.indexOf("application/json") !== -1) {
      return await res.json();
    } else {
      // try to parse anyway
      const txt = await res.text();
      return JSON.parse(txt || "{}");
    }
  } catch (err) {
    console.error("fetchJson error:", err, url, opts);
    throw err;
  }
}

// token validation + get role/id
async function validateTokenAndRole() {
  try {
    const j = await fetchJson(`${API_URL}?mode=validate&token=${encodeURIComponent(session.token)}`);
    if (j.status !== "success") {
      return { ok: false, reason: j.message || "invalid" };
    }
    // returns id, name, role from GAS validate
    return { ok: true, id: j.id, role: j.role, name: j.name };
  } catch (e) {
    return { ok: false, reason: e.message || String(e) };
  }
}

// load members for dropdowns
async function loadMembersForDropdowns() {
  const res = await fetchJson(`${API_URL}?mode=getData`);
  if (res.status !== "success") throw new Error("getData failed");
  const members = res.data || [];
  const selects = ["parentIdAyah", "parentIdIbu", "spouseId"];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // clear then add default
    el.innerHTML = `<option value="">-- Pilih --</option>`;
  });
  members.forEach(m => {
    selects.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      el.appendChild(opt);
    });
  });
}

// load single detail
async function loadMemberDetail() {
  try {
    msgEl.innerText = "⏳ Memuat data...";
    msgEl.className = "small";
    const detail = await fetchJson(`${API_URL}?mode=getOne&id=${encodeURIComponent(ID)}`);
    if (detail.status !== "success") {
      msgEl.innerText = "❌ Gagal memuat data: " + (detail.message || "not found");
      msgEl.classList.add("error");
      return null;
    }
    const d = detail.data || {};
    // populate dropdowns then set selected
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

    msgEl.innerText = "";
    return d;
  } catch (err) {
    console.error("loadMemberDetail err:", err);
    msgEl.innerText = "❌ Gagal memuat data: " + (err.message || err);
    msgEl.classList.add("error");
    return null;
  }
}

// convert file to dataURL
function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// make form read-only (for unauthorized users)
function setReadOnlyMode() {
  const form = document.getElementById("formEdit");
  Array.from(form.elements).forEach(el => {
    el.disabled = true;
  });
  btnSave.style.display = "none";
  statusLine.innerText = "🔒 Anda tidak berwenang mengedit data ini.";
  statusLine.classList.add("error");
}

// submit handler
document.getElementById("formEdit").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  msgEl.className = "small";
  msgEl.innerText = "⏳ Menyimpan perubahan...";

  try {
    // validate token
    const v = await validateTokenAndRole();
    if (!v.ok) {
      msgEl.innerText = "🔐 Sesi tidak valid: " + (v.reason || "unauthorized");
      msgEl.classList.add("error");
      return;
    }

    // prepare photo if any
    const photoFile = document.getElementById("photo").files[0];
    let base64 = "";
    let type = "";
    if (photoFile) {
      const dataUrl = await toDataUrl(photoFile);
      base64 = (dataUrl || "").split(",")[1] || "";
      type = photoFile.type || "image/jpeg";
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
      photo_type: type
    };

    const opts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    };

    const res = await fetchJson(API_URL, opts);
    if (res.status === "success") {
      msgEl.className = "success";
      msgEl.innerText = "✅ Perubahan berhasil disimpan!";
      // redirect to detail
      setTimeout(()=> window.location.href = `detail.html?id=${ID}`, 800);
    } else {
      msgEl.classList.add("error");
      msgEl.innerText = "❌ Gagal menyimpan: " + (res.message || "unknown");
    }
  } catch (err) {
    console.error("submit err:", err);
    msgEl.classList.add("error");
    // network issues usually produce Failed to fetch
    msgEl.innerText = "❌ Error saat menyimpan: " + (err.message || err);
    // helpful hint
    if ((err.message||"").toLowerCase().includes("failed to fetch")) {
      msgEl.innerText += " — Periksa API_URL dan deployment Web App GAS (CORS / publikasi).";
    }
  }
});

// logout
document.getElementById("btnLogout").addEventListener("click", (ev) => {
  ev.preventDefault();
  logout();
});
function logout() {
  fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(session.token)}`)
    .finally(()=> {
      localStorage.removeItem("familyUser");
      window.location.href = "login.html";
    });
}

// init
(async function init() {
  statusLine.innerText = "⏳ Memeriksa sesi...";
  try {
    const v = await validateTokenAndRole();
    if (!v.ok) {
      statusLine.innerText = "Sesi tidak valid: " + (v.reason || "");
      setReadOnlyMode();
      return;
    }
    // store validated props to session object locally (so we can compare id)
    session.role = v.role;
    session.id = v.id;
    session.name = v.name;

    // if user and not his own id => read-only
    if (session.role !== "admin" && String(session.id) !== String(ID)) {
      await loadMemberDetail(); // still show details
      setReadOnlyMode();
      return;
    }

    // admin or owner: load details and enable editing
    await loadMemberDetail();
    statusLine.innerText = "";
  } catch (err) {
    console.error("init err:", err);
    statusLine.innerText = "Gagal memuat halaman: " + (err.message || "");
    msgEl.classList.add("error");
    msgEl.innerText = "❌ Gagal memuat data";
  }
})();
