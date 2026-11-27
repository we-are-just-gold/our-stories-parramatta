// Live evaluation feed. Keeps a copy of the survey and session answers so the evaluation page can show them as they arrive.
// No names, contact details, IP addresses or consent forms are kept.
// POST /api/eval  {form, data, at?, nid?}          one more answer set; at and nid (Netlify submission id) mark a backfill from earlier today, skipped if already held
// POST /api/eval  {list: true, code, day?}         every answer set for the day, password needed (EVAL_CODE)
import { getStore } from "@netlify/blobs";

// The forms the evaluation reads, and for each the fields it keeps (null keeps every field but the dropped ones).
export const FORMS = {
  "arrival-survey": null,
  "end-of-day-survey": null,
  "in-my-community": null,
  "quick-fire": null,
  "through-the-day": null,
  "share-your-story": ["story"],
  "circle-message": ["message", "table"],
};
const DROP = new Set(["bot-field", "form-name", "name", "first_name", "contact", "ip", "user_agent", "referrer", "story_consent",
  "guardian_name", "guardian_mobile", "young_person_name", "signature"]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const code = () => {
  try { return (globalThis.Netlify && Netlify.env.get("EVAL_CODE")) || process.env.EVAL_CODE || ""; }
  catch { return process.env.EVAL_CODE || ""; }
};
export const sydneyDay = (ms) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(ms));
const val = (v) => Array.isArray(v) ? v.slice(0, 20).map((x) => String(x).slice(0, 200)) : String(v ?? "").slice(0, 4000);

export function keep(form, data) {
  const only = FORMS[form];
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (DROP.has(k) || /^picture/.test(k)) continue;
    if (only && !only.includes(k)) continue;
    if (!/^[a-z0-9_]{1,80}(\[\])?$/.test(k)) continue;
    const x = val(v);
    if (Array.isArray(x) ? x.length : x.trim()) out[k] = x;
  }
  return out;
}

export async function handle(req, store) {
  if (req.method !== "POST") return json({ error: "use POST" }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  if (b.form) {
    const form = String(b.form);
    if (!(form in FORMS)) return json({ error: "unknown form" }, 400);
    const data = keep(form, b.data);
    if (!Object.keys(data).length) return json({ ok: true, empty: true });
    // A backfill from Netlify's own record carries its time; a live answer takes the time it arrives.
    const now = Date.now(), given = Number(b.at) || 0;
    const at = given && given <= now && sydneyDay(given) === sydneyDay(now) ? given : now;
    if (given) {
      // A backfill from Netlify's record: skip it if the live copy of the same answers arrived within three minutes.
      const flat = (d) => JSON.stringify(Object.keys(d).sort().map((k) => [k, [].concat(d[k]).map((x) => String(x).replace(/\s+/g, " ").trim())]));
      const same = flat(data);
      const { blobs } = await store.list({ prefix: `a/${sydneyDay(at)}/${form}/` });
      for (const x of blobs) {
        const t = parseInt(x.key.split("/").pop(), 10) || 0;
        if (Math.abs(t - at) > 180000) continue;
        const it = await store.get(x.key, { type: "json" });
        if (it && flat(it.data) === same) return json({ ok: true, skipped: true });
      }
      if (b.nid) {
        const k = `a/${sydneyDay(at)}/${form}/${at}-n${String(b.nid).replace(/[^a-z0-9]/gi, "").slice(0, 30)}`;
        if (await store.get(k)) return json({ ok: true, skipped: true });
        await store.setJSON(k, { at, form, data });
        return json({ ok: true });
      }
    }
    await store.setJSON(`a/${sydneyDay(at)}/${form}/${at}-${Math.random().toString(36).slice(2, 8)}`, { at, form, data });
    return json({ ok: true });
  }
  if (!code() || norm(b.code) !== norm(code())) return json({ error: "wrong password" }, 403);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(b.day || "")) ? b.day : sydneyDay(Date.now());
  const { blobs } = await store.list({ prefix: `a/${day}/` });
  const items = (await Promise.all(blobs.map((x) => store.get(x.key, { type: "json" })))).filter(Boolean);
  items.sort((x, y) => x.at - y.at);
  const forms = Object.fromEntries(Object.keys(FORMS).map((f) => [f, []]));
  for (const it of items) if (forms[it.form]) forms[it.form].push({ at: it.at, data: it.data });
  return json({ day, forms });
}

export default async (req) => handle(req, getStore({ name: "evaluation", consistency: "strong" }));

export const config = { path: "/api/eval" };
