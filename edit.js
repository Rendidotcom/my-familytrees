// ============================
// SESSION CHECK
// ============================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  alert("⚠ Harap login dahulu!");
  location.href = "login.html";
}

// ============================
// VALIDATE TOKEN
// ============================
async function validateToken() {
  try {
    const r = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await r.json();

    if (j.status !== "success") {
      alert("🚫 Sesi habis, login ulang!");
      logout();
      return;
    }
  } catch (e) {
    logout();
  }
}
validateToken();


// ============================
// GET PARAM ID
// ============================
const params = new URLSearchParams(location.search);
const ID = params.get("id");

if (!ID) {
  alert("ID tidak ditemukan");
  location.href = "dashboard.html";
}


// ============================
// LOAD SEMUA DATA (untuk dropdown & data detail)
// ============================
async function loadAll() {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Gagal mengambil data!");
      return;
    }

    const all = j.data;

    // --- isi dropdown ---
    fillDropdown("parentIdAyah", all);
    fillDropdown("parentIdIbu", all);
    fillDropdown("spouseId", all);

    // --- cari data berdasarkan ID ---
    const p = all.find(x => String(x.id) === String(ID));

    if (!p) {
      alert("Data tidak ditemukan!");
      return;
    }

    // --- isi form ---
    document.getElementById("name").value = p.name;
    document.getElementById("domisili").value = p.domisili;
    document.getElementById("relationship").value = p.relationship;
    document.getElementById("parentIdAyah").value = p.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = p.parentIdIbu || "";
    document.getElementById("spouseId").value = p.spouseId || "";
    document.getElementById("orderChild").value = p.orderChild || "";
    document.getElementById("status").value = p.status || "";
    document.getElementById("notes").value = p.notes || "";

  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan load data.");
  }
}

// helper dropdown
function fillDropdown(id, arr) {
  const sel = document.getElementById(id);
  sel.innerHTML = `<option value="">-- Pilih --</option>`;

  arr.forEach(row => {
    sel.insertAdjacentHTML(
      "beforeend",
      `<option value="${row.id}">${row.name}</option>`
    );
  });
}

loadAll();


// ============================
// KONVERSI BASE64
// ============================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}


// ============================
// SUBMIT UPDATE
// ============================
document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();

  const msg = document.getElementById("msg");
  msg.textContent = "⏳ Memproses...";

  let photoBase64 = "";
  const f = document.getElementById("photo").files[0];
  if (f) photoBase64 = await toBase64(f);

  const payload = {
    mode: "updateMember",  // ⬅ WAJIB sesuai GAS
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
    photo_base64: photoBase64,
    photo_type: f ? f.type : ""
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
      setTimeout(() => location.href = `detail.html?id=${ID}`, 500);
    } else {
      msg.textContent = "❌ Gagal: " + j.message;
    }

  } catch (err) {
    msg.textContent = "❌ ERROR: " + err.message;
  }
});


// ============================
// LOGOUT
// ============================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}
