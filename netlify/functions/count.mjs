// Head count for hosts. Counts only: no names, no answers, no IP kept.
// POST /api/count  {form}   one more form of this kind was sent
// GET  /api/count           how many of each were sent today, Sydney time
import { getStore } from "@netlify/blobs";

const FORMS = [
  "arrival-survey", "through-the-day", "share-your-story", "end-of-day-survey", "consent",
  "in-my-community", "quick-fire", "stage-spot", "read-for-me", "circle-message",
  "facilitator-reflection", "volunteer-reflection",
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const sydneyDay = (ms) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(ms));

export async function handle(req, store) {
  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
    const form = String(b.form || "");
    if (!FORMS.includes(form)) return json({ error: "unknown form" }, 400);
    await store.set("c/" + form + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8), "1");
    return json({ ok: true });
  }
  const today = sydneyDay(Date.now());
  const { blobs } = await store.list({ prefix: "c/" });
  const counts = Object.fromEntries(FORMS.map((f) => [f, 0]));
  for (const x of blobs) {
    const [, form, id] = x.key.split("/");
    if (form in counts && sydneyDay(parseInt(id, 10) || 0) === today) counts[form]++;
  }
  return json({ day: today, counts });
}

export default async (req) => handle(req, getStore({ name: "head-count", consistency: "strong" }));

export const config = { path: "/api/count" };
