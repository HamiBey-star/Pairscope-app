const REACTIONS = [
  { type: 'rocket', icon: '🚀' },
  { type: 'fire', icon: '🔥' },
  { type: 'poop', icon: '💩' },
  { type: 'flag', icon: '🚩' }
];

function renderReactions(el, data) {
  const token = el.dataset.token;
  const counts = (data && data.counts) || {};
  const mine = (data && data.mine) || [];
  el.innerHTML = REACTIONS.map(x =>
    <button class="rx ${mine.includes(x.type) ? 'on' : ''}" data-type="${x.type}">${x.icon} <b>${counts[x.type] || 0}</b></button>
  ).join('');
  el.querySelectorAll('.rx').forEach(b => b.onclick = async (e) => {
    e.stopPropagation();
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type: b.dataset.type })
      });
    } catch (err) {}
    loadReactions(el);
  });
}

async function loadReactions(el) {
  if (!el.dataset.token) return;
  renderReactions(el, null);
  try {
    const r = await fetch('/api/votes?token=' + encodeURIComponent(el.dataset.token)).then(x => x.json());
    renderReactions(el, r);
  } catch (e) {}
}

function scanReactions() {
  document.querySelectorAll('.rx-bar:not([data-ready])').forEach(el => {
    el.dataset.ready = '1';
    loadReactions(el);
  });
}

new MutationObserver(scanReactions).observe(document.documentElement, { childList: true, subtree: true });
scanReactions();
