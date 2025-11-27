// =========================
// 🔧 CONFIG
// =========================
const API_URL = "https://script.google.com/macros/s/AKfycbxhEHvZQchk6ORKUjmpgwGVpYLbSZ8bYyDF0QgjKruUgz-M_0EMW7pCJ2m5mcuNkwjzXg/exec";

// =========================
// 🔐 CHECK SESSION
// =========================
const session = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!session || !session.token) {
  window.location.href = "login.html";
}

// =========================
// 🚪 LOGOUT
// =========================
function logout() {
  localStorage.removeItem("familyUser");
  window.location.href = "login.html";
}

// =========================
// 🧭 NAVBAR
// =========================
function createNavbar(active = "") {
  const nav = `
    <div style="
      display:flex;
      justify-content:space-around;
      background:#1e88e5;
      padding:12px;
      margin-bottom:15px;
      border-radius:0 0 10px 10px;
      color:white;">
      
      <button onclick="location.href='dashboard.html'" 
        style="background:none;border:none;color:${active==='dashboard'?'yellow':'white'};font-weight:bold">📋 Dashboard</button>

      <button onclick="location.href='tree.html'" 
        style="background:none;border:none;color:${active==='tree'?'yellow':'white'};font-weight:bold">🌳 Tree</button>

      <button onclick="logout()"
        style="background:none;border:none;color:red;font-weight:bold">🚪 Logout</button>
    </div>
  `;
  document.body.insertAdjacentHTML("afterbegin", nav);
}
