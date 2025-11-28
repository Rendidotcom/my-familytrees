// dashboard.js — FINAL (sinkron dengan GAS Sheet1)
import { API_URL } from "./config.js";
import { getSession, clearSession, validateToken, createNavbar } from "./session.js";

createNavbar("dashboard");

const listEl = document.getElementById("list");
const statusEl = document.getElementById("statusMsg");

if (!listEl) throw new Error("#list element required");

async function protectAndGetSession() {
  const s = getSession();
  if (!s || !s.token) {
    statusEl && (statusEl.textContent = "Sesi tidak ditemukan, arahkan ke login...");
    setTimeout(()=> location.href = "login.html", 800);
    return null;
  }
  const v = await validateToken(s.token);
  if (!v.valid) {
    // clear and redirect
    clearSession();
    statusEl && (statusEl.textContent = "Sesi habis, mengarahkan ke login...");
    setTimeout(()=> location.href = "login.html", 900);
    return null;
  }
  // show name (and role)
  const ui = document.getElementById("userInfo");
  if (ui) ui.textContent = `${v.data.name || s.name || "User"} (${v.data.role || s.role || "user"})`;
  return s;
}

async function fetchMembers() {
  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    if (!j || j.status !== "success" || !Array.isArray(j.data)) throw new Error(j && j.message ? j.message : "invalid response");
    return j.data;
  } catch (err) {
    console.error("fetchMembers error", err);
    throw err;
  }
}

function driveViewUrl(url) {
  if (!url) return "";
  const m = url.match(/[-\w]{25,}/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[0]}` : url;
}

function render(members) {
  listEl.innerHTML = "";
  if (!members || members.length === 0) {
    listEl.innerHTML = `<div class="center muted">Belum ada anggota keluarga.</div>`;
    return;
  }
  members.forEach(p => {
    const wrapper = document.createElement("div");
    wrapper.className = "member-card";

    const img = document.createElement("img");
    img.src = p.photoURL ? driveViewUrl(p.photoURL) : "https://via.placeholder.com/60?text=No+Img";
    img.alt = p.name || "member";

    const info = document.createElement("div");
    info.innerHTML = `<div><strong>${p.name || "-"}</strong></div><div class="muted">${p.relationship || ""}</div>`;

    const actions = document.createElement("div");
    actions.className = "member-actions";

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-edit";
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", ()=> location.href = `edit.html?id=${encodeURIComponent(p.id)}`);

    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-del";
    btnDel.textContent = "Hapus";
    btnDel.addEventListener("click", ()=> {
      if (confirm(`Hapus ${p.name}?`)) location.href = `delete.html?id=${encodeURIComponent(p.id)}`;
    });

    const btnDetail = document.createElement("button");
    btnDetail.className = "btn";
    btnDetail.textContent = "Detail";
    btnDetail.addEventListener("click", ()=> location.href = `detail.html?id=${encodeURIComponent(p.id)}`);

    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    actions.appendChild(btnDetail);

    wrapper.appendChild(img);
    wrapper.appendChild(info);
    wrapper.appendChild(actions);

    listEl.appendChild(wrapper);
  });
}

(async function init() {
  statusEl && (statusEl.textContent = "Memeriksa sesi...");
  const session = await protectAndGetSession();
  if (!session) return;

  statusEl && (statusEl.textContent = "Memuat anggota...");
  try {
    const members = await fetchMembers();
    render(members);
    statusEl && (statusEl.textContent = `Total anggota: ${members.length}`);
  } catch (err) {
    statusEl && (statusEl.textContent = "Gagal memuat data. Periksa koneksi atau API.");
    listEl.innerHTML = `<div class="center muted">Tidak dapat memuat data sekarang.</div>`;
  }
})();
