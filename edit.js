// ==========================
// IMPORT CONFIG
// ==========================
import { API_URL } from "./config.js";

console.log("edit.js loaded OK");

// ==========================
// CHECK SESSION
// ==========================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
    alert("⚠ Harap login terlebih dahulu!");
    location.href = "login.html";
}

// ==========================
// VALIDATE TOKEN
// ==========================
async function validateToken() {
    try {
        const r = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
        const j = await r.json();
        if (j.status !== "success") logout();
    } catch (e) {
        logout();
    }
}
validateToken();

// ==========================
// AMBIL PARAMETER ID 
// ==========================
const params = new URLSearchParams(location.search);
const ID = params.get("id");
if (!ID) {
    alert("ID tidak ditemukan!");
    location.href = "dashboard.html";
}

// ==========================
// LOAD DROPDOWN ANGGOTA
// ==========================
async function loadMembersDropdown(members) {
    const selects = ["parentIdAyah", "parentIdIbu", "spouseId"];

    selects.forEach(sel => {
        document.getElementById(sel).innerHTML = `<option value="">-- Pilih --</option>`;
    });

    members.forEach(m => {
        selects.forEach(sel => {
            document.getElementById(sel).insertAdjacentHTML(
                "beforeend",
                `<option value="${m.id}">${m.name}</option>`
            );
        });
    });
}

// ==========================
// LOAD DETAIL DATA
// ==========================
async function loadDetail() {
    try {
        const res = await fetch(`${API_URL}?mode=getData`);
        const j = await res.json();

        if (j.status !== "success") {
            alert("Gagal memuat data!");
            return;
        }

        const members = j.data;
        await loadMembersDropdown(members);

        const p = members.find(x => x.id == ID);
        if (!p) {
            alert("Data tidak ditemukan.");
            return;
        }

        // Isi form
        document.getElementById("name").value = p.name;
        document.getElementById("domisili").value = p.domisili;
        document.getElementById("relationship").value = p.relationship;
        document.getElementById("parentIdAyah").value = p.parentIdAyah || "";
        document.getElementById("parentIdIbu").value = p.parentIdIbu || "";
        document.getElementById("spouseId").value = p.spouseId || "";
        document.getElementById("orderChild").value = p.orderChild || "";
        document.getElementById("status").value = p.status || "";
        document.getElementById("notes").value = p.notes || "";

    } catch (err) {
        alert("Kesalahan memuat data: " + err.message);
    }
}

loadDetail();

// ==========================
// FILE → BASE64
// ==========================
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

// ==========================
// SUBMIT UPDATE
// ==========================
document.getElementById("formEdit").addEventListener("submit", async e => {
    e.preventDefault();

    const msg = document.getElementById("msg");
    msg.textContent = "⏳ Menyimpan...";

    let base64 = "";
    const file = document.getElementById("photo").files[0];
    if (file) base64 = (await toBase64(file)).split(",")[1];

    const payload = {
        mode: "updateMember",     // ← sesuai GAS
        token: session.token,
        id: ID,

        name: document.getElementById("name").value.trim(),
        domisili: document.getElementById("domisili").value.trim(),
        relationship: document.getElementById("relationship").value,
        parentIdAyah: document.getElementById("parentIdAyah").value,
        parentIdIbu: document.getElementById("parentIdIbu").value,
        spouseId: document.getElementById("spouseId").value,
        orderChild: document.getElementById("orderChild").value,
        status: document.getElementById("status").value,
        notes: document.getElementById("notes").value.trim(),

        photo_base64: base64,
        photo_type: file ? file.type : ""
    };

    try {
        const r = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const j = await r.json();

        if (j.status === "success") {
            msg.textContent = "✅ Berhasil disimpan!";
            setTimeout(() => location.href = `detail.html?id=${ID}`, 600);
        } else {
            msg.textContent = "❌ Error: " + j.message;
        }

    } catch (err) {
        msg.textContent = "❌ " + err.message;
    }
});

// ==========================
// LOGOUT
// ==========================
function logout() {
    fetch(`${API_URL}?mode=logout&token=${session.token}`)
        .finally(() => {
            localStorage.removeItem("familyUser");
            location.href = "login.html";
        });
}
