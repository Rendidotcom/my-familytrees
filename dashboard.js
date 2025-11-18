// ===============================
// DASHBOARD.JS FINAL VERSION
// ===============================

// UBAH ke URL API Anda
const API_URL = "https://YOUR-API-ENDPOINT/get-all"; 

// Convert link Google Drive menjadi gambar langsung
function convertDriveURL(url) {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
        const id = url.match(/\/d\/(.*?)\//)?.[1];
        return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
    }
    return url;
}

// Fetch data dari API
async function loadFamilyData() {
    try {
        const res = await fetch(API_URL);
        const json = await res.json();

        if (json.status !== "success") {
            console.error("API error:", json);
            return;
        }

        const data = json.data;
        renderTable(data);
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

// Membuat map ID → object (untuk relasi)
function createIdMap(data) {
    const map = {};
    data.forEach(item => {
        map[item.id] = item;
    });
    return map;
}

// Render tampilan
function renderTable(data) {
    const idMap = createIdMap(data);
    const container = document.getElementById("family-list");
    container.innerHTML = "";

    data.sort((a, b) => a.rowIndex - b.rowIndex);

    data.forEach(person => {
        const photo = convertDriveURL(person.photoURL);

        // Ambil relasi
        const ayah = idMap[person.parentIdAyah]?.name || "-";
        const ibu = idMap[person.parentIdIbu]?.name || "-";
        const spouse = idMap[person.spouseId]?.name || "-";

        // Cari anak (reverse lookup)
        const children = data
            .filter(p => p.parentIdAyah == person.id || p.parentIdIbu == person.id)
            .map(c => c.name)
            .join(", ") || "-";

        // Card UI
        const card = `
            <div class="card">
                <img src="${photo || 'default.png'}" class="photo"/>
                
                <div class="info">
                    <h3>${person.name}</h3>
                    <p><b>Domisili:</b> ${person.domisili}</p>
                    <p><b>Hubungan:</b> ${person.relationship}</p>
                    <p><b>Ayah:</b> ${ayah}</p>
                    <p><b>Ibu:</b> ${ibu}</p>
                    <p><b>Pasangan:</b> ${spouse}</p>
                    <p><b>Anak:</b> ${children}</p>
                </div>
            </div>
        `;

        container.innerHTML += card;
    });
}

// Jalankan saat halaman dibuka
document.addEventListener("DOMContentLoaded", loadFamilyData);
