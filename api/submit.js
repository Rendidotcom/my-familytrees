export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method Not Allowed" });
  }

  try {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbxxxxxxx/exec";

    const r = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await r.text();

    // Paksa GAS selalu JSON
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res.status(500).json({
        status: "error",
        message: "GAS response bukan JSON: " + text,
      });
    }

    return res.status(200).json(json);

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
}
