var REACTIONS = [
  { type: 'rocket', icon: '🚀' },
  { type: 'fire', icon: '🔥' },
  { type: 'poop', icon: '💩' },
  { type: 'flag', icon: '🚩' }
];
var CACHE = {};
var ASKED = {};
var timer = null;

function paint(el) {
  var token = el.dataset.token;
  var data = CACHE[token] || {};
  var counts = data.counts || {};
  var mine = data.mine || [];
  el.innerHTML = REACTIONS.map(function (x) {
    return '<button class="rx ' + (mine.indexOf(x.type) > -1 ? 'on' : '') +
      '" data-type="' + x.type + '">' + x.icon + ' <b>' + (counts[x.type] || 0) + '</b></button>';
  }).join('');
  el.querySelectorAll('.rx').forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation();
      e.preventDefault();
      fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, type: b.dataset.type })
      }).then(function () {
        return fetch('/api/votes?token=' + encodeURIComponent(token));
      }).then(function (r) { return r.json(); })
        .then(function (d) { CACHE[token] = d; paintAll(token); })
        .catch(function () {});
    };
  });
}

function paintAll(token) {
  document.querySelectorAll('.rx-bar').forEach(function (el) {
    if (el.dataset.token === token) paint(el);
  });
}

function scan() {
  document.querySelectorAll('tr[data-i]').forEach(function (tr) {
    var td = tr.querySelector('td');
    var s = tr.querySelector('[data-w]');
    if (td && s && !td.querySelector('.rx-bar')) {
      var d = document.createElement('div');
      d.className = 'rx-bar';
      d.style.minHeight = '26px';
      d.dataset.token = s.getAttribute('data-w').split('|').pop();
      td.appendChild(d);
    }
  });
  var need = [];
  document.querySelectorAll('.rx-bar:not([data-ready])').forEach(function (el) {
    el.dataset.ready = '1';
    var t = el.dataset.token;
    if (!t) return;
    paint(el);
    if (!CACHE[t] && !ASKED[t]) { ASKED[t] = 1; need.push(t); }
  });
  for (var i = 0; i < need.length; i += 50) {
    (function (part) {
      fetch('/api/votes?tokens=' + encodeURIComponent(part.join(',')))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          part.forEach(function (t) { if (d[t]) { CACHE[t] = d[t]; paintAll(t); } });
        })
        .catch(function () { part.forEach(function (t) { delete ASKED[t]; }); });
    })(need.slice(i, i + 50));
  }
}

function later() {
  clearTimeout(timer);
  timer = setTimeout(scan, 400);
}

new MutationObserver(function (muts) {
  for (var i = 0; i < muts.length; i++) {
    var n = muts[i].target;
    var el = n.nodeType === 1 ? n : n.parentElement;
    if (!el || !el.closest || !el.closest('.rx-bar')) { later(); return; }
  }
}).observe(document.documentElement, { childList: true, subtree: true });
scan();
window.LIMIT = 40;
var moreBtn = document.createElement('button');
moreBtn.textContent = 'Load more';
moreBtn.style.cssText = 'display:none;margin:14px auto;padding:10px 22px;border-radius:999px;border:1px solid #00e0b8;background:transparent;color:#00e0b8;font-size:14px;cursor:pointer';
moreBtn.onclick = function () {
  window.LIMIT += 40;
  if (window._render) window._render();
};
setInterval(function () {
  var table = document.querySelector('table');
  if (!table) return;
  if (!moreBtn.parentNode) table.parentNode.insertBefore(moreBtn, table.nextSibling);
  var n = table.querySelectorAll('tr[data-i]').length;
  moreBtn.style.display = n >= window.LIMIT ? 'block' : 'none';
}, 1000);
