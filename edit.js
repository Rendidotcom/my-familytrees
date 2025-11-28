// =========================
// CEK LOGIN
// =========================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// Ambil parameter ID dari URL
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

    if (j.role !== "admin") {
      alert("⛔ Hanya admin yang dapat mengedit.");
      location.href = "dashboard.html";
    }
  } catch (e) {
    console.error("Token error:", e);
    logout();
  }
}
validateToken();

// =========================
// LOAD SEMUA MEMBER UNTUK DROPDOWN
// =========================
async function loadDropdowns(selected = {}) {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const j = await res.json();
    if (j.status !== "success") return;

    const data = j.data;

    const fields = ["parentIdAyah", "parentIdIbu", "spouseId"];

    fields.forEach(id => {
      const el = document.getElementById(id);
      el.innerHTML = `<option value="">-- Pilih --</option>`;
    });

    data.forEach(p => {
      ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(id => {
        document
          .getElementById(id)
          .insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
      });
    });

    // Set selected setelah semua option dimuat
    document.getElementById("parentIdAyah").value = selected.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = selected.parentIdIbu || "";
    document.getElementById("spouseId").value = selected.spouseId || "";

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

    // Set form value
    document.getElementById("name").value = d.name;
    document.getElementById("domisili").value = d.domisili;
    document.getElementById("relationship").value = d.relationship;

    // Muat dropdown sambil set selected
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
      headers: { "Content-Type": "application/json" },
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
