export async function onRequestPost({ request }) {
const events = await request.json();
  console.log("Helius events:", JSON.stringify(events).slice(0, 2000));

  // TODO: save/process events here (KV, D1, etc.)

  return new Response("ok", { status: 200 });
}

export const onRequestGet = () => new Response("webhook live");
