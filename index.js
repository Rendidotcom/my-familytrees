<script>
(function () {

  // Endpoint via Vercel API → diteruskan ke GAS
  const API_INSERT = "/api/submit?mode=insert&noCache=1";
  const API_UPLOAD = "/api/submit?mode=uploadPhoto&noCache=1";

  const form = document.getElementById("formAdd");
  const msg = document.getElementById("msg");
  const photoInput = document.getElementById("photo");
  const preview = document.getElementById("preview");

  let uploadedURL = "";

  /* ===========================================================
     1. FOTO PREVIEW
  ============================================================ */
  photoInput.addEventListener("change", () => {
    const f = photoInput.files[0];
    if (!f) return;

    preview.src = URL.createObjectURL(f);
    preview.style.display = "block";
  });


  /* ===========================================================
     2. UPLOAD FOTO → dapatkan URL dari GAS
  ============================================================ */
  async function uploadPhoto() {
    const file = photoInput.files[0];
    if (!file) return ""; // jika tidak upload foto

    const fd = new FormData();
    fd.append("file", file);

    const r = await fetch(API_UPLOAD, {
      method: "POST",
      body: fd // jangan pakai headers
    });

    const j = await r.json();
    if (j.status !== "success") throw new Error("Upload foto gagal");

    return j.url; // URL file di Google Drive
  }


  /* ===========================================================
     3. SUBMIT FORM
  ============================================================ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.innerHTML = "Menyimpan...";

    try {
      /* ---- 3A. Jika ada foto → upload dulu ---- */
      if (photoInput.files.length > 0) {
        uploadedURL = await uploadPhoto();
      }

      /* ---- 3B. Ambil data form ---- */
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.photoURL = uploadedURL || "";

      /* ---- 3C. Kirim ke GAS sebagai JSON ---- */
      const r = await fetch(API_INSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      if (j.status !== "success") throw new Error(j.message);

      /* ---- 3D. Berhasil ---- */
      msg.innerHTML = `<div style="color:green">Berhasil disimpan!</div>`;
      form.reset();
      preview.style.display = "none";
      uploadedURL = "";

    } catch (err) {
      msg.innerHTML = `<div style="color:red">${err.message}</div>`;
    }
  });

})();
</script>
