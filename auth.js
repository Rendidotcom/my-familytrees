// ===================================================
// AUTH.JS UNIVERSAL (TANPA EXPORT) — 100% AMAN
// ===================================================

window.getSession = function () {
  return JSON.parse(localStorage.getItem("familyUser") || "null");
};

window.setSession = function (user) {
  localStorage.setItem("familyUser", JSON.stringify(user));
};

window.clearSession = function () {
  localStorage.removeItem("familyUser");
};

window.validateToken = async function (token) {
  try {
    const res = await fetch(`${API_URL}?mode=validate&token=${token}`);
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (e) {
    return null;
  }
};

// ===================================================
// LOGIN GUARD
// ===================================================
window.requireLogin = function () {
  const user = window.getSession();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
};

// ===================================================
// LOGOUT
// ===================================================
window.logout = function () {
  const user = window.getSession();
  if (user && user.token) {
    fetch(`${API_URL}?mode=logout&token=${user.token}`);
  }
  window.clearSession();
  window.location.href = "login.html";
};

// ===================================================
// NAVBAR
// ===================================================
window.createNavbar = function (active = "") {
  const html = `
    <nav class="nav">
      <a href="dashboard.html" class="${active === 'dashboard' ? 'active' : ''}">📋 Dashboard</a>
      <a href="tree.html" class="${active === 'tree' ? 'active' : ''}">🌳 Tree</a>
      <a href="#" onclick="logout()">🚪 Logout</a>
    </nav>
  `;
  document.body.insertAdjacentHTML("afterbegin", html);
};
