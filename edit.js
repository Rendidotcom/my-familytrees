// edit.js — FINAL (BASE64 PHOTO UPDATE, delete tetap aman)
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
  const domisiliEl = document.getElementById("domisili");
  const photoEl = document.getElementById("photo");
  const previewEl = document.getElementById("preview");
  const btnDelete = document.getElementById("btnDelete");
  const btnLogout = document.getElementById("btnLogout");

  function getIdFromUrl() {
    return new URLSearchParams(location.search).get("id");
  }

  async function toBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
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
      msg.textContent = "Gagal load anggota: " + err.message;
      return;
    }

    const target = members.find((m) => m.id === id);
    if (!target) return (msg.textContent = "Tidak ditemukan");

    idEl.value = target.id;
    nameEl.value = target.name || "";
    birthOrderEl.value = target.orderChild || "";
    statusEl.value = target.status || "hidup";
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

  photoEl.addEventListener("change", () => {
    const f = photoEl.files[0];
    if (f) {
      previewEl.src = URL.createObjectURL(f);
      previewEl.style.display = "block";
    }
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Menyimpan...";

    const s = await protect();
    if (!s) return;

    const payload = new URLSearchParams();
    payload.append("mode", "update");
    payload.append("token", s.token);
    payload.append("id", idEl.value);
    payload.append("updatedBy", s.name);
    payload.append("name", nameEl.value);
    payload.append("parentIdAyah", fatherEl.value);
    payload.append("parentIdIbu", motherEl.value);
    payload.append("spouseId", spouseEl.value);
    payload.append("orderChild", birthOrderEl.value);
    payload.append("status", statusEl.value);
    payload.append("notes", notesEl.value);
    payload.append("domisili", domisiliEl.value);

    if (photoEl.files[0]) {
      const base64 = await toBase64(photoEl.files[0]);
      payload.append("photo_base64", base64);
      payload.append("photo_type", photoEl.files[0].type);
    }

    try {
      const r = await fetch(API_URL, { method: "POST", body: payload });
      const j = await r.json();
      if (j.status === "success") {
        msg.textContent = "Berhasil disimpan";
        setTimeout(() => (location.href = "dashboard.html"), 700);
      } else {
        msg.textContent = "Gagal: " + j.message;
      }
    } catch (err) {
      msg.textContent = "Error: " + err.message;
    }
  });

  btnDelete.addEventListener("click", async () => {
    if (!confirm("Yakin hapus?")) return;
    const s = await protect();
    if (!s) return;

    msg.textContent = "Menghapus...";
    const r = await fetch(`${API_URL}?mode=delete&id=${idEl.value}&token=${s.token}`);
    const j = await r.json();
    if (j.status === "success") {
      msg.textContent = "Berhasil dihapus";
      setTimeout(() => (location.href = "dashboard.html"), 700);
    } else {
      msg.textContent = "Gagal hapus";
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
