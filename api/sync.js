// SmartPonto — API de sincronização (Vercel Serverless + Neon Postgres)
// GET  /api/sync?since=<iso>           → estado partilhado + eventos alterados desde `since`
// POST /api/sync {state, events, since} → funde alterações do cliente e devolve o mesmo que o GET
const { neon } = require('@neondatabase/serverless');

const COLLECTIONS = ['users', 'workers', 'locations', 'devices', 'shifts', 'corrections'];
const byId = (arr, key) => { const m = new Map(); (arr || []).forEach(x => m.set(x[key] || x.id, x)); return m; };

function mergeState(server, client) {
  const out = Object.assign({}, server || {});
  for (const c of COLLECTIONS) {
    const m = byId(server && server[c], 'id');
    for (const rec of (client && client[c]) || []) {
      const cur = m.get(rec.id);
      if (c === 'corrections' && cur && cur.decidedAt && !rec.decidedAt) continue; // decisão já tomada noutro dispositivo
      m.set(rec.id, rec);
    }
    out[c] = [...m.values()];
  }
  if (client && client.policy && (!server || !server.policy || (client.policy.updatedAt || '') >= (server.policy.updatedAt || ''))) out.policy = client.policy;
  if (client && client.holidays) out.holidays = client.holidays;
  if (client && client.blocks) out.blocks = client.blocks;
  const am = byId(server && server.audit, 'id'); for (const a of (client && client.audit) || []) am.set(a.id, a);
  out.audit = [...am.values()].sort((a, b) => a.at < b.at ? 1 : -1).slice(0, 600);
  out.attempts = {};
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const key = req.headers['x-smartponto-key'] || '';
  if (!process.env.SMARTPONTO_KEY || key !== process.env.SMARTPONTO_KEY) return res.status(401).json({ error: 'Chave de acesso inválida' });
  if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'DATABASE_URL em falta' });
  const sql = neon(process.env.DATABASE_URL);
  try {
    let since = (req.method === 'POST' ? (req.body && req.body.since) : req.query.since) || '1970-01-01T00:00:00Z';
    if (!/^\d{4}-\d{2}-\d{2}T/.test(since)) since = '1970-01-01T00:00:00Z';
    const rows = await sql`SELECT doc FROM sp_state WHERE id = 'main'`;
    let state = rows.length ? rows[0].doc : null;

    if (req.method === 'POST') {
      const body = req.body || {};
      if (body.state) {
        state = mergeState(state, body.state);
        await sql`INSERT INTO sp_state (id, doc, updated_at) VALUES ('main', ${JSON.stringify(state)}::jsonb, now()) ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`;
      }
      const incoming = Array.isArray(body.events) ? body.events.slice(0, 500) : [];
      for (const ev of incoming) {
        if (!ev || !ev.event_id) continue;
        const cur = await sql`SELECT doc FROM sp_events WHERE event_id = ${ev.event_id}`;
        if (cur.length) {
          const old = cur[0].doc; const oh = (old.history || []).length, nh = (ev.history || []).length;
          if (oh > nh) continue; // o servidor tem uma transição mais recente (ex.: revisão feita noutro dispositivo)
          if (oh === nh && old.state === ev.state && JSON.stringify(old) === JSON.stringify(ev)) continue;
          if (!ev.capture && old.capture) ev.capture = old.capture;
        }
        await sql`INSERT INTO sp_events (event_id, doc, updated_at) VALUES (${ev.event_id}, ${JSON.stringify(ev)}::jsonb, now()) ON CONFLICT (event_id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`;
      }
    }
    const evs = await sql`SELECT doc, updated_at FROM sp_events WHERE updated_at > ${since}::timestamptz ORDER BY updated_at ASC LIMIT 2000`;
    const st = await sql`SELECT now() AS t`;
    return res.status(200).json({ state, events: evs.map(r => r.doc), serverTime: st[0].t, count: evs.length });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};
