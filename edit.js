// ======================================================
// edit.js — FINAL CLEAN (BASE64 PHOTO UPDATE, GAS READY)
// ======================================================
(function () {
  const API_URL = window.API_URL;
  const {
    getSession,
    validateToken,
    clearSession,
    createNavbar,
  } = window;

  if (typeof createNavbar === "function") createNavbar();

  /* =========================
     ELEMENTS
  ========================= */
  const msg = document.getElementById("msg");
  const form = document.getElementById("editForm");

  const el = (id) => document.getElementById(id);

  const idEl = el("memberId");
  const nameEl = el("name");
  const fatherEl = el("father");
  const motherEl = el("mother");
  const spouseEl = el("spouse");
  const birthOrderEl = el("birthOrder");
  const statusEl = el("status");
  const notesEl = el("notes");
  const domisiliEl = el("domisili");
  const photoEl = el("photo");
  const previewEl = el("preview");
  const btnDelete = el("btnDelete");
  const btnLogout = el("btnLogout");

  /* =========================
     HELPERS
  ========================= */
  const getIdFromUrl = () =>
    new URLSearchParams(location.search).get("id");

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function protect() {
    const session =
      typeof getSession === "function"
        ? getSession()
        : JSON.parse(localStorage.getItem("familyUser") || "null");

    if (!session || !session.token) {
      location.href = "login.html";
      return null;
    }

    if (typeof validateToken === "function") {
      const v = await validateToken(session.token);
      if (!v || !v.valid) {
        if (typeof clearSession === "function") clearSession();
        location.href = "login.html";
        return null;
      }
    }
    return session;
  }

  /* =========================
     LOAD DATA
  ========================= */
  async function fetchMembers() {
    const r = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`);
    const j = await r.json();
    if (j.status !== "success") throw new Error(j.message);
    return j.data;
  }

  function fillSelect(select, data, selfId) {
    select.innerHTML = `<option value="">(Tidak ada)</option>`;
    data.forEach((m) => {
      if (m.id !== selfId) {
        select.insertAdjacentHTML(
          "beforeend",
          `<option value="${m.id}">${m.name}</option>`
        );
      }
    });
  }

  async function loadMember() {
    const id = getIdFromUrl();
    if (!id) return (msg.textContent = "ID tidak ditemukan");

    msg.textContent = "Memuat data...";

    const members = await fetchMembers();
    const target = members.find((m) => m.id === id);
    if (!target) return (msg.textContent = "Data tidak ditemukan");

    idEl.value = target.id;
    nameEl.value = target.name || "";
    birthOrderEl.value = target.orderChild || "";
    statusEl.value = target.status || "";
    notesEl.value = target.notes || "";
    domisiliEl.value = target.domisili || "";

    fillSelect(fatherEl, members, id);
    fillSelect(motherEl, members, id);
    fillSelect(spouseEl, members, id);

    fatherEl.value = target.parentIdAyah || "";
    motherEl.value = target.parentIdIbu || "";
    spouseEl.value = target.spouseId || "";

    if (target.photoURL) {
      previewEl.src = target.photoURL.includes("drive.google")
        ? target.photoURL.replace("open?id=", "uc?export=view&id=")
        : target.photoURL;
      previewEl.style.display = "block";
    }

    msg.textContent = "Siap diedit";
  }

  /* =========================
     PHOTO PREVIEW
  ========================= */
  photoEl.addEventListener("change", () => {
    const f = photoEl.files[0];
    if (!f) return;
    previewEl.src = URL.createObjectURL(f);
    previewEl.style.display = "block";
  });

  /* =========================
     SUBMIT UPDATE
  ========================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Menyimpan perubahan...";

    const s = await protect();
    if (!s) return;

    const payload = new URLSearchParams();
    payload.append("mode", "update");
    payload.append("token", s.token);
    payload.append("id", idEl.value);
    payload.append("updatedBy", s.name || "user");
    payload.append("name", nameEl.value);
    payload.append("parentIdAyah", fatherEl.value);
    payload.append("parentIdIbu", motherEl.value);
    payload.append("spouseId", spouseEl.value);
    payload.append("orderChild", birthOrderEl.value);
    payload.append("status", statusEl.value);
    payload.append("notes", notesEl.value);
    payload.append("domisili", domisiliEl.value);

    // 🔥 BASE64 PHOTO (SAMA SEPERTI index.html)
    if (photoEl.files[0]) {
      const file = photoEl.files[0];
      payload.append("photo_base64", await toBase64(file));
      payload.append("photo_type", file.type);
    }

    const r = await fetch(API_URL, { method: "POST", body: payload });
    const j = await r.json();

    if (j.status === "success") {
      msg.textContent = "✅ Perubahan tersimpan";
      setTimeout(() => (location.href = "dashboard.html"), 700);
    } else {
      msg.textContent = "❌ " + j.message;
    }
  });

  /* =========================
     DELETE (AMAN)
  ========================= */
  btnDelete.addEventListener("click", async () => {
    if (!confirm("Yakin hapus anggota ini?")) return;

    const s = await protect();
    if (!s) return;

    msg.textContent = "Menghapus...";
    const r = await fetch(
      `${API_URL}?mode=delete&id=${idEl.value}&token=${s.token}`
    );
    const j = await r.json();

    if (j.status === "success") {
      msg.textContent = "🗑 Berhasil dihapus";
      setTimeout(() => (location.href = "dashboard.html"), 700);
    } else {
      msg.textContent = "❌ " + j.message;
    }
  });

  /* =========================
     LOGOUT
  ========================= */
  if (btnLogout) {
    btnLogout.onclick = () => {
      if (typeof clearSession === "function") clearSession();
      else localStorage.removeItem("familyUser");
      location.href = "login.html";
    };
  }

  /* =========================
     INIT
  ========================= */
  (async function init() {
    await protect();
    await loadMember();
  })();
})();
