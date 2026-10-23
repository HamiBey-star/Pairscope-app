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
(function () {
  var ua = navigator.userAgent || '';
  var isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  var inPhantom = !!(window.phantom && window.phantom.solana && window.phantom.solana.isPhantom);
  try { if (localStorage.getItem('hidePhantomBar')) return; } catch (e) {}
  if (!isMobile || inPhantom) return;

  var url = location.origin + location.pathname + location.search;
  var link = 'https://phantom.app/ul/browse/' + encodeURIComponent(url) +
    '?ref=' + encodeURIComponent(location.origin);

  var bar = document.createElement('div');
  bar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:10px;' +
    'padding:8px 12px;background:#ab9ff2;color:#1c1c1c;font-size:14px;font-weight:600;';

  var a = document.createElement('a');
  a.href = link;
  a.textContent = 'Open in Phantom to trade';
  a.style.cssText = 'color:#1c1c1c;text-decoration:underline;';

  var x = document.createElement('button');
  x.textContent = '\u00d7';
  x.style.cssText = 'border:0;background:transparent;font-size:20px;color:#1c1c1c;cursor:pointer;';
  x.onclick = function () {
    try { localStorage.setItem('hidePhantomBar', '1'); } catch (e) {}
    bar.remove();
  };

  bar.appendChild(a);
  bar.appendChild(x);
  document.body.insertBefore(bar, document.body.firstChild);
})();
(function () {
  var KEY = 'psPaper', S = null;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!S || !S.pos) S = { cash: 10000, pos: [] };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function fp(n) { n = +n || 0; return n < 0.001 ? n.toPrecision(3) : n.toFixed(4); }
  function find(k) {
    try { for (var i = 0; i < D.length; i++) if (key(D[i]) === k) return D[i]; } catch (e) {}
    return null;
  }

  var btn = document.createElement('button');
  btn.textContent = '\uD83D\uDCC4 Paper';
  btn.style.cssText = 'position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;padding:10px 16px;border-radius:999px;border:1px solid #00e0b8;background:#0b0e11;color:#00e0b8;font-size:14px;font-weight:600;cursor:pointer';
  var box = document.createElement('div');
  box.style.cssText = 'display:none;position:fixed;left:8px;right:8px;bottom:calc(60px + env(safe-area-inset-bottom,0px));max-height:60vh;overflow:auto;z-index:9999;padding:12px;border-radius:12px;border:1px solid #222a33;background:#12171d;color:#e6e8ea;font-size:13px';
  document.body.appendChild(btn);
  document.body.appendChild(box);
  btn.onclick = function () { box.style.display = box.style.display === 'none' ? 'block' : 'none'; draw(); };

  function draw() {
    var eq = S.cash, rows = '';
    S.pos.forEach(function (p, i) {
      var r = find(p.k);
      if (r && r.p) p.last = r.p;
      var now = p.last || p.entry, val = p.qty * now, pl = val - p.cost, pct = pl / p.cost * 100;
      eq += val;
      rows += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid #222a33">' +
        '<div><b>' + esc(p.s) + '</b><br><span style="color:#8b95a1">in $' + fp(p.entry) + ' \u2192 $' + fp(now) + '</span></div>' +
        '<div style="text-align:right;color:' + (pl >= 0 ? '#2ecc71' : '#ff5c5c') + '"><b>' + (pl >= 0 ? '+' : '') + pct.toFixed(1) + '%</b><br>' + (pl >= 0 ? '+' : '') + '$' + pl.toFixed(2) + '</div>' +
        '<button data-sell="' + i + '" style="padding:6px 12px;border-radius:8px;border:0;background:#ff5c5c;color:#fff;cursor:pointer">Sell</button></div>';
    });
    var tot = eq - 10000;
    box.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>Paper trading</b><span style="color:' + (tot >= 0 ? '#2ecc71' : '#ff5c5c') + '">Total ' + (tot >= 0 ? '+' : '') + '$' + tot.toFixed(2) + '</span></div>' +
      '<div style="color:#8b95a1;margin-bottom:6px">Cash $' + S.cash.toFixed(2) + ' \u00b7 Equity $' + eq.toFixed(2) + '</div>' +
      (rows || '<div style="color:#8b95a1;padding:8px 0">No open trades. Tap "Paper buy" under any pair.</div>') +
      '<button data-reset="1" style="margin-top:10px;padding:6px 12px;border-radius:8px;border:1px solid #222a33;background:transparent;color:#8b95a1;cursor:pointer">Reset $10,000</button>';
    save();
  }

  box.onclick = function (e) {
    var s = e.target.getAttribute('data-sell');
    if (s !== null) {
      var p = S.pos[+s];
      if (p) { S.cash += p.qty * (p.last || p.entry); S.pos.splice(+s, 1); draw(); }
    }
    if (e.target.getAttribute('data-reset') && confirm('Reset paper account?')) { S = { cash: 10000, pos: [] }; draw(); }
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pp-buy');
    if (!b) return;
    e.stopPropagation(); e.preventDefault();
    var tr = b.closest('tr'), r;
    try { r = D[+tr.getAttribute('data-i')]; } catch (x) {}
    if (!r || !r.p) { alert('Price not available yet'); return; }
    var amt = parseFloat(prompt('Paper buy amount in $ (cash $' + S.cash.toFixed(0) + ')', '100'));
    if (!amt || amt <= 0 || amt > S.cash) { if (amt) alert('Not enough paper cash'); return; }
    S.cash -= amt;
    S.pos.push({ k: key(r), s: r.s || 'token', qty: amt / r.p, cost: amt, entry: r.p, last: r.p });
    draw();
    box.style.display = 'block';
  }, true);

  setInterval(function () {
    document.querySelectorAll('tr[data-i]').forEach(function (tr) {
      var td = tr.querySelector('td');
      if (td && !td.querySelector('.pp-buy')) {
        var b = document.createElement('button');
        b.className = 'pp-buy';
        b.textContent = '\uD83D\uDCC4 Paper buy';
        b.style.cssText = 'margin-top:6px;padding:4px 10px;border-radius:999px;border:1px solid #00e0b8;background:transparent;color:#00e0b8;font-size:12px;cursor:pointer';
        td.appendChild(b);
      }
    });
    if (box.style.display !== 'none') draw();
  }, 3000);
})();
