// =========================
// CEK LOGIN
// =========================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// Ambil ID dari URL
const urlParams = new URLSearchParams(window.location.search);
const memberId = urlParams.get("id");

if (!memberId) {
  document.getElementById("error").innerText = "ID tidak ditemukan!";
}

// =========================
// VALIDASI TOKEN
// =========================
async function validateToken() {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Sesi habis. Login kembali.");
      logout();
    }

  } catch (e) {
    logout();
  }
}
validateToken();

// =========================
// LOAD DROPDOWN
// =========================
async function loadDropdowns(selected = {}) {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const j = await res.json();
    if (j.status !== "success") return;

    const data = j.data;

    const ayah = document.getElementById("parentIdAyah");
    const ibu = document.getElementById("parentIdIbu");
    const spouse = document.getElementById("spouseId");

    data.forEach(p => {
      ayah.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
      ibu.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
      spouse.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    });

    // Set selected
    ayah.value = selected.parentIdAyah || "";
    ibu.value = selected.parentIdIbu || "";
    spouse.value = selected.spouseId || "";

  } catch (err) {
    console.error("Dropdown error:", err);
  }
}

// =========================
// LOAD DATA MEMBER
// =========================
async function loadMember() {
  try {
    const res = await fetch(`${API_URL}?mode=getById&id=${memberId}`);
    const j = await res.json();

    if (j.status !== "success") {
      document.getElementById("error").innerText = "Gagal memuat data!";
      return;
    }

    const d = j.data;

    document.getElementById("name").value = d.name;
    document.getElementById("domisili").value = d.domisili;
    document.getElementById("relationship").value = d.relationship;

    loadDropdowns({
      parentIdAyah: d.parentIdAyah,
      parentIdIbu: d.parentIdIbu,
      spouseId: d.spouseId
    });

  } catch (err) {
    console.error(err);
    document.getElementById("error").innerText = "Gagal memuat data!";
  }
}
loadMember();

// =========================
// SIMPAN PERUBAHAN
// =========================
document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();

  const msg = document.getElementById("msg");
  msg.textContent = "⏳ Menyimpan...";

  const payload = {
    mode: "update",
    token: session.token,
    id: memberId,
    name: name.value.trim(),
    domisili: domisili.value.trim(),
    relationship: relationship.value,
    parentIdAyah: parentIdAyah.value,
    parentIdIbu: parentIdIbu.value,
    spouseId: spouseId.value
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    const j = await res.json();

    if (j.status === "success") {
      msg.textContent = "✅ Perubahan disimpan!";
    } else {
      msg.textContent = "❌ Gagal: " + j.message;
    }

  } catch (err) {
    msg.textContent = "❌ Error: " + err.message;
  }
});

// =========================
// LOGOUT
// =========================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}
