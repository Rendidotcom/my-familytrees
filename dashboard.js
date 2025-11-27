import { API_URL } from "./config.js";
import { getSession, validateToken, createNavbar } from "./session.js";

/* ---------------------------------------------------
   LOAD DASHBOARD
--------------------------------------------------- */

window.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  const session = getSession();
  if (!session || !session.token) {
    return (window.location.href = "login.html");
  }

  createNavbar("dashboard");

  document.getElementById("status").innerHTML = "Validating login...";

  // Validate token ke server GAS
  const check = await validateToken(session.token);
  if (!check.valid) {
    document.getElementById("status").innerHTML =
      "<span style='color:red'>Session expired. Please login again.</span>";
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  // tampilkan nama user
  document.getElementById("userInfo").innerText =
    `👤 ${check.data.name} (${check.data.role})`;

  // Load data family
  loadFamilyData();
}

/* ---------------------------------------------------
   GET DATA FAMILY
--------------------------------------------------- */
async function loadFamilyData() {
  const container = document.getElementById("dataContainer");
  container.innerHTML = "Loading family members...";

  try {
    const res = await fetch(`${API_URL}?mode=getData`);
    const json = await res.json();

    if (json.status !== "success") {
      container.innerHTML = "<span style='color:red'>Failed to load data.</span>";
      return;
    }

    const data = json.data;

    if (!data || data.length === 0) {
      container.innerHTML = "<i>No data found.</i>";
      return;
    }

    // Build table
    let html = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Gender</th>
            <th>Birth</th>
            <th>Father</th>
            <th>Mother</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach(row => {
      html += `
        <tr>
          <td>${row.name}</td>
          <td>${row.gender}</td>
          <td>${row.birth || "-"}</td>
          <td>${row.father || "-"}</td>
          <td>${row.mother || "-"}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";

    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML =
      "<span style='color:red'>Error loading data from server.</span>";
  }
}
