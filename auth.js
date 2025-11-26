// ===============================
// AUTH GUARD
// ===============================
export function requireLogin() {
  const user = JSON.parse(localStorage.getItem("familyUser") || "null");
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

// ===============================
// LOGOUT
// ===============================
export function logout() {
  const user = JSON.parse(localStorage.getItem("familyUser") || "{}");

  fetch(`${API_URL}?mode=logout&token=${user.token}`);

  localStorage.removeItem("familyUser");
  window.location.href = "login.html";
}

// ===============================
// NAVBAR
// ===============================
export function createNavbar(active = "") {
  const nav = `
    <nav class="nav">
      <a href="dashboard.html" class="${active === "dashboard" ? "active": ""}">📋 Dashboard</a>
      <a href="tree.html" class="${active === "tree" ? "active": ""}">🌳 Tree</a>
      <a href="#" onclick="logout()">🚪 Logout</a>
    </nav>
  `;
  document.body.insertAdjacentHTML("afterbegin", nav);
}
