// =========================
// 🔐 PROTECT PAGE
// =========================
const user = JSON.parse(localStorage.getItem("familyUser") || "null");

if (!user) {
  window.location.href = "login.html";
}


// =========================
// 🚪 LOGOUT FUNCTION
// =========================
function logout() {
  localStorage.removeItem("familyUser");
  alert("👋 Anda telah logout.");
  window.location.href = "login.html";
}


// =========================
// 🧭 NAV BAR MAKER
// =========================
function createNavbar(activePage = "") {
  const nav = document.createElement("div");
  nav.style.display = "flex";
  nav.style.justifyContent = "space-around";
  nav.style.background = "#1e88e5";
  nav.style.padding = "12px";
  nav.style.marginBottom = "15px";
  nav.style.borderRadius = "0 0 10px 10px";
  nav.style.color = "white";
  nav.style.fontSize = "16px";

  nav.innerHTML = `
    <button onclick="location.href='dashboard.html'" style="background:none;border:none;color:${activePage==='dashboard'?'yellow':'white'};font-weight:bold;cursor:pointer">📋 Dashboard</button>
    
    <button onclick="location.href='tree.html'" style="background:none;border:none;color:${activePage==='tree'?'yellow':'white'};font-weight:bold;cursor:pointer">🌳 Family Tree</button>

    <button onclick="logout()" style="background:none;border:none;color:red;font-weight:bold;cursor:pointer">🚪 Logout</button>
  `;

  document.body.prepend(nav);
}
