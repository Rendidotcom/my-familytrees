// edit.js sinkron dengan edit.html
import { API_URL } from "./config.js";

let session = JSON.parse(localStorage.getItem("familyUser") || "null");
let memberId = new URLSearchParams(location.search).get("id");

if (!session || !session.token) {
  alert("⚠ Harap login terlebih dahulu!");
  location.href = "login.html";
}

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
      alert("⛔ Hanya admin yang boleh mengedit data.");
      location.href = "dashboard.html";
    }
  } catch (err) {
    console.error("Token error:", err);
    logout();
  }
}
validateToken();

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function loadMembersDropdown() {
  const res = await fetch(`${API_URL}?mode=getData`);
  const j = await res.json();
  if (j.status !== "success") return;

  const data = j.data;

  ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(sel => {
    document.getElementById(sel).innerHTML = `<option value="">-- Pilih --</option>`;
  });

  data.forEach(p => {
    ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(sel => {
      document.getElementById(sel)
        .insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    });
  });
}

async function loadDetail() {
  await loadMembersDropdown();

  const res = await fetch(`${API_URL}?mode=getById&id=${memberId}`);
  const j = await res.json();

  if (j.status !== "success") {
    alert("❌ Anggota tidak ditemukan!");
    location.href = "dashboard.html";
    return;
  }

  const p = j.data;

  name.value = p.name;
  domisili.value = p.domisili;
  relationship.value = p.relationship;
  parentIdAyah.value = p.parentIdAyah || "";
  parentIdIbu.value = p.parentIdIbu || "";
  spouseId.value = p.spouseId || "";
  orderChild.value = p.orderChild || "";
  status.value = p.status;
  notes.value = p.notes || "";

  if (p.photoURL) {
    const id = p.photoURL.match(/[-\w]{25,}/)?.[0];
    if (id) {
      const preview = document.getElementById("preview");
      preview.src = `https://drive.google.com/uc?export=view&id=${id}`;
      preview.style.display = "block";
    }
  }
}
loadDetail();

document.getElementById("formEdit").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("msg");
  msg.textContent = "⏳ Menyimpan...";

  const file = document.getElementById("photo").files[0];
  let base64 = "";
  if (file) base64 = (await toBase64(file)).split(",")[1];

  const payload = {
    mode: "update",
    id: memberId,
    token: session.token,
    updatedBy: session.name,
    name: name.value,
    domisili: domisili.value,
    relationship: relationship.value,
    parentIdAyah: parentIdAyah.value,
    parentIdIbu: parentIdIbu.value,
    spouseId: spouseId.value,
    orderChild: orderChild.value,
    status: status.value,
    notes: notes.value,
    photo_base64: base64,
    photo_type: file ? file.type : ""
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const j = await res.json();

    msg.textContent = j.status === "success" ? "✅ Berhasil diperbarui!" : "❌ " + j.message;
  } catch (err) {
    msg.textContent = "❌ Error: " + err.message;
  }
});

export async function hapus() {
  if (!confirm("⚠️ Yakin ingin menghapus anggota ini?")) return;

  const res = await fetch(`${API_URL}?mode=delete&id=${memberId}&token=${session.token}`);
  const j = await res.json();

  if (j.status === "success") {
    alert("🗑️ Data berhasil dihapus.");
    location.href = "dashboard.html";
  } else {
    alert("❌ " + j.message);
  }
}

export function logout() {
  fetch(`${API_URL}?mode=logout&token=${session?.token || ""}`)
    .finally(() => {
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}
