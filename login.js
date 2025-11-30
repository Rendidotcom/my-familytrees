// login.js — non-module (load after config.js and session.js)
(function(){
  const API_URL = window.API_URL;

  const nameEl = document.getElementById("loginName");
  const pinEl = document.getElementById("loginPin");
  const nextBtn = document.getElementById("btnNext");
  const pinContainer = document.getElementById("pinContainer");
  const loginMsg = document.getElementById("loginMsg");

  // STEP 1: check user exists
  nextBtn.addEventListener("click", async function handler(){
    loginMsg.textContent = "";
    const name = (nameEl.value||"").trim();
    if(!name){ loginMsg.textContent = "Nama tidak boleh kosong."; return; }

    try{
      const res = await fetch(`${API_URL}?mode=checkUser&name=${encodeURIComponent(name)}`);
      const j = await res.json();
      if(j.status === "success" && j.exists){
        pinContainer.classList.remove("hidden");
        this.textContent = "Masuk";
        // replace handler to login
        this.removeEventListener("click", handler);
        this.addEventListener("click", loginUser);
      } else {
        loginMsg.textContent = "Nama belum terdaftar. Silakan buat akun.";
      }
    }catch(err){
      loginMsg.textContent = "Koneksi gagal.";
    }
  });

  async function loginUser(){
    loginMsg.textContent = "";
    const name = (nameEl.value||"").trim();
    const pin = (pinEl.value||"").trim();
    if(!pin){ loginMsg.textContent = "PIN wajib diisi."; return; }

    try{
      // Use FormData (GAS doPost will parse)
      const fd = new FormData();
      fd.append("mode","login");
      fd.append("name", name);
      fd.append("pin", pin);
      const res = await fetch(API_URL, { method: "POST", body: fd });
      const j = await res.json();

      if(j.status === "success"){
        // Normalize response shapes
        const token = j.token || j.data?.token || j.sessionToken || null;
        const userObj = j.user || j.data?.user || (j.id ? { id: j.id, name: j.name, role: j.role } : null);
        const session = {
          id: userObj?.id || null,
          name: userObj?.name || name,
          role: userObj?.role || "user",
          token: token || j.token,
          tokenExpiry: Date.now() + 24*60*60*1000
        };
        window.saveSession(session);
        window.location.href = "dashboard.html";
      } else {
        loginMsg.textContent = j.message || "Login gagal.";
      }
    }catch(err){
      loginMsg.textContent = "Koneksi gagal.";
    }
  }

  // REGISTER button handler (if present)
  document.getElementById("btnCreate")?.addEventListener("click", async function(){
    const name = (document.getElementById("regName")?.value||"").trim();
    const p1 = (document.getElementById("regPin1")?.value||"").trim();
    const p2 = (document.getElementById("regPin2")?.value||"").trim();
    const regMsg = document.getElementById("regMsg");
    regMsg.textContent = "";
    if(!name || !p1 || !p2){ regMsg.textContent = "Semua field wajib diisi."; return; }
    if(p1 !== p2){ regMsg.textContent = "PIN tidak sama."; return; }
    try{
      const fd = new FormData();
      fd.append("mode","register");
      fd.append("name", name);
      fd.append("pin", p1);
      const res = await fetch(API_URL, { method:"POST", body: fd });
      const j = await res.json();
      if(j.status === "success"){
        const session = { id:j.user.id, name:j.user.name, role:j.user.role, token:j.token, tokenExpiry: Date.now()+24*60*60*1000 };
        window.saveSession(session);
        location.href = "dashboard.html";
      } else {
        regMsg.textContent = j.message || "Gagal membuat akun.";
      }
    }catch(err){
      regMsg.textContent = "Koneksi gagal.";
    }
  });

})();
