/* ============================================================
   DELETE.JS — FINAL STABLE (Admin + User bisa hapus dirinya)
============================================================= */

const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}

const API_URL = window.API_URL;

/* -------------------------
   Ambil ID dari URL
---------------------------- */
const id = new URLSearchParams(location.search).get("id");
if (!id) {
  document.getElementById("detail").innerHTML = "❌ ID tidak ditemukan.";
  throw new Error("ID missing");
}

/* -------------------------
   Helper Fetch JSON
---------------------------- */
async function getJSON(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

/* -------------------------
   Normalizer universal GAS
---------------------------- */
function normalize(json) {
  if (!json) return null;

  let d =
    json.data ||
    json.member ||
    json.row ||
    json.item ||
    json.result ||
    json;

  if (!d) return null;
  d._id = d.id || d.ID || d._id || null;
  return d;
}

/* -------------------------
   LOAD DETAIL ang sudah sinkron
---------------------------- */
async function loadDetail() {
  const box = document.getElementById("detail");
  box.innerHTML = "⏳ Memuat data...";

  const tryURL = [
    `${API_URL}?mode=getById&id=${id}&token=${session.token}`,
    `${API_URL}?action=getOne&id=${id}&token=${session.token}`,
  ];

  let found = null, rawErr = null;

  for (let u of tryURL) {
    const j = await getJSON(u);

    // Jika forbidden → tampilkan error j apa adanya
    if (j && j.status === "error") {
      rawErr = j;
      continue;
    }

    const nm = normalize(j);
    if (nm && nm._id) {
      found = nm;
      break;
    }
  }

  // Jika user akses bukan miliknya → forbidden
  if (!found) {
    box.innerHTML = `<span style="color:red;font-weight:bold">Data tidak ditemukan.</span>`;
    if (rawErr) {
      document.getElementById("jsonOutput").style.display = "block";
      document.getElementById("jsonOutput").textContent =
        JSON.stringify(rawErr, null, 2);
    }
    return;
  }

  // Tampilkan detail
  box.innerHTML = `
    <b>ID:</b> ${found._id}<br>
    <b>Nama:</b> ${found.name || "-"}<br>
    <b>Status:</b> ${found.status || "-"}<br>
  `;

  // Jika user menghapus akun sendiri → tampilkan tombol khusus
  if (found._id === session.id || found._id === session.userId) {
    document.getElementById("selfDeleteBtn").style.display = "block";

    // Sembunyikan tombol admin
    document.getElementById("softBtn").style.display = "none";
    document.getElementById("hardBtn").style.display = "none";
  }
}

loadDetail();

/* -------------------------
   Soft Delete
---------------------------- */
async function softDelete() {
  if (!confirm("Yakin melakukan SOFT DELETE?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.textContent = "⏳ Soft deleting...";

  const url = `${API_URL}?mode=softDelete&id=${id}&token=${session.token}`;
  const j = await getJSON(url);
  out.textContent = JSON.stringify(j, null, 2);

  if (j && j.status === "success") {
    alert("Soft delete berhasil.");
    location.href = "dashboard.html";
  }
}

/* -------------------------
   Hard Delete (admin)
---------------------------- */
async function hardDelete() {
  if (!confirm("⚠ PERMANEN!!! Lanjutkan?")) return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.textContent = "⏳ Hard deleting...";

  const url = `${API_URL}?mode=delete&id=${id}&token=${session.token}`;
  const j = await getJSON(url);

  out.textContent = JSON.stringify(j, null, 2);

  if (j && j.status === "success") {
    alert("Data terhapus permanen.");
    location.href = "dashboard.html";
  }
}

/* -------------------------
   USER DELETE DIRI SENDIRI
---------------------------- */
async function deleteMySelf() {
  if (!confirm("⚠ Anda akan menghapus AKUN ANDA sendiri. Lanjutkan?"))
    return;

  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.textContent = "⏳ Menghapus akun...";

  const url = `${API_URL}?mode=delete&id=${session.id || session.userId}&token=${session.token}`;
  const j = await getJSON(url);

  out.textContent = JSON.stringify(j, null, 2);

  if (j && j.status === "success") {
    alert("Akun Anda telah dihapus permanen.");
    localStorage.removeItem("familyUser");
    location.href = "login.html";
  }
}
