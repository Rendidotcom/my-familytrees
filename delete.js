console.log("DELETE.JS LOADED");

/* ============================================================
   1. WAIT FOR ELEMENT — Aman untuk device lambat
============================================================= */
function waitForElement(selector, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const obs = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        obs.disconnect();
        resolve(found);
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      obs.disconnect();
      reject("Timeout tunggu elemen: " + selector);
    }, timeout);
  });
}

/* ============================================================
   2. START — Safe mode
============================================================= */
document.addEventListener("DOMContentLoaded", initDelete);

async function initDelete() {
  console.log("Init delete page…");

  try {
    const tbody = await waitForElement("#userTable tbody");
    const btnRefresh = await waitForElement("#btnRefresh");
    const btnDeleteSelected = await waitForElement("#btnDeleteSelected");
    const btnDeleteAll = await waitForElement("#btnDeleteAll");

    console.log("✔ Semua elemen ditemukan!");

    btnRefresh.onclick = loadUsers;
    btnDeleteSelected.onclick = deleteSelected;
    btnDeleteAll.onclick = deleteAll;

    loadUsers();

  } catch (err) {
    console.error("❌ ERROR DOM:", err);
  }
}

/* ============================================================
   3. LOAD USERS
============================================================= */
async function loadUsers() {
  const loader = document.getElementById("loader");
  const tbody = document.querySelector("#userTable tbody");

  loader.style.display = "block";
  tbody.innerHTML = "";

  const session = JSON.parse(localStorage.getItem("familyUser") || "{}");

  const url = `${API_URL}?mode=list&token=${session.token}`;
  console.log("[FETCH] URL:", url);

  try {
    const res = await fetch(url);
    const raw = await res.text();
    console.log("[RAW RESPONSE]", raw);

    const json = JSON.parse(raw);

    if (!json.data) {
      loader.innerHTML = "Tidak ada data.";
      return;
    }

    renderTable(json.data);

  } catch (e) {
    console.error("❌ Load gagal:", e);
  }

  loader.style.display = "none";
}

/* ============================================================
   4. RENDER TABLE
============================================================= */
function renderTable(list) {
  const tbody = document.querySelector("#userTable tbody");
  tbody.innerHTML = "";

  list.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="row-check" data-id="${u.id}"></td>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ============================================================
   5. DELETE SELECTED
============================================================= */
async function deleteSelected() {
  const selected = [...document.querySelectorAll(".row-check:checked")];
  if (selected.length === 0) return alert("Tidak ada user dipilih!");

  if (!confirm("Hapus user terpilih?")) return;

  const session = JSON.parse(localStorage.getItem("familyUser") || "{}");

  for (const s of selected) {
    const id = s.dataset.id;
    await fetch(`${API_URL}?mode=delete&id=${id}&token=${session.token}`);
  }

  loadUsers();
}

/* ============================================================
   6. DELETE ALL
============================================================= */
async function deleteAll() {
  if (!confirm("⚠ SERIUS hapus SEMUA user?")) return;

  const session = JSON.parse(localStorage.getItem("familyUser") || "{}");
  await fetch(`${API_URL}?mode=delete&id=ALL&token=${session.token}`);

  loadUsers();
}
