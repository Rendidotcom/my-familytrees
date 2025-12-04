/* ============================================================
   delete.js — GAS-compatible final
   - Uses mode=getData to load users
   - Deletes per-ID via GET ?mode=delete&id=...&token=...
   - Supports self-delete (auto logout)
   - Updates UI, handles errors
   =========================================================== */

/* -------------------------
   0. Prereq / Session
---------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
  alert("Silakan login kembali.");
  location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;
const isAdmin = session.role === "admin";

/* -------------------------
   1. Elements
---------------------------- */
const tbody = document.querySelector("#userTable tbody");
const loader = document.querySelector("#loader");
const btnRefresh = document.querySelector("#btnRefresh");
const btnDeleteSelected = document.querySelector("#btnDeleteSelected");
const btnDeleteAll = document.querySelector("#btnDeleteAll");

/* helper safe fetch/parse JSON */
async function safeGetJSON(url) {
  try {
    const r = await fetch(url);
    const text = await r.text();
    // try parse JSON, otherwise return error object with raw text
    try {
      return JSON.parse(text);
    } catch (e) {
      return { status: "error", message: "Invalid JSON from server", raw: text };
    }
  } catch (err) {
    return { status: "error", message: err.message || String(err) };
  }
}

/* -------------------------
   2. UI helpers
---------------------------- */
function setLoading(on) {
  if (loader) loader.style.display = on ? "block" : "none";
  if (btnRefresh) btnRefresh.disabled = on;
  if (btnDeleteSelected) btnDeleteSelected.disabled = on;
  if (btnDeleteAll) btnDeleteAll.disabled = on;
}

function emptyRowMessage(msg) {
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#666;padding:18px">${msg}</td></tr>`;
}

/* -------------------------
   3. Load users using mode=getData
   GAS returns { status:"success", data: [ ...members... ] }
---------------------------- */
async function loadUsers() {
  setLoading(true);
  tbody.innerHTML = "";
  emptyRowMessage("Memuat data...");

  const url = `${API_URL}?mode=getData&ts=${Date.now()}`;
  const res = await safeGetJSON(url);

  if (!res || res.status !== "success" || !Array.isArray(res.data)) {
    const msg = (res && res.message) ? res.message : "Gagal memuat data (unexpected response)";
    emptyRowMessage("Tidak ada user. (" + msg + ")");
    console.warn("getData result:", res);
    setLoading(false);
    return;
  }

  const users = res.data;
  if (users.length === 0) {
    emptyRowMessage("Tidak ada user.");
    setLoading(false);
    return;
  }

  // render rows
  tbody.innerHTML = "";
  for (const u of users) {
    const id = u.id || u._id || u.ID || "";
    const name = u.name || u.nama || "-";
    const email = u.email || u.domisili || "-"; // GAS doesn't include email by default; fallback sensible field

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="width:1%">
        <input type="checkbox" class="userCheck" value="${id}" ${String(id) === String(sessionId) ? "" : ""}>
      </td>
      <td style="width:30%;font-family:monospace">${id}</td>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(email)}</td>
    `;
    tbody.appendChild(tr);
  }

  setLoading(false);
}

/* -------------------------
   4. Delete helper (per-ID via GET)
   Using GET avoids some CORS preflight in environments where POST JSON may be blocked.
---------------------------- */
async function deleteSingleByGet(idToDelete) {
  const url = `${API_URL}?mode=delete&id=${encodeURIComponent(idToDelete)}&token=${encodeURIComponent(token)}`;
  const res = await safeGetJSON(url);
  return res;
}

/* delete multiple sequentially (keeps GAS load stable) */
async function deleteMultiple(ids) {
  setLoading(true);

  const results = [];
  for (const id of ids) {
    // skip empty ids
    if (!id) {
      results.push({ id, status: "error", message: "Missing id" });
      continue;
    }
    const r = await deleteSingleByGet(id);
    results.push({ id, result: r });
    // if the user deleted themselves, stop further processing and logout
    if (String(id) === String(sessionId) && r && r.status === "success") {
      // logout & redirect
      alert("Akun Anda telah dihapus. Anda akan dikeluarkan.");
      localStorage.removeItem("familyUser");
      location.href = "login.html";
      return { aborted: true, results };
    }
  }

  setLoading(false);
  return { aborted: false, results };
}

/* -------------------------
   5. Button handlers
---------------------------- */
btnRefresh && btnRefresh.addEventListener("click", loadUsers);

btnDeleteSelected && btnDeleteSelected.addEventListener("click", async () => {
  const checks = Array.from(document.querySelectorAll(".userCheck:checked"));
  if (!checks.length) {
    alert("Pilih user yang ingin dihapus.");
    return;
  }
  const ids = checks.map(c => c.value).filter(Boolean);

  // Security: confirm
  if (!confirm(`Yakin ingin menghapus ${ids.length} user terpilih?`)) return;

  const { aborted, results } = await deleteMultiple(ids);
  if (aborted) return; // handled in deleteMultiple (self-delete logout)

  // show simple summary
  const failed = results.filter(r => !r.result || (r.result.status && r.result.status !== "success"));
  if (failed.length) {
    alert(`Selesai. Namun ${failed.length} deletion gagal. Lihat console untuk detail.`);
    console.warn("delete results", results);
  } else {
    alert("Semua user terpilih berhasil dihapus.");
  }

  await loadUsers();
});

btnDeleteAll && btnDeleteAll.addEventListener("click", async () => {
  const allChecks = Array.from(document.querySelectorAll(".userCheck"));
  if (!allChecks.length) {
    alert("Tidak ada user untuk dihapus.");
    return;
  }
  if (!confirm("Yakin ingin menghapus SEMUA user? Tindakan ini permanen.")) return;

  // gather ids
  const ids = allChecks.map(c => c.value).filter(Boolean);
  const { aborted, results } = await deleteMultiple(ids);
  if (aborted) return;

  const failed = results.filter(r => !r.result || (r.result.status && r.result.status !== "success"));
  if (failed.length) {
    alert(`Selesai. Namun ${failed.length} deletion gagal. Lihat console.`);
    console.warn("delete all results", results);
  } else {
    alert("Semua user berhasil dihapus.");
  }

  await loadUsers();
});

/* -------------------------
   6. Utilities
---------------------------- */
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------------
   7. Init
---------------------------- */
setLoading(true);
loadUsers().catch(err => {
  console.error("init loadUsers error", err);
  setLoading(false);
});
