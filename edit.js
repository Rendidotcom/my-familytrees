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
// HELPER: LOGOUT
// ============================
function logout() {
  fetch(`${API_URL}?mode=logout&token=${session?.token || ""}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}

// ============================
// AMBIL PARAMETER ID
// ============================
const params = new URLSearchParams(location.search);
const memberId = params.get("id");
if (!memberId) {
  alert("ID tidak ditemukan");
  location.href = "dashboard.html";
}

// ============================
// LOAD DATA DROPDOWN
// ============================
async function loadDropdown(data) {
  const selects = ["fatherId", "motherId", "spouseId"];

  selects.forEach(sel => {
    document.getElementById(sel).innerHTML = `<option value="">-- Pilih --</option>`;
  });

  data.forEach(p => {
    selects.forEach(sel => {
      document.getElementById(sel).insertAdjacentHTML(
        "beforeend",
        `<option value="${p.id}">${p.name}</option>`
      );
    });
  });
}

// ============================
// LOAD DETAIL + ISI FORM
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

    // isi dropdown
    await loadDropdown(all);

    // ambil data berdasarkan ID
    const p = all.find(x => x.id === memberId);

    if (!p) {
      alert("Data tidak ditemukan.");
      return;
    }

    // isi form
    document.getElementById("name").value = p.name;
    document.getElementById("relationship").value = p.relationship;
    document.getElementById("domisili").value = p.domisili;
    document.getElementById("orderChild").value = p.orderChild;
    document.getElementById("notes").value = p.notes;
    document.getElementById("status").value = p.status;

    document.getElementById("fatherId").value = p.parentIdAyah || "";
    document.getElementById("motherId").value = p.parentIdIbu || "";
    document.getElementById("spouseId").value = p.spouseId || "";

  } catch (err) {
    console.error(err);
    alert("Gagal memuat data!");
  }
}

loadDetail();

// ============================
// SUBMIT UPDATE MEMBER
// ============================
document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    mode: "updateMember",
    token: session.token,
    id: memberId,
    name: name.value.trim(),
    domisili: domisili.value.trim(),
    relationship: relationship.value,
    parentIdAyah: fatherId.value,
    parentIdIbu: motherId.value,
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
    alert("❌ Error saat menyimpan: " + err.message);
  }
});
