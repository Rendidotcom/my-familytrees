// =======================
// CONFIG
// =======================
const API_URL = "https://script.google.com/macros/s/AKfycbyqxxxxxxx/exec"; 
// ganti dengan URL GAS kamu yang benar

// =======================
// Ambil ID dari URL
// =======================
const urlParams = new URLSearchParams(window.location.search);
const memberId = urlParams.get("id");

if (!memberId) {
    document.getElementById("status").innerHTML =
        `<span style="color:red;">❌ ID tidak ditemukan!</span>`;
}

// =======================
// LOAD DATA SAAT HALAMAN DIBUKA
// =======================
async function loadData() {
    try {
        const res = await fetch(`${API_URL}?action=getById&id=${memberId}`);
        const data = await res.json();

        if (!data || !data.success) {
            document.getElementById("status").innerHTML =
                `<span style="color:red;">❌ Error memuat data!</span>`;
            return;
        }

        // Isi form
        document.getElementById("id").value = data.data.id;
        document.getElementById("nama").value = data.data.nama;
        document.getElementById("domisili").value = data.data.domisili;
        document.getElementById("hubungan").value = data.data.hubungan;
        document.getElementById("aktor").value = data.data.aktor;

    } catch (err) {
        console.error(err);
        document.getElementById("status").innerHTML =
            `<span style="color:red;">❌ Gagal memuat data!</span>`;
    }
}

loadData();

// =======================
// SIMPAN PERUBAHAN
// =======================
document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        action: "update",
        id: document.getElementById("id").value,
        nama: document.getElementById("nama").value,
        domisili: document.getElementById("domisili").value,
        hubungan: document.getElementById("hubungan").value,
        aktor: document.getElementById("aktor").value,
    };

    document.getElementById("status").innerHTML = "⏳ Menyimpan...";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(formData),
        });

        const result = await res.json();

        if (result.success) {
            document.getElementById("status").innerHTML =
                `<span style="color:green;">✔️ Data berhasil diperbarui!</span>`;

            // redirect 1 detik
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } else {
            document.getElementById("status").innerHTML =
                `<span style="color:red;">❌ Gagal menyimpan!</span>`;
        }
    } catch (err) {
        console.error(err);
        document.getElementById("status").innerHTML =
            `<span style="color:red;">❌ Terjadi kesalahan saat menyimpan!</span>`;
    }
});
