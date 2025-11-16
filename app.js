const pb = new PocketBase("https://YOUR-POCKETBASE-URL");

async function loadRelations() {
    let people = await pb.collection("people").getFullList();

    const father = document.getElementById("father");
    const mother = document.getElementById("mother");
    const spouse = document.getElementById("spouse");

    people.forEach(p => {
        father.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        mother.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        spouse.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
}

loadRelations();

document.getElementById("formPerson").addEventListener("submit", async (e) => {
    e.preventDefault();

    let formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("domisili", document.getElementById("domisili").value);

    const photo = document.getElementById("photo").files[0];
    if (photo) formData.append("photo", photo);

    formData.append("father", document.getElementById("father").value);
    formData.append("mother", document.getElementById("mother").value);
    formData.append("spouse", document.getElementById("spouse").value);

    const record = await pb.collection("people").create(formData);

    alert("Data berhasil disimpan!");
});
