// functions/api/pump-live.js : relays PumpPortal new-token feed to the browser
export async function onRequestGet({ request }) {
  if (request.headers.get("Upgrade") !== "websocket") return new Response("websocket only", { status: 426 });
  const pair = new WebSocketPair();
  const client = pair[0], server = pair[1];
  server.accept();
  (async () => {
    try {
      const up = await fetch("https://pumpportal.fun/api/data", { headers: { Upgrade: "websocket" } });
      const u = up.webSocket;
      if (!u) { server.close(1011, "upstream unavailable"); return; }
      u.accept();
      u.send(JSON.stringify({ method: "subscribeNewToken" }));
      u.addEventListener("message", (e) => { try { server.send(e.data); } catch (_) {} });
      u.addEventListener("close", () => { try { server.close(1000, "upstream closed"); } catch (_) {} });
      server.addEventListener("close", () => { try { u.close(); } catch (_) {} });
    } catch (_) {
      try { server.close(1011, "relay error"); } catch (__) {}
    }
  })();
  return new Response(null, { status: 101, webSocket: client });
}
