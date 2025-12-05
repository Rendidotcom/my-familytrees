console.log("DELETE.JS LOADED");

document.addEventListener("DOMContentLoaded", loadUsers);

async function loadUsers() {
    const session = JSON.parse(localStorage.getItem("familyUser") || "null");
    if (!session) {
        alert("Silakan login kembali.");
        location.href = "login.html";
        return;
    }

    const token = session.token;
    const url = `${API_URL}?mode=list&token=${token}`;

    console.log("[FETCH] URL:", url);

    try {
        const res = await fetch(url);

        // Fallback: jika bukan JSON, baca text dulu
        let raw = await res.text();
        console.log("[RAW RESPONSE]:", raw);

        let json;
        try {
            json = JSON.parse(raw);
        } catch (e) {
            throw new Error("Response tidak valid dari GAS");
        }

        if (!json.success || !Array.isArray(json.data)) {
            throw new Error("Format JSON tidak sesuai");
        }

        renderTable(json.data);

    } catch (err) {
        console.error("LOAD ERROR", err);
        alert("Gagal memuat data. Cek console untuk detail.");
    }
}

function renderTable(users) {
    const tbody = document.getElementById("userTableBody");
    if (!tbody) {
        console.error("ERROR: Elemen #userTableBody tidak ditemukan");
        return;
    }

    tbody.innerHTML = "";

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="4" style="text-align:center; padding:15px;">Tidak ada data</td></tr>
        `;
        return;
    }

    users.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td><input type="checkbox" class="selectUser" data-id="${u.id}"></td>
                <td>${u.id}</td>
                <td>${u.name || "-"}</td>
                <td>${u.email || "-"}</td>
            </tr>
        `;
    });
}


// =============================
// HAPUS TERPILIH
// =============================
document.getElementById("btnDeleteSelected")?.addEventListener("click", async () => {
    const selected = [...document.querySelectorAll(".selectUser:checked")]
        .map(x => x.dataset.id);

    if (selected.length === 0) return alert("Tidak ada user terpilih.");

    if (!confirm(`Hapus ${selected.length} akun?`)) return;

    await deleteUsers(selected);
});


// =============================
// HAPUS SEMUA
// =============================
document.getElementById("btnDeleteAll")?.addEventListener("click", async () => {
    if (!confirm("Hapus SEMUA user? Ini tidak bisa dibatalkan.")) return;

    const all = [...document.querySelectorAll(".selectUser")].map(x => x.dataset.id);

    await deleteUsers(all);
});


// =============================
// FUNGSI HAPUS
// =============================
async function deleteUsers(ids) {
    const session = JSON.parse(localStorage.getItem("familyUser") || "null");
    if (!session) return alert("Session hilang!");

    const token = session.token;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                mode: "deleteBatch",
                token,
                ids
            })
        });

        const raw = await res.text();
        console.log("[RAW DELETE RESPONSE]:", raw);

        let json;
        try {
            json = JSON.parse(raw);
        } catch (e) {
            throw new Error("Response JSON delete tidak valid");
        }

        if (!json.success) {
            alert("Gagal menghapus: " + (json.message || "unknown error"));
            return;
        }

        alert("Berhasil menghapus!");
        loadUsers();

    } catch (err) {
        console.error("DELETE ERROR", err);
        alert("Gagal menghapus. Lihat console.");
    }
}
