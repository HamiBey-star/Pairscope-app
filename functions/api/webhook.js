// functions/api/webhook.js : receives Helius webhook events.
// SECURITY: set the Helius webhook "authHeader" to a long random string and add the same string as the
// Pages secret HELIUS_AUTH (Settings > Variables and Secrets, or `wrangler pages secret put HELIUS_AUTH`).
// Until HELIUS_AUTH is set the endpoint stays open (so an existing webhook keeps working) but logs a warning.
const MAX_BYTES = 1024 * 1024; // Helius batches are small; refuse anything above 1 MB

export async function onRequestPost({ request, env }) {
  if (env.HELIUS_AUTH) {
    if (request.headers.get("Authorization") !== env.HELIUS_AUTH) return new Response("unauthorized", { status: 401 });
  } else {
    console.warn("HELIUS_AUTH is not set: webhook is accepting unauthenticated requests");
  }
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_BYTES) return new Response("too large", { status: 413 });

  let events;
  try { events = await request.json(); } catch (_) { return new Response("bad json", { status: 400 }); }
  if (!Array.isArray(events)) events = [events];

  console.log("Helius events:", events.length, JSON.stringify(events).slice(0, 2000));
  // NEXT STEP: normalise each swap and write it to D1 (env.DB), then answer 200 quickly.
  return new Response("ok", { status: 200 });
}

export const onRequestGet = () => new Response("webhook live");
