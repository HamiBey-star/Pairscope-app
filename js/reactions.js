var REACTIONS = [
  { type: 'rocket', icon: '🚀' },
  { type: 'fire', icon: '🔥' },
  { type: 'poop', icon: '💩' },
  { type: 'flag', icon: '🚩' }
];

function renderReactions(el, data) {
  var token = el.dataset.token;
  var counts = (data && data.counts) || {};
  var mine = (data && data.mine) || [];
  el.innerHTML = REACTIONS.map(function (x) {
    return '<button class="rx ' + (mine.indexOf(x.type) > -1 ? 'on' : '') +
      '" data-type="' + x.type + '">' + x.icon + ' <b>' + (counts[x.type] || 0) + '</b></button>';
  }).join('');
  el.querySelectorAll('.rx').forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, type: b.dataset.type })
      }).then(function () { loadReactions(el); }).catch(function () {});
    };
  });
}

function loadReactions(el) {
  if (!el.dataset.token) return;
  renderReactions(el, null);
  fetch('/api/votes?token=' + encodeURIComponent(el.dataset.token))
    .then(function (x) { return x.json(); })
    .then(function (r) { renderReactions(el, r); })
    .catch(function () {});
}

function scanReactions() {
  document.querySelectorAll('.rx-bar:not([data-ready])').forEach(function (el) {
    el.dataset.ready = '1';
    loadReactions(el);
  });
}

new MutationObserver(scanReactions).observe(document.documentElement, { childList: true, subtree: true });
scanReactions();
