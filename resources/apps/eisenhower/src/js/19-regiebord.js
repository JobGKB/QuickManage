/* ---------- regiebord ---------- */
function projStat(x){
  const p = x.p, i = x.i; if(!p) return {c:'n', why:''};
  const t = R.idx.get(TODAYISO) ?? 0; const soon = R.days[Math.min(t + 10, R.days.length - 1)];
  if(p.nietVoor && i.start && i.start < p.nietVoor) return {c:'r', l:'wvb', why:`ingepland vóór ${fD(p.nietVoor)}`};
  if(p.wacht?.op && p.wacht.tot && i.start && p.wacht.tot >= i.start) return {c:'r', l:'kp', why:`wacht op ${p.wacht.op.toLowerCase()} (${fD(p.wacht.tot)}), na de start`};
  if(i.fase === 'voorb' && !p.geenPlanning && i.start && i.start <= soon && i.vb !== 'gereed') return {c:'r', l:'wvb', why:`start ${fWD(i.start)}, voorbereiding ${VB[i.vb].toLowerCase()}`};
  if(p.wacht?.op) return {c:'a', l:'kp', why:`wacht op ${p.wacht.op.toLowerCase()}`};
  if(i.fase === 'voorb' && !p.geenPlanning && i.vb !== 'gereed') return {c:'a', l:'wvb', why:`voorbereiding ${VB[i.vb].toLowerCase()}`};
  return {c:'g', why:i.fase === 'voorb' ? 'voorbereiding gereed' : ''};
}
function renderRegie(occ, P, flt){
  const lens = S.lens || '';
  const wk0 = R.idx.get(iso(monday(TODAY))) ?? 0; const weeks = [];
  for(let w = 0; w < 8; w++){ const i0 = wk0 + w * 5; if(i0 + 4 >= R.days.length) break; weeks.push(i0); }
  const byCode = new Map(P.map(x => [x.p.code, x]));
  const xOf = it => { const pr = projFor(it); return pr ? (byCode.get(pr.code) || {p:pr, i:projInfo(pr)}) : null; };
  const mine = x => !flt || (x && x.p.wvb === flt);
  const chip = (label, title, st, attrs, extra = '') => `<button type="button" class="rc rc-${st.c} ${st.l ? 'l-' + st.l : ''} ${extra}" ${attrs} title="${esc(title)}">${esc(label)}</button>`;
  const short = (x, it) => { const c = x ? x.p.code : ''; const o = x ? x.p.oms : it.naam; return (c ? c + ' ' : '') + o; };
  // tellers per doel
  const t = R.idx.get(TODAYISO) ?? 0;
  let vrijDagen = 0; for(const pl of ploegList()){ const o = occ[pl.id]; if(!o) continue; for(let i = t; i <= t + 19 && i < o.length; i++) if(!o[i] && !vrijOn(R.days[i])) vrijDagen++; }
  const stats = P.map(x => ({x, st:projStat(x)}));
  const wvbRood = stats.filter(z => z.st.c === 'r' && z.st.l === 'wvb' && mine(z.x)).length;
  const kp = stats.filter(z => z.st.l === 'kp' && mine(z.x)).length;
  const afh = P.filter(x => x.i.fase === 'gereed' && adminInfo(x.p).open.length && mine(x));
  const afhOud = afh.filter(x => daysSince(x.p.faseSinds) > 21).length;
  const zonder = P.filter(x => (x.i.fase === 'voorb' || x.i.fase === 'uitv') && !x.p.geenPlanning && !x.i.items.some(it => (it.dagen || []).length) && mine(x));
  const meters = [
    {k:'buiten', t:'Mensen buiten bezig', n:vrijDagen, s:vrijDagen ? `vrije ploegdagen, 4 weken` : 'alle eigen ploegen vol', c:vrijDagen ? 'a' : 'g'},
    {k:'wvb', t:'Voorbereiding op tijd', n:wvbRood, s:wvbRood ? 'starts in gevaar' : 'alles op schema', c:wvbRood ? 'r' : 'g'},
    {k:'kp', t:'Knelpunten', n:kp, s:kp ? 'wacht ergens op' : 'niets geblokkeerd', c:kp ? 'a' : 'g'},
    {k:'af', t:'Werken afhandelen', n:afh.length, s:afh.length ? `${afhOud} langer dan 3 weken` : 'alles afgehandeld', c:afhOud ? 'r' : afh.length ? 'a' : 'g'}];
  let h = `<section class="rmeters">${meters.map(m => `<button type="button" class="rm rm-${m.c} ${lens === m.k ? 'on' : ''}" data-lens="${m.k}" aria-pressed="${lens === m.k}"><span class="rmn">${m.n}</span><span class="rmt">${m.t}</span><span class="rms">${m.s}</span></button>`).join('')}</section>
    <p class="hint rhint">${lens ? `Alleen <b>${esc(meters.find(m => m.k === lens).t.toLowerCase())}</b> is gemarkeerd. <button class="linkbtn" type="button" data-lens="">Toon alles</button>` : 'Klik op een doel om te zien waar het speelt. Rood = ingrijpen, oranje = in de gaten houden, groen = op schema. Klik op een project om het te openen.'}</p>`;
  // bord
  const head = `<div class="rb-h"></div>${weeks.map(i0 => `<div class="rb-h ${i0 === wk0 ? 'now' : ''}">wk ${isoWeek(parse(R.days[i0]))}<small>${fD(R.days[i0])}</small></div>`).join('')}`;
  let body = '';
  for(const pl of ploegList()){
    const eigen = !!occ[pl.id];
    const its = S.items.filter(it => it.ploeg === pl.id && !it.klaar);
    body += `<div class="rb-p"><i class="dotp" style="--pc:${pColor(pl)}"></i>${esc(pl.naam)}${eigen ? '' : '<small>extern</small>'}</div>`;
    for(const i0 of weeks){
      const wd = R.days.slice(i0, i0 + 5);
      const here = its.filter(it => (it.dagen || []).some(d => wd.includes(d)));
      let werk = 0, vrij = 0, dub = 0; if(eigen) for(let k = 0; k < 5; k++){ const d = R.days[i0 + k]; if(vrijOn(d)) continue; werk++; const v = occ[pl.id][i0 + k]; if(!v) vrij++; if(v >= 2) dub++; }
      const chips = here.map(it => { const x = xOf(it); const st = x ? projStat(x) : {c:'n'}; const dim = flt && !mine(x);
        const n = (it.dagen || []).filter(d => wd.includes(d)).length;
        return chip(short(x, it), `${short(x, it)}\n${n} ${n === 1 ? 'dag' : 'dagen'} deze week${st.why ? '\n' + st.why : ''}${isPotlood(it) ? '\nvoorlopig' : ''}`, st, x ? `data-proj="${esc(x.p.code)}"` : `data-open="${esc(it.id)}"`, `${isPotlood(it) ? 'pot' : ''} ${dim ? 'dim' : ''}`); });
      const max = 4; const more = chips.length - max;
      const gap = eigen && werk && vrij ? `<button type="button" class="rgap l-buiten ${vrij >= 3 ? 'big' : ''}" data-goday="${R.days[i0]}" title="Naar de planning">${vrij} ${vrij === 1 ? 'dag' : 'dagen'} vrij</button>` : '';
      body += `<div class="rb-c ${!werk && eigen ? 'hol' : ''} ${dub ? 'dub' : ''}">${!werk && eigen ? '<span class="faint rsm">vrij / vakantie</span>' : ''}${chips.slice(0, max).join('')}${more > 0 ? `<button type="button" class="rmore" data-goday="${R.days[i0]}">+${more} meer</button>` : ''}${dub ? `<span class="rdub" title="Dubbel geboekt">${dub} ${dub === 1 ? "dag" : "dagen"} dubbel</span>` : ''}${gap}</div>`;
    }
  }
  h += `<section class="rboard ${lens ? 'lens lens-' + lens : ''}" style="--wk:${weeks.length}"><div class="rb-grid">${head}${body}</div></section>`;
  // wachtrijen
  const zSort = [...zonder].sort((a, b) => { const sa = projStat(a).c, sb = projStat(b).c; const ord = {g:0, a:1, r:2, n:3}; return String(a.p.nietVoor || '').localeCompare(String(b.p.nietVoor || '')) || ord[sa] - ord[sb] || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}); });
  const klaar = zSort.filter(x => x.p.geenPlanning || x.i.vb === 'gereed');
  const nietKlaar = zSort.filter(x => !(x.p.geenPlanning || x.i.vb === 'gereed'));
  const qchip = x => { const st = projStat(x); return chip(`${x.p.code} ${x.p.oms}`, `${x.p.code} ${x.p.oms}${st.why ? '\n' + st.why : ''}${x.p.nietVoor ? '\nniet vóór ' + fD(x.p.nietVoor) : ''}`, st, `data-proj="${esc(x.p.code)}"`) + (x.p.nietVoor ? `<small class="rq-d">vanaf ${esc(fD(x.p.nietVoor))}</small>` : ''); };
  h += `<section class="rqueues">
    <div class="rq l-buiten-q"><h3 class="sub">Klaar om in te plannen <span class="cnt">${klaar.length}</span></h3><p class="hint">Opdracht binnen, voorbereiding gereed, nog geen plek. Hiermee vul je de gaten.</p><div class="rq-l">${klaar.map(qchip).join('') || '<span class="hint">Niets op de plank.</span>'}</div></div>
    <div class="rq"><h3 class="sub">Binnen, nog niet voorbereid <span class="cnt">${nietKlaar.length}</span></h3><p class="hint">Nog geen plek en voorbereiding loopt nog.</p><div class="rq-l">${nietKlaar.map(qchip).join('') || '<span class="hint">Geen.</span>'}</div></div>
    <div class="rq l-af-q"><h3 class="sub">Af te handelen <span class="cnt">${afh.length}</span></h3><p class="hint">Technisch gereed, administratief nog open. Oudste eerst.</p><div class="rq-l">${[...afh].sort((a, b) => String(a.p.faseSinds).localeCompare(String(b.p.faseSinds))).map(x => { const d = daysSince(x.p.faseSinds);
      return chip(`${x.p.code} ${x.p.oms}`, `${x.p.code} ${x.p.oms}\nopen: ${adminInfo(x.p).open.join(', ')}`, {c:d > 21 ? 'r' : 'a', l:'af'}, `data-proj="${esc(x.p.code)}"`) + `<small class="rq-d">${d} d</small>`; }).join('') || '<span class="hint">Alles afgehandeld.</span>'}</div></div>
  </section>`;
  const offs = P.filter(x => x.i.fase === 'offerte' && mine(x)); const offOud = offs.filter(x => x.i.n === 3 && daysSince(x.p.faseSinds) > 30).length;
  h += `<p class="hint" style="margin:0">Offertes: <button class="linkbtn" type="button" data-gotab="offerte">${offs.length} open</button>${offOud ? ` · ${offOud} al langer dan 30 dagen verzonden` : ''}.</p>`;
  return h;
}
function renderVoorpagina(occ){
  const bz = bezetting(occ, 8);
  const t = R.idx.get(TODAYISO) ?? 0; let vrij = 0;
  for(const r of bz.rows) for(let i = t; i <= t + 19 && i < occ[r.p.id].length; i++) if(!occ[r.p.id][i] && !vrijOn(R.days[i])) vrij++;
  const back = S.items.filter(it => isBacklog(it) && !it.klaar).length;
  const rood = S.items.filter(it => { const st = itemStat(it); return st && st.c === 'r'; }).length;
  const zin = [vrij ? `<b>${vrij}</b> ploegdagen vrij in de komende 4 weken` : 'Alle eigen ploegen de komende 4 weken vol', back ? `<button class="linkbtn" type="button" data-gotab="planning">${back} nog in te plannen</button>` : '', rood ? `<button class="linkbtn" type="button" data-gotab="planning">${rood} met een !</button>` : ''].filter(Boolean).join(' · ');
  if(!bz.rows.length) return `<div class="empty"><b>Nog geen ploegen.</b><span class="muted">Stel je ploegen in via Meer → Ploegen en vakanties.</span></div>`;
  return `<section class="pagehead"><h2>Overzicht</h2><span class="muted">${zin}.</span></section>
  <section class="bez"><h3 class="sub">Beschikbaarheid ploegen</h3><div class="bezwrap"><table class="bezt"><thead><tr><th></th>${bz.weeks.map(i0 => `<th>wk ${isoWeek(parse(R.days[i0]))}<small>${fD(R.days[i0])}</small></th>`).join('')}</tr></thead><tbody>
    ${bz.rows.map(r => `<tr><th><i class="dotp" style="--pc:${pColor(r.p)}"></i>${esc(r.p.naam)}</th>${r.cells.map(c => { const cls = !c.werk ? 'hol' : c.dub ? 'crit' : c.vrij >= 3 ? 'warn2' : c.vrij ? 'warn' : 'ok';
      const txt = !c.werk ? 'vrij' : c.dub ? `${c.dub} ${c.dub === 1 ? 'dag' : 'dagen'} dubbel` : c.vrij ? `${c.vrij} ${c.vrij === 1 ? 'dag' : 'dagen'} vrij` : 'vol';
      return `<td><button type="button" class="bc ${cls}" data-goday="${R.days[c.i0]}" title="${c.bezet} van ${c.werk} werkdagen bezet · klik om naar de planning te gaan"><span class="bar5">${Array.from({length:5}, (_, k) => { const d = R.days[c.i0 + k]; const v = occ[r.p.id][c.i0 + k]; return `<i class="${vrijOn(d) ? 'h' : v >= 2 ? 'x' : v ? 'b' : ''}"></i>`; }).join('')}</span>${txt}</button></td>`; }).join('')}</tr>`).join('')}
    </tbody></table></div><p class="hint" style="margin:0">Klik op een week om naar die week in de planning te gaan.</p></section>`;
}