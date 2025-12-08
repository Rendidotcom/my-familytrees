/* ============================================================
   DELETE.JS — PREMIUM V8 FINAL
   - Sinkron dengan delete.html Premium V8
   - Multi delete
   - Delete All (Admin only)
   - Auto self-delete logout
   - Supports tryDeleteVariants()
   - Debug logger
============================================================= */

console.log("Delete.js Premium V8 Loaded");


// ============================================================
// GLOBAL
// ============================================================
const session = JSON.parse(localStorage.getItem("familyUser") || "null");
if (!session) {
    alert("Sesi login habis. Silakan login ulang.");
    location.href = "login.html";
}
const token = session.token;
const sessionId = session.id;
const role = session.role;

const logBox = document.getElementById("mftLog");


// ============================================================
// LOGGER
// ============================================================
function log(msg) {
    const t = new Date().toLocaleTimeString();
    logBox.textContent += `\n[${t}] ${msg}`;
    logBox.scrollTop = logBox.scrollHeight;
}


// ============================================================
// GENERIC CORS-PROTECTED FETCH TO GAS HTML-SHELL
// ============================================================
async function fetchRaw(url, opts = {}) {
    try {
        log("POST → " + url);

        const r = await fetch(url, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(opts.body || {})
        });

        const json = await r.json();
        log("Response: " + JSON.stringify(json));
        return json;

    } catch (e) {
        log("ERROR fetchRaw: " + e);
        return { ok: false, error: e.toString() };
    }
}



// ============================================================
// TRY DELETE VARIANTS — Premium V8
// ============================================================
async function tryDeleteVariants(id) {
    const urlList = [
        `${API_URL}?mode=deleteMember&id=${id}&token=${token}`,
        `${API_URL}?mode=delete&id=${id}&token=${token}`,
        `${API_URL}?action=delete&id=${id}&token=${token}`,
        `${API_URL}?mode=hardDelete&id=${id}&token=${token}`,
        `${API_URL}?id=${id}&mode=delete&token=${token}`
    ];

    for (const u of urlList) {
        log("Mencoba delete variant: " + u);

        const res = await fetchRaw(u, { body: { id, token } });

        if (res?.ok === true) {
            log("Delete Sukses via variant: " + u);
            return res;
        }
    }

    return { ok: false, message: "Semua varian delete gagal." };
}



// ============================================================
// LOAD USER LIST
// ============================================================
async function loadUsers() {
    log("Memuat data user...");

    const roleBadge = document.getElementById("roleBadge");
    roleBadge.innerText = "ROLE: " + role.toUpperCase();

    let url = `${API_URL}?mode=listUsers&token=${token}`;
    if (role !== "admin") {
        url = `${API_URL}?mode=getUser&id=${sessionId}&token=${token}`;
    }

    const res = await fetchRaw(url);

    const body = document.getElementById("userTableBody");
    body.innerHTML = "";

    if (!res.ok) {
        body.innerHTML = `<tr><td colspan="4" style="text-align:center;">Gagal memuat data.</td></tr>`;
        return;
    }

    const data = Array.isArray(res.data) ? res.data : [res.data];

    if (data.length === 0) {
        body.innerHTML = `<tr><td colspan="4" style="text-align:center;">Tidak ada user ditemukan.</td></tr>`;
        return;
    }

    data.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td style="text-align:center">
                <input type="checkbox" class="chkDel" data-id="${u.id}">
            </td>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.address || u.email || "-"}</td>
        `;

        body.appendChild(tr);
    });

    // USER BIASA → disable semua checkbox kecuali dirinya
    if (role !== "admin") {
        document.querySelectorAll(".chkDel").forEach(chk => {
            if (chk.dataset.id !== sessionId) {
                chk.disabled = true;
            }
        });
    }

    log("Data selesai dimuat.");
}



// ============================================================
// DELETE SINGLE
// ============================================================
async function deleteSingle(id) {
    log("Menghapus ID: " + id);

    const res = await tryDeleteVariants(id);

    if (res.ok) {
        if (id === sessionId) {
            log("User menghapus dirinya → Auto logout");
            localStorage.removeItem("familyUser");
            setTimeout(() => (location.href = "login.html"), 1200);
        }
    }

    return res.ok;
}



// ============================================================
// DELETE SELECTED
// ============================================================
async function deleteSelected() {
    const checks = document.querySelectorAll(".chkDel:checked");

    if (checks.length === 0) {
        alert("Tidak ada user dipilih.");
        return;
    }

    if (!confirm("Yakin ingin menghapus user terpilih?")) return;

    for (const chk of checks) {
        const id = chk.dataset.id;

        // User biasa hanya boleh hapus dirinya
        if (role !== "admin" && id !== sessionId) {
            log("User biasa tidak boleh hapus ID: " + id);
            continue;
        }

        await deleteSingle(id);
    }

    loadUsers();
}



// ============================================================
// DELETE ALL USERS (ADMIN ONLY)
// ============================================================
async function deleteAll() {
    if (role !== "admin") {
        alert("Hanya admin!");
        return;
    }

    if (!confirm("Yakin ingin HAPUS SEMUA USER? Ini tidak bisa dibatalkan!")) return;

    const checks = document.querySelectorAll(".chkDel");
    for (const chk of checks) {
        const id = chk.dataset.id;
        await deleteSingle(id);
    }

    loadUsers();
}



// ============================================================
// EVENT LISTENERS
// ============================================================
document.getElementById("refreshBtn").onclick = loadUsers;
document.getElementById("deleteSelectedBtn").onclick = deleteSelected;
document.getElementById("deleteAllBtn").onclick = deleteAll;

// Init load
setTimeout(loadUsers, 300);

