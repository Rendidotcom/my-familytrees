// edit.js (module)
import { API_URL } from "./config.js"; // jika config import sudah di-set di html as well

// SESSION
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
const statusLine = document.getElementById("statusLine");
const msgEl = document.getElementById("msg");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// ambil id di URL
const params = new URLSearchParams(location.search);
const ID = params.get("id");
if (!ID) {
  msgEl.innerText = "ID anggota tidak ditemukan pada URL.";
  msgEl.className = "error";
  throw new Error("Missing id");
}

// helper untuk fetch JSON dengan error handling
async function fetchJson(url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    const j = await r.json();
    return j;
  } catch (e) {
    console.error("fetchJson error:", e, url, opts);
    throw e;
  }
}

// validasi token (cek sesi & role)
async function validateToken() {
  try {
    const j = await fetchJson(`${API_URL}?mode=validate&token=${session.token}`);
    if (j.status !== "success") {
      alert("Sesi berakhir. Silakan login lagi.");
      logout();
      return false;
    }
    // GAS hanya returns role; GAS enforces admin checks on update.
    return true;
  } catch (e) {
    console.error("validateToken err:", e);
    logout();
    return false;
  }
}

// load all members untuk dropdowns (getData)
async function loadMembersForDropdowns() {
  const j = await fetchJson(`${API_URL}?mode=getData`);
  if (j.status !== "success") throw new Error("getData failed");
  const members = j.data || [];
  // fill selects
  const selects = ["parentIdAyah", "parentIdIbu", "spouseId"];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
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
  return members;
}

// load single member detail (use mode=getOne&id=)
async function loadMemberDetailAndPopulate() {
  try {
    msgEl.innerText = "⏳ Memuat data...";
    msgEl.className = "small";

    // load detail by id first (so we can show early error if not found)
    const detail = await fetchJson(`${API_URL}?mode=getOne&id=${encodeURIComponent(ID)}`);
    if (detail.status !== "success") {
      msgEl.innerText = "❌ Gagal memuat data: " + (detail.message || "not found");
      msgEl.className = "error";
      return;
    }
    const d = detail.data;

    // load dropdowns then set selected values
    await loadMembersForDropdowns();

    // isi form
    document.getElementById("name").value = d.name || "";
    document.getElementById("domisili").value = d.domisili || "";
    document.getElementById("relationship").value = d.relationship || "";
    document.getElementById("parentIdAyah").value = d.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = d.parentIdIbu || "";
    document.getElementById("spouseId").value = d.spouseId || "";
    document.getElementById("orderChild").value = d.orderChild || "";
    document.getElementById("status").value = d.status || "";
    document.getElementById("notes").value = d.notes || "";

    msgEl.innerText = ""; // clear
    msgEl.className = "small";
  } catch (err) {
    console.error("loadMemberDetailAndPopulate err:", err);
    msgEl.innerText = "❌ Gagal memuat data!";
    msgEl.className = "error";
  }
}

// convert file to base64 (only data URL, we'll strip header)
function toBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// submit update
document.getElementById("formEdit").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  msgEl.innerText = "⏳ Menyimpan perubahan...";
  msgEl.className = "small";

  try {
    // check token one more time
    const valid = await validateToken();
    if (!valid) return;

    const photoFile = document.getElementById("photo").files[0];
    let base64 = "";
    if (photoFile) {
      const dataUrl = await toBase64(photoFile);
      base64 = dataUrl.split(",")[1] || "";
    }

    const payload = {
      mode: "update",        // sesuai GAS doPost switch -> handleUpdate
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

    const r = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (j.status === "success") {
      msgEl.innerText = "✅ Perubahan berhasil disimpan!";
      msgEl.className = "success";
      setTimeout(() => { location.href = `detail.html?id=${ID}`; }, 800);
    } else {
      msgEl.innerText = "❌ Gagal menyimpan: " + (j.message || "unknown");
      msgEl.className = "error";
    }
  } catch (err) {
    console.error("submit err:", err);
    msgEl.innerText = "❌ Error saat menyimpan: " + (err.message || err);
    msgEl.className = "error";
  }
});

// logout binding
document.getElementById("btnLogout").addEventListener("click", (ev) => {
  ev.preventDefault();
  logout();
});

function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}

// start: validate & load
(async function init() {
  statusLine.innerText = "⏳ Memeriksa sesi...";
  try {
    const ok = await validateToken();
    if (!ok) return;
    statusLine.innerText = "";
    await loadMemberDetailAndPopulate();
  } catch (e) {
    console.error("init err:", e);
    statusLine.innerText = "Gagal memuat halaman.";
  }
})();
