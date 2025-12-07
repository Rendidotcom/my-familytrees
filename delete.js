/* ============================================================
   DELETE.JS — PREMIUM v5
============================================================= */

const API = "https://script.google.com/macros/s/AKfycbyourGASurl/exec";

/* -------------------------
   0. SESSION
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
   1. ELEMENTS
---------------------------- */
const tb = document.querySelector("#userTableBody");
const roleBadge = document.querySelector("#roleBadge");
const spinner = document.querySelector("#spinner");
const toast = document.querySelector("#toast");

document.querySelector("#deleteAllBtn").style.display = isAdmin ? "inline-block" : "none";

/* -------------------------
   2. TOOLS
---------------------------- */
const show = () => spinner.style.display = "block";
const hide = () => spinner.style.display = "none";

function toastMsg(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

async function api(mode, data = {}) {
  const body = { mode, token, ...data };
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

/* Flexible extractor */
function extract(data) {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.payload && Array.isArray(data.payload)) return data.payload;
  return [];
}

/* -------------------------
   3. LOAD USERS
---------------------------- */
async function load() {
  show();
  tb.innerHTML = "";

  const raw = await api("list");
  const users = extract(raw);

  hide();

  roleBadge.textContent = `Role kamu: ${session.role}`;

  users.forEach(u => {
    const id = u.id || u.ID || u.Id || "-";
    const nama = u.name || u.nama || "-";
    const dom = u.domisili || u.email || "-";
    const role = u.role || "-";

    const tr = document.createElement("tr");
    if (String(id) === String(sessionId)) tr.classList.add("me");

    tr.innerHTML = `
      <td><input type="checkbox" class="chk" value="${id}"></td>
      <td>${id}</td>
      <td>${nama}</td>
      <td>${dom}</td>
      <td>${role}</td>
    `;

    tb.appendChild(tr);
  });
}

/* -------------------------
   4. DELETE ACTIONS
---------------------------- */
async function deleteSelected() {
  const ids = [...document.querySelectorAll(".chk:checked")].map(c => c.value);
  if (!ids.length) return toastMsg("Tidak ada yang dipilih");

  if (!confirm(`Yakin hapus ${ids.length} user?`)) return;

  show();
  const res = await api("delete", { ids });

  hide();
  toastMsg(res.message || "Deleted");

  if (ids.includes(String(sessionId))) {
    localStorage.removeItem("familyUser");
    return location.href = "login.html";
  }

  load();
}

async function deleteAll() {
  if (!isAdmin) return toastMsg("Hanya admin");
  if (!confirm("HAPUS SEMUA USER?")) return;

  show();
  const res = await api("deleteall");
  hide();

  toastMsg("Semua user dihapus");
  load();
}

/* -------------------------
   5. EVENT
---------------------------- */
document.querySelector("#refreshBtn").onclick = load;
document.querySelector("#deleteSelectedBtn").onclick = deleteSelected;
document.querySelector("#deleteAllBtn").onclick = deleteAll;

/* -------------------------
   START
---------------------------- */
load();
