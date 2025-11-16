const pb = new PocketBase("https://YOUR-POCKETBASE-URL");

async function generateTree() {
    const people = await pb.collection("people").getFullList();

    let container = document.getElementById("treeContainer");
    container.innerHTML = "";

    people.forEach(p => {
        let html = `
            <div class='personBox'>
                <img src="${pb.baseUrl}/api/files/people/${p.id}/${p.photo}" width="80">
                <h3>${p.name}</h3>
                <p>${p.domisili}</p>
                <p>Ayah: ${p.expand?.father?.name || "-"}</p>
                <p>Ibu: ${p.expand?.mother?.name || "-"}</p>
                <p>Pasangan: ${p.expand?.spouse?.name || "-"}</p>
            </div>
        `;
        container.innerHTML += html;
    });
}

generateTree();
