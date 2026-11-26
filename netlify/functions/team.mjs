// Team contacts for the volunteer and host pages. Kept out of the public pages:
// sent only to a browser that has already opened the team gate.
// POST /api/team  {k}   k is what the gate stored after the right password
const HOST = "9792875ded1497999a4de46722835339cce9346191da1c1ebc4ec5c144d9d407";
const VOL = "a3c4480df0d51a006ce17f5712259ec5b05bee492919163137b0d015222607fb";

// The contacts are not in this file or anywhere in the repo. They are set in Netlify as TEAM_CONTACTS,
// a JSON list of {name, role, phone, email}.
const contacts = () => {
  let raw = "";
  try { raw = (globalThis.Netlify && Netlify.env.get("TEAM_CONTACTS")) || process.env.TEAM_CONTACTS || ""; }
  catch { raw = process.env.TEAM_CONTACTS || ""; }
  try { const list = JSON.parse(raw); return Array.isArray(list) ? list : []; } catch { return []; }
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "not found" }, 404);
  let b;
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const k = String((b && b.k) || "");
  if (k !== HOST && k !== VOL) return json({ error: "locked" }, 401);
  return json({ contacts: contacts() });
};

export const config = { path: "/api/team" };
