/* ---------- planning ---------- */
function renderUitvList(){
  if(!S.projecten.length) return '';
  const list = activeProjects().map(p => ({p, i:projInfo(p)})).filter(x => x.i.fase === 'uitv')
    .sort((a, b) => (!!a.i.items.length - !!b.i.items.length) || String(a.i.eind || '').localeCompare(String(b.i.eind || '')) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}));
  if(!list.length) return '';
  const los = list.filter(x => !x.i.items.length && !x.p.geenPlanning).length;
  const open = S.uitvOpen ?? los > 0; const toon0 = S.uitvAll || !los ? list : list.filter(x => !x.i.items.length && !x.p.geenPlanning);
  const pl0 = x => [...new Set(x.i.items.map(it => ploegOf(it.ploeg)?.naam).filter(Boolean))].join(', ') || (x.p.geenPlanning ? 'geen buitenwerk' : '');
  const t = tblCtl('uitv', toon0, {zoek:x => x.p.code + ' ' + x.p.oms,
    filters:[{k:'pl', leeg:'Alle ploegen', v:pl0}, {k:'wvb', leeg:'Alle werkvoorbereiders', v:x => firstName(x.p.wvb) || ''}],
    cols:[['code', 'Werkorder', x => x.p.code], ['oms', 'Omschrijving', x => x.p.oms], ['pl', 'Ploeg', pl0], ['nv', 'Niet eerder dan', x => x.p.nietVoor || ''], ['eind', 'Loopt tot', x => x.i.eind || ''], ['wvb', 'Wvb', x => firstName(x.p.wvb) || ''], [null, '']]});
  const toon = t.rows;
  return `<details class="tblfold" ${open ? 'open' : ''} id="uitvFold" style="margin-bottom:12px"><summary><b>Projecten gereed voor uitvoering</b> <span class="cnt">${list.length}</span> ${los ? `<span class="warnt">${los} niet op de tijdlijn</span>` : '<span class="hint">Alles staat op de tijdlijn</span>'}</summary>
    ${t.tools}<div class="tblwrap"><table class="tbl" data-tfbody="uitv">${t.thead}<tbody>
    ${toon.map(x => { const pl = [...new Set(x.i.items.map(it => ploegOf(it.ploeg)?.naam).filter(Boolean))].join(', ');
      return t.tr(x, `<tr data-proj="${esc(x.p.code)}"><td class="mono">${esc(x.p.code)}</td><td class="om">${esc(x.p.oms)}</td><td>${esc(pl || (x.p.geenPlanning ? 'geen buitenwerk' : '–'))}</td>
      <td>${x.p.nietVoor ? `<span class="${x.i.start && x.i.start < x.p.nietVoor ? 'kp' : ''}" title="${x.i.start && x.i.start < x.p.nietVoor ? 'Ingepland vóór deze datum' : ''}">${esc(fWD(x.p.nietVoor))}</span>` : '<span class="faint">–</span>'}</td>
      <td>${x.i.eind ? esc(fWD(x.i.eind)) : x.p.geenPlanning ? '' : '<span class="warnt">niet ingepland</span>'}</td><td>${esc(firstName(x.p.wvb) || '–')}</td>
      <td>${!x.i.items.length && !x.p.geenPlanning && S.canWrite ? `<button class="btn sm" type="button" data-plannen="${esc(x.p.code)}">Op tijdlijn zetten</button>` : ''}</td></tr>`); }).join('') || '<tr><td colspan="7" class="faint">Geen projecten met deze filters.</td></tr>'}</tbody></table></div>
    ${los && list.length > los ? `<button class="btn sm" type="button" id="uitvAll" style="margin-top:6px">${S.uitvAll ? 'Alleen wat niet op de tijdlijn staat' : `Toon alle ${list.length}`}</button>` : ''}</details>`;
}
function renderPlanning(occ){
  const t = R.idx.get(TODAYISO) ?? 0;
  const cf = conflictsList(occ, t, t + 19);
  let h = '';
  h += `<div class="toolbar">
    <div class="seg" id="zoomSeg">${Object.keys(ZOOM).map(z => `<button type="button" data-zoom="${z}" aria-pressed="${S.zoom === z}">${z[0].toUpperCase() + z.slice(1)}</button>`).join('')}</div>
    <button class="btn sm" type="button" id="btnToday">Vandaag</button>
    <div class="seg" id="sortSeg" aria-label="Sorteren"><button type="button" data-sort="ploeg" aria-pressed="${S.sort === 'ploeg'}">Per ploeg</button><button type="button" data-sort="project" aria-pressed="${S.sort === 'project'}">Per project</button></div>
    <span class="spacer"></span>
    ${S.items.some(it => it.klaar) ? `<label class="ck" style="font-size:13.5px"><input type="checkbox" id="showKlaar" ${S.showKlaar ? 'checked' : ''}> Archief tonen (${S.items.filter(it => it.klaar).length})</label>` : ''}
    ${S.canWrite ? '<button class="btn sm primary" type="button" id="btnNew">+ Project</button>' : ''}
  </div>`;
  if(!S.ploegen.length && !S.items.length){
    return h + `<div class="empty"><b>Nog geen planning.</b><span class="muted">Begin met je ploegen (bijvoorbeeld Bram, Dean, Evert) en voeg daarna per ploeg projecten toe.</span>${S.canWrite ? '<button class="btn primary" type="button" id="emptyPloeg">Ploegen instellen</button>' : ''}</div>`;
  }
  const W = R.days.length * dw();
  // kop
  let hm = '', hw = '', hd = '';
  let cur = null, start = 0;
  R.days.forEach((d, i) => { const m = d.slice(0, 7); if(m !== cur){ if(cur) hm += monthSpan(cur, start, i); cur = m; start = i; } });
  hm += monthSpan(cur, start, R.days.length);
  const thisMon = iso(monday(TODAY));
  R.days.forEach((d, i) => { const dt = parse(d); if(dt.getDay() === 1 || i === 0){ const wn = isoWeek(dt); hw += `<span class="${d === thisMon ? 'now' : ''}" style="left:${i * dw()}px;width:${5 * dw()}px">${dw() * 5 >= 44 ? 'wk ' : ''}${wn}</span>`; }
    if(S.zoom === 'dag') hd += `<span class="${d === TODAYISO ? 't' : ''} ${dt.getDay() === 1 ? 'mon' : ''}" style="left:${i * dw()}px;width:${dw()}px" title="${WD[(dt.getDay() + 6) % 7]} ${fD(d)}">${dt.getDate()}</span>`; });
  // overlay
  let ov = '';
  for(const v of S.vak){ const a = firstIdxOnOrAfter(v.start), b = lastIdxOnOrBefore(v.end); if(a == null || b == null || b < a) continue;
    ov += `<div class="hol ${isVrij(v) ? 'feest' : ''}" style="left:${a * dw()}px;width:${(b - a + 1) * dw()}px" title="${esc(v.label)}"></div>`; }
  R.days.forEach((d, i) => { if(i && parse(d).getDay() === 1) ov += `<div class="wkl" style="left:${i * dw()}px"></div>`; });
  if(t != null) ov += `<div class="tod" style="left:${t * dw() + dw() / 2 - 1}px"></div>`;
  // rijen
  let rows = '';
  const groups = ploegList().map(p => ({p, items:S.items.filter(it => it.ploeg === p.id)}));
  groups.unshift({p:null, items:S.items.filter(isBacklog)});
  if(S.sort === 'project'){
    const all = S.items.filter(it => (S.showKlaar || !it.klaar) && matchQ(it)).sort((a, b) => String(a.naam).localeCompare(String(b.naam), 'nl', {numeric:true}));
    for(const it of all) rows += itemRow(it, ploegOf(it.ploeg), occ, true);
  } else for(const g of groups){
    const list = g.items.filter(it => (S.showKlaar || !it.klaar) && matchQ(it)).sort(sortItems);
    const iw = [];
    if(!g.p && !g.items.length && !iw.length) continue;
    if(S.q && !list.length && !iw.length) continue;
    rows += groupRow(g.p, occ, list.length);
    if(!S.coll[g.p ? g.p.id : '_back'] || S.q) for(const it of list) rows += itemRow(it, g.p, occ);
    if(iw.length){ const open = S.iwOpen || !!S.q; const nk = iw.filter(x => x.i.vb === 'gereed').length;
      rows += `<div class="grow iwhdr"><button class="glab" type="button" id="iwTog" aria-expanded="${open}"><span class="nm"><span class="car">${open ? '▾' : '▸'}</span><span class="t">Uit IW, nog geen plek</span><span class="cnt">${iw.length}</span>${nk ? `<span class="iwk">${nk} klaar om te plannen</span>` : ''}</span></button><div class="lane" style="width:${W}px"></div></div>`;
      if(open) for(const x of iw) rows += iwRow(x); }
    if(false) rows += `<div class="grow gadd"><div class="glab"><input type="text" data-add="${esc(g.p?.id || '')}" placeholder="+ Project toevoegen${g.p ? ' aan ' + esc(g.p.naam) : ''}" aria-label="Project toevoegen"></div><div class="lane" style="width:${W}px"></div></div>`;
  }
  h += `<div class="gwrap" id="gwrap"><div class="grid" id="grid" style="width:calc(var(--lw) + ${W}px)">
    <div class="ghead"><div class="gcorner">Ploeg / project</div><div class="gtl" style="width:${W}px"><div class="hm">${hm}</div><div class="hw">${hw}</div>${S.zoom === 'dag' ? `<div class="hd">${hd}</div>` : ''}</div></div>
    <div class="gbody" id="gbody"><div class="ovl" style="width:${W}px">${ov}</div>${rows}</div>
  </div></div>`;
  return h;
}
function monthSpan(m, a, b){ if(!m) return ''; const [y, mm] = m.split('-').map(Number); const w = (b - a) * dw(); return `<span style="left:${a * dw()}px;width:${w}px">${w > 70 ? MNDL[mm - 1] + ' ' + y : MND[mm - 1]}</span>`; }
function firstIdxOnOrAfter(s){ for(let i = 0; i < R.days.length; i++) if(R.days[i] >= s) return i; return null; }
function lastIdxOnOrBefore(s){ for(let i = R.days.length - 1; i >= 0; i--) if(R.days[i] <= s) return i; return null; }
function sortKey(it){ const ds = [...(it.dagen || [])].sort(); if(!ds.length) return null; const next = ds.find(d => d >= TODAYISO); return next ? next : '~' + ds[ds.length - 1]; }
function sortItems(a, b){ const fa = sortKey(a), fb = sortKey(b); if(fa && fb && fa !== fb) return fa < fb ? -1 : 1; if(!fa !== !fb) return fa ? -1 : 1; return String(a.naam).localeCompare(String(b.naam)); }
function collBtn(k, n){ const c = !!S.coll[k]; return `<button type="button" class="gcoll" data-coll="${esc(k)}" aria-expanded="${!c}" title="${c ? 'Uitklappen' : 'Inklappen'}">${c ? '▸' : '▾'}</button>${c && n ? `<span class="gcnt">${n}</span>` : ''}`; }
function groupRow(p, occ, n){
  const W = R.days.length * dw();
  if(!p) return `<div class="grow ghdr" style="--pc:var(--ink-3)"><div class="glab"><span class="nm">${collBtn('_back', n)}<span class="t">Nog in te plannen</span>${S.canWrite ? '<button class="gplus" type="button" data-addto="" title="Project toevoegen aan Nog in te plannen" aria-label="Project toevoegen aan Nog in te plannen">+</button>' : ''}</span></div><div class="lane" style="width:${W}px" data-dropploeg=""></div></div>`;
  let occH = '';
  const o = occ[p.id];
  if(o){ let i = 0; while(i < o.length){ if(o[i] >= 2){ let j = i; while(j + 1 < o.length && o[j + 1] >= 2) j++; occH += `<div class="o o2" style="left:${i * dw()}px;width:${(j - i + 1) * dw()}px" title="Dubbel geboekt"></div>`; i = j; } i++; } }
  const t0 = R.idx.get(TODAYISO) ?? 0; const fr = o ? [...o.slice(t0, t0 + 20)].filter((v, k) => !v && !holidayOn(R.days[t0 + k])).length : 0;
  const dub = o ? [...o.slice(t0, t0 + 20)].filter(v => v >= 2).length : 0;
  const leden = String(p.leden || p.naam || '').split(/[,&+]|\ben\b/i).map(x => x.trim().toLowerCase()).filter(Boolean);
  const wie = (S.afw || []).filter(a => leden.some(l => a.naam.toLowerCase().split(' ')[0] === l.split(' ')[0]));
  for(const a of wie){ const ks = Object.keys(a.dagen || {}).map(d => R.idx.get(d)).filter(i => i != null).sort((x, y) => x - y); let i = 0;
    while(i < ks.length){ let j = i; while(j + 1 < ks.length && ks[j + 1] === ks[j] + 1) j++;
      occH += `<div class="afm" style="left:${ks[i] * dw()}px;width:${(ks[j] - ks[i] + 1) * dw()}px" title="${esc(a.naam.split(' ')[0])} vrij ${esc(fD(R.days[ks[i]]))}${j > i ? ' – ' + esc(fD(R.days[ks[j]])) : ''}"></div>`; i = j + 1; } }
  return `<div class="grow ghdr" style="--pc:${pColor(p)}" data-ploegrow="${esc(p.id)}"><div class="glab" data-editploeg="${esc(p.id)}"><span class="nm">${collBtn(p.id, n)}<span class="t">${esc(p.naam)}</span>${S.canWrite ? `<button class="gplus" type="button" data-addto="${esc(p.id)}" title="Project toevoegen aan ${esc(p.naam)}" aria-label="Project toevoegen aan ${esc(p.naam)}">+</button>` : ''}</span></div><div class="lane occ" style="width:${W}px;--pc:${pColor(p)}" data-dropploeg="${esc(p.id)}">${occH}</div></div>`;
}
function iwZonderPlek(){
  if(!S.projecten.length) return [];
  return activeProjects().map(p => ({p, i:projInfo(p)})).filter(x => (x.i.fase === 'voorb' || x.i.fase === 'uitv') && !x.p.geenPlanning && !x.i.items.length)
    .sort((a, b) => ((b.i.vb === 'gereed') - (a.i.vb === 'gereed')) || String(a.p.nietVoor || '').localeCompare(String(b.p.nietVoor || '')) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}));
}
function iwRow(x){
  const W = R.days.length * dw(); const nv = x.p.nietVoor ? firstIdxOnOrAfter(x.p.nietVoor) : null;
  const klaar = x.i.vb === 'gereed';
  return `<div class="grow iwrow"><div class="glab" data-projopen="${esc(x.p.code)}" title="${esc(x.p.code + ' ' + x.p.oms)} · uit IW, nog niet ingepland"><span class="nm"><span class="t">${esc(x.p.code + ' ' + x.p.oms)}</span>${klaar ? '<span class="iwk" title="Voorbereiding gereed">klaar</span>' : ''}</span>${S.canWrite ? `<button class="btn sm iwplan" type="button" data-plannen="${esc(x.p.code)}">Plannen</button>` : ''}</div><div class="lane" style="width:${W}px">${nv != null ? `<div class="nvmark" style="left:${nv * dw()}px" title="Niet eerder dan ${esc(fD(x.p.nietVoor))}">niet vóór ${esc(fD(x.p.nietVoor))}</div>` : ''}</div></div>`;
}
function itemRow(it, p, occ, showPloeg){
  const W = R.days.length * dw(); const col = p ? pColor(p) : '#5d6b78';
  const idx = idxOfItem(it); const o = p ? occ[p.id] : null;
  const t0 = R.idx.get(TODAYISO) ?? 0; const hasCf = o && !it.klaar && idx.some(i => i >= t0 && o[i] >= 2);
  const f = firstDay(it), l = lastDay(it);
  const meta = [it.wie, f ? (f === l ? fD(f) : fD(f) + ' – ' + fD(l)) + ` · ${idx.length} d` : 'nog geen dagen', it.wvb ? 'wvb ' + it.wvb : ''].filter(Boolean).join(' · ');
  return `<div class="grow ${S.sel === it.id ? 'sel' : ''} ${S.pick === it.id ? 'pick' : ''} ${it.klaar ? 'klaar' : ''}" data-row="${esc(it.id)}">${S.editName === it.id ? `<div class="glab edit"><input class="nmin" id="nmIn" value="${esc(S.editVal ?? it.naam)}" placeholder="Projectnummer en naam, bijv. ROIB2618 Doeltjes plaatsen" aria-label="Projectnaam" autocomplete="off">` : `<div class="glab" data-open="${esc(it.id)}" title="${esc(it.naam)}">`}<span class="nm" ${S.editName === it.id ? 'hidden' : ''}>${(() => { if(it.klaar || it.uitleen) return ''; const st = itemStat(it); const auto = st && st.c === 'r' ? st.why : ''; const v = itVb(it);
        const tip = ['Voorbereiding: ' + VB[v].toLowerCase(), auto, it.let ? (it.letNote || 'aandachtspunt') : ''].filter(Boolean).join(' · ') + (S.canVb || S.canWrite ? ' · klik om te wijzigen' : '');
        return `<button type="button" class="vbi vbi-${v} ${auto || it.let ? 'hot' : ''}" data-vbico="${esc(it.id)}" title="${esc(tip)}" aria-label="${esc(tip)}">${VB_ICO[v]}</button>`; })()}<span class="t">${esc(it.naam || 'Naamloos project')}</span>${potAny(it) ? '<span class="pot" title="Voorlopig, nog niet definitief">voorlopig</span>' : ''}${it.parallel ? '<span class="pot" title="Loopt parallel, telt niet als dubbelboeking">parallel</span>' : ''}${it.uitleen ? '<span class="pot" title="Ploeg werkt deze periode voor een ander">uitgeleend</span>' : ''}${showPloeg ? `<span class="pp" style="--pc:${p ? pColor(p) : 'var(--ink-3)'}">${esc(!p ? 'Nog in te plannen' : p.type === 'derden' ? (it.wie || 'Derden') : p.naam)}</span>` : ''}</span></div><div class="lane" style="width:${W}px" data-lane="${esc(it.id)}" data-dropploeg="${esc(p?.id || '')}">${barsHtml(it, idx, col, o)}</div></div>`;
}
function isPotlood(it){ if(it.potlood === true) return true; if(it.potlood === false) return false; const pr = typeof projFor === 'function' ? projFor(it) : null; if(!pr) return false; const n = stNum(pr.status); const man = pr.fase; return man ? man === 'offerte' : (n > 0 && n <= 4); }
function potDays(it, ds){ if(it.uitleen) return false; const fut = ds.filter(d => d >= TODAYISO); if(!fut.length) return false; if(Array.isArray(it.potDagen)) return fut.some(d => it.potDagen.includes(d)); return isPotlood(it); }
const potRun = (it, a, b) => potDays(it, R.days.slice(a, b + 1));
const potAny = it => potDays(it, it.dagen || []);
function splitIdx(it, extra){ const set = new Set((it.splits || []).map(d => R.idx.get(d)).filter(i => i != null)); if(extra) for(const i of extra) set.add(i); return set; }
function runsOf(it, idx, extra){ const sp = splitIdx(it, extra); const out = []; const gapVrij = (a, b) => { for(let k = a; k < b; k++) if(!vrijOn(R.days[k])) return false; return true; }; for(const i of idx){ const l = out[out.length - 1]; if(l && !sp.has(i) && (i === l[1] + 1 || gapVrij(l[1] + 1, i))) l[1] = i; else out.push([i, i]); } return out; }
function dragSplits(d){ const lo = Math.min(d.start, d.cur), hi = Math.max(d.start, d.cur);
  if(d.fill && (d.type === 'mv' || d.type === 're' || d.type === 'paint')) return [d.fill[0], d.fill[1] + 1];
  if(d.type === 'mv'){ const dl = d.cur - d.start; return [d.a + dl, d.b + dl + 1]; }
  if(d.type === 'rs') return [Math.min(d.cur, d.b), d.b + 1];
  if(d.type === 're') return [d.a, Math.max(d.cur, d.a) + 1];
  if(d.type === 'paint') return [lo, hi + 1];
  return []; }
