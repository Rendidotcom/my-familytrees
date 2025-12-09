(function () {
  const API = `${window.API_URL}?mode=insert&noCache=1`;
  const UPLOAD = `${window.API_URL}?mode=uploadPhoto&noCache=1`;

  const form = document.getElementById("formAdd");
  const msg = document.getElementById("msg");
  const photoInput = document.getElementById("photo");
  const preview = document.getElementById("preview");

  let uploadedURL = "";

  photoInput.addEventListener("change", () => {
    const f = photoInput.files[0];
    if (!f) return;
    preview.src = URL.createObjectURL(f);
    preview.style.display = "block";
  });

  async function uploadPhoto() {
    const f = photoInput.files[0];
    if (!f) return "";

    const fd = new FormData();
    fd.append("file", f);

    const r = await fetch(UPLOAD, { method: "POST", body: fd });
    const j = await r.json();

    if (j.status !== "success") throw new Error("Upload gagal");
    return j.url;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.innerHTML = "";

    try {
      if (photoInput.files.length > 0) {
        uploadedURL = await uploadPhoto();
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.photoURL = uploadedURL || "";

      const r = await fetch(API, {
        method: "POST",
        body: JSON.stringify(data),
      });

      const j = await r.json();
      if (j.status !== "success") throw new Error(j.message);

      msg.innerHTML = `<div class="success">Berhasil disimpan!</div>`;
      form.reset();
      preview.style.display = "none";

    } catch (err) {
      msg.innerHTML = `<div class="error">${err.message}</div>`;
    }
  });

})();
