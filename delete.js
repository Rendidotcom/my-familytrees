/* ======================================================
   delete.js — PREMIUM V3 (ADMIN FULL MODE + USER MODE)
   - Works with config.js (window.API_URL)
   - Session: localStorage.familyUser { id, name, role, token }
   - Hard Delete   → POST mode=delete
   - Soft Delete   → POST mode=softdelete  (opsional)
   - Admin:
        ✓ lihat semua user
        ✓ centang banyak
        ✓ hapus banyak
        ✓ hapus semua
   - User biasa:
        ✓ hanya lihat dirinya
        ✓ hanya boleh hapus dirinya
        ✓ auto logout setelah self-delete
====================================================== */

(function () {
  "use strict";
  console.log("DELETE.JS PREMIUM V3 LOADED");

  /************************************************************************
   * URL fix to avoid duplication / confusion
   ************************************************************************/
  try {
    if (location.search && history.replaceState) {
      history.replaceState({}, "", location.origin + location.pathname);
    }
  } catch (e) {}

  /************************************************************************
   * UI Helpers (toast + spinner)
   ************************************************************************/
  function ensureHelpers() {
    if (!document.getElementById("mft-toast")) {
      const t = document.createElement("div");
      t.id = "mft-toast";
      Object.assign(t.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: "99999",
        padding: "10px 14px",
        borderRadius: "10px",
        fontWeight: "600",
        color: "#fff",
        display: "none",
        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
        fontFamily: "system-ui,Segoe UI,Roboto"
      });
      document.body.appendChild(t);
    }

    if (!document.getElementById("mft-spinner")) {
      const s = document.createElement("div");
      s.id = "mft-spinner";
      Object.assign(s.style, {
        position: "fixed",
        left: "50%",
        top: "28%",
        transform: "translateX(-50%)",
        zIndex: "99998",
        padding: "14px 18px",
        borderRadius: "10px",
        background: "white",
        display: "none",
        boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
        fontFamily: "system-ui,Segoe UI,Roboto"
      });
      s.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <svg width="22" height="22" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="8" stroke="#1565c0" stroke-width="4" fill="none" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate"
              from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
          </circle>
        </svg>
        <div style="font-weight:700;color:#333">Memproses...</div>
      </div>`;
      document.body.appendChild(s);
    }
  }
  ensureHelpers();

  function toast(msg, ok = true, ms = 2000) {
    const t = document.getElementById("mft-toast");
    t.style.background = ok ? "#2e7d32" : "#c62828";
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => (t.style.display = "none"), ms);
  }

  const spinner = show => (document.getElementById("mft-spinner").style.display = show ? "block" : "none");

  const busy = (btns, on) =>
    btns.forEach(b => b && (b.disabled = on));

  const escapeHtml = s =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  /************************************************************************
   * SESSION
   ************************************************************************/
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem("familyUser") || "null");
  } catch (e) {}

  if (!session || !session.token) {
    alert("Sesi tidak ditemukan. Silakan login ulang.");
    location.href = "login.html";
    return;
  }

  const MY_ID = String(session.id);
  const MY_ROLE = (session.role || "user").toLowerCase();
  const TOKEN = session.token;

  /************************************************************************
   * DOM
   ************************************************************************/
  const tbody =
    document.querySelector("#userTableBody") ||
    document.querySelector("#userTable tbody") ||
    document.querySelector("#tbl tbody");

  if (!tbody) {
    toast("Tabel user tidak ditemukan!", false, 3000);
    return;
  }

  const btnRefresh =
    document.querySelector("#refreshBtn") ||
    document.querySelector("#btnRefresh");

  const btnDeleteSelected =
    document.querySelector("#deleteSelectedBtn") ||
    document.querySelector("#btnDeleteSelected");

  const btnDeleteAll =
    document.querySelector("#deleteAllBtn") ||
    document.querySelector("#btnDeleteAll");

  const btnSoftDelete =
    document.querySelector("#softDeleteBtn") ||
    null; // opsional

  /************************************************************************
   * safeFetch POST
   ************************************************************************/
  async function postAPI(payload = {}) {
    try {
      const res = await fetch(window.API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
      const txt = await res.text();
      try {
        return { ok: true, json: JSON.parse(txt) };
      } catch {
        return { ok: false, raw: txt };
      }
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  /************************************************************************
   * LOAD USERS
   ************************************************************************/
  function drawLoading() {
    tbody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;padding:16px;color:#666">Memuat data...</td></tr>`;
  }

  function renderRows(arr) {
    if (!arr.length) {
      tbody.innerHTML =
        `<tr><td colspan="4" style="text-align:center;padding:16px">Tidak ada data.</td></tr>`;
      return;
    }

    tbody.innerHTML = arr
      .map(u => {
        const id = u.id ?? u.ID ?? "";
        const name = u.name ?? u.nama ?? "-";
        const email = u.email ?? u.domisili ?? "-";

        const canCheck =
          MY_ROLE === "admin" || String(id) === MY_ID;

        return `
        <tr>
          <td style="width:1%;text-align:center">
            <input type="checkbox" class="mft-chk"
              value="${escapeHtml(id)}"
              ${canCheck ? "" : "disabled"}>
          </td>
          <td>${escapeHtml(id)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(email)}</td>
        </tr>`;
      })
      .join("");
  }

  async function loadUsers() {
    spinner(true);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], true);
    drawLoading();

    const res = await postAPI({ mode: "list", token: TOKEN });

    if (res.ok && Array.isArray(res.json)) {
      const full = res.json;
      const visible =
        MY_ROLE === "admin"
          ? full
          : full.filter(u => String(u.id ?? u.ID) === MY_ID);

      renderRows(visible);
    } else {
      tbody.innerHTML =
        `<tr><td colspan="4" style="text-align:center;padding:16px">Gagal memuat data.</td></tr>`;
      toast("Format response server tidak sesuai!", false);
    }

    spinner(false);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], false);
  }

  /************************************************************************
   * DELETE FUNCTION: HARD DELETE
   ************************************************************************/
  async function hardDelete(id) {
    return await postAPI({
      mode: "delete",
      token: TOKEN,
      id: id
    });
  }

  /************************************************************************
   * SOFT DELETE (opsional)
   ************************************************************************/
  async function softDelete(id) {
    return await postAPI({
      mode: "softdelete",
      token: TOKEN,
      id: id
    });
  }

  /************************************************************************
   * BUTTON HANDLERS
   ************************************************************************/
  async function deleteSelectedHandler() {
    const ids = [...document.querySelectorAll(".mft-chk:checked")].map(i => i.value);
    if (!ids.length) return alert("Tidak ada user dipilih.");

    // USER MODE → hanya boleh hapus dirinya
    if (MY_ROLE !== "admin") {
      const wrong = ids.filter(x => x !== MY_ID);
      if (wrong.length) return alert("Anda hanya bisa menghapus akun Anda sendiri.");
    }

    if (!confirm(`Hapus ${ids.length} user terpilih?`)) return;

    spinner(true);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], true);

    for (const id of ids) {
      const r = await hardDelete(id);

      if (!r.ok || (r.json.status !== "success" && !r.json.status)) {
        toast(`Gagal hapus ID ${id}`, false);
        spinner(false);
        busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], false);
        return;
      }

      // self delete
      if (id === MY_ID && MY_ROLE !== "admin") {
        localStorage.removeItem("familyUser");
        alert("Akun Anda telah dihapus. Anda akan dialihkan ke login.");
        return (location.href = "login.html");
      }
    }

    toast("Penghapusan selesai.");
    await loadUsers();

    spinner(false);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], false);
  }

  async function deleteAllHandler() {
    if (MY_ROLE !== "admin") return alert("Hanya admin yang bisa hapus semua user.");

    if (!confirm("⚠ Hapus SEMUA user? Tidak bisa dibatalkan!")) return;

    spinner(true);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], true);

    const list = await postAPI({ mode: "list", token: TOKEN });
    if (!list.ok || !Array.isArray(list.json)) {
      toast("Gagal mengambil list user.", false);
      spinner(false);
      busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], false);
      return;
    }

    for (const u of list.json) {
      const id = u.id ?? u.ID;
      if (!id) continue;
      await hardDelete(id);
    }

    toast("Semua user dihapus.");
    await loadUsers();

    spinner(false);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], false);
  }

  async function softDeleteSelectedHandler() {
    const ids = [...document.querySelectorAll(".mft-chk:checked")].map(i => i.value);
    if (!ids.length) return alert("Tidak ada user dipilih.");

    if (MY_ROLE !== "admin") {
      const wrong = ids.filter(x => x !== MY_ID);
      if (wrong.length) return alert("Anda hanya dapat soft delete akun Anda sendiri.");
    }

    if (!confirm(`Soft delete ${ids.length} user?`)) return;

    spinner(true);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], true);

    for (const id of ids) {
      const r = await softDelete(id);

      if (!r.ok) {
        toast(`Soft delete gagal ID ${id}`, false);
        spinner(false);
        busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], false);
        return;
      }

      if (id === MY_ID && MY_ROLE !== "admin") {
        localStorage.removeItem("familyUser");
        alert("Akun Anda telah dihapus. Dialihkan ke login.");
        return (location.href = "login.html");
      }
    }

    toast("Soft delete selesai.");
    await loadUsers();

    spinner(false);
    busy([btnRefresh, btnDeleteSelected, btnDeleteAll, btnSoftDelete], false);
  }

  /************************************************************************
   * WIRE EVENTS
   ************************************************************************/
  btnRefresh && btnRefresh.addEventListener("click", loadUsers);
  btnDeleteSelected && btnDeleteSelected.addEventListener("click", deleteSelectedHandler);
  btnDeleteAll && btnDeleteAll.addEventListener("click", deleteAllHandler);
  btnSoftDelete && btnSoftDelete.addEventListener("click", softDeleteSelectedHandler);

  // USER MODE → hide delete all
  if (MY_ROLE !== "admin") {
    if (btnDeleteAll) btnDeleteAll.style.display = "none";
  }

  // AUTO LOAD
  setTimeout(loadUsers, 70);

})();
