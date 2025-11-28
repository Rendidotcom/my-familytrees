// ==========================
// SESSION CHECK
// ==========================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

async function validateToken() {
  try {
    const r = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await r.json();
    if (j.status !== "success") logout();
  } catch {
    logout();
  }
}
validateToken();


// ambil ID dari URL
const params = new URLSearchParams(location.search);
const ID = params.get("id");

const form = document.getElementById("formEdit");
const loadingBox = document.getElementById("loadingBox");


// ==========================
// LOAD DROPDOWN
// ==========================
function fillDropdown(members) {
  ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(sel => {
    const box = document.getElementById(sel);
    box.innerHTML = `<option value="">-- Pilih --</option>`;
    members.forEach(p => {
      box.insertAdjacentHTML(
        "beforeend",
        `<option value="${p.id}">${p.name}</option>`
      );
    });
  });
}


// ==========================
// LOAD DETAIL (PASTI MUNCUL)
// ==========================
async function loadDetail() {
  try {
    const r = await fetch(`${API_URL}?mode=getData`);
    const j = await r.json();

    if (j.status !== "success") {
      loadingBox.textContent = "❌ Gagal memuat data!";
      return;
    }

    const members = j.data;

    // isi dropdown dulu
    fillDropdown(members);

    // cari id
    const p = members.find(x => x.id == ID);

    if (!p) {
      alert("❌ Data tidak ditemukan!");
      location.href = "dashboard.html";
      return;
    }

    // isi form
    name.value = p.name;
    domisili.value = p.domisili;
    relationship.value = p.relationship;
    parentIdAyah.value = p.parentIdAyah || "";
    parentIdIbu.value = p.parentIdIbu || "";
    spouseId.value = p.spouseId || "";
    orderChild.value = p.orderChild || "";
    status.value = p.status || "";
    notes.value = p.notes || "";

    // tampilkan form
    loadingBox.style.display = "none";
    form.style.display = "block";

  } catch (err) {
    loadingBox.textContent = "❌ Error memuat data!";
  }
}

loadDetail();


// ==========================
// FILE → BASE64
// ==========================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}


// ==========================
// SUBMIT UPDATE
// ==========================
form.addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("msg");
  msg.textContent = "⏳ Menyimpan...";

  let base64 = "";
  const f = photo.files[0];
  if (f) base64 = (await toBase64(f)).split(",")[1];

  const payload = {
    mode: "updateMember",
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
    photo_type: f ? f.type : ""
  };

  try {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    const j = await r.json();

    if (j.status === "success") {
      msg.textContent = "✅ Data berhasil diperbarui!";
      setTimeout(() => location.href = `detail.html?id=${ID}`, 800);
    } else {
      msg.textContent = "❌ Error: " + j.message;
    }
  } catch (err) {
    msg.textContent = "❌ " + err.message;
  }
});


// ==========================
// LOGOUT
// ==========================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}
