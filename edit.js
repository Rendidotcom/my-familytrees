// edit.js — FINAL tanpa ubah logika HAPUS
(function () {
  const API_URL = window.API_URL;
  const { getSession, validateToken, clearSession, createNavbar } = window;
  createNavbar();

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
  const photoEl = document.getElementById("photo");
  const previewEl = document.getElementById("preview");
  const btnDelete = document.getElementById("btnDelete");

  function getIdFromUrl() {
    return new URLSearchParams(location.search).get("id");
  }

  async function protect() {
    const s = getSession();
    if (!s || !s.token) {
      msg.textContent = "Sesi hilang";
      setTimeout(() => (location.href = "login.html"), 700);
      return null;
    }
    const v = await validateToken(s.token);
    if (!v.valid) {
      clearSession();
      setTimeout(() => (location.href = "login.html"), 700);
      return null;
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
    const members = await fetchAllMembers();
    const target = members.find((m) => m.id === id);

    if (!target) return (msg.textContent = "Tidak ditemukan");

    // Fill form
    idEl.value = target.id;
    nameEl.value = target.name || "";
    birthOrderEl.value = target.orderChild || "";
    statusEl.value = target.status || "hidup";
    notesEl.value = target.notes || "";

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

  // =====================
  // SIMPAN (pakai FormData)
  // =====================
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Menyimpan...";

    const s = await protect();
    if (!s) return;

    const fd = new FormData();
    fd.append("mode", "updateMember");      // tidak diubah
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

    if (photoEl.files[0]) {
      fd.append("photo", photoEl.files[0]);
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: fd, // FormData → aman untuk foto besar
      });

      const j = await res.json();

      if (j.status === "success") {
        msg.textContent = "Berhasil disimpan!";
        setTimeout(() => (location.href = "dashboard.html"), 700);
      } else {
        msg.textContent = "Gagal: " + (j.message || "Tidak diketahui");
      }
    } catch (err) {
      msg.textContent = "Error menyimpan: " + err.message;
    }
  });

  // =====================
  // HAPUS (TIDAK DIUBAH)
  // =====================
  btnDelete.addEventListener("click", async () => {
    if (!confirm("Yakin hapus?")) return;

    const s = await protect();
    if (!s) return;

    msg.textContent = "Menghapus...";

    const res = await fetch(
      `${API_URL}?mode=deleteMember&id=${idEl.value}&token=${s.token}`
    );
    const j = await res.json();

    if (j.status === "success") {
      msg.textContent = "Berhasil dihapus";
      setTimeout(() => (location.href = "dashboard.html"), 700);
    } else {
      msg.textContent = "Gagal hapus: " + j.message;
    }
  });

  document.getElementById("btnLogout").addEventListener("click", () => {
    clearSession();
    location.href = "login.html";
  });

  // Init
  (async function init() {
    await protect();
    await loadMember();
  })();
})();
