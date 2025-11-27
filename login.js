/**************************************************************
 🔐 LOGIN SYSTEM — FAMILY TREE 2025  
 Full fixed, sinkron dengan dashboard.js & GAS
**************************************************************/

// URL Web App GAS — gunakan URL terbaru milik Anda
const API_URL = "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";

/**************************************************************
 🟦 Login Function
**************************************************************/
async function login() {
  const id = document.getElementById("id").value.trim();
  const pin = document.getElementById("pin").value.trim();

  if (!id || !pin) {
    alert("Masukkan ID dan PIN.");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "login",
        id: id,
        pin: pin
      })
    });

    if (!res.ok) {
      alert("Gagal menghubungi server.");
      return;
    }

    const j = await res.json();
    console.log(j);

    if (j.status !== "success") {
      alert(j.message || "ID atau PIN salah.");
      return;
    }

    /**********************************************************
     🟩 Simpan SESSION (sinkron dengan dashboard.js)
    **********************************************************/
    const session = {
      id: j.id,
      name: j.name,
      role: j.role,
      token: j.token,
      tokenExpiry: j.tokenExpiry
    };

    localStorage.setItem("session", JSON.stringify(session));

    /**********************************************************
     🔄 Redirect ke Dashboard
    **********************************************************/
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    alert("❌ Kesalahan koneksi server saat login.");
  }
}

/**************************************************************
 🔘 Enter untuk login
**************************************************************/
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") login();
});
