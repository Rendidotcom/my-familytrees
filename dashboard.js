// dashboard.js — FINAL VERSION
// Pastikan config.js diload lebih dulu di HTML
// <script src="config.js"></script>
// <script src="dashboard.js"></script>

console.log("📁 dashboard.js loaded");
console.log("➡ API_URL from config.js =", window.API_URL);

// Elemen target
const tableBody = document.querySelector("#data-table tbody");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error-box");

// -----------------------------
// Fetch Data dari Google Apps Script
// -----------------------------
async function loadData() {
  console.log("⏳ Mengambil data dari GAS...");

  loader.style.display = "block";
  errorBox.style.display = "none";

  try {
    const response = await fetch(window.API_URL + "?action=getData", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("HTTP Error: " + response.status);
    }

    const result = await response.json();
    console.log("📦 Data diterima:", result);

    if (!result || !result.data) {
      throw new Error("Format data tidak valid dari GAS");
    }

    renderTable(result.data);

  } catch (err) {
    console.error("❌ ERROR:", err);
    errorBox.innerText = "Gagal memuat data: " + err.message;
    errorBox.style.display = "block";
  } finally {
    loader.style.display = "none";
  }
}

// -----------------------------
// Render Table
// -----------------------------
function renderTable(rows) {
  tableBody.innerHTML = "";

  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:20px;">
          Tidak ada data
        </td>
      </tr>
    `;
    return;
  }

  rows.forEach((row, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${row.tanggal || ""}</td>
      <td>${row.nama || ""}</td>
      <td>${row.toko || ""}</td>
      <td>${row.alamat || ""}</td>
      <td>${row.hp || ""}</td>
      <td>${row.barang || ""}</td>
      <td>${row.qty || ""}</td>
      <td>${row.catatan || ""}</td>
      <td>${row.status || ""}</td>
    `;

    tableBody.appendChild(tr);
  });

  console.log("📋 Tabel selesai dirender:", rows.length, "rows");
}

// -----------------------------
// Reload Button
// -----------------------------
document.getElementById("reload-btn").addEventListener("click", () => {
  console.log("🔄 Reload ditekan");
  loadData();
});

// -----------------------------
// Auto Load saat page dibuka
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Page loaded, mulai load data…");
  loadData();
});
