/* ---------- eisenhower ---------- */
function renderMatrix(){
  const pool = S.items.filter(it => !it.klaar && matchQ(it) && (S.matrixScope === 'all' || isBacklog(it)));
  const card = it => { const p = ploegOf(it.ploeg); const f = firstDay(it);
    return `<button class="card" type="button" draggable="${S.canWrite}" data-card="${esc(it.id)}" style="--pc:${p ? pColor(p) : 'var(--line)'}">
      <span class="nm">${it.let ? '<i class="flag">!</i>' : ''}<span>${esc(it.naam)}</span></span>
      <span class="mt">${p ? esc(p.naam) : 'Geen ploeg'}${f ? ' · ' + esc(fD(f)) : ''}</span>
    </button>`; };
  const none = pool.filter(it => !QUADS[it.quad]);
  const q = k => { const Q = QUADS[k]; const list = pool.filter(it => it.quad === k);
    return `<section class="quad" data-quad="${k}" style="--q:${Q.css}"><header><b>${Q.naam}</b></header>
      ${list.length ? `<div class="cards">${list.map(card).join('')}</div>` : ''}
</section>`; };
  return `<div class="toolbar">
    <div class="seg" id="scopeSeg"><button type="button" data-scope="backlog" aria-pressed="${S.matrixScope === 'backlog'}">Nog in te plannen</button><button type="button" data-scope="all" aria-pressed="${S.matrixScope === 'all'}">Alle lopende projecten</button></div>
  </div>
  ${none.length ? `<section class="tray" data-quad="" id="tray"><h3 class="sub">Nog niet ingedeeld</h3><div class="cards">${none.map(card).join('')}</div></section>` : ''}
  <div class="mx">
    <span></span><span class="ax">Urgent</span><span class="ax">Niet urgent</span>
    <span class="ax ay">Belangrijk</span>${q('nu')}${q('plan')}
    <span class="ax ay">Minder belangrijk</span>${q('del')}${q('park')}
  </div>`;
}
