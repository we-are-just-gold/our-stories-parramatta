// Live poll for Hear: Dr Ru's three questions.
// POST /api/poll  {i_like, i_do_not_like, i_wish}   add answers (no names, no IP kept)
// GET  /api/poll                                   answers a host has shown, and how many are waiting
// Host only, with the host code:
//   {pending: true}   every answer, with the waiting ones marked
//   {show: id}        show one waiting answer        {showAll: true}  show everything waiting now
//   {hold: bool}      turn the hold on or off        {hide: id}       take an answer off the screen
//   {unhide: id}      bring a hidden answer back
//   {clear: true}     delete every answer
import { getStore } from "@netlify/blobs";

const QS = ["i_like", "i_do_not_like", "i_wish"];
// Answers sent before this moment were tests. They are deleted the next time the poll is read.
const PURGE_BEFORE = 1795667793049; // Thursday 26 November 2026, 3.36pm Sydney time
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

const idOf = (key) => key.slice(key.indexOf("/") + 1);
const sentAt = (id) => parseInt(id, 10) || 0;
const cleanId = (v) => String(v).replace(/[^0-9a-z-]/g, "").slice(0, 40);

// Everything the poll knows, from one listing. Keys:
//   a/<id> an answer   h/<id> hidden   ok/<id> shown by a host
//   u/<time> everything sent up to this time is shown   s/hold-off the hold is switched off
async function read(store) {
  const { blobs } = await store.list();
  const old = blobs.filter((x) => /^(a|h|ok)\//.test(x.key) && sentAt(idOf(x.key)) < PURGE_BEFORE);
  if (old.length) {
    await Promise.all(old.map((x) => store.delete(x.key)));
    old.forEach((x) => cache.delete(x.key));
  }
  const gone = new Set(old.map((x) => x.key));
  const keys = blobs.map((x) => x.key).filter((k) => !gone.has(k));
  const pick = (p) => keys.filter((k) => k.startsWith(p));
  const hidden = new Set(pick("h/").map(idOf));
  const ok = new Set(pick("ok/").map(idOf));
  const upto = Math.max(0, ...pick("u/").map((k) => sentAt(idOf(k))));
  const hold = !keys.includes("s/hold-off");
  const aKeys = pick("a/");
  await Promise.all(aKeys.filter((k) => !cache.has(k)).map(async (k) => {
    const v = await store.get(k, { type: "json" });
    if (v) cache.set(k, v);
  }));
  const every = aKeys
    .map((k) => ({ id: idOf(k), ...(cache.get(k) || {}) }))
    .filter((x) => x.q)
    .sort((x, y) => (x.id < y.id ? -1 : 1));
  const all = every.filter((x) => !hidden.has(x.id));
  const gonePile = every.filter((x) => hidden.has(x.id));
  const shown = (x) => !hold || sentAt(x.id) <= upto || ok.has(x.id);
  return { keys, all, hiddenList: gonePile, shown, hold };
}

const setUpto = async (store, keys) => {
  await store.set("u/" + Date.now(), "1");
  await Promise.all(keys.filter((k) => k.startsWith("u/")).map((k) => store.delete(k)));
};

export async function handle(req, store) {
  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
    const hostAsk = b.hide || b.unhide || b.clear || b.pending || b.show || b.showAll || typeof b.hold === "boolean";
    if (hostAsk) {
      const code = hostCode();
      if (!code || b.code !== code) return json({ error: "wrong code" }, 403);
      if (b.clear) {
        const { blobs } = await store.list();
        const del = blobs.filter((x) => /^(a|h|ok|u)\//.test(x.key));
        await Promise.all(del.map((x) => store.delete(x.key)));
        cache.clear();
        return json({ ok: true, cleared: del.filter((x) => x.key.startsWith("a/")).length });
      }
      if (b.hide) { await store.set("h/" + cleanId(b.hide), "1"); return json({ ok: true }); }
      if (b.unhide) { await store.delete("h/" + cleanId(b.unhide)); return json({ ok: true }); }
      if (b.show) { await store.set("ok/" + cleanId(b.show), "1"); return json({ ok: true }); }
      const s = await read(store);
      if (b.showAll) { await setUpto(store, s.keys); return json({ ok: true }); }
      if (typeof b.hold === "boolean") {
        if (b.hold) {
          // Switching the hold back on keeps everything already on the screen.
          await setUpto(store, s.keys);
          await store.delete("s/hold-off");
        } else {
          await store.set("s/hold-off", "1");
        }
        return json({ ok: true, hold: b.hold });
      }
      const answers = s.all.map((x) => (s.shown(x) ? x : { ...x, w: 1 }));
      const waiting = answers.filter((x) => x.w).length;
      return json({ answers: [...answers, ...s.hiddenList.map((x) => ({ ...x, h: 1 }))], waiting, hidden: s.hiddenList.length, hold: s.hold });
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
  const s = await read(store);
  const answers = s.all.filter(s.shown);
  return json({ answers, waiting: s.all.length - answers.length, hold: s.hold });
}

export default async (req) => handle(req, getStore({ name: "hear-poll", consistency: "strong" }));

export const config = { path: "/api/poll" };
