// ==============================
// VALIDASI SESSION
// ==============================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// ==============================
// VALIDASI TOKEN
// ==============================
async function validateToken() {
  try {
    const r = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await r.json();
    if (j.status !== "success") logout();
  } catch (e) {
    logout();
  }
}
validateToken();

// ==============================
// GET PARAMETER ID
// ==============================
const params = new URLSearchParams(location.search);
const ID = params.get("id");

// ==============================
// LOAD DROPDOWN
// ==============================
async function loadDropdown() {
  const r = await fetch(`${API_URL}?mode=getData`);
  const j = await r.json();
  if (j.status !== "success") return;

  const members = j.data;

  ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(sel => {
    document.getElementById(sel).innerHTML = `<option value="">-- Pilih --</option>`;
  });

  members.forEach(p => {
    ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(sel => {
      document.getElementById(sel).insertAdjacentHTML(
        "beforeend",
        `<option value="${p.id}">${p.name}</option>`
      );
    });
  });
}

// ==============================
// LOAD DETAIL
// ==============================
async function loadDetail() {
  try {
    const r = await fetch(`${API_URL}?mode=getDetail&id=${ID}`);
    const j = await r.json();

    if (j.status !== "success") {
      alert("❌ Gagal memuat data!");
      return;
    }

    const p = j.data;

    // TAMPILKAN DATA
    name.value = p.name || "";
    domisili.value = p.domisili || "";
    relationship.value = p.relationship || "";
    parentIdAyah.value = p.parentIdAyah || "";
    parentIdIbu.value = p.parentIdIbu || "";
    spouseId.value = p.spouseId || "";
    orderChild.value = p.orderChild || "";
    status.value = p.status || "";
    notes.value = p.notes || "";

  } catch (err) {
    alert("❌ Error memuat detail: " + err.message);
  }
}

// ==============================
// LOAD SEMUA
// ==============================
async function initEditPage() {
  await loadDropdown(); // load pilihan ayah/ibu/pasangan
  await loadDetail();   // isi field sesuai ID
}
initEditPage();

// ==============================
// FILE BASE64
// ==============================
function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ==============================
// SUBMIT UPDATE
// ==============================
document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("msg");
  msg.textContent = "⏳ Menyimpan...";

  let base64 = "";
  const file = photo.files[0];
  if (file) base64 = (await toBase64(file)).split(",")[1];

  const payload = {
    mode: "updateMember", // sesuai GAS
    token: session.token,
    id: ID,

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

  try {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const j = await r.json();

    if (j.status === "success") {
      msg.textContent = "✅ Berhasil disimpan!";
      setTimeout(() => location.href = `detail.html?id=${ID}`, 600);
    } else {
      msg.textContent = "❌ Error: " + j.message;
    }

  } catch (err) {
    msg.textContent = "❌ " + err.message;
  }
});

// ==============================
// LOGOUT
// ==============================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}
