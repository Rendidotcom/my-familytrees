import { API_URL } from "./config.js";

// =============================
// SESSION
// =============================
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
const msg = document.getElementById("msg");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

const userRole = session.role;
const userId = session.userId; // pastikan login GAS mengirimkan userId

// Ambil ID dari URL
const params = new URLSearchParams(location.search);
const memberId = params.get("id");
if (!memberId) {
  msg.innerText = "❌ ID tidak ditemukan!";
  throw new Error("Missing ID");
}

// RULE AKSES
// User hanya boleh edit dirinya sendiri
if (userRole !== "admin" && memberId !== userId) {
  alert("⛔ Anda tidak boleh mengedit data orang lain.");
  location.href = `detail.html?id=${memberId}`;
}

// =============================
// VALIDASI TOKEN
// =============================
async function validateToken() {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Sesi habis. Silakan login lagi.");
      logout();
      return false;
    }

    return true;
  } catch (e) {
    console.error(e);
    logout();
    return false;
  }
}

// =============================
// LOAD DROPDOWN
// =============================
async function loadDropdown() {
  const res = await fetch(`${API_URL}?mode=getData`);
  const j = await res.json();
  if (j.status !== "success") return;

  const list = j.data;
  const selects = ["parentIdAyah", "parentIdIbu", "spouseId"];

  selects.forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<option value="">-- Pilih --</option>`;
    list.forEach(m => {
      el.innerHTML += `<option value="${m.id}">${m.name}</option>`;
    });
  });
}

// =============================
// LOAD MEMBER BY ID
// =============================
async function loadMember() {
  msg.innerText = "⏳ Memuat data...";

  const res = await fetch(`${API_URL}?mode=getById&id=${memberId}`);
  const j = await res.json();

  if (j.status !== "success") {
    msg.innerText = "❌ Gagal memuat data.";
    return;
  }

  const d = j.data;

  await loadDropdown();

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

  msg.innerText = "";
}

// =============================
// FILE → BASE64
// =============================
function toBase64(file) {
  return new Promise(resolve => {
    if (!file) return resolve("");
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

// =============================
// SUBMIT UPDATE
// =============================
document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();
  msg.innerText = "⏳ Menyimpan perubahan...";

  const valid = await validateToken();
  if (!valid) return;

  // foto
  const file = document.getElementById("photo").files[0];
  const dataUrl = file ? await toBase64(file) : "";
  const base64 = dataUrl ? dataUrl.split(",")[1] : "";

  const payload = {
    mode: "update",
    token: session.token,
    id: memberId,
    name: name.value.trim(),
    domisili: domisili.value.trim(),
    relationship: relationship.value,
    parentIdAyah: parentIdAyah.value,
    parentIdIbu: parentIdIbu.value,
    spouseId: spouseId.value,
    orderChild: orderChild.value,
    status: status.value,
    notes: notes.value.trim(),
    photo_base64: base64,
    photo_type: file ? file.type : ""
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const j = await res.json();

  if (j.status === "success") {
    msg.innerText = "✅ Berhasil disimpan!";
    setTimeout(() => location.href = `detail.html?id=${memberId}`, 600);
  } else {
    msg.innerText = "❌ Gagal: " + j.message;
  }
});

// =============================
// LOGOUT
// =============================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}

// START
(async () => {
  await validateToken();
  await loadMember();
})();
