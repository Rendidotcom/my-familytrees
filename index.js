(function () {
  const API = "/api/submit";

  const form = document.getElementById("formAdd");
  const msg = document.getElementById("msg");
  const photoInput = document.getElementById("photo");
  const preview = document.getElementById("preview");

  let base64Photo = "";

  photoInput.addEventListener("change", () => {
    const f = photoInput.files[0];
    if (!f) return;

    preview.src = URL.createObjectURL(f);
    preview.style.display = "block";

    const r = new FileReader();
    r.onload = () => base64Photo = r.result;
    r.readAsDataURL(f);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.innerHTML = "Sending...";

    try {
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      data.mode = "insert";
      data.photoBase64 = base64Photo || "";

      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const j = await r.json();

      if (j.status !== "success")
        throw new Error(j.message);

      msg.innerHTML = `<div style="color:green">Berhasil!</div>`;
      form.reset();
      preview.style.display = "none";

    } catch (err) {
      msg.innerHTML = `<div style="color:red">${err.message}</div>`;
    }
  });

})();
