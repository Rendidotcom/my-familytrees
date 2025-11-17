const GAS_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

const form = document.getElementById("editForm");
const member = JSON.parse(localStorage.getItem("editMember") || "{}");
if(!member.name) {
  alert("Data tidak ditemukan.");
  window.location.href = "dashboard.html";
}

// isi form dengan data lama
form.name.value = member.name;
form.domisili.value = member.domisili;
form.relationship.value = member.relationship;

// populate spouse select
async function populateSpouseOptions(){
  const callbackName = "jsonpCallback_" + Date.now();
  window[callbackName] = function(result){
    if(result.status==="success"){
      const select = form.spouse;
      select.innerHTML = '<option value="">- Tidak ada -</option>';
      result.data.forEach((m, idx)=>{
        if(m.name !== member.name){
          const opt = document.createElement("option");
          opt.value = m.name;
          opt.text = m.name;
          if(member.spouse === m.name) opt.selected = true;
          select.appendChild(opt);
        }
      });
    }
    delete window[callbackName];
  };
  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + callbackName;
  document.body.appendChild(script);
}
populateSpouseOptions();

// submit form
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  let photoURL = member.photoURL;
  const file = document.getElementById("photo").files[0];

  if(file){
    const reader = new FileReader();
    reader.onload = async ()=>{
      const base64Photo = reader.result.split(",")[1];
      const payload = {
        mode: "update",
        rowIndex: member.index,
        name: form.name.value,
        domisili: form.domisili.value,
        relationship: form.relationship.value,
        spouse: form.spouse.value,
        photo_base64: base64Photo,
        photo_type: file.type
      };
      await sendUpdate(payload);
    };
    reader.readAsDataURL(file);
  } else {
    const payload = {
      mode: "update",
      rowIndex: member.index,
      name: form.name.value,
      domisili: form.domisili.value,
      relationship: form.relationship.value,
      spouse: form.spouse.value,
      photoURL: photoURL
    };
    await sendUpdate(payload);
  }
});

async function sendUpdate(payload){
  try{
    const res = await fetch(GAS_URL, { method:"POST", body: JSON.stringify(payload) });
    const result = await res.json();
    if(result.status==="success"){
      alert("✔ Data berhasil diperbarui!");
      window.location.href="dashboard.html";
    } else {
      alert("❌ Error: "+result.message);
    }
  }catch(err){
    alert("❌ Fetch error: "+err.message);
  }
}
