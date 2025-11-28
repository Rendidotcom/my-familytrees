// edit.js — clean, robust, sinkron dengan GAS (Sheet1)
// Pastikan edit.html sudah menyertakan config (window.API_URL)

(async () => {
  const API_URL = window.API_URL; // harus disediakan oleh edit.html via config.js
  const msgEl = document.getElementById("msg");
  const form = document.getElementById("formEdit");
  const params = new URLSearchParams(location.search);
  const ID = params.get("id");

  // DOM shortcuts
  const $ = id => document.getElementById(id);
  const nameEl = $("name");
  const domisiliEl = $("domisili");
  const relationshipEl = $("relationship");
  const parentIdAyahEl = $("parentIdAyah");
  const parentIdIbuEl = $("parentIdIbu");
  const spouseIdEl = $("spouseId");
  const orderChildEl = $("orderChild");
  const statusEl = $("status");
  const notesEl = $("notes");
  const photoEl = $("photo");

  // session
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem("familyUser") || "null");
  } catch (e) {
    session = null;
  }

  if (!ID) {
    alert("ID anggota tidak ditemukan. Kembali ke dashboard.");
    location.href = "dashboard.html";
    return;
  }

  if (!session || !session.token) {
    alert("⚠ Harap login terlebih dahulu!");
    location.href = "login.html";
    return;
  }

  // helper: show message
  function show(msg, type = "info") {
    if (!msgEl) return;
    msgEl.textContent = msg;
    msgEl.style.color = type === "error" ? "#c0392b" : (type === "success" ? "#27ae60" : "#333");
  }

  // helper: toBase64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // validate token (non-fatal on network errors)
  async function validateToken() {
    try {
      const res = await fetch(`${API_URL}?mode=validate&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Network");
      const j = await res.json();
      if (j.status !== "success") {
        // token invalid/expired
        alert("Sesi kadaluarsa — silakan login ulang.");
        localStorage.removeItem("familyUser");
        location.href = "login.html";
        throw new Error("Token invalid");
      }
      // update local session name/role if returned
      if (j.name) session.name = j.name;
      if (j.id) session.id = j.id;
      if (j.role) session.role = j.role;
      // show role/name in navbar if any element exists
      const ui = document.getElementById("userInfo");
      if (ui) ui.textContent = `${session.name}${session.role ? " ("+session.role+")" : ""}`;
      return true;
    } catch (err) {
      // If network error, allow to continue (we'll still try to fetch data),
      // but inform the user that validation couldn't be completed.
      console.warn("validateToken error:", err);
      show("Peringatan: gagal memeriksa sesi (koneksi). Mencoba melanjutkan...", "error");
      return false;
    }
  }

  // load members for dropdowns (returns array)
  async function loadAllMembersForDropdown() {
    try {
      const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      if (!j || j.status !== "success" || !Array.isArray(j.data)) throw new Error("Response tidak valid");
      // fill dropdowns
      const members = j.data;
      ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(sel => {
        const el = $(sel);
        if (!el) return;
        el.innerHTML = `<option value="">-- Pilih --</option>`;
      });
      members.forEach(p => {
        ["parentIdAyah", "parentIdIbu", "spouseId"].forEach(sel => {
          const el = $(sel);
          if (!el) return;
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name || p.id;
          el.appendChild(opt);
        });
      });
      return members;
    } catch (err) {
      console.error("loadAllMembersForDropdown error:", err);
      show("Gagal memuat daftar anggota (dropdown).", "error");
      return [];
    }
  }

  // load single member detail (preferred: getOne)
  async function loadMemberDetail() {
    try {
      // try getOne first (fast)
      const res = await fetch(`${API_URL}?mode=getOne&id=${encodeURIComponent(ID)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();
      if (j && j.status === "success" && j.data) {
        return j.data;
      }
      // fallback to getData if getOne not available
    } catch (err) {
      console.warn("getOne failed, fallback to getData:", err);
    }

    // fallback: getData and find by id
    try {
      const res2 = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`, { cache: "no-store" });
      if (!res2.ok) throw new Error("HTTP " + res2.status);
      const j2 = await res2.json();
      if (!j2 || j2.status !== "success" || !Array.isArray(j2.data)) throw new Error("Response invalid");
      const found = j2.data.find(x => String(x.id) === String(ID));
      if (!found) throw new Error("Not found");
      return found;
    } catch (err) {
      console.error("Fallback getData failed:", err);
      throw err;
    }
  }

  // initial sequence
  try {
    show("Memeriksa sesi...");
    await validateToken();
    show("Memuat daftar anggota...");
    const members = await loadAllMembersForDropdown();
    show("Memuat data anggota...");
    const detail = await loadMemberDetail();

    // fill form
    nameEl.value = detail.name || "";
    domisiliEl.value = detail.domisili || "";
    relationshipEl.value = detail.relationship || "";
    orderChildEl.value = detail.orderChild || "";
    statusEl.value = detail.status || "";
    notesEl.value = detail.notes || "";

    // set dropdowns (if option exists)
    if (parentIdAyahEl) parentIdAyahEl.value = detail.parentIdAyah || "";
    if (parentIdIbuEl) parentIdIbuEl.value = detail.parentIdIbu || "";
    if (spouseIdEl) spouseIdEl.value = detail.spouseId || "";

    show("Data siap diedit.", "success");
  } catch (err) {
    console.error("init load error:", err);
    show("❌ Error memuat data!", "error");
  }

  // submit handler
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    show("⏳ Menyimpan perubahan...");
    // gather photo
    let base64 = "";
    try {
      const file = photoEl.files && photoEl.files[0];
      if (file) {
        const dataUrl = await toBase64(file);
        base64 = dataUrl.split(",")[1] || "";
      }
    } catch (err) {
      console.warn("toBase64 error:", err);
      show("Gagal memproses foto.", "error");
      return;
    }

    const payload = {
      mode: "update",           // sesuai doPost switch di GAS
      token: session.token,
      id: ID,

      name: nameEl.value.trim(),
      domisili: domisiliEl.value.trim(),
      relationship: relationshipEl.value,
      parentIdAyah: parentIdAyahEl.value || "",
      parentIdIbu: parentIdIbuEl.value || "",
      spouseId: spouseIdEl.value || "",
      orderChild: orderChildEl.value || "",
      status: statusEl.value || "",
      notes: notesEl.value.trim(),

      photo_base64: base64,
      photo_type: (photoEl.files && photoEl.files[0]) ? photoEl.files[0].type : ""
    };

    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (j && j.status === "success") {
        show("✅ Perubahan tersimpan.", "success");
        setTimeout(() => location.href = `detail.html?id=${encodeURIComponent(ID)}`, 700);
      } else {
        const m = (j && j.message) ? j.message : "Gagal menyimpan perubahan.";
        show("❌ " + m, "error");
      }
    } catch (err) {
      console.error("submit error:", err);
      show("❌ Error koneksi saat menyimpan: " + (err.message || err), "error");
    }
  });

  // logout helper used by nav
  window.logout = function () {
    fetch(`${API_URL}?mode=logout&token=${encodeURIComponent(session.token)}`)
      .finally(() => {
        localStorage.removeItem("familyUser");
        location.href = "login.html";
      });
  };

})();
