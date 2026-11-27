// Evaluation notes: the team's own notes, transcripts, audio and pictures from the day. Password needed for everything (DESK_CODE).
// POST /api/evnotes, JSON body with code and op:
//   {op: "list"}                                   every note, newest first, with its files listed (no file data)
//   {op: "add", session, kind, text}               a new note; returns its id
//   {op: "part", id, fid, i, n, name, type, b64}   one part of a file (up to about 3 MB); the last part adds the file to the note
//   {op: "get", fid, i}                            one part of a file, as raw bytes
//   {op: "delete", id}                             a note and its files
import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const code = () => {
  try { return (globalThis.Netlify && Netlify.env.get("DESK_CODE")) || process.env.DESK_CODE || ""; }
  catch { return process.env.DESK_CODE || ""; }
};
const SESSIONS = ["General", "Welcome desk", "Hear", "Lunch", "Create", "Share"];
const KINDS = ["Note", "Transcript", "Audio", "Picture", "Quote"];
const idOk = (v) => /^[a-z0-9-]{6,60}$/.test(String(v || ""));
const pad = (i) => String(i).padStart(4, "0");
const MAX_PART = 4.2 * 1024 * 1024; // base64 text of a 3 MB part

export async function handle(req, store) {
  if (req.method !== "POST") return json({ error: "use POST" }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  if (!code() || norm(b.code) !== norm(code())) return json({ error: "wrong password" }, 403);

  if (b.op === "list") {
    const { blobs } = await store.list({ prefix: "n/" });
    const notes = (await Promise.all(blobs.map((x) => store.get(x.key, { type: "json" })))).filter(Boolean);
    notes.sort((x, y) => y.at - x.at);
    return json({ notes });
  }
  if (b.op === "add") {
    const at = Date.now();
    const id = at + "-" + Math.random().toString(36).slice(2, 8);
    const note = {
      id, at,
      session: SESSIONS.includes(b.session) ? b.session : "General",
      kind: KINDS.includes(b.kind) ? b.kind : "Note",
      text: String(b.text || "").slice(0, 100000),
      by: String(b.by || "").replace(/\s+/g, " ").trim().slice(0, 60),
      files: [],
    };
    await store.setJSON("n/" + id, note);
    return json({ ok: true, id });
  }
  if (b.op === "part") {
    if (!idOk(b.id) || !idOk(b.fid)) return json({ error: "bad id" }, 400);
    const i = Number(b.i), n = Number(b.n);
    if (!Number.isInteger(i) || !Number.isInteger(n) || i < 0 || n < 1 || n > 200 || i >= n) return json({ error: "bad part" }, 400);
    const b64 = String(b.b64 || "");
    if (!b64 || b64.length > MAX_PART) return json({ error: "part too large" }, 413);
    const bytes = Buffer.from(b64, "base64");
    await store.set(`f/${b.fid}/${pad(i)}`, bytes);
    if (i === n - 1) {
      const note = await store.get("n/" + b.id, { type: "json" });
      if (!note) return json({ error: "no such note" }, 404);
      const { blobs } = await store.list({ prefix: `f/${b.fid}/` });
      if (blobs.length !== n) return json({ error: "parts missing", have: blobs.length }, 409);
      note.files = (note.files || []).filter((f) => f.fid !== b.fid);
      note.files.push({ fid: b.fid, n, size: Number(b.size) || 0,
        name: String(b.name || "file").replace(/[^\w .()-]/g, "").slice(0, 120) || "file",
        type: /^[a-z]+\/[\w.+-]+$/.test(String(b.type || "")) ? b.type : "application/octet-stream" });
      await store.setJSON("n/" + b.id, note);
    }
    return json({ ok: true });
  }
  if (b.op === "get") {
    if (!idOk(b.fid)) return json({ error: "bad id" }, 400);
    const buf = await store.get(`f/${b.fid}/${pad(Number(b.i) || 0)}`, { type: "arrayBuffer" });
    if (!buf) return json({ error: "not found" }, 404);
    return new Response(buf, { headers: { "content-type": "application/octet-stream", "cache-control": "no-store" } });
  }
  if (b.op === "delete") {
    if (!idOk(b.id)) return json({ error: "bad id" }, 400);
    const note = await store.get("n/" + b.id, { type: "json" });
    if (note) for (const f of note.files || []) {
      const { blobs } = await store.list({ prefix: `f/${f.fid}/` });
      await Promise.all(blobs.map((x) => store.delete(x.key)));
    }
    await store.delete("n/" + b.id);
    return json({ ok: true });
  }
  return json({ error: "unknown op" }, 400);
}

export default async (req) => handle(req, getStore({ name: "evaluation-notes", consistency: "strong" }));

export const config = { path: "/api/evnotes" };
