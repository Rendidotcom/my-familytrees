// index.js — FINAL (FormData save + JSON fallback + dropdown family loader)
(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;
  if (typeof createNavbar === "function") createNavbar();

  const msg = document.getElementById("msg");
  const addForm = document.getElementById("addForm");

  // Form fields
  const nameEl = document.getElementById("name");
  const relEl = document.getElementById("relationship");
  const domEl = document.getElementById("domisili");
  const fatherEl = document.getElementById("father");
  const motherEl = document.getElementById("mother");
  const spouseEl = document.getElementById("spouse");
  const birthOrderEl = document.getElementById("birthOrder");
  const statusEl = document.getElementById("status");
  const notesEl = document.getElementById("notes");
  const photoEl = document.getElementById("photo");
  const previewEl = document.getElementById("preview");

  // ---------------------------------------------------
  // 1. SESSION PROTECT
  // ---------------------------------------------------
  async function protect() {
    const s = getSession ? getSession() : JSON.parse(localStorage.getItem("familyUser") || "null");
    if (!s || !s.token) {
      msg.textContent = "Sesi hilang";
      return setTimeout(() => (location.href = "login.html"), 600);
    }
    if (typeof validateToken === "function") {
      const v = await validateToken(s.token);
      if (!v || !v.valid) {
        if (typeof clearSession === "function") clearSession();
        return setTimeout(() => (location.href = "login.html"), 600);
      }
    }
    return s;
  }

  // ---------------------------------------------------
  // 2. LOAD ALL MEMBERS FOR DROPDOWNS
  // ---------------------------------------------------
  async function fetchAllMembers() {
    const r = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`);
    const j = await r.json();
    if (j.status !== "success") throw new Error("Gagal load data keluarga");
    return j.data;
  }

  function fillSelect(el, members) {
    el.innerHTML = `<option value="">(Tidak ada)</option>`;
    members.forEach((m) => {
      el.insertAdjacentHTML("beforeend", `<option value="${m.id}">${m.name}</option>`);
    });
  }

  async function prepareDropdowns() {
    msg.textContent = "Memuat data keluarga...";
    try {
      const members = await fetchAllMembers();
      fillSelect(fatherEl, members);
      fillSelect(motherEl, members);
      fillSelect(spouseEl, members);
      msg.textContent = "";
    } catch (e) {
      msg.textContent = "Gagal memuat anggota: " + e.message;
    }
  }

  // ---------------------------------------------------
  // 3. PREVIEW PHOTO FILE
  // ---------------------------------------------------
  photoEl.addEventListener("change", () => {
    const f = photoEl.files[0];
    if (f) {
      previewEl.src = URL.createObjectURL(f);
      previewEl.style.display = "block";
    }
  });

  // ---------------------------------------------------
  // 4. UNIVERSAL JSON HELPER
  // ---------------------------------------------------
  async function tryFetchJson(url, opts = {}) {
    try {
      const r = await fetch(url, opts);
      return await r.json();
    } catch (e) {
      return { status: "error", message: String(e) };
    }
  }

  // ---------------------------------------------------
  // 5. SUBMIT — FormData utama + JSON fallback
  // ---------------------------------------------------
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Menyimpan...";

    const s = await protect();
    if (!s) return;

    // FormData (utama)
    const fd = new FormData();
    fd.append("mode", "addData");
    fd.append("token", s.token);
    fd.append("createdBy", s.name);
    fd.append("name", nameEl.value);
    fd.append("relationship", relEl.value);
    fd.append("domisili", domEl.value);
    fd.append("parentIdAyah", fatherEl.value);
    fd.append("parentIdIbu", motherEl.value);
    fd.append("spouseId", spouseEl.value);
    fd.append("orderChild", birthOrderEl.value);
    fd.append("status", statusEl.value);
    fd.append("notes", notesEl.value);

    if (photoEl.files[0]) fd.append("photo", photoEl.files[0]);

    // ---- 5a. Coba POST FormData
    try {
      const r = await fetch(API_URL, { method: "POST", body: fd });
      const j = await r.json();

      if (j.status === "success") {
        msg.textContent = "Berhasil ditambahkan!";
        return setTimeout(() => (location.href = "dashboard.html"), 700);
      }

      console.warn("FormData gagal, GAS tidak support:", j);
    } catch (err) {
      console.warn("FormData error:", err);
    }

    // ---- 5b. JSON fallback (tanpa foto)
    const payload = {
      mode: "addData",
      token: s.token,
      createdBy: s.name,
      name: nameEl.value,
      relationship: relEl.value,
      domisili: domEl.value,
      parentIdAyah: fatherEl.value,
      parentIdIbu: motherEl.value,
      spouseId: spouseEl.value,
      orderChild: birthOrderEl.value,
      status: statusEl.value,
      notes: notesEl.value,
    };

    try {
      const r2 = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j2 = await r2.json();

      if (j2.status === "success") {
        msg.textContent = "Berhasil ditambahkan (fallback)!";
        return setTimeout(() => (location.href = "dashboard.html"), 700);
      }

      msg.textContent = "Gagal simpan: " + (j2.message || JSON.stringify(j2));
    } catch (err) {
      msg.textContent = "Error menyimpan: " + err.message;
    }
  });

  // ---------------------------------------------------
  // INIT
  // ---------------------------------------------------
  (async function init() {
    await protect();
    await prepareDropdowns();
  })();
})();
