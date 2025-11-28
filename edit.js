// ===============================
// AMBIL SESSION
// ===============================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

// ===============================
// VALIDASI LOGIN
// ===============================
if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// ===============================
// VALIDATE TOKEN
// ===============================
async function validateToken() {
  try {
    const r = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await r.json();

    if (j.status !== "success") {
      alert("Sesi berakhir, silakan login ulang!");
      logout();
      return;
    }
  } catch (e) {
    logout();
  }
}
validateToken();

// ===============================
// PARAMETER ID
// ===============================
const params = new URLSearchParams(location.search);
const ID = params.get("id");

if (!ID) {
  alert("ID tidak ditemukan!");
  location.href = "dashboard.html";
}

// ===============================
// LOAD DROPDOWN (Ayah, Ibu, Pasangan)
// ===============================
async function loadMembersDropdown() {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const j = await res.json();
    if (j.status !== "success") return;

    const members = j.data;

    const dropdowns = ["parentIdAyah", "parentIdIbu", "spouseId"];

    dropdowns.forEach(sel => {
      document.getElementById(sel).innerHTML = `<option value="">-- Pilih --</option>`;
    });

    members.forEach(m => {
      dropdowns.forEach(sel => {
        document.getElementById(sel).insertAdjacentHTML(
          "beforeend",
          `<option value="${m.id}">${m.name}</option>`
        );
      });
    });

  } catch (err) {
    console.error("Dropdown error:", err);
  }
}

// ===============================
// LOAD DETAIL (SET VALUE FORM)
// ===============================
async function loadDetail() {
  try {
    const res = await fetch(`${API_URL}?mode=getDetail&id=${ID}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Gagal memuat data!");
      return;
    }

    const p = j.data;

    // isi form
    document.getElementById("name").value = p.name || "";
    document.getElementById("domisili").value = p.domisili || "";
    document.getElementById("relationship").value = p.relationship || "";

    document.getElementById("parentIdAyah").value = p.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = p.parentIdIbu || "";
    document.getElementById("spouseId").value = p.spouseId || "";

    document.getElementById("orderChild").value = p.orderChild || "";
    document.getElementById("status").value = p.status || "";
    document.getElementById("notes").value = p.notes || "";

  } catch (err) {
    console.error("Load detail error:", err);
    alert("Gagal memuat detail anggota!");
  }
}

// Jalankan dropdown dulu, lalu detail
(async () => {
  await loadMembersDropdown();
  setTimeout(loadDetail, 300); // beri waktu dropdown selesai terisi
})();

// ===============================
// KONVERSI FOTO BASE64
// ===============================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ===============================
// SIMPAN UPDATE
// ===============================
document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("msg");
  msg.textContent = "⏳ Menyimpan...";

  let base64 = "";
  const file = photo.files[0];
  if (file) base64 = (await toBase64(file)).split(",")[1];

  const payload = {
    mode: "update",
    token: session.token,
    updatedBy: session.name,

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
      setTimeout(() => {
        location.href = `detail.html?id=${ID}`;
      }, 700);
    } else {
      msg.textContent = "❌ Error: " + j.message;
    }
  } catch (err) {
    msg.textContent = "❌ " + err.message;
  }
});

// ===============================
// LOGOUT
// ===============================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session.token}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}
