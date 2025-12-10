export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GAS URL kamu
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzyQzbKwHKgjOAQWWYs4loX7YadF75CSVpUdvjtoflcx1ri699KfcYZSU4rqFzXWFhfUw/exec";

  try {
    const body = await req.json();

    const gasRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await gasRes.json();

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({ status: "error", message: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
