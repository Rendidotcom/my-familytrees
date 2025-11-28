// edit.js — FINAL (sinkron GAS / Sheet1)
// Pastikan edit.html sudah men-set window.API_URL (atau ganti API_URL di sini)

(() => {
  const API = window.API_URL || (typeof API_URL !== 'undefined' ? API_URL : null);
  if (!API) {
    console.error("API_URL tidak ditemukan. Pastikan edit.html meng-import config.js dan set window.API_URL.");
    alert("Konfigurasi API tidak ditemukan. Hub admin.");
    return;
  }

  // session
  let session = null;
  try { session = JSON.parse(localStorage.getItem("familyUser") || "null"); } catch(e){ session = null; }

  const msgEl = document.getElementById("msg");
  const form = document.getElementById("formEdit");
  const params = new URLSearchParams(location.search);
  const ID = params.get("id");

  function showMsg(t, isError = false) {
    if (!msgEl) return;
    msgEl.textContent = t;
    msgEl.style.color = isError ? "red" : "#333";
  }

  function mustLogin() {
    localStorage.removeItem("familyUser");
    location.href = "login.html";
  }

  // check basic session
  if (!session || !session.token) {
    alert("⚠ Anda belum login. Masuk dulu.");
    mustLogin();
    return;
  }
  if (!ID) {
    alert("ID anggota tidak ditemukan pada URL.");
    location.href = "dashboard.html";
    return;
  }

  // helper to convert file -> base64 (only data URL string)
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // Validate token (but don't aggressively logout on network error)
  async function validateToken() {
    try {
      const res = await fetch(`${API}?mode=validate&token=${encodeURIComponent(session.token)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();
      if (!(j && j.status === "success")) {
        showMsg("Sesi tidak valid, silakan login ulang.", true);
        setTimeout(mustLogin, 900);
        return false;
      }
      // update session name/role if server returned them
      if (j.name || j.role || j.id) {
        session = Object.assign({}, session, { name: j.name || session.name, role: j.role || session.role, id: j.id || session.id });
        try { localStorage.setItem("familyUser", JSON.stringify(session)); } catch(e){}
      }
      return true;
    } catch (err) {
      console.warn("validateToken error:", err);
      // jaringan bermasalah — biarkan user lanjut (optimistis) but show message
      showMsg("Gagal memeriksa sesi (koneksi). Mencoba tetap memuat data...");
      return true;
    }
  }

  // Load dropdowns (father/mother/spouse) from getData
  async function loadDropdowns() {
    try {
      const res = await fetch(`${API}?mode=getData&nocache=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();
      if (!j || j.status !== "success" || !Array.isArray(j.data)) throw new Error("Response tidak valid");

      const members = j.data;
      const selects = ["parentIdAyah", "parentIdIbu", "spouseId"];
      selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `<option value="">-- Tidak ada --</option>`;
      });

      members.forEach(p => {
        selects.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name;
          el.appendChild(opt);
        });
      });

      return members;
    } catch (err) {
      console.error("loadDropdowns error:", err);
      showMsg("Gagal memuat daftar anggota (dropdown). Cek koneksi.", true);
      return [];
    }
  }

  // Load single member detail (use mode=getOne)
  async function loadDetail() {
    showMsg("Memuat data anggota...");
    try {
      const res = await fetch(`${API}?mode=getOne&id=${encodeURIComponent(ID)}&nocache=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();
      if (!j || j.status !== "success" || !j.data) {
        throw new Error(j && j.message ? j.message : "Data tidak ditemukan");
      }
      const p = j.data;

      // isi field, aman jika elemen tidak ada
      const setIf = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
      setIf("name", p.name);
      setIf("domisili", p.domisili);
      setIf("relationship", p.relationship);
      setIf("parentIdAyah", p.parentIdAyah || "");
      setIf("parentIdIbu", p.parentIdIbu || "");
      setIf("spouseId", p.spouseId || "");
      setIf("orderChild", p.orderChild || "");
      setIf("status", p.status || "");
      setIf("notes", p.notes || "");
      showMsg(""); // clear
      return true;
    } catch (err) {
      console.error("loadDetail error:", err);
      showMsg("Gagal memuat data anggota: " + (err.message || err), true);
      return false;
    }
  }

  // Initialize: validate token -> load dropdowns -> load detail (wait)
  (async () => {
    const ok = await validateToken();
    if (!ok) return;
    // load dropdowns first
    await loadDropdowns();
    // then detail (delay not needed)
    await loadDetail();
  })();

  // Submit handler
  if (form) {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const origText = btn ? btn.textContent : null;
      if (btn) { btn.disabled = true; btn.textContent = "Menyimpan..."; }
      showMsg("⏳ Menyimpan perubahan...");

      try {
        // read file (if any)
        const photoInput = document.getElementById("photo");
        let base64 = "";
        let photoType = "";
        if (photoInput && photoInput.files && photoInput.files[0]) {
          try {
            const dataUrl = await toBase64(photoInput.files[0]);
            base64 = dataUrl.split(",")[1] || "";
            photoType = photoInput.files[0].type || "";
          } catch (err) {
            console.warn("Gagal konversi foto:", err);
          }
        }

        // build payload matching GAS: mode="update", token, id, fields...
        const payload = {
          mode: "update",
          token: session.token,
          id: ID,
          name: (document.getElementById("name")?.value || "").trim(),
          domisili: (document.getElementById("domisili")?.value || "").trim(),
          relationship: (document.getElementById("relationship")?.value || "").trim(),
          parentIdAyah: (document.getElementById("parentIdAyah")?.value || "").trim(),
          parentIdIbu: (document.getElementById("parentIdIbu")?.value || "").trim(),
          spouseId: (document.getElementById("spouseId")?.value || "").trim(),
          orderChild: (document.getElementById("orderChild")?.value || "").trim(),
          status: (document.getElementById("status")?.value || "").trim(),
          notes: (document.getElementById("notes")?.value || "").trim(),
          updatedBy: session.name || session.id || "",
          // photo: optional
          photo_base64: base64,
          photo_type: photoType
        };

        // POST JSON
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("HTTP " + res.status);
        const j = await res.json();

        if (j && j.status === "success") {
          showMsg("✅ Perubahan berhasil disimpan.");
          // refresh redirect to detail
          setTimeout(() => { location.href = `detail.html?id=${encodeURIComponent(ID)}`; }, 800);
        } else {
          const errMsg = (j && (j.message || j.error)) ? (j.message || j.error) : "Gagal menyimpan data";
          showMsg("❌ " + errMsg, true);
        }

      } catch (err) {
        console.error("submit error:", err);
        showMsg("❌ Error saat menyimpan: " + (err.message || err), true);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
      }
    });
  } else {
    console.warn("Form #formEdit tidak ditemukan.");
  }

  // Logout helper (compatible with your edit.html)
  window.logout = function () {
    // try call logout endpoint, then clear
    fetch(`${API}?mode=logout&token=${encodeURIComponent(session?.token || "")}`)
      .finally(() => {
        localStorage.removeItem("familyUser");
        location.href = "login.html";
      });
  };

})();
