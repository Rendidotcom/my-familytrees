// ======================================================
// config.js — STABLE SYNC VERSION (recommended)
// ======================================================

(function () {
  // ===============================
  //  SETTING API URL
  // ===============================
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzyQzbKwHKgjOAQWWYs4loX7YadF75CSVpUdvjtoflcx1ri699KfcYZSU4rqFzXWFhfUw/exec";

  // Jadikan global
  window.API_URL = API_URL;
  window.API_STATUS = "online";

  // Log
  console.log(
    "%cCONFIG LOADED",
    "background:#0d47a1;color:white;padding:4px;border-radius:4px",
    "API_URL:", API_URL
  );
})();
