const GAS_URL = "https://script.google.com/macros/s/AKfycbzRvMj-bFP08nZMXK1rEnAX7ZvOd46OK-r1bZ4ugT-2rV8vs9VpI1G_APZMJ-3AgBXlRw/exec";

const form = document.getElementById("editForm");
const member = JSON.parse(localStorage.getItem("editMember") || "{}");

if (!member.name) {
  alert("Data tidak ditemukan.");
  window.location.href = "dashboard.html";
}

// Isi form dengan data lama
form.name.value = member.name;
form.domisili.value = member.domisili;
form.relationship.value = member.relationship;
form.notes.value = member.notes || "";

const parentSelectorsDiv = document.getElementById("parentSelectors");
const parentIdAyah = document.getElementById("parentIdAyah");
const parentIdIbu = document.getElementById("parentIdIbu");
const spouseSelect = document.getElementById("spouseId");

// Tampilkan Parent ID hanya jika Anak
function toggleParentSelectors() {
  if (form.relationship.value === "Anak") {
    parentSelectorsDiv.style.display = "block";
  } else {
    parentSelectorsDiv.style.display = "none";
    parentIdAyah.value = "";
    parentIdIbu.value = "";
  }
}
form.relationship.addEventListener("change", toggleParentSelectors);
toggleParentSelectors();

// Ambil semua anggota untuk dropdown Ayah/Ibu/Spouse
function populateMemberDropdowns() {
  const callbackName = "jsonpCallback_" + Date.now();
  window[callbackName] = function(result) {
    if(result.status==="success"){
      // Ayah dropdown
      parentIdAyah.innerHTML = '<option value="">- Tidak ada -</option>';
      // Ibu dropdown
      parentIdIbu.innerHTML = '<option value="">- Tidak ada -</option>';
      // Spouse dropdown
      spouseSelect.innerHTML = '<option value="">- Tidak ada -</option>';

      result.data.forEach((m,i)=>{
        const option = `<option value="${m.index}" ${member.parentIdAyah==m.index?"selected":""}>${m.name}</option>`;
        if(m.relationship==="Ayah") parentIdAyah.innerHTML += option;
        if(m.relationship==="Ibu") parentIdIbu.innerHTML += option;

        const spouseOption = `<option value="${m.index}" ${member.spouseId==m.index?"selected":""}>${m.name}</option>`;
        spouseSelect.innerHTML += spouseOption;
      });
    }
    delete window[callbackName];
  };
  const script = document.createElement("script");
  script.src = GAS_URL + "?mode=getData&callback=" + callbackName;
  document.body.appendChild(script);
}

populateMemberDropdowns();

// Submit form
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  let photoURL = member.photoURL;

  const file = document.getElementById("photo").files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = async ()=>{
      const base64Photo = reader.result.split(",")[1];
      await sendUpdate({ photo_base64: base64Photo, photo_type: file.type });
    };
    reader.readAsDataURL(file);
  } else {
    await sendUpdate({});
  }
});

async function sendUpdate(photoData){
  const payload = {
    mode: "update",
    rowIndex: member.index,
    name: form.name.value,
    domisili: form.domisili.value,
    relationship: form.relationship.value,
    photoURL: photoData.photo_base64 ? "" : member.photoURL,
    notes: form.notes.value,
    parentIdAyah: parentIdAyah.value,
    parentIdIbu: parentIdIbu.value,
    spouseId: spouseSelect.value
  };
  if(photoData.photo_base64){
    payload.photo_base64 = photoData.photo_base64;
    payload.photo_type = photoData.photo_type;
  }

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
