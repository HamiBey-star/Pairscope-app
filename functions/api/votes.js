const TYPES = ['rocket', 'fire', 'poop', 'flag'];
const OK = /^[A-Za-z0-9:_.-]{3,100}$/;

async function voterId(request) {
  const raw = (request.headers.get('CF-Connecting-IP') || '') + (request.headers.get('User-Agent') || '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 32);
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const single = u.searchParams.get('token');
  const raw = single || u.searchParams.get('tokens') || '';
  const list = raw.split(',').filter(function (t) { return OK.test(t); }).slice(0, 100);
  if (!list.length) return Response.json(single ? { counts: {}, mine: [] } : {});
  const me = await voterId(request);
  const marks = list.map(function () { return '?'; }).join(',');
  const res = await env.DB.prepare(
    'SELECT token, type, COUNT(*) AS c, SUM(voter = ?) AS mine FROM votes WHERE token IN (' + marks + ') GROUP BY token, type'
  ).bind(me, ...list).all();
  const out = {};
  list.forEach(function (t) { out[t] = { counts: {}, mine: [] }; });
  res.results.forEach(function (r) {
    out[r.token].counts[r.type] = r.c;
    if (r.mine > 0) out[r.token].mine.push(r.type);
  });
  return Response.json(single ? out[list[0]] : out);
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  if (!TYPES.includes(body.type) || !OK.test(body.token || ''))
    return new Response('bad request', { status: 400 });
  const me = await voterId(request);
  const old = await env.DB.prepare('SELECT type FROM votes WHERE token=? AND voter=?')
    .bind(body.token, me).all();
  const same = old.results.some(function (r) { return r.type === body.type; });
  await env.DB.prepare('DELETE FROM votes WHERE token=? AND voter=?')
    .bind(body.token, me).run();
  if (!same)
    await env.DB.prepare('INSERT INTO votes VALUES (?,?,?)').bind(body.token, me, body.type).run();
  return Response.json({ ok: true });
}
