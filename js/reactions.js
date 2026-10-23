const REACTIONS = [
  { type: 'rocket', icon: '🚀' },
  { type: 'fire', icon: '🔥' },
  { type: 'poop', icon: '💩' },
  { type: 'flag', icon: '🚩' }
];

async function loadReactions(el) {
  const token = el.dataset.token;
  if (!token) return;
  try {
    const r = await fetch('/api/votes?token=' + encodeURIComponent(token)).then(x => x.json());
    el.innerHTML = REACTIONS.map(x =>
      <button class="rx ${r.mine.includes(x.type) ? 'on' : ''}" data-type="${x.type}">${x.icon} <b>${r.counts[x.type] || 0}</b></button>
    ).join('');
    el.querySelectorAll('.rx').forEach(b => b.onclick = async (e) => {
      e.stopPropagation();
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type: b.dataset.type })
      });
      loadReactions(el);
    });
  } catch (e) {}
}

// auto-fill any .rx-bar that appears on the page
const rxObserver = new MutationObserver(() => {
  document.querySelectorAll('.rx-bar:not([data-ready])').forEach(el => {
    el.dataset.ready = '1';
    loadReactions(el);
  });
});
rxObserver.observe(document.body, { childList: true, subtree: true });
