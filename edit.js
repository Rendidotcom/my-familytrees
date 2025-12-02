// edit.js — FINAL (sinkron dengan GAS)
// Pastikan config.js (window.API_URL) dan session.js (getSession, validateToken, clearSession) sudah dimuat.

(function () {
  const API_URL = window.API_URL || "";
  if (!API_URL) console.warn("⚠ API_URL kosong — periksa config.js");

  // session helpers — asumsikan session.js menyediakan getSession(), validateToken(token), clearSession()
  const { getSession, validateToken, clearSession } = window;

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

  // convert file to base64 (body only, no data: prefix)
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function protect() {
    const s = getSession ? getSession() : JSON.parse(localStorage.getItem("familyUser") || "null");
    if (!s || !s.token) {
      msg.textContent = "Sesi hilang, login ulang...";
      setTimeout(() => (location.href = "login.html"), 700);
      return null;
    }
    if (typeof validateToken === "function") {
      try {
        const v = await validateToken(s.token);
        if (!v || !v.valid) {
          clearSession && clearSession();
          msg.textContent = "Sesi tidak valid";
          setTimeout(() => (location.href = "login.html"), 700);
          return null;
        }
      } catch (e) {
        // ignore: tetap lanjutkan dengan session lokal
      }
    }
    return s;
  }

  async function fetchAllMembers() {
    const res = await fetch(`${API_URL}?mode=getData&ts=${Date.now()}`);
    return await res.json();
  }

  function fillSelect(el, members, selfId) {
    el.innerHTML = `<option value="">(Tidak ada)</option>`;
    members.forEach((m) => {
      if (m.id !== selfId) {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name || m.id;
        el.appendChild(opt);
      }
    });
  }

  async function loadMember() {
    const id = getIdFromUrl();
    if (!id) return (msg.textContent = "ID tidak ada");

    msg.textContent = "Memuat data...";
    try {
      const jAll = await fetchAllMembers();
      if (!jAll || jAll.status !== "success") {
        msg.textContent = "Gagal memuat daftar anggota";
        return;
      }
      const members = jAll.data || [];
      const target = members.find((m) => m.id === id);
      if (!target) {
        msg.textContent = "Data tidak ditemukan.";
        return;
      }

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

      // preview foto existing (drive URL => direct)
      if (target.photoURL) {
        const m = String(target.photoURL).match(/[-\w]{25,}/);
        if (m) {
          previewEl.src = `https://drive.google.com/uc?export=view&id=${m[0]}`;
          previewEl.style.display = "inline-block";
        }
      }

      msg.textContent = "Siap diedit";
    } catch (err) {
      console.error(err);
      msg.textContent = "Error load data";
    }
  }

  photoEl.addEventListener("change", () => {
    const f = photoEl.files[0];
    if (f) {
      previewEl.src = URL.createObjectURL(f);
      previewEl.style.display = "inline-block";
    }
  });

  // Utility: POST JSON helper
  async function postJson(payload) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  // ================
  // SIMPAN PERUBAHAN
  // ================
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Menyimpan...";

    const s = await protect();
    if (!s) return;

    let photo_base64 = "";
    let photo_type = "";
    if (photoEl.files[0]) {
      try {
        photo_base64 = await toBase64(photoEl.files[0]);
        photo_type = photoEl.files[0].type || "image/jpeg";
      } catch (err) {
        console.warn("Foto baca error:", err);
      }
    }

    // NOTE: mode harus "update" sesuai GAS
    const payload = {
      mode: "update",
      token: s.token,
      id: idEl.value,
      updatedBy: s.name || "",
      name: nameEl.value,
      parentIdAyah: fatherEl.value || "",
      parentIdIbu: motherEl.value || "",
      spouseId: spouseEl.value || "",
      orderChild: birthOrderEl.value || "",
      status: statusEl.value || "",
      notes: notesEl.value || "",
      // optional photo
      photo_base64,
      photo_type
    };

    try {
      const j = await postJson(payload);
      console.log("update resp:", j);
      if (j && j.status === "success") {
        msg.textContent = "Berhasil disimpan — mengalihkan...";
        setTimeout(() => (location.href = "dashboard.html"), 700);
      } else {
        msg.textContent = "Gagal menyimpan: " + (j && j.message ? j.message : "unknown");
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "Error menyimpan: " + err.message;
    }
  });

  // ================
  // HAPUS (Hard delete)
  // ================
  btnDelete.addEventListener("click", async () => {
    if (!confirm("⚠ Hapus anggota ini secara PERMANEN?")) return;

    const s = await protect();
    if (!s) return;

    msg.textContent = "Menghapus...";

    try {
      // gunakan POST {mode: "delete", id, token}
      const payload = { mode: "delete", id: idEl.value, token: s.token, deletedBy: s.name || "" };
      let j = null;
      try {
        j = await postJson(payload);
      } catch (errPost) {
        console.warn("POST gagal, fallback ke GET:", errPost);
        // fallback GET
        const res = await fetch(`${API_URL}?mode=delete&id=${encodeURIComponent(idEl.value)}&token=${encodeURIComponent(s.token)}`);
        j = await res.json();
      }

      console.log("delete resp:", j);
      if (j && j.status === "success") {
        msg.textContent = "Berhasil dihapus, kembali ke dashboard...";
        setTimeout(() => (location.href = "dashboard.html"), 700);
      } else {
        msg.textContent = "Gagal hapus: " + (j && j.message ? j.message : "unknown");
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "Error hapus: " + err.message;
    }
  });

  // Soft delete helper (opsional)
  async function doSoftDelete() {
    if (!confirm("Soft-delete: set status => deleted?")) return;
    const s = await protect();
    if (!s) return;
    msg.textContent = "Soft-deleting...";
    try {
      const payload = { mode: "softDelete", id: idEl.value, token: s.token, deletedBy: s.name || "" };
      const j = await postJson(payload);
      if (j && j.status === "success") {
        msg.textContent = "Berhasil soft-delete.";
        setTimeout(() => (location.href = "dashboard.html"), 700);
      } else {
        msg.textContent = "Gagal soft-delete: " + (j && j.message ? j.message : "unknown");
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "Error soft-delete: " + err.message;
    }
  }

  // Logout button (if exists)
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      clearSession && clearSession();
      location.href = "login.html";
    });
  }

  // Init
  (async function init() {
    await protect();
    await loadMember();
  })();
})();
