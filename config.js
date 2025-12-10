// config.js — CLEAN VERSION (ES Module)

// URL server Vercel kamu
export const API_ENDPOINT = "/api/submit";

// Wrapper helper FAMTREE_API
export const FAMTREE_API = {
  async submitData(payload) {
    try {
      const r = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await r.text();
      let json;

      try {
        json = JSON.parse(text);
      } catch {
        return {
          status: "error",
          message: "Response bukan JSON: " + text,
        };
      }

      return json;
    } catch (err) {
      return {
        status: "error",
        message: "Fetch error: " + err.message,
      };
    }
  }
};