function barsHtml(it, idx, col, o, extra){
  const rs = runsOf(it, idx, extra); let h = '';
  rs.forEach(([a, b], k) => {
    let cf = '';
    if(false) for(let i = a; i <= b; i++) if(o[i] >= 2){ let j = i; while(j + 1 <= b && o[j + 1] >= 2) j++; cf += `<span class="cf" style="left:${(i - a) * dw()}px;width:${(j - i + 1) * dw()}px"></span>`; i = j; }
    const w = (b - a + 1) * dw() - 2;
    for(let i = a; i <= b; i++) if(vrijOn(R.days[i])){ let j = i; while(j + 1 <= b && vrijOn(R.days[j + 1])) j++; cf += `<span class="vdag" style="left:${(i - a) * dw()}px;width:${(j - i + 1) * dw()}px" title="Vrije dag, telt niet mee"></span>`; i = j; }
    const label = esc(it.naam);
    h += `<div class="bar ${S.pick === it.id && (!S.pickRun || S.pickRun === `${a}-${b}`) ? 'pickrun' : ''} ${it.klaar ? 'klaar' : ''} ${!it.ploeg ? 'tent' : ''} ${potRun(it, a, b) ? 'potlood' : ''} ${it.uitleen ? 'uitleen' : ''}" style="left:${a * dw() + 1}px;width:${w}px;--c:${col}" data-run="${a}-${b}" title="${esc(it.naam)} · ${esc(fD(R.days[a]))}${a !== b ? ' – ' + esc(fD(R.days[b])) : ''} (${werkIn(a, b)} d)${potRun(it, a, b) ? ' · voorlopig' : ''}">${potRun(it, a, b) && R.days[a] < TODAYISO ? `<span class="pastsolid" style="width:${((R.idx.get(TODAYISO) ?? firstIdxOnOrAfter(TODAYISO)) - a) * dw()}px"></span>` : ''}${cf}<span class="bl">${w > 26 ? (it.uitleen && label ? '↗ ' : '') + label : ''}</span></div>`;
  });
  return h;
}
function scrollToDay(day, backDays = 10){ const g = $('#gwrap'); if(!g) return; const i = R.idx.get(day) ?? firstIdxOnOrAfter(day) ?? 0; g.scrollLeft = Math.max(0, (i - backDays) * dw()); }
