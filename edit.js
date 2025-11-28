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
// VALIDASI TOKEN + ROLE
// =========================
async function validateToken() {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Sesi habis. Login kembali.");
      logout();
      return;
    }

    session.role = j.role;
    session.userId = j.userId; // penting untuk cek siapa yang boleh edit

    // 🔥 USER BUKAN ADMIN → hanya boleh edit dirinya sendiri
    if (session.role !== "admin" && session.userId !== memberId) {
      alert("⛔ Anda hanya bisa mengedit data Anda sendiri.");
      location.href = `detail.html?id=${memberId}`;
      return;
    }

  } catch (e) {
    console.error("Token error:", e);
    logout();
  }
}
validateToken();

// =========================
// UTIL → FILE KE BASE64
// =========================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// =========================
// LOAD DROPDOWN
// =========================
async function loadDropdowns(selected = {}) {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const j = await res.json();
    if (j.status !== "success") return;

    const data = j.data;

    const selects = ["parentIdAyah", "parentIdIbu", "spouseId"];
    selects.forEach(id => {
      document.getElementById(id).innerHTML = `<option value="">-- Pilih --</option>`;
    });

    data.forEach(p => {
      selects.forEach(id => {
        document.getElementById(id).insertAdjacentHTML(
          "beforeend",
          `<option value="${p.id}">${p.name}</option>`
        );
      });
    });

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

  // FOTO OPSIONAL
  const file = document.getElementById("photo").files[0];
  let base64 = "";
  let type = "";

  if (file) {
    const raw = await toBase64(file);
    base64 = raw.split(",")[1];
    type = file.type;
  }

  const payload = {
    mode: "update",
    token: session.token,
    id: memberId,

    // data biasa
    name: name.value.trim(),
    domisili: domisili.value.trim(),
    relationship: relationship.value,
    parentIdAyah: parentIdAyah.value,
    parentIdIbu: parentIdIbu.value,
    spouseId: spouseId.value,

    // foto
    photo_base64: base64,
    photo_type: type
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
    msg.textContent = "❌ Error saat menyimpan: " + err.message;
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
