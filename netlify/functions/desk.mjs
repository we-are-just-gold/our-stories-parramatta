// Welcome desk. A live list built from the consent forms, with a task list.
// POST /api/desk  {consent: {...}}                 a copy of a consent form just sent (no mobile number kept here)
// GET  /api/desk                                  whether Humanitix is connected, and how many tickets (no names)
// Desk only, with the desk password:
//   {list: true}            people, tasks and the run sheet
//   {tick: id, on: bool}    tick or untick a task
//   {arrived: key, on: bool} mark a person as arrived
import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const deskCode = () => {
  try { return (globalThis.Netlify && Netlify.env.get("DESK_CODE")) || process.env.DESK_CODE || ""; }
  catch { return process.env.DESK_CODE || ""; }
};
const clean = (v, n = 120) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);
const keyOf = (name) => clean(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const cleanId = (v) => String(v || "").replace(/[^0-9a-z-]/g, "").slice(0, 80);
const sentAt = (key) => parseInt(key.slice(key.indexOf("/") + 1), 10) || 0;

// The day at a glance, from the volunteer pack. Minutes after midnight, Sydney time.
const RUN = [
  [540, "Set up", "Rooms, the welcome desk, signage, camera free tables and a support card on every table."],
  [570, "Doors open", "Sign people in, hand out name badges and bright stickers, and point people to Start your day in the app."],
  [675, "Catering arrives", "Catering sets up in the Civic Gallery foyer."],
  [720, "Lunch", "Lunch is for everyone attending any session, volunteers too."],
  [735, "Welcome desk open for Create", "The desk opens 30 minutes before each session."],
  [870, "Welcome desk open for Share", "The desk opens 30 minutes before each session."],
  [885, "Break", "Reset the room into circles for Share."],
  [1020, "Pack down", "Collect equipment and signage."],
];

const cache = new Map();

// ---------- Humanitix: who has booked (read only) ----------
const HX = "https://api.humanitix.com/v1";
const env = (k) => {
  try { return (globalThis.Netlify && Netlify.env.get(k)) || process.env[k] || ""; }
  catch { return process.env[k] || ""; }
};
const hxEvent = () => env("HUMANITIX_EVENT_ID") || "6ae16f380e0963afc2c6ce8c";
let hxCache = { at: 0, data: null };

async function hxGet(path, key) {
  const r = await fetch(HX + path, { headers: { "x-api-key": key, accept: "application/json" } });
  if (!r.ok) { const e = new Error("Humanitix " + r.status); e.status = r.status; throw e; }
  return r.json();
}
async function hxPages(path, key, field) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const j = await hxGet(path + (path.includes("?") ? "&" : "?") + "page=" + page + "&pageSize=100", key);
    const rows = j[field] || [];
    out.push(...rows);
    if (!rows.length || out.length >= (j.total || 0)) break;
  }
  return out;
}
// Question labels, wherever the event keeps them: any list of {_id, question}.
function questionLabels(node, map = new Map(), depth = 0) {
  if (!node || typeof node !== "object" || depth > 6) return map;
  if (Array.isArray(node)) { node.forEach((x) => questionLabels(x, map, depth + 1)); return map; }
  if (node._id && typeof node.question === "string") map.set(String(node._id), node.question);
  Object.values(node).forEach((v) => questionLabels(v, map, depth + 1));
  return map;
}
// Ticket types and how many of each can be sold, wherever the event keeps them: any list of {name, quantity}.
function ticketCaps(node, out = [], depth = 0) {
  if (!node || typeof node !== "object" || depth > 6) return out;
  if (Array.isArray(node)) { node.forEach((x) => ticketCaps(x, out, depth + 1)); return out; }
  if (typeof node.name === "string" && Number.isFinite(node.quantity) && !node.deleted) {
    if (!out.some((x) => x.name === clean(node.name, 60))) out.push({ name: clean(node.name, 60), capacity: node.quantity });
    return out;
  }
  Object.values(node).forEach((v) => ticketCaps(v, out, depth + 1));
  return out;
}
// "Create for adults: 12.45pm to 2.45pm" sorts by its first time when the event gives no order.
const startOf = (name) => { const m = /(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)/i.exec(name); if (!m) return 9999; return ((+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + (+m[2] || 0); };
const needLabel = (q) => (/diet|allerg|food/i.test(q) ? "Dietary" : /access|support|mobility|interpret/i.test(q) ? "Access" : "");
const emptyAnswer = (v) => !v || /^(no|none|nil|n\/?a|na|no thanks?|nothing|-+)\.?$/i.test(v);

async function humanitix() {
  const key = env("HUMANITIX_API_KEY");
  if (!key) return { status: "off", people: [] };
  if (hxCache.data && Date.now() - hxCache.at < 60000) return hxCache.data;
  try {
    const ev = hxEvent();
    const [tickets, orders, event] = await Promise.all([
      hxPages(`/events/${ev}/tickets?status=complete`, key, "tickets"),
      hxPages(`/events/${ev}/orders`, key, "orders").catch(() => []),
      hxGet(`/events/${ev}`, key).catch(() => null),
    ]);
    const labels = questionLabels(event);
    const orderBy = new Map(orders.map((o) => [String(o._id), o]));
    const needsOf = (fields) => (fields || []).map((f) => {
      const label = needLabel(labels.get(String(f.questionId)) || "");
      const value = clean(f.value, 200);
      return label && !emptyAnswer(value) ? { label, value } : null;
    }).filter(Boolean);
    const by = new Map();
    for (const t of tickets) {
      if (t.status && t.status !== "complete") continue;
      const o = orderBy.get(String(t.orderId)) || {};
      const name = clean(`${t.firstName || ""} ${t.lastName || ""}`, 100) || clean(`${o.firstName || ""} ${o.lastName || ""}`, 100) || "Booking " + clean(t.orderName || t.orderId, 20);
      const key2 = keyOf(name);
      if (!by.has(key2)) by.set(key2, { key: key2, name, sessions: new Map(), tickets: 0, checkedIn: false, needs: [] });
      const p = by.get(key2);
      const type = clean(t.ticketTypeName, 60) || "Ticket";
      p.sessions.set(type, (p.sessions.get(type) || 0) + 1);
      p.tickets++;
      if (t.checkIn && t.checkIn.checkedIn) p.checkedIn = true;
      for (const n of [...needsOf(t.additionalFields), ...needsOf(o.additionalFields)]) {
        if (!p.needs.some((x) => x.label === n.label && x.value === n.value)) p.needs.push(n);
      }
    }
    const people = [...by.values()].map((p) => ({ ...p, sessions: [...p.sessions].map(([name, count]) => ({ name, count })) }));
    const caps = ticketCaps(event);
    const sold = new Map();
    for (const t of tickets) { const n = clean(t.ticketTypeName, 60) || "Ticket"; sold.set(n, (sold.get(n) || 0) + 1); }
    const names = [...new Set([...caps.map((c) => c.name), ...sold.keys()])];
    if (!caps.length) names.sort((x, y) => startOf(x) - startOf(y));
    const types = names.map((name) => ({ name, sold: sold.get(name) || 0, capacity: (caps.find((c) => c.name === name) || {}).capacity || 0 }));
    hxCache = { at: Date.now(), data: { status: "ok", people, types, tickets: tickets.length, orders: orders.length } };
  } catch (e) {
    // Keep showing the last good list if Humanitix stops answering.
    if (hxCache.data && hxCache.data.status === "ok") return { ...hxCache.data, stale: true };
    hxCache = { at: Date.now() - 45000, data: { status: "error", code: e.status || 0, people: [] } };
  }
  return hxCache.data;
}

async function view(store) {
  const { blobs } = await store.list();
  const keys = blobs.map((x) => x.key);
  const ticks = new Set(keys.filter((k) => k.startsWith("t/")).map((k) => k.slice(2)));
  const arrived = new Set(keys.filter((k) => k.startsWith("r/")).map((k) => k.slice(2)));
  const unticks = new Set(keys.filter((k) => k.startsWith("u/")).map((k) => k.slice(2)));
  const pKeys = keys.filter((k) => k.startsWith("p/")).sort((a, b) => sentAt(a) - sentAt(b));
  await Promise.all(pKeys.filter((k) => !cache.has(k)).map(async (k) => {
    const v = await store.get(k, { type: "json" });
    if (v) cache.set(k, v);
  }));
  const byKey = new Map();
  for (const k of pKeys) {
    const f = cache.get(k);
    if (!f || !f.name) continue;
    const key = keyOf(f.name);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ ...f, at: sentAt(k) });
  }
  const people = [], tasks = [];
  for (const [key, forms] of byKey) {
    const last = forms[forms.length - 1];
    const differs = [];
    if (forms.some((f) => f.photos !== last.photos)) differs.push("their own photos");
    if (forms.some((f) => f.under18 && last.under18 && f.youngPhotos !== last.youngPhotos)) differs.push("the young people’s photos");
    people.push({
      key, name: last.name, photos: last.photos, under18: !!last.under18, young: last.young || "",
      youngPhotos: last.youngPhotos || "", permission: !!last.permission, forms: forms.length, at: last.at,
      desk: !!last.desk, differs, arrived: arrived.has(key),
    });
    const youngUnsure = differs.includes("the young people’s photos");
    if (last.photos === "sticker") tasks.push({ id: "sticker-" + key, who: key, kind: "sticker", text: `Bright sticker for ${last.name}.` });
    if (last.under18 && last.young && (last.youngPhotos === "sticker" || youngUnsure)) {
      tasks.push({ id: "ysticker-" + key, who: key, kind: "sticker", text: `Bright stickers for ${last.young}, with ${last.name}.` });
    }
    if (differs.length) {
      tasks.push({ id: "check-" + key, kind: "check",
        text: `Ask ${last.name} about ${differs.join(" and ")}. Their forms disagree.` + (youngUnsure ? " Use bright stickers until they confirm." : "") });
    }
    if (last.under18 && !last.permission) {
      tasks.push({ id: "perm-" + key, kind: "check", text: `${last.name} has not ticked permission for ${last.young || "the young person"} to take part.` });
    }
  }
  // Add who has booked on Humanitix, matched to consent forms by name.
  const hx = await humanitix();
  if (hx.status === "ok") {
    const have = new Map(people.map((p) => [p.key, p]));
    for (const b of hx.people) {
      const extra = { booked: true, sessions: b.sessions, tickets: b.tickets, checkedIn: b.checkedIn, needs: b.needs };
      if (have.has(b.key)) Object.assign(have.get(b.key), extra);
      else people.push({ key: b.key, name: b.name, photos: "", under18: false, young: "", youngPhotos: "", permission: false,
        forms: 0, at: 0, desk: false, differs: [], arrived: arrived.has(b.key), noConsent: true, ...extra });
    }
  }
  // Tickets by session, with how many belong to people ticked as arrived.
  const types = (hx.types || []).map((t) => ({ ...t, arrived: 0 }));
  for (const p of people) {
    if (!p.arrived || !p.sessions) continue;
    for (const se of p.sessions) { const t = types.find((x) => x.name === se.name); if (t) t.arrived += se.count; }
  }
  people.sort((a, b) => a.name.localeCompare(b.name));
  // A sticker is handed over at sign in, so ticking someone as arrived ticks their sticker tasks.
  // Unticking that task by hand keeps it open. Checks (forms that disagree, permission) stay manual.
  tasks.forEach((t) => {
    const auto = t.kind === "sticker" && arrived.has(t.who) && !unticks.has(t.id);
    t.done = ticks.has(t.id) || auto;
    if (auto && !ticks.has(t.id)) t.auto = true;
    delete t.who;
  });
  const run = RUN.map(([at, title, text]) => ({ id: "run-" + at, at, title, text, done: ticks.has("run-" + at) }));
  return { people, tasks, run, types, humanitix: { status: hx.status, code: hx.code || 0, stale: !!hx.stale, tickets: hx.tickets || 0, orders: hx.orders || 0, booked: hx.people.length } };
}

