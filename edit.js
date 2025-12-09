// edit.js — FINAL (restore & robust delete, FormData save with JSON fallback + DOMISILI)
(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;
  if (typeof createNavbar === "function") createNavbar();

  const msg = document.getElementById("msg");
  const editForm = document.getElementById("editForm");
  const idEl = document.getElementById("memberId");
  const nameEl = document.getElementById("name");
  const fatherEl = document.getElementById("father");
  const motherEl = document.getElementById("mother");
  const spouseEl = document.getElementById("spouse");
  const birthOrderEl = document.getElementById("birthOrder");
  const statusEl = document.getElementById("status");
  const notesEl = document.getElementById("notes");
  const domisiliEl = document.getElementById("domisili"); // ❤️ TAMBAHAN BARU
  const photoEl = document.getElementById("photo");
  const previewEl = document.getElementById("preview");
  const btnDelete = document.getElementById("btnDelete");
  const btnLogout = document.getElementById("btnLogout");

  function getIdFromUrl() {
    return new URLSearchParams(location.search).get("id");
  }

  async function protect() {
    const s = getSession ? getSession() : JSON.parse(localStorage.getItem("familyUser") || "null");
    if (!s || !s.token) {
      msg.textContent = "Sesi hilang";
      setTimeout(() => (location.href = "login.html"), 700);
      return null;
    }
    if (typeof validateToken === "function") {
      const v = await validateToken(s.token);
      if (!v || !v.valid) {
        if (typeof clearSession === "function") clearSession();
        setTimeout(() => (location.href = "login.html"), 700);
        return null;
      }
    }
    return s;
  }

  async function fetchAllMembers() {
    const res = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`);
    const j = await res.json();
    if (j.status !== "success") throw new Error("Gagal load data");
    return j.data;
  }

  function fillSelect(el, members, selfId) {
    el.innerHTML = `<option value="">(Tidak ada)</option>`;
    members.forEach((m) => {
      if (m.id !== selfId) {
        el.insertAdjacentHTML("beforeend", `<option value="${m.id}">${m.name}</option>`);
      }
    });
  }

  async function loadMember() {
    const id = getIdFromUrl();
    if (!id) return (msg.textContent = "ID tidak ada");

    msg.textContent = "Memuat...";
    let members;
    try {
      members = await fetchAllMembers();
    } catch (err) {
      msg.textContent = "Gagal load anggota: " + (err.message || err);
      return;
    }

    const target = members.find((m) => m.id === id);
    if (!target) return (msg.textContent = "Tidak ditemukan");

    // Fill form
    idEl.value = target.id;
    nameEl.value = target.name || "";
    birthOrderEl.value = target.orderChild || "";
    statusEl.value = target.status || "hidup";
    notesEl.value = target.notes || "";
    domisiliEl.value = target.domisili || ""; // ❤️ LOAD DOMISILI

    fillSelect(fatherEl, members, id);
    fillSelect(motherEl, members, id);
    fillSelect(spouseEl, members, id);

    fatherEl.value = target.parentIdAyah || "";
    motherEl.value = target.parentIdIbu || "";
    spouseEl.value = target.spouseId || "";

    // Preview existing photo
    if (target.photoURL) {
      const m = target.photoURL.match(/[-\w]{25,}/);
      if (m) {
        previewEl.src = `https://drive.google.com/uc?export=view&id=${m[0]}`;
        previewEl.style.display = "block";
      } else {
        previewEl.src = target.photoURL;
        previewEl.style.display = "block";
      }
    }

    msg.textContent = "Siap diedit";
  }

  photoEl.addEventListener("change", () => {
    const f = photoEl.files[0];
    if (f) {
      previewEl.src = URL.createObjectURL(f);
      previewEl.style.display = "block";
    }
  });

  async function tryFetchJson(url, opts = {}) {
    try {
      const r = await fetch(url, opts);
      return await r.json();
    } catch (e) {
      return { status: "error", message: String(e) };
    }
  }

  // SIMPAN
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Menyimpan...";

    const s = await protect();
    if (!s) return;

    const fd = new FormData();
    fd.append("mode", "update");
    fd.append("token", s.token);
    fd.append("id", idEl.value);
    fd.append("updatedBy", s.name);
    fd.append("name", nameEl.value);
    fd.append("parentIdAyah", fatherEl.value);
    fd.append("parentIdIbu", motherEl.value);
    fd.append("spouseId", spouseEl.value);
    fd.append("orderChild", birthOrderEl.value);
    fd.append("status", statusEl.value);
    fd.append("notes", notesEl.value);
    fd.append("domisili", domisiliEl.value); // ❤️ FORM DATA DOMISILI

    if (photoEl.files[0]) {
      fd.append("photo", photoEl.files[0]);
    }

    try {
      const res = await fetch(API_URL, { method: "POST", body: fd });
      const j = await res.json();
      if (j && j.status === "success") {
        msg.textContent = "Berhasil disimpan!";
        setTimeout(() => (location.href = "dashboard.html"), 700);
        return;
      }
    } catch (err) {}

    // FALLBACK JSON
    try {
      const payload = {
        mode: "update",
        token: s.token,
        id: idEl.value,
        updatedBy: s.name,
        name: nameEl.value,
        parentIdAyah: fatherEl.value,
        parentIdIbu: motherEl.value,
        spouseId: spouseEl.value,
        orderChild: birthOrderEl.value,
        status: statusEl.value,
        notes: notesEl.value,
        domisili: domisiliEl.value, // ❤️ JSON DOMISILI
      };

      const res2 = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j2 = await res2.json();
      if (j2 && j2.status === "success") {
        msg.textContent = "Berhasil disimpan (fallback)!";
        setTimeout(() => (location.href = "dashboard.html"), 700);
        return;
      } else {
        msg.textContent = "Gagal: " + (j2.message || JSON.stringify(j2));
      }
    } catch (err) {
      msg.textContent = "Error menyimpan: " + err.message;
    }
  });

  // DELETE
  async function tryDeleteVariants(idValue, token) {
    const candidateUrls = [
      `${API_URL}?mode=deleteMember&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?mode=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?action=delete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?mode=hardDelete&id=${encodeURIComponent(idValue)}&token=${encodeURIComponent(token)}`,
      `${API_URL}?id=${encodeURIComponent(idValue)}&mode=delete&token=${encodeURIComponent(token)}`,
    ];

    for (const u of candidateUrls) {
      try {
        const j = await tryFetchJson(u);
        if (j && (j.status === "success" || j.status === "ok")) {
          return { ok: true, result: j, url: u };
        }
      } catch (e) {}
    }

    const postPayloads = [
      { mode: "delete", id: idValue, token },
      { mode: "deleteMember", id: idValue, token },
      { mode: "hardDelete", id: idValue, token },
      { action: "delete", id: idValue, token },
    ];

    for (const payload of postPayloads) {
      try {
        const r = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await r.json();
        if (j && (j.status === "success" || j.status === "ok")) {
          return { ok: true, result: j, payload };
        }
      } catch (e) {}
    }

    return { ok: false, result: null };
  }

  btnDelete.addEventListener("click", async () => {
    if (!confirm("Yakin hapus?")) return;

    const s = await protect();
    if (!s) return;

    msg.textContent = "Menghapus...";

    const idValue = idEl.value;
    const result = await tryDeleteVariants(idValue, s.token);

    if (result.ok) {
      msg.textContent = "Berhasil dihapus";
      setTimeout(() => (location.href = "dashboard.html"), 700);
    } else {
      msg.textContent = "Gagal hapus: API tidak merespon success.";
      console.warn("Delete failed:", result);
    }
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (typeof clearSession === "function") clearSession();
      else localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
  }

  (async function init() {
    await protect();
    await loadMember();
  })();
})();
