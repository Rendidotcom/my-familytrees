// dashboard.js (clean full)
import { API_URL } from "./config.js";
import { getSession, validateToken, doLogout, createNavbar } from "./session.js";

createNavbar("dashboard");

function showCenterModal(title, message, buttons = []) {
  const existing = document.getElementById("__center_modal");
  if (existing) existing.remove();

  const wrap = document.createElement("div");
  wrap.id = "__center_modal";
  wrap.style.position = "fixed";
  wrap.style.left = 0;
  wrap.style.top = 0;
  wrap.style.right = 0;
  wrap.style.bottom = 0;
  wrap.style.background = "rgba(0,0,0,0.45)";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.zIndex = 9999;

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "20px 22px";
  box.style.borderRadius = "12px";
  box.style.maxWidth = "540px";
  box.style.width = "90%";
  box.style.boxShadow = "0 10px 40px rgba(0,0,0,0.2)";
  box.innerHTML = `<h3 style="margin-top:0">${title}</h3><p style="color:#333">${message}</p>`;

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.justifyContent = "flex-end";
  btnRow.style.gap = "8px";
  btnRow.style.marginTop = "12px";

  buttons.forEach(b => {
    const el = document.createElement("button");
    el.textContent = b.label;
    el.onclick = () => {
      if (b.onClick) b.onClick();
      wrap.remove();
    };
    el.style.padding = "8px 12px";
    el.style.borderRadius = "8px";
    el.style.border = "none";
    el.style.cursor = "pointer";
    if (b.className === "primary") {
      el.style.background = "#1976d2";
      el.style.color = "white";
    } else {
      el.style.background = "#eee";
    }
    btnRow.appendChild(el);
  });

  box.appendChild(btnRow);
  wrap.appendChild(box);
  document.body.appendChild(wrap);
  return wrap;
}

const session = getSession();

if (!session || !session.token) {
  showCenterModal("Sesi tidak ditemukan", "Sesi tidak ditemukan. Silakan login ulang.", [
    { label: "Buka Login", className: "primary", onClick: () => { window.location.href = "login.html"; } }
  ]);
} else {
  (async () => {
    const v = await validateToken(session.token);
    if (!v.valid) {
      showCenterModal("Sesi kadaluarsa", "Sesi Anda sudah tidak valid. Silakan login ulang.", [
        { label: "Ke Login", className: "primary", onClick: () => { doLogout(); } }
      ]);
    } else {
      // update session jika perlu
      const snew = {
        id: v.data.id || session.id,
        name: v.data.name || session.name,
        role: v.data.role || session.role,
        token: session.token
      };
      // simpan session baru ke localStorage
      localStorage.setItem("familyUser", JSON.stringify(snew));

      document.getElementById("userInfo").textContent = `${snew.name} (${snew.role})`;
      await loadData();
    }
  })().catch(err => {
    console.error("Token validation error:", err);
    showCenterModal("Kesalahan koneksi", "Tidak dapat memvalidasi sesi. Periksa koneksi Anda.", [
      { label: "Reload", onClick: () => location.reload() },
      { label: "Ke Login", className: "primary", onClick: () => doLogout() }
    ]);
  });
}

async function loadData() {
  const listEl = document.getElementById("list");
  if (!listEl) return;
  listEl.innerHTML = "⏳ Memuat data...";
  try {
    const res = await fetch(`${API_URL}?mode=getData&nocache=${Date.now()}`);
    if (!res.ok) throw new Error("Fetch gagal");
    const j = await res.json();
    if (j.status !== "success" || !Array.isArray(j.data)) {
      listEl.innerHTML = "Tidak ada data.";
      return;
    }
    renderList(j.data);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = "❌ Kesalahan koneksi server.";
  }
}

function renderList(data) {
  const list = document.getElementById("list");
  list.innerHTML = "";
  const sessionLocal = getSession() || {};
  data.forEach(p => {
    const photo = p.photoURL ? p.photoURL : "https://via.placeholder.com/60?text=👤";
    const card = document.createElement("div");
    card.className = "card";
    const actionButtons = [];
    if (sessionLocal.role === "admin" || sessionLocal.id === p.id) {
      actionButtons.push(`<button class="btn-edit" data-id="${p.id}">✏️ Edit</button>`);
    }
    if (sessionLocal.role === "admin") {
      actionButtons.push(`<button class="btn-del" data-id="${p.id}">🗑 Hapus</button>`);
    }
    actionButtons.push(`<button class="btn-view" data-id="${p.id}">👁 Detail</button>`);

    card.innerHTML = `
      <img src="${photo}" width="60" style="border-radius:8px">
      <div style="flex:1;margin-left:10px">
        <b>${p.name}</b><br><small>${p.relationship || ""}</small>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${actionButtons.join("")}
      </div>
    `;
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.padding = "8px";
    card.style.borderBottom = "1px solid #eee";
    list.appendChild(card);
  });

  // event delegation
  list.querySelectorAll(".btn-view").forEach(b =>
    b.addEventListener("click", e =>
      location.href = `detail.html?id=${e.currentTarget.dataset.id}`
    )
  );
  list.querySelectorAll(".btn-edit").forEach(b =>
    b.addEventListener("click", e =>
      location.href = `edit.html?id=${e.currentTarget.dataset.id}`
    )
  );
  list.querySelectorAll(".btn-del").forEach(b =>
    b.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Hapus data ini?")) return;
      try {
        const sess = getSession();
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "delete", id, token: sess.token })
        });
        const j = await res.json();
        if (j.status === "success") {
          alert("Berhasil dihapus");
          loadData();
        } else {
          alert("Gagal: " + (j.message || "unknown"));
        }
      } catch (err) {
        alert("Kesalahan koneksi saat menghapus");
      }
    })
  );
}
