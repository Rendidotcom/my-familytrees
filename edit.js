import { API_URL } from "./config.js";

const statusLine = document.getElementById("statusLine");
const msgEl = document.getElementById("msg");
const btnLogout = document.getElementById("btnLogout");
const session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

const params = new URLSearchParams(location.search);
const ID = params.get("id");
if (!ID) {
  msgEl.innerText = "ID anggota tidak ditemukan pada URL.";
  msgEl.classList.add("error");
  throw new Error("Missing id");
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  return await res.json();
}

async function validateToken() {
  try {
    const j = await fetchJson(`${API_URL}?mode=validate&token=${session.token}`);
    if (j.status !== "success") {
      alert("Sesi berakhir. Silakan login lagi.");
      logout();
      return false;
    }
    return true;
  } catch {
    msgEl.innerText = "Gagal memeriksa sesi. Periksa koneksi atau API_URL.";
    msgEl.classList.add("error");
    return false;
  }
}

async function loadMembersForDropdowns() {
  const j = await fetchJson(`${API_URL}?mode=getData`);
  if (j.status !== "success") throw new Error("getData failed");
  const members = j.data || [];

  const dropdowns = ["parentIdAyah", "parentIdIbu", "spouseId"];
  dropdowns.forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<option value="">-- Pilih --</option>`;
  });

  members.forEach(m => {
    dropdowns.forEach(id => {
      const el = document.getElementById(id);
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      el.appendChild(opt);
    });
  });

  return members;
}

async function loadMemberDetailAndPopulate() {
  try {
    statusLine.innerText = "⏳ Memuat data...";
    const detail = await fetchJson(`${API_URL}?mode=getOne&id=${encodeURIComponent(ID)}`);

    if (detail.status !== "success") {
      msgEl.innerText = "❌ Gagal memuat data: " + (detail.message || "not found");
      msgEl.classList.add("error");
      statusLine.innerText = "";
      return;
    }

    const d = detail.data || {};
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
    msgEl.innerText = "❌ Gagal memuat data! Periksa API_URL dan deployment Web App GAS.";
    msgEl.classList.add("error");
    statusLine.innerText = "";
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

document.getElementById("formEdit").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  msgEl.innerText = "⏳ Menyimpan perubahan...";
  msgEl.className = "small";

  const ok = await validateToken();
  if (!ok) return;

  try {
    const file = document.getElementById("photo").files[0];
    const base64 = file ? (await toBase64(file)).split(",")[1] : "";

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
      photo_type: file ? file.type : ""
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();

    if (j.status === "success") {
      msgEl.innerText = "✅ Perubahan berhasil disimpan!";
      msgEl.classList.add("success");
      setTimeout(() => location.href = `detail.html?id=${ID}`, 700);
    } else {
      msgEl.innerText = "❌ Gagal menyimpan: " + (j.message || "unknown");
      msgEl.classList.add("error");
    }
  } catch (err) {
    msgEl.innerText =
      "❌ Error saat menyimpan: " +
      err.message +
      " — Periksa API_URL & Web App GAS.";
    msgEl.classList.add("error");
  }
});

btnLogout.addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}

(async function init() {
  statusLine.innerText = "⏳ Memeriksa sesi...";
  const ok = await validateToken();
  if (!ok) return;
  statusLine.innerText = "";
  await loadMemberDetailAndPopulate();
})();
