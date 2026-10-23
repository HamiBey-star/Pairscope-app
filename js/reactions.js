var REACTIONS = [
  { type: 'rocket', icon: '🚀' },
  { type: 'fire', icon: '🔥' },
  { type: 'poop', icon: '💩' },
  { type: 'flag', icon: '🚩' }
];
var CACHE = {};
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
  // add a bar to every table row that has none
 document.querySelectorAll('tr[data-i]').forEach(function (tr) {
    var td = tr.querySelector('td');
    var s = tr.querySelector('[data-w]');
    if (td && s && !td.querySelector('.rx-bar')) {
      var d = document.createElement('div');
      d.className = 'rx-bar';
      d.dataset.token = s.getAttribute('data-w');
      td.appendChild(d);
    }
  });
  // fill all new bars with one request
  var fresh = [];
  document.querySelectorAll('.rx-bar:not([data-ready])').forEach(function (el) {
    el.dataset.ready = '1';
    if (el.dataset.token) { paint(el); fresh.push(el.dataset.token); }
  });
  if (!fresh.length) return;
  var uniq = fresh.filter(function (t, i) { return fresh.indexOf(t) === i; });
  for (var i = 0; i < uniq.length; i += 50) {
    (function (part) {
      fetch('/api/votes?tokens=' + encodeURIComponent(part.join(',')))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          part.forEach(function (t) { if (d[t]) { CACHE[t] = d[t]; paintAll(t); } });
        })
        .catch(function () {});
    })(uniq.slice(i, i + 50));
  }
}

function later() {
  clearTimeout(timer);
  timer = setTimeout(scan, 150);
}

new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true });
scan();
