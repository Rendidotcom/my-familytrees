/* ============================================================
   DELETE.JS — PREMIUM V8 FINAL
   Sinkron dengan delete.html V8
   Works for: Admin + User biasa
============================================================= */

console.log("DELETE.JS PREMIUM V8 LOADED");

/* ----------------------------
   0. ELEMENTS
----------------------------- */
const tableBody = document.getElementById("userTableBody");
const roleBadge = document.getElementById("roleBadge");
const logBox = document.getElementById("mftLog");

const btnRefresh = document.getElementById("refreshBtn");
const btnDeleteSelected = document.getElementById("deleteSelectedBtn");
const btnDeleteAll = document.getElementById("deleteAllBtn");

/* ----------------------------
   1. SESSION
----------------------------- */
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
    alert("Silakan login kembali.");
    location.href = "login.html";
}

const token = session.token;
const myId = session.id;
const myRole = session.role || "user";

roleBadge.innerText = "ROLE: " + myRole.toUpperCase();

if (myRole !== "admin") {
    btnDeleteAll.style.display = "none"; // user tidak boleh hapus semua
}

/* ----------------------------
   2. LOGGING
----------------------------- */
function log(msg) {
    const t = new Date().toLocaleTimeString();
    logBox.textContent += `\n[${t}] ${msg}`;
    logBox.scrollTop = logBox.scrollHeight;
}

/* ----------------------------
   3. FETCH HELPERS
----------------------------- */
async function postJSON(mode, body = {}) {
    const url = `${API_URL}?mode=${mode}&token=${token}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }

        const data = await res.json();
        return data;

    } catch (err) {
        log("ERROR fetch: " + err.message);
        throw err;
    }
}

/* ----------------------------
   4. LOAD USERS
----------------------------- */
async function loadUsers() {
    log("Memuat data user...");

    tableBody.innerHTML = `
        <tr><td colspan="4" style="text-align:center;padding:18px;">Memuat...</td></tr>
    `;

    try {
        const data = await postJSON("getUsers");

        if (!data || !data.users) {
            log("Response kosong!");
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Tidak ada data</td></tr>`;
            return;
        }

        const users = data.users;

        // USER BIASA → hanya lihat dirinya sendiri
        const visibleUsers = (myRole === "admin")
            ? users
            : users.filter(u => u.id === myId);

        if (visibleUsers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Tidak ada data.</td></tr>`;
            return;
        }

        tableBody.innerHTML = ""; // reset

        visibleUsers.forEach(u => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td style="text-align:center">
                    <input type="checkbox" class="rowCheck" data-id="${u.id}">
                </td>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.domisili || u.email || "-"}</td>
            `;

            tableBody.appendChild(tr);
        });

        log("Data user berhasil dimuat.");

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Gagal memuat data.</td></tr>`;
        log("GAGAL memuat user: " + err.message);
    }
}

/* ----------------------------
   5. DELETE SELECTED
----------------------------- */
async function deleteSelected() {
    const checkboxes = [...document.querySelectorAll(".rowCheck:checked")];
    if (checkboxes.length === 0) {
        alert("Pilih pengguna yang ingin dihapus.");
        return;
    }

    const ids = checkboxes.map(c => c.dataset.id);

    // USER hanya boleh hapus diri sendiri
    if (myRole !== "admin" && ids.some(id => id !== myId)) {
        alert("Anda hanya boleh menghapus akun Anda sendiri.");
        return;
    }

    if (!confirm("Yakin ingin menghapus data terpilih?")) return;

    log("Menghapus ID: " + ids.join(", "));

    try {
        const res = await postJSON("deleteUsers", { ids });
        log("Response: " + JSON.stringify(res));

        if (myRole !== "admin") {
            // user menghapus dirinya sendiri → logout otomatis
            localStorage.removeItem("familyUser");
            alert("Akun Anda sudah dihapus. Anda akan logout.");
            location.href = "login.html";
            return;
        }

        await loadUsers();
    } catch (err) {
        log("Gagal delete: " + err.message);
    }
}

/* ----------------------------
   6. DELETE ALL (ADMIN)
----------------------------- */
async function deleteAll() {
    if (myRole !== "admin") return;

    if (!confirm("⚠️ ADMIN: Yakin ingin menghapus SEMUA user?")) return;

    log("Menghapus semua user...");

    try {
        const res = await postJSON("deleteAll");
        log("Response: " + JSON.stringify(res));

        await loadUsers();
    } catch (err) {
        log("Gagal delete all: " + err.message);
    }
}

/* ----------------------------
   7. EVENTS
----------------------------- */
btnRefresh.addEventListener("click", loadUsers);
btnDeleteSelected.addEventListener("click", deleteSelected);
btnDeleteAll.addEventListener("click", deleteAll);

/* ----------------------------
   8. AUTO LOAD
----------------------------- */
loadUsers();
log("Delete Manager Premium V8 siap.");
