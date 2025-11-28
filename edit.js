/* ================================
   EDIT.JS - FINAL SYNC WITH GAS
   ================================ */

import { API_URL } from "./config.js";

let session = JSON.parse(localStorage.getItem("familyUser") || "null");

/* ================================
   VALIDATE LOGIN
================================ */
if (!session || !session.token) {
    alert("⚠ Harap login terlebih dahulu!");
    location.href = "login.html";
}

async function validateToken() {
    try {
        const res = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
        const j = await res.json();
        if (j.status !== "success") logout();
    } catch (e) {
        logout();
    }
}
validateToken();


/* ================================
   GET PARAM ID
================================ */
const params = new URLSearchParams(location.search);
const ID = params.get("id");
if (!ID) {
    alert("ID tidak ditemukan!");
    location.href = "dashboard.html";
}


/* ================================
   LOAD DROPDOWN MEMBERS
================================ */
async function loadMembersDropdown() {
    try {
        const res = await fetch(`${API_URL}?mode=getData`);
        const j = await res.json();

        if (j.status !== "success") return;

        const members = j.data;

        function fillSelect(id) {
            const sel = document.getElementById(id);
            sel.innerHTML = `<option value="">-- Pilih --</option>`;
            members.forEach(p => {
                sel.insertAdjacentHTML(
                    "beforeend",
                    `<option value="${p.id}">${p.name}</option>`
                );
            });
        }

        fillSelect("parentIdAyah");
        fillSelect("parentIdIbu");
        fillSelect("spouseId");

    } catch (e) {
        console.log("Dropdown error:", e);
    }
}


/* ================================
   LOAD DETAIL (AFTER DROPDOWN READY)
================================ */
async function loadDetail() {

    const res = await fetch(`${API_URL}?mode=getOne&id=${ID}`);
    const j = await res.json();

    if (j.status !== "success") {
        alert("Gagal memuat data!");
        return;
    }

    const p = j.data;

    document.getElementById("name").value = p.name;
    document.getElementById("domisili").value = p.domisili;
    document.getElementById("relationship").value = p.relationship;

    document.getElementById("parentIdAyah").value = p.parentIdAyah || "";
    document.getElementById("parentIdIbu").value = p.parentIdIbu || "";
    document.getElementById("spouseId").value = p.spouseId || "";

    document.getElementById("orderChild").value = p.orderChild || "";
    document.getElementById("status").value = p.status || "";
    document.getElementById("notes").value = p.notes || "";
}


/* ================================
   RUN INITIAL LOAD SEQUENCE
================================ */
(async () => {
    await loadMembersDropdown();
    setTimeout(loadDetail, 300); // pastikan dropdown sudah siap
})();


/* ================================
   BASE64 CONVERTER
================================ */
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}


/* ================================
   UPDATE DATA
================================ */
document.getElementById("formEdit").addEventListener("submit", async (e) => {
    e.preventDefault();

    const msg = document.getElementById("msg");
    msg.textContent = "⏳ Menyimpan perubahan...";

    let base64 = "";
    const file = document.getElementById("photo").files[0];
    if (file) base64 = (await toBase64(file)).split(",")[1];

    const payload = {
        mode: "update",
        token: session.token,
        updatedBy: session.name,

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
            msg.textContent = "✅ Perubahan berhasil disimpan!";
            setTimeout(() => location.href = `detail.html?id=${ID}`, 800);
        } else {
            msg.textContent = "❌ Error: " + j.message;
        }

    } catch (err) {
        msg.textContent = "❌ " + err.message;
    }
});


/* ================================
   LOGOUT
================================ */
function logout() {
    fetch(`${API_URL}?mode=logout&token=${session.token}`)
        .finally(() => {
            localStorage.removeItem("familyUser");
            location.href = "login.html";
        });
}
