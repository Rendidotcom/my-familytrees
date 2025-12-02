createNavbar();

// ========================
// AMBIL SESSION LOGIN
// ========================
let session = JSON.parse(localStorage.getItem("familyUser") || "null");

if(!session || !session.token){
  alert("Harap login dahulu!");
  location.href = "login.html";
}

// ========================
// VALIDASI TOKEN
// ========================
async function validateToken(){
  try{
    const r = await fetch(`${API_URL}?mode=validate&token=${session.token}`);
    const j = await r.json();

    if(j.status !== "success"){
      alert("Sesi berakhir, silakan login ulang.");
      logout();
    }

    if(j.role !== "admin"){
      alert("Hanya admin yang dapat menambah anggota.");
      location.href = "dashboard.html";
    }

    session.role = j.role;
    session.name = j.name;

  }catch(err){
    console.error(err);
    logout();
  }
}
validateToken();

// ========================
// SIMPAN DATA (POST + FormData)
// ========================
async function saveData(){
  const btn = document.getElementById("btnSave");
  const msg = document.getElementById("msg");

  const name = document.getElementById("name").value.trim();
  if(!name){
    alert("Nama wajib diisi.");
    return;
  }

  btn.disabled = true;
  btn.style.opacity = "0.6";
  msg.textContent = "⏳ Menyimpan...";

  const fd = new FormData();

  fd.append("mode", "insert");
  fd.append("token", session.token);
  fd.append("createdBy", session.name);

  fd.append("name", document.getElementById("name").value.trim());
  fd.append("domisili", document.getElementById("domisili").value.trim());
  fd.append("relationship", document.getElementById("relationship").value);
  fd.append("parentIdAyah", document.getElementById("parentIdAyah").value);
  fd.append("parentIdIbu", document.getElementById("parentIdIbu").value);
  fd.append("spouseId", document.getElementById("spouseId").value);
  fd.append("orderChild", document.getElementById("orderChild").value);
  fd.append("status", document.getElementById("status").value);
  fd.append("notes", document.getElementById("notes").value.trim());

  // Foto opsional
  const photo = document.getElementById("photo").files[0];
  if(photo){
    fd.append("photo", photo);
  }

  try{
    const res = await fetch(API_URL, {
      method: "POST",
      body: fd
    });

    const j = await res.json();

    if(j.status === "success"){
      msg.textContent = "✅ Berhasil ditambahkan!";
      document.getElementById("formAdd").reset();
    } else {
      msg.textContent = "❌ Gagal: " + (j.message || "Tidak diketahui");
    }

  }catch(err){
    msg.textContent = "❌ Error: " + err.message;
  }

  btn.disabled = false;
  btn.style.opacity = "1";
}

// ========================
// LOGOUT
// ========================
function logout(){
  fetch(`${API_URL}?mode=logout&token=${session?.token||""}`)
    .finally(()=>{
      localStorage.removeItem("familyUser");
      location.href = "login.html";
    });
}
