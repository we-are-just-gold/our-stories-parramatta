// Live poll for Hear: Dr Ru's three questions.
// POST /api/poll  {i_like, i_do_not_like, i_wish}   add answers (no names, no IP kept)
// GET  /api/poll                                   every answer that is not hidden
// POST /api/poll  {hide: id, code} | {clear: true, code}   host only
import { getStore } from "@netlify/blobs";

const QS = ["i_like", "i_do_not_like", "i_wish"];
const cache = new Map();

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const hostCode = () => {
  try { return (globalThis.Netlify && Netlify.env.get("POLL_HOST_CODE")) || process.env.POLL_HOST_CODE || ""; }
  catch { return process.env.POLL_HOST_CODE || ""; }
};

export async function handle(req, store) {
  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
    if (b.hide || b.clear) {
      const code = hostCode();
      if (!code || b.code !== code) return json({ error: "wrong code" }, 403);
      if (b.clear) {
        const { blobs } = await store.list();
        await Promise.all(blobs.map((x) => store.delete(x.key)));
        cache.clear();
        return json({ ok: true, cleared: blobs.length });
      }
      const id = String(b.hide).replace(/[^0-9a-z-]/g, "").slice(0, 40);
      await store.set("h/" + id, "1");
      return json({ ok: true });
    }
    let n = 0;
    for (const q of QS) {
      const t = String(b[q] || "").replace(/\s+/g, " ").trim().slice(0, 280);
      if (!t) continue;
      const id = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      await store.setJSON("a/" + id, { q, t });
      n++;
    }
    return json({ ok: true, saved: n });
  }
  const [a, h] = await Promise.all([store.list({ prefix: "a/" }), store.list({ prefix: "h/" })]);
  const hidden = new Set(h.blobs.map((x) => x.key.slice(2)));
  await Promise.all(a.blobs.filter((x) => !cache.has(x.key)).map(async (x) => {
    const v = await store.get(x.key, { type: "json" });
    if (v) cache.set(x.key, v);
  }));
  const answers = a.blobs
    .map((x) => ({ id: x.key.slice(2), ...(cache.get(x.key) || {}) }))
    .filter((x) => x.q && !hidden.has(x.id))
    .sort((x, y) => (x.id < y.id ? -1 : 1));
  return json({ answers });
}

export default async (req) => handle(req, getStore({ name: "hear-poll", consistency: "strong" }));

export const config = { path: "/api/poll" };
