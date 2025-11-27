const API_URL = "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";

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
      body: JSON.stringify({
        mode: "login",
        id: id,
        pin: pin
      })
    });

    const j = await res.json();
    console.log(j);

    if (j.status !== "success") {
      alert(j.message || "Login gagal");
      return;
    }

    const userData = {
      id: j.id,
      name: j.name,
      role: j.role,
      token: j.token,
      tokenExpiry: j.tokenExpiry
    };

    localStorage.setItem("familyUser", JSON.stringify(userData));
    window.location.href = "dashboard.html";

  } catch (err) {
    alert("Kesalahan koneksi server saat login.");
  }
}
