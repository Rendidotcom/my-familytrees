export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "POST only" });
  }

  try {
    const GAS_URL =
      "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxx/exec";

    const r = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const j = await r.json();
    return res.status(200).json(j);

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
}
