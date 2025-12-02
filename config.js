// ======================================================
// config.js — ADVANCED SMART VERSION
// ======================================================

(function () {
  // ------------------------------------------------------
  // 1. Daftar endpoint API (utama + mirror)
  // ------------------------------------------------------
  const ENDPOINTS = [
    // Endpoint utama GAS (yang kamu pakai sekarang)
    "https://script.google.com/macros/s/AKfycbxZFjqYNCFc5E3zXgBGwg2X8uYkSXr8BbLW7TRVcrVaKx4bKs6QEgIl95VMEfXZLGN2lg/exec",

    // Optional: endpoint mirror (boleh dikosongkan jika tidak punya)
    // "__MIRROR_URL_HERE__"
  ];

  // ------------------------------------------------------
  // 2. Timeout fetch 2.8 detik (supaya GAS tidak lama menggantung)
  // ------------------------------------------------------
  function fetchWithTimeout(url, options = {}, timeout = 2800) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeout)
      ),
    ]);
  }

  // ------------------------------------------------------
  // 3. Uji endpoint satu per satu sampai ada yang “hidup”
  // ------------------------------------------------------
  async function testEndpoint(url) {
    try {
      const res = await fetchWithTimeout(url + "?mode=pulse&nc=" + Date.now());

      if (!res.ok) throw new Error("bad response");
      const json = await res.json();

      return json.status === "ok"; // GAS return {status:"ok"} pada mode=pulse
    } catch (err) {
      return false;
    }
  }

  // ------------------------------------------------------
  // 4. Pilih endpoint terbaik
  // ------------------------------------------------------
  async function detectAPI() {
    for (const url of ENDPOINTS) {
      const ok = await testEndpoint(url);

      if (ok) {
        window.API_URL = url;
        window.API_STATUS = "online";

        console.log(
          "%cAPI READY",
          "background:#00c853;color:white;padding:4px;border-radius:4px",
          "→",
          url
        );

        return;
      }
    }

    // Jika semua endpoint mati
    window.API_URL = ENDPOINTS[0];
    window.API_STATUS = "offline";

    console.log(
      "%cAPI OFFLINE",
      "background:#d50000;color:white;padding:4px;border-radius:4px",
      "Semua endpoint gagal. Sistem tetap memakai endpoint utama.",
      ENDPOINTS[0]
    );
  }

  // ------------------------------------------------------
  // 5. Mulai proses deteksi
  // ------------------------------------------------------
  detectAPI();

  // Gunakan ini dari file lain:
  // window.API_URL
  // window.API_STATUS → "online" / "offline"

})();
