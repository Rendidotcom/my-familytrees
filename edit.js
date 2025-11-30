// edit.js (sinkron dengan GAS)
(function () {
  const API = window.API_URL;
  console.log("📡 edit.js start, API=", API);

  // get session (support both keys for backward compatibility)
  const raw = localStorage.getItem("familyUser") || localStorage.getItem("user");
  const session = raw ? JSON.parse(raw) : null;

  // helpers
  const $ = id => document.getElementById(id);
  const showMsg = (t, cls="text-muted") => {
    const el = $("msg"); el.className = "mt-3 " + cls; el.textContent = t;
    console.log("MSG:", t);
  };

  if (!session || !session.token) {
    console.warn("⚠ No session -> redirect to login (but won't loop).");
    // keep console visible for tablet, then redirect
    setTimeout(()=> location.href = "login.html", 400);
    return;
  }

  // read id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (!id) {
    showMsg("ID anggota tidak ditemukan pada URL.", "text-danger");
    console.error("Missing ?id= on URL");
    return;
  }
  $("memberId").value = id;

  // validate token quick (optional, not strict)
  async function validateToken() {
    try {
      const r = await fetch(`${API}?mode=validate&token=${session.token}`);
      const j = await r.json();
      console.log("validateToken ->", j);
      return j.status === "success";
    } catch (e) {
      console.error("validateToken err", e);
      return false;
    }
  }

  // convert file -> base64 without data: prefix
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // load all members for dropdowns
  async function loadMembersForDropdowns() {
    try {
      const res = await fetch(`${API}?mode=getData&nocache=${Date.now()}`);
      const j = await res.json();
      if (j.status !== "success") throw new Error(j.message || "getData failed");
      const members = j.data || [];
      const selects = [{id:"father", empty:"-- Pilih Ayah --"}, {id:"mother", empty:"-- Pilih Ibu --"}, {id:"spouse", empty:"-- Pilih Pasangan --"}];
      selects.forEach(s=>{
        const el = $(s.id);
        el.innerHTML = `<option value="">${s.empty}</option>`;
      });
      members.forEach(m=>{
        selects.forEach(s=>{
          const el = $(s.id);
          const opt = document.createElement("option");
          opt.value = m.id;
          opt.textContent = m.name;
          el.appendChild(opt);
        });
      });
      return members;
    } catch (err) {
      console.error("loadMembersForDropdowns err", err);
      showMsg("Gagal memuat daftar anggota: " + err.message, "text-danger");
      throw err;
    }
  }

  // load single member (use getOne)
  async function loadDetail() {
    try {
      $("msg").textContent = "⏳ Memuat data...";
      await loadMembersForDropdowns();

      const res = await fetch(`${API}?mode=getOne&id=${encodeURIComponent(id)}`);
      const j = await res.json();
      console.log("getOne ->", j);
      if (j.status !== "success") {
        showMsg("❌ Anggota tidak ditemukan: " + (j.message||""), "text-danger");
        return;
      }
      const p = j.data || {};
      $("name").value = p.name || "";
      $("birthOrder").value = p.orderChild || "";
      $("status").value = p.status || "hidup";
      $("notes").value = p.notes || "";
      $("father").value = p.parentIdAyah || "";
      $("mother").value = p.parentIdIbu || "";
      $("spouse").value = p.spouseId || "";

      if (p.photoURL) {
        const idDrive = p.photoURL.match(/[-\w]{25,}/)?.[0];
        if (idDrive) {
          const preview = $("preview");
          preview.src = `https://drive.google.com/uc?export=view&id=${idDrive}`;
          preview.style.display = "block";
        }
      }
      showMsg("", "text-muted");
    } catch (e) {
      console.error("loadDetail err", e);
      showMsg("❌ Gagal memuat detail: " + e.message, "text-danger");
    }
  }

  // submit update
  document.getElementById("editForm").addEventListener("submit", async (ev)=>{
    ev.preventDefault();
    showMsg("⏳ Menyimpan...");
    try {
      const ok = await validateToken();
      if (!ok) {
        showMsg("Sesi tidak valid. Silakan login ulang.", "text-danger");
        setTimeout(()=> location.href="login.html", 800);
        return;
      }
      const file = $("photo").files[0];
      const base64 = await toBase64(file);

      const payload = {
        mode: "update",
        id,
        token: session.token,
        updatedBy: session.name || session?.name || "",
        name: $("name").value.trim(),
        domisili: "", // field not present in this compact version; keep empty or add input in HTML if needed
        relationship: "", // ditambahkan bila diperlukan
        parentIdAyah: $("father").value || "",
        parentIdIbu: $("mother").value || "",
        spouseId: $("spouse").value || "",
        orderChild: $("birthOrder").value || "",
        status: $("status").value || "",
        notes: $("notes").value.trim() || "",
        photo_base64: base64 || "",
        photo_type: file ? file.type : ""
      };

      console.log("update payload:", payload);

      const res = await fetch(API, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload),
        mode: "cors"
      });
      const j = await res.json();
      console.log("update response:", j);
      if (j.status === "success") {
        showMsg("✅ Berhasil diperbarui!", "text-success");
      } else {
        showMsg("❌ Gagal: " + (j.message || "unknown"), "text-danger");
      }
    } catch (err) {
      console.error("submit err", err);
      showMsg("❌ Error saat menyimpan: " + err.message, "text-danger");
    }
  });

  // delete handler
  document.getElementById("btnDelete").addEventListener("click", async ()=>{
    if(!confirm("⚠️ Yakin ingin menghapus anggota ini?")) return;
    try {
      const res = await fetch(`${API}?mode=delete&id=${encodeURIComponent(id)}&token=${encodeURIComponent(session.token)}`);
      const j = await res.json();
      console.log("delete ->", j);
      if (j.status === "success") {
        alert("🗑️ Data berhasil dihapus.");
        location.href = "dashboard.html";
      } else {
        alert("❌ " + (j.message || "gagal"));
      }
    } catch (e) {
      console.error("delete err", e);
      alert("Error saat hapus: " + e.message);
    }
  });

  // logout
  function logout() {
    fetch(`${API}?mode=logout&token=${encodeURIComponent(session.token)}`)
      .finally(()=> {
        localStorage.removeItem("familyUser");
        localStorage.removeItem("user");
        location.href = "login.html";
      });
  }
  document.getElementById("btnLogout").addEventListener("click", logout);

  // init
  loadDetail();
})();
