<script>
// ============================
// SESSION VALIDATION
// ============================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

// ============================
// VALIDATE TOKEN
// ============================
async function validateToken() {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("🚫 Sesi berakhir. Silakan login ulang!");
      logout();
      return;
    }

    session.role = j.role;
    session.name = j.name;

    if (session.role !== "admin") {
      alert("⛔ Hanya admin yang dapat mengedit data.");
      location.href = "dashboard.html";
    }
  } catch (err) {
    console.error(err);
    logout();
  }
}
validateToken();

// ============================
// LOGOUT
// ============================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session?.token || ""}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}

// ============================
// GET PARAM ID
// ============================
const params = new URLSearchParams(location.search);
const memberId = params.get("id");

if (!memberId) {
  alert("ID tidak ditemukan!");
  location.href = "dashboard.html";
}

// ============================
// LOAD DROPDOWNS
// ============================
async function loadDropdown(data) {
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
}

// ============================
// LOAD DETAIL DATA
// ============================
async function loadDetail() {
  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const j = await res.json();

    if (j.status !== "success") {
      alert("Gagal memuat data!");
      return;
    }

    const all = j.data;

    // isi dropdown dulu
    await loadDropdown(all);

    // cari data berdasarkan ID
    const p = all.find(x => x.id === memberId);

    if (!p) {
      alert("Data tidak ditemukan!");
      return;
    }

    // isi form
    document.getElementById("name").value = p.name || "";
    document.getElementById("domisili").value = p.domisili || "";
    document.getElementById("relationship").value = p.relationship || "";
    document.getElementById("orderChild").value = p.orderChild || "";
    document.getElementById("status").value = p.status || "";
    document.getElementById("notes").value = p.notes || "";

    document.getElementById("parentIdAyah").value = p.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = p.parentIdIbu || "";
    document.getElementById("spouseId").value = p.spouseId || "";

  } catch (err) {
    console.error(err);
    alert("Gagal memuat data!");
  }
}

loadDetail();

// ============================
// UPDATE DATA
// ============================
document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    mode: "updateData", // sesuai GAS
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
    notes: notes.value.trim()
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const j = await res.json();

    if (j.status === "success") {
      alert("✅ Data berhasil diperbarui!");
      location.href = `detail.html?id=${memberId}`;
    } else {
      alert("❌ Gagal: " + j.message);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});
</script>
