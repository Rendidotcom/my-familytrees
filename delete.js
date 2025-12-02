/*******************************************************
 *  delete.js — FINAL CLEAN VERSION
 *  Soft Delete + Hard Delete (Sinkron GAS Sheet1)
 *  CORS SAFE — NO HEADERS, NO MODULES
 *******************************************************/


/* ======================================================
   1. GLOBAL CHECK: config.js harus terbaca
   ====================================================== */
if (!window.API_URL) {
  alert("❌ config.js tidak ditemukan atau API_URL tidak terbaca.");
  throw new Error("API_URL missing");
}


/* ======================================================
   2. SESSION LOGIN
   ====================================================== */
let session = null;

function loadSession() {
  try {
    session = JSON.parse(localStorage.getItem("familyUser") || "null");
    if (!session || !session.token) {
      alert("⚠ Sesi login tidak ditemukan. Silakan login ulang.");
      location.href = "login.html";
      return false;
    }
  } catch {
    alert("⚠ Gagal membaca session.");
    location.href = "login.html";
    return false;
  }
  return true;
}

loadSession();


/* ======================================================
   3. AMBIL PARAMETER ID DARI URL
   ====================================================== */
const params = new URLSearchParams(location.search);
const memberId = params.get("id");

if (!memberId) {
  document.getElementById("detail").innerHTML = "❌ Parameter ID tidak ada.";
  throw new Error("Missing id");
}


/* ======================================================
   4. UTILITAS TAMBAHAN
   ====================================================== */

function convertDriveUrl(url) {
  if (!url) return "https://via.placeholder.com/120?text=Avatar";
  const match = String(url).match(/[-\w]{25,}/);
  return match
    ? `https://drive.google.com/uc?export=view&id=${match[0]}`
    : url;
}

function displayJson(obj) {
  const out = document.getElementById("jsonOutput");
  out.style.display = "block";
  out.textContent = JSON.stringify(obj, null, 2);
}

function setLoading(state = true) {
  const box = document.getElementById("detail");
  if (state) box.innerHTML = "⏳ Memuat data...";
}


/* ======================================================
   5. LOAD DETAIL ANGGOTA (Sinkron GAS)
   ====================================================== */

let member = null;

async function loadMemberDetail() {
  setLoading(true);

  const url = `${API_URL}?mode=getOne&id=${encodeURIComponent(memberId)}&nc=${Date.now()}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    displayJson(json);

    if (json.status !== "success" || !json.data) {
      document.getElementById("detail").innerHTML =
        `❌ ${json.message || "Tidak dapat memuat data."}`;
      return;
    }

    member = json.data;

    document.getElementById("detail").innerHTML = `
      <div style="text-align:center; margin-bottom:14px;">
        <img src="${convertDriveUrl(member.photoURL)}" 
             style="width:120px;height:120px;border-radius:50%;border:3px solid #ddd;">
        <h3 style="margin-top:12px;">${member.name}</h3>
        <div style="color:#888;font-size:14px;">
          Status: <b>${member.status || "active"}</b>
        </div>
      </div>

      <div style="font-size:15px; line-height:1.7;">
        <b>ID:</b> ${member.id}<br>
        <b>Domisili:</b> ${member.domisili || "-"}<br>
        <b>Relationship:</b> ${member.relationship || "-"}<br>
        <b>Notes:</b> ${member.notes || "-"}<br><br>

        <b>Parent Ayah:</b> ${member.parentIdAyah || "-"}<br>
        <b>Parent Ibu:</b> ${member.parentIdIbu || "-"}<br>
        <b>Spouse ID:</b> ${member.spouseId || "-"}<br>
        <b>Order Child:</b> ${member.orderChild || "-"}<br>
        <b>Role:</b> ${member.role || "-"}
      </div>
    `;

  } catch (err) {
    document.getElementById("detail").innerHTML = "❌ Error menghubungi server.";
    displayJson({ error: String(err) });
  }
}

loadMemberDetail();


/* ======================================================
   6. GENERIC POST REQUEST — CORS SAFE (NO HEADERS)
   ====================================================== */

async function sendPost(payload) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    displayJson(json);

    return json;

  } catch (err) {
    displayJson({ error: String(err) });
    alert("❌ Tidak dapat terhubung ke server.");
    throw err;
  }
}


/* ======================================================
   7. SOFT DELETE — Sinkron GAS
   ====================================================== */

async function softDelete() {
  if (!member) return alert("Data belum dimuat.");

  const ok = confirm(
    `Soft Delete?\n\n` +
    `Data ${member.name} tidak dihapus permanen, hanya diset "deleted".`
  );
  if (!ok) return;

  const payload = {
    mode: "softDelete",
    id: memberId,
    token: session.token,
    deletedBy: session.name,
    time: new Date().toISOString()
  };

  const json = await sendPost(payload);

  if (json.status === "success") {
    alert("✓ Soft delete berhasil.");
    location.href = "dashboard.html";
    return;
  }

  if (json.message?.includes("Invalid token") || json.status === "expired") {
    alert("⚠ Sesi login habis. Silakan login lagi.");
    localStorage.removeItem("familyUser");
    location.href = "login.html";
    return;
  }

  alert("❌ Gagal soft delete: " + (json.message || "Unknown error"));
}


/* ======================================================
   8. HARD DELETE — Sinkron GAS
   ====================================================== */

async function hardDelete() {
  if (!member) return alert("Data belum dimuat.");

  const ok = confirm(
    `⚠⚠ PERINGATAN HARD DELETE ⚠⚠\n\n` +
    `Data "${member.name}" akan DIHAPUS PERMANEN.\n` +
    `Aksi ini tidak dapat dipulihkan!\n\n` +
    `Lanjutkan?`
  );
  if (!ok) return;

  const payload = {
    mode: "delete",
    id: memberId,
    token: session.token,
    deletedBy: session.name,
    time: new Date().toISOString()
  };

  const json = await sendPost(payload);

  if (json.status === "success") {
    alert("✓ Hard delete PERMANEN berhasil.");
    location.href = "dashboard.html";
    return;
  }

  if (json.message?.includes("Invalid token") || json.status === "expired") {
    alert("⚠ Sesi login habis. Silakan login ulang.");
    localStorage.removeItem("familyUser");
    location.href = "login.html";
    return;
  }

  alert("❌ Hard delete gagal: " + (json.message || "Unknown error"));
}


/* ======================================================
   9. LOGOUT
   ====================================================== */

function logout() {
  try {
    fetch(`${API_URL}?mode=logout&token=${session?.token || ""}`);
  } catch {}

  localStorage.removeItem("familyUser");
  location.href = "login.html";
}


/* ======================================================
   10. DEBUGGING
   ====================================================== */
function debug(...msg) {
  console.log("[DELETE.JS]", ...msg);
}

debug("delete.js loaded, memberId =", memberId);


/* ======================================================
   11. AUTO REFRESH (Opsional)
   ====================================================== */

const AUTO_REFRESH = false;
if (AUTO_REFRESH) {
  setInterval(() => loadMemberDetail(), 15000);
}


/* ======================================================
   END OF FILE
   ====================================================== */
