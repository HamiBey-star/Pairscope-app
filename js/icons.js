/* PairScope icon set: one consistent stroke style, replaces mixed emoji (they render differently on every device) */
(function(){
var P={
flame:'<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
up:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
down:'<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>',
"new":'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
map:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
picks:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
window.PSI=function(n,s){s=s||16;return'<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(P[n]||"")+'</svg>'};
})();
