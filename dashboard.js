/**************************************************
 *  DASHBOARD.JS — FINAL CLEAN (ANTI LOOP LOGIN)
 **************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";

// =========================
// 🔐 CHECK LOCAL SESSION
// =========================
const user = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!user || !user.token) {
  console.warn("⚠ No local session, redirect login.");
  location.href = "login.html";
}


// =========================
// 🔐 VALIDATE TOKEN KE GAS
// =========================
async function validateSession() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "validateToken",
        token: user.token,
        userId: user.id
      })
    });

    const json = await res.json();

    if (json.status !== "success") {
      console.warn("⚠ Token invalid/expired → redirect login");
      localStorage.removeItem("familyUser");
      return (location.href = "login.html");
    }

    console.log("✅ Token valid. User OK.");
    loadDashboard(); // ← setelah valid, baru load data

  } catch (err) {
    console.error(err);
    alert("Kesalahan koneksi ke server.");
  }
}


// =========================
// 📊 LOAD DASHBOARD DATA
// =========================
async function loadDashboard() {
  document.getElementById("welcome").innerHTML =
    `Halo <b>${user.name}</b> 👋`;

  try {
    const res = await fetch(`${API_URL}?mode=getFamily`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    const json = await res.json();

    if (json.status !== "success") {
      alert("Gagal load data.");
      return;
    }

    renderTable(json.data);

  } catch (err) {
    console.error(err);
  }
}


// =========================
// 🧾 RENDER TABLE
// =========================
function renderTable(data) {
  const tbody = document.getElementById("familyTable");
  tbody.innerHTML = "";

  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.Domisili}</td>
      <td>${row.Relationship}</td>
      <td>${row.Notes || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}


// =========================
// 🚪 LOGOUT
// =========================
function logout() {
  localStorage.removeItem("familyUser");
  location.href = "login.html";
}


// =========================
// ▶ START
// =========================
validateSession();
