// Stage list for hosts and The room: stage spot requests, things to read out, and stories sent today.
// POST /api/stage {k} (what the Hosts gate stores) or {code} (The room password).
// Reads the site's own Netlify form records with NETLIFY_API_TOKEN. Never returns email, phone or IP.
const SITE = "57556a4b-9282-489e-8ca3-1ca8ec0d69e7";
const FORM = { stage: "6b04ede3083b724416f48eb5", read: "6b04f7f632e2811554089c08", story: "6b04e7f4016c677df5eaef41" };
const HOST_KEY = "9792875ded1497999a4de46722835339cce9346191da1c1ebc4ec5c144d9d407";
const env = (k) => { try { return (globalThis.Netlify && Netlify.env.get(k)) || process.env[k] || ""; } catch { return process.env[k] || ""; } };
const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const day = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date(ms));
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });

let cache = { at: 0, body: null };
async function subs(id, token) {
  const r = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}/forms/${id}/submissions?per_page=100`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("netlify " + r.status);
  return r.json();
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "use POST" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const ok = String(b.k || "") === HOST_KEY || (env("EVAL_CODE") && norm(b.code) === norm(env("EVAL_CODE")));
  if (!ok) return json({ error: "locked" }, 403);
  if (cache.body && Date.now() - cache.at < 10000) return json(cache.body);
  const token = env("NETLIFY_API_TOKEN");
  if (!token) return json({ error: "no token" }, 503);
  try {
    const today = day(Date.now());
    const [st, rd, sy] = await Promise.all([subs(FORM.stage, token), subs(FORM.read, token), subs(FORM.story, token)]);
    const keep = (list) => list.filter((s) => day(Date.parse(s.created_at)) === today);
    const body = {
      stage: keep(st).map((s) => ({ at: Date.parse(s.created_at), name: s.data.name || "", minutes: s.data.minutes || "" })),
      read: keep(rd).map((s) => ({ at: Date.parse(s.created_at), name: s.data.first_name || "", text: s.data.to_read_out || "" })),
      stories: keep(sy).map((s) => {
        const d = s.data || {}, named = d.name_me_as && !/without/i.test(d.name_me_as);
        const pics = ["picture", "picture_2", "picture_3", "picture_4", "picture_5"].map((k) => d[k] && d[k].url).filter(Boolean);
        return { at: Date.parse(s.created_at), name: named ? d.name || "" : "", nameAs: d.name_me_as || "", portrait: /^yes/i.test(d.portrait || ""), adult: d.adult || "", text: d.story || "", pics };
      }),
    };
    cache = { at: Date.now(), body };
    return json(body);
  } catch (e) {
    return json({ error: "Could not reach the form records" }, 502);
  }
};
export const config = { path: "/api/stage" };
