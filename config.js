// config.js — FINAL STABIL UNTUK GAS
(function () {

  // ===========================
  // 1. URL API WAJIB BENAR
  // ===========================
  // Ganti hanya jika kamu DEPLYOY ULANG Script Google Apps Script
  window.API_URL = "https://script.google.com/macros/s/AKfycbxZFjqYNCFc5E3zXgBGwg2X8uYkSXr8BbLW7TRVcrVaKx4bKs6QEgIl95VMEfXZLGN2lg/exec";


  // ===========================
  // 2. DEBUG MODE (opsional)
  // ===========================
  window.DEBUG = false; 
  // true = console log banyak
  // false = silent


  // ===========================
  // 3. GLOBAL ERROR HANDLER
  // ===========================
  window.onerror = function (msg, url, line, col, err) {
    console.error("❌ GLOBAL ERROR:", msg, "@", url, ":", line, ":", col);
    if (window.DEBUG && err) console.error(err);
  };


  console.log("⚙️ config.js loaded — API:", window.API_URL);

})();
