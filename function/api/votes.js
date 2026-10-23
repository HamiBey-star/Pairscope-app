const TYPES = ['rocket', 'fire', 'poop', 'flag'];

async function voterId(request) {
  const raw = (request.headers.get('CF-Connecting-IP') || '') + (request.headers.get('User-Agent') || '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return new Response('missing token', { status: 400 });
  const me = await voterId(request);
  const { results } = await env.DB.prepare(
    'SELECT type, COUNT(*) AS c, SUM(voter = ?) AS mine FROM votes WHERE token = ? GROUP BY type'
  ).bind(me, token).all();
  const counts = {}, mine = [];
  for (const r of results) { counts[r.type] = r.c; if (r.mine > 0) mine.push(r.type); }
  return Response.json({ counts, mine });
}

export async function onRequestPost({ request, env }) {
  const { token, type } = await request.json();
  if (!TYPES.includes(type) || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token))
    return new Response('bad request', { status: 400 });
  const me = await voterId(request);
  const del = await env.DB.prepare('DELETE FROM votes WHERE token=? AND voter=? AND type=?')
    .bind(token, me, type).run();
  if (!del.meta.changes)
    await env.DB.prepare('INSERT INTO votes VALUES (?,?,?)').bind(token, me, type).run();
  return Response.json({ ok: true });
}