export async function handle(req, store) {
  if (req.method !== "POST") {
    // Counts only, no names: lets anyone check that Humanitix is connected.
    const hx = await humanitix();
    const { blobs } = await store.list({ prefix: "p/" });
    return json({ humanitix: hx.status, code: hx.code || 0, tickets: hx.tickets || 0, booked: hx.people.length, consentForms: blobs.length,
      types: (hx.types || []).map((t) => ({ name: t.name, sold: t.sold, capacity: t.capacity })) });
  }
  let b;
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  if (b.consent && typeof b.consent === "object") {
    const c = b.consent;
    const name = clean(c.name, 100);
    if (!name) return json({ error: "no name" }, 400);
    const under18 = /^yes, and/i.test(String(c.under_18 || ""));
    const rec = {
      name,
      photos: /rather not/i.test(String(c.photos_and_video || "")) ? "sticker" : "ok",
      under18,
      young: under18 ? clean(c.young_person_name, 160) : "",
      permission: under18 && /yes/i.test(String(c.guardian_permission_to_take_part || "")),
      youngPhotos: !under18 ? "" : (/cannot/i.test(String(c.young_person_photos_and_video || "")) ? "sticker" : "ok"),
      desk: !!c.desk,
    };
    const at = Number(c.at);
    const topUp = at > 1.79e12 && at <= Date.now();
    const ts = topUp ? Math.floor(at) : Date.now();
    if (topUp) {
      // A top up from the signed records: skip a form the desk already holds.
      const { blobs } = await store.list({ prefix: "p/" });
      const near = blobs.map((x) => x.key).filter((k) => Math.abs(sentAt(k) - ts) <= 180000);
      for (const k of near) {
        const f = cache.get(k) || (await store.get(k, { type: "json" }));
        if (f && keyOf(f.name) === keyOf(name) && f.photos === rec.photos && !!f.under18 === rec.under18 && (f.youngPhotos || "") === rec.youngPhotos) {
          return json({ ok: true, skipped: true });
        }
      }
    }
    await store.setJSON("p/" + ts + "-" + Math.random().toString(36).slice(2, 8), rec);
    return json({ ok: true });
  }
  const code = deskCode();
  if (!code || norm(b.code) !== norm(code)) return json({ error: "wrong password" }, 403);
  if (b.tick) {
    const id = cleanId(b.tick);
    if (b.on === false) { await store.delete("t/" + id); await store.set("u/" + id, "1"); }
    else { await store.set("t/" + id, "1"); await store.delete("u/" + id); }
    return json({ ok: true });
  }
  if (b.arrived) {
    const id = cleanId(b.arrived);
    if (b.on === false) await store.delete("r/" + id); else await store.set("r/" + id, "1");
    return json({ ok: true });
  }
  return json(await view(store));
}

export default async (req) => handle(req, getStore({ name: "welcome-desk", consistency: "strong" }));

export const config = { path: "/api/desk" };
