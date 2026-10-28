/* ---------- planning (tabblad Tijdschema): takenlijst + balkenplanning zoals MS Project ---------- */
let plSub = lsGet('lw-plSub') || 'planning', plAttAll = false, plSel = '', plZoom = lsGet('lw-plZoom') || 'week', plView = lsGet('lw-plView') || 'alles';
const TYPE_NAAM = {taak:'Taak', mijl:'Mijlpaal', stop:'Stoppunt', groep:'Groep', uitv:'Uitvoering', hf:'Hoofdfase', wg:'Werkgang'};
const STOP_STATUS = {open:['Open', 'fout'], gemeld:['Aangemeld', 'stale'], vrij:['Vrijgegeven', 'done']};
const RES_SOORT = {ploeg:'Eigen ploeg', oa:'Onderaannemer', mat:'Materieel', pers:'Persoon'};
function plCollapsed(){ try{ return new Set(JSON.parse(lsGet('lw-plc-' + S.pid) || '[]')); }catch{ return new Set(); } }
function plSetCollapsed(set){ lsSet('lw-plc-' + S.pid, JSON.stringify([...set])); }
function ensureUitv(pl){ if(pl.tasks.some(t => t.type === 'uitv')) return; const roots = pl.tasks.filter(t => !t.parent), g = roots.find(t => t.type === 'groep' && /voorbereid/i.test(t.naam));
  const at = g ? pl.tasks.indexOf(g) + 1 : pl.tasks.indexOf(roots[0]); pl.tasks.splice(at < 0 ? 0 : at, 0, {id:'UITV', type:'uitv', naam:'Uitvoering'}); }
function setPlan(fn, msg){ if(!S.canWrite) return; stash(); P.plan = P.plan ? clone(P.plan) : {}; P.plan.tasks = P.plan.tasks || []; P.plan.res = P.plan.res || []; ensureUitv(P.plan); fn(P.plan); changed(); tijdRefresh(); if(msg) toast(msg); }
function setWg(key, fn){ setSchema(s => { const w = s.werkgangen[key] = {...(s.werkgangen[key] || {})}; fn(w); }); tijdRefresh(); }
function tijdRefresh(){ if(S.tab !== 'tijd') return; if(tijdRefresh.busy){ tijdRefresh.again = true; return; } tijdRefresh.busy = true;
  try{ const ae = document.activeElement; if(ae && $('#tabBody')?.contains(ae) && ae.matches('input,textarea,select')) ae.blur(); // openstaande invoer eerst verwerken
    const keep = ['.plg', '.kplist'].map(q => { const g = $(q); return g ? [q, g.scrollTop, g.scrollLeft] : null; }).filter(Boolean), wy = window.scrollY; renderTijd(); for(const [q, t, l] of keep){ const g2 = $(q); if(g2){ g2.scrollTop = t; g2.scrollLeft = l; } } window.scrollTo(0, wy); }
  finally{ tijdRefresh.busy = false; } if(tijdRefresh.again){ tijdRefresh.again = false; tijdRefresh(); } }
// alle verwijzingen (voorgangers, blokkeert, plek in de lijst) omzetten na hernummeren of weggooien van werkgangen / hoofdfases
function remapRefs(fn, skipSchema){
  const fix = arr => (arr || []).map(p => typeof p === 'string' ? fn(p) : (q => q ? {...p, r:q} : null)(fn(p.r))).filter(Boolean);
  if(P.plan?.tasks) for(const t of P.plan.tasks){ if(t.preds) t.preds = fix(t.preds); if(t.blok) t.blok = fix(t.blok); if(t.na) t.na = fn(t.na) || ''; if(t.parent && t.parent.startsWith('H:')) t.parent = fn(t.parent) ?? ''; }
  const w = skipSchema ? null : P.schema?.werkgangen; if(w) for(const v of Object.values(w)) if(Array.isArray(v.preds)) v.preds = fix(v.preds);
  if(P.plan?.base?.items){ const out = {}; for(const [k, v] of Object.entries(P.plan.base.items)){ const k2 = fn(k); if(k2) out[k2] = v; } P.plan.base.items = out; } }
const resName = id => planOf().res.find(r => r.id === id)?.naam || '?';
function wgLabel(n){ const ks = kinds().filter(k => (n.vakken || []).some(v => v.kind === k)); return ks.map(kName).join(', ') || 'geen vakken'; }
function plIcon(n){ return n.type === 'mijl' ? '<span class="pi mi" title="Mijlpaal">◆</span>' : n.type === 'stop' ? `<span class="pi st ${n.stop?.status || 'open'}" title="Stoppunt">STOP</span>` : n.type === 'wg' ? '<span class="pi wg" title="Werkgang uit de fasering">▦</span>' : ''; }
function plVisible(R){ const col = plCollapsed(), out = []; let hideBelow = null;
  for(const n of R.nodes){ if(hideBelow !== null){ if(n.depth > hideBelow) continue; hideBelow = null; }
    if(plView === 'kritiek' && ['wg', 'taak', 'mijl', 'stop'].includes(n.type) && !n.crit) continue;
    if(plView === 'extern' && n.intern) continue;
    if(plView === 'stop' && ['wg', 'taak', 'mijl'].includes(n.type)) continue;
    out.push(n); if(col.has(n.ref) && R.nodes.some(k => k.parent === n.ref)) hideBelow = n.depth; }
  return out; }
function renderTijd(){
  const R = planCompute(), {nodes, by, cal, cfg} = R, rows = R.rows, ro = !S.canWrite, pl = planOf();
  const has = nodes.some(n => n.start), today = iso(Date.now()), todayI = cal.idx(tOf(today));
  const leaves = nodes.filter(n => ['wg', 'taak', 'mijl', 'stop'].includes(n.type) && n.start);
  const sp = leaves.length ? {start:leaves.reduce((a, n) => n.start < a ? n.start : a, leaves[0].start), eind:leaves.reduce((a, n) => n.eind > a ? n.eind : a, leaves[0].eind)} : null;
  const crit = leaves.filter(n => n.crit), cur = leaves.filter(n => n.S <= todayI && n.E > todayI && n.type !== 'stop' && n.type !== 'mijl');
  const end = nodes.find(n => n.type === 'uitv'), baseEnd = pl.base && end?.base ? end.base[1] : null, dev = baseEnd && end.eind ? cal.idx(tOf(end.eind)) - cal.idx(tOf(baseEnd)) : null;
  if(!nodes.some(n => n.ref === plSel)) plSel = '';
  const vis = plVisible(R), col = plCollapsed();
  const kal = `<section class="panel" data-fold="kal"><h2>Kalender en startdatum</h2>
    <div class="form">
      <label class="l">Start project / voorbereiding <span class="faint">(taken zonder voorganger)</span><input class="f" type="date" id="plStart" value="${esc(pl.start)}" ${ro ? 'disabled' : ''}></label>
      <label class="ck" style="align-self:end"><input type="checkbox" id="tsFeest" ${cfg.feestdagen ? 'checked' : ''} ${ro ? 'disabled' : ''}> Nationale feestdagen overslaan</label>
      ${cfg.feestdagen ? (() => { const y0 = sp ? Number(sp.start.slice(0, 4)) : new Date().getFullYear(), y1 = sp ? Number(sp.eind.slice(0, 4)) : y0 + 1, list = [];
        for(let y = y0; y <= Math.min(y1, y0 + 4); y++) for(const [d, h] of holidays(y)) list.push({d, ...h, on:holOn(cfg, d, h), wk:[0, 6].includes(new Date(tOf(d)).getUTCDay())});
        const nOn = list.filter(x => x.on && !x.wk).length;
        return `<details class="wide feest"><summary>Feestdagen ${y0}${y1 > y0 ? '–' + Math.min(y1, y0 + 4) : ''}: ${nOn} vrije werkdagen · aanpassen</summary><p class="muted" style="margin:6px 0">Vink aan welke dagen niet gewerkt wordt.</p>
          <div class="fl">${list.map(x => `<label class="ck${x.wk ? ' faint' : ''}"><input type="checkbox" data-feest="${x.d}" data-std="${x.std ? 1 : 0}" ${x.on ? 'checked' : ''} ${ro ? 'disabled' : ''}> <span class="num">${fmtD(x.d, true)}</span> ${esc(x.naam)}${x.wk ? ' (weekend)' : ''}</label>`).join('')}</div></details>`; })() : ''}
      <div class="wide vrij"><span class="l" style="margin:0">Vrije periodes (bouwvak, vorstverlet, eigen vrije dagen)</span>
        ${vrijList(cfg.vrij).map((v, i) => `<div class="row vr"><input class="f" type="date" data-vv="${i}" value="${esc(v.van)}" ${ro ? 'disabled' : ''} aria-label="Van"><span class="muted">t/m</span><input class="f" type="date" data-vt="${i}" value="${esc(v.tm)}" ${ro ? 'disabled' : ''} aria-label="Tot en met"><input class="f" data-vn="${i}" value="${esc(v.naam)}" placeholder="Omschrijving, bijv. Bouwvak" ${ro ? 'disabled' : ''}>${ro ? '' : `<button class="btn sm ghost" type="button" data-vdel="${i}" aria-label="Periode verwijderen">✕</button>`}</div>`).join('') || '<p class="faint" style="margin:0">Nog geen vrije periodes.</p>'}
        ${ro ? '' : '<div class="row"><button class="btn sm" type="button" id="vAdd">+ Vrije periode</button><button class="btn sm" type="button" id="vBouw">+ Bouwvak</button></div>'}</div>
    </div></section>`;
  const kpi = (l, v, cl) => `<span class="kpi ${cl || ''}"><span>${l}</span><b>${esc(v)}</b></span>`;
  const tiles = `<div class="plhead"><label class="kpi st"><span>Start uitvoering</span><input class="f" type="date" id="tsStart" value="${esc(cfg.start)}" ${ro ? 'disabled' : ''}></label>
    ${kpi('Gereed', sp ? fmtD(sp.eind, true) : '—')}${kpi('Werkdagen', sp ? cal.idx(tOf(sp.eind)) - cal.idx(tOf(sp.start)) + 1 : '—')}${dev !== null ? kpi('T.o.v. basisplanning', dev === 0 ? 'op schema' : (dev > 0 ? dev + ' wd later' : -dev + ' wd eerder'), dev > 0 ? 'warn' : 'ok') : ''}
    ${kpi('Nu bezig', cur.length ? cur.slice(0, 3).map(n => n.type === 'wg' ? n.key : n.nr).join(' + ') : has ? (today < sp.start ? 'nog niet gestart' : today > sp.eind ? 'afgerond' : '—') : '—')}</div>`;
  const att = planAttention(R);
  const attHtml = !att.length ? `<div class="attok"><span>✓ Niets dringends: geen stoppunten om te melden, geen achterstand, geen dubbele inzet.</span>${S.sample ? `<button class="btn sm ghost" type="button" id="plAI">Claude laten meekijken</button>` : ''}<span class="faint" id="plAIst"></span><div id="plAIres" style="flex-basis:100%"></div></div>` : `<section class="panel" data-fold="aand"><div class="row" style="justify-content:space-between"><h2>Dit vraagt je aandacht</h2><span class="row">${att.length ? `<span class="pill ${att.some(a => a.lvl === 'hoog') ? 'fout' : 'stale'}">${att.length} ${att.length === 1 ? 'punt' : 'punten'}</span>` : '<span class="pill done">Niets dringends</span>'}</span></div>
    ${att.length ? `<div class="att">${att.map((a, i) => i >= 3 && !plAttAll ? '' : `<button type="button" class="ai ${a.lvl}" data-att="${i}"><span class="al">${a.lvl === 'hoog' ? '!' : a.lvl === 'middel' ? '•' : 'i'}</span><span>${a.html || esc(a.txt)}</span>${a.when ? `<span class="aw">${esc(a.when)}</span>` : ''}</button>`).join('')}${att.length > 3 ? `<button class="btn sm ghost" type="button" id="attAll">${plAttAll ? 'minder tonen' : 'alle ' + att.length + ' punten tonen'}</button>` : ''}</div>` : '<p class="muted" style="margin:0">Geen stoppunten om te melden, geen achterstand en geen dubbel ingeplande ploegen.</p>'}
    <div class="row"><button class="btn sm ghost" type="button" id="attCopy" ${att.length ? '' : 'disabled'}>Kopieer als takenlijst (To Do)</button>${S.sample ? `<button class="btn sm ghost" type="button" id="plAI">Claude laten meekijken</button>` : ''}<span class="faint" id="plAIst"></span></div>
    <div id="plAIres"></div></section>`;
  const sel = by[plSel];
  const tool = `<div class="pltool">
      ${ro ? '' : `<details class="menu"><summary class="btn sm primary">+ Toevoegen</summary><div class="menuc"><button type="button" data-add="taak">Taak</button><button type="button" data-add="mijl">Mijlpaal</button><button type="button" data-add="stop">Stoppunt</button><button type="button" data-add="groep">Groep</button><span class="faint">komt onder de geselecteerde regel</span></div></details>
      <span class="tg"><button class="btn sm" type="button" id="plOut" title="Uitspringen" ${sel?.task && sel.task.parent && !sel.task.parent.startsWith('H:') ? '' : 'disabled'}>⇤</button><button class="btn sm" type="button" id="plIn" title="Inspringen (onder de regel erboven)" ${sel?.task && sel.type !== 'uitv' ? '' : 'disabled'}>⇥</button><button class="btn sm" type="button" id="plUp" title="Omhoog" ${sel?.task ? '' : 'disabled'}>↑</button><button class="btn sm" type="button" id="plDown" title="Omlaag" ${sel?.task ? '' : 'disabled'}>↓</button><button class="btn sm danger" type="button" id="plDel" title="Verwijderen" ${sel?.task && sel.type !== 'uitv' ? '' : 'disabled'}>✕</button></span>`}
      <span class="spacer"></span>
      <select class="f" id="plView" title="Wat toon je"><option value="alles">Alles</option><option value="kritiek">Alleen kritiek pad</option><option value="stop">Groepen, mijlpalen, stoppunten</option><option value="extern">Zonder interne taken</option></select>
      <select class="f" id="plZoom" title="Schaal"><option value="dag">Dagen</option><option value="week">Weken</option><option value="maand">Maanden</option></select>
      <details class="menu right"><summary class="btn sm">Meer ▾</summary><div class="menuc">
        <button type="button" id="plToday">Naar vandaag</button><button type="button" id="plAll">Alles uitklappen</button><button type="button" id="plNone">Groepen inklappen</button>
        ${ro ? '' : `<hr><button type="button" id="plBase">${pl.base ? 'Basisplanning bijwerken' : 'Basisplanning vastleggen'}</button>${pl.base ? `<button type="button" id="plBaseDel">Basisplanning wissen</button>` : ''}<button type="button" id="plTpl">Standaardtaken toevoegen…</button><hr><button type="button" id="plBestek">Bestek inlezen…</button><button type="button" id="plBegr">Begroting inlezen…</button>`}</div></details>
      <details class="menu right help"><summary class="btn sm" title="Uitleg">?</summary><div class="menuc"><p><b>Regel aanklikken</b> opent de details rechts; werkgangen tonen daar ook de kaart.</p><p><b>Voorgangers</b> typ je zoals in MS Project: <b>12</b> = na taak 12, <b>12BB+2</b> = 2 dagen na de start van 12, <b>2.3</b> = na werkgang 2.3, <b>H2VB-5</b> = klaar 5 werkdagen vóór de start van hoofdfase 2.</p><p>Rood = kritiek pad: loopt dit uit, dan schuift de oplevering. Grijs balkje = basisplanning.</p></div></details>
    </div>`;
  const grid = plGrid(R, vis, col, ro);
  const det = sel ? plDetail(sel, R, ro) : '';
  const subs = [['planning', 'Planning'], ['posten', 'Bestekposten'], ['instellingen', 'Kalender en bronnen']];
  const legend = `<div class="glegend pll"><span><i style="background:#5b7fa6"></i>Taak</span><span><i style="background:#c0392b"></i>Kritiek pad</span><span><i class="dm"></i>Mijlpaal</span><span><i class="sp"></i>Stoppunt</span><span><i style="background:#23303a;height:5px"></i>Groep</span>${pl.base ? '<span><i style="background:#9aa3a9;height:4px"></i>Basisplanning</span>' : ''}${kinds().map(k => `<span><i style="background:${kColor(k)}"></i>${esc(kName(k))}</span>`).join('')}</div>`;
  const body = plSub === 'posten' ? plKoppelPanel(R, ro)
    : plSub === 'instellingen' ? `${kal}${plResPanel(R, ro)}${plBronPanel(R, ro)}${has ? voorzTijdHtml(rows, cal) : ''}`
    : `${tiles}
    ${R.kring ? '<div class="banner crit"><p><b>Kringverwijzing:</b> een paar taken wachten (via voorgangers) op elkaar. Controleer de voorgangers; de data kloppen nu niet.</p></div>' : ''}
    ${has ? '' : '<div class="banner info"><p>Vul hierboven de start van de uitvoering in om data, kritiek pad en balken te zien.</p></div>'}
    ${attHtml}
    <section class="panel plpanel">${tool}<div id="plDet">${det}</div>${grid}${legend}</section>`;
  $('#tabBody').innerHTML = `<div class="stack"><nav class="subtabs" role="tablist">${subs.map(([k, l]) => `<button type="button" role="tab" data-sub="${k}" aria-selected="${plSub === k}">${l}</button>`).join('')}</nav>${body}</div>`;
  $('#tabBody').querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { plSub = b.dataset.sub; lsSet('lw-plSub', plSub); tijdRefresh(); window.scrollTo(0, 0); });
  wireFolds($('#tabBody'));
  plWire(R, vis, ro, att);
  if(sel?.type === 'wg' && sel.start) showTsMap(sel.key);
}
function plGrid(R, vis, col, ro){
  const {cal, nodes} = R, by = R.by, RH = 28, HH = 44;
  const kidsSet = new Set(nodes.map(n => n.parent).filter(Boolean));
  const COLS = [['nr', 'Nr', 36], ['naam', 'Naam', 250], ['duur', 'Duur', 58], ['start', 'Start', 76], ['eind', 'Eind', 76], ['pred', 'Volgt op', 112], ['rel', 'Relatie', 128], ['lag', 'Vertraging', 92], ['pct', '%', 56], ['fl', 'Speling', 78]];
  const TW = COLS.reduce((a, c) => a + c[2], 0), cg = `<colgroup>${COLS.map(c => `<col style="width:${c[2]}px">`).join('')}</colgroup>`;
  const tr = vis.map(n => { const leaf = ['wg', 'taak', 'mijl', 'stop'].includes(n.type), par = kidsSet.has(n.ref), t = n.task, canEdit = !ro;
    const naam = n.type === 'wg' ? `<span class="wgn">${n.key}</span> <span class="faint">${esc(wgLabel(n))}</span>` : (t && canEdit && n.type !== 'uitv' ? `<input class="f cell" data-pf="naam" value="${esc(n.naam)}" aria-label="Naam">` : `<b>${esc(n.naam)}</b>`);
    const duur = n.type === 'mijl' ? '<span class="faint">0</span>' : n.type === 'wg' || n.type === 'taak' || n.type === 'stop' ? (canEdit ? `<input class="f cell n" type="number" min="0" max="2000" data-pf="duur" value="${n.duur}" title="${n.type === 'stop' ? 'Beoordelingstermijn in werkdagen (0 = mijlpaal)' : 'Duur in werkdagen'}">` : n.duur) : (n.start ? `<span class="faint">${n.wd} wd</span>` : '');
    const pv = n.type === 'wg' && !n.explicit ? '' : predsText(n.preds, by);
    const pred = leaf ? plPredCells(n, R, canEdit) : '<td></td><td></td><td></td>';
    const pct = leaf ? (canEdit ? `<input class="f cell n" type="number" min="0" max="100" step="5" data-pf="pct" value="${n.pct || 0}">` : (n.pct || 0) + '%') : (n.start ? `<span class="faint">${n.pct || 0}%</span>` : '');
    const fl = n.float === undefined ? '' : n.crit ? '<span class="krit">kritiek</span>' : n.jit ? '<span class="faint" title="Gepland op het laatste moment vóór de taak waar hij aan voorafgaat">net op tijd</span>' : `<span class="faint">${n.float} wd</span>`;
    const late = leaf && n.eind && n.eind < iso(Date.now()) && (n.pct || 0) < 100 && n.type !== 'stop';
    return `<tr data-ref="${n.ref}" class="t-${n.type}${n.ref === plSel ? ' sel' : ''}${n.crit && leaf ? ' crit' : ''}${n.intern ? ' intern' : ''}"><td class="nr">${n.nr}</td>
      <td class="nm" style="padding-left:${6 + n.depth * 16}px">${par ? `<button class="tw" type="button" data-tw="${n.ref}" aria-label="${col.has(n.ref) ? 'Uitklappen' : 'Inklappen'}">${col.has(n.ref) ? '▸' : '▾'}</button>` : '<span class="tw0"></span>'}${plIcon(n)}${naam}</td>
      <td>${duur}</td><td class="num${late ? ' laat' : ''}" title="${n.start ? 'week ' + weekNr(n.start) : ''}">${n.start ? fmtD(n.start) : ''}</td><td class="num${late ? ' laat' : ''}" title="${n.eind ? 'week ' + weekNr(n.eind) : ''}">${n.eind ? fmtD(n.eind) : ''}</td>
      ${pred}<td>${pct}</td><td>${fl}</td></tr>`; }).join('');
  const g = plGanttSvg(R, vis, RH, HH);
  return `<div class="plg" style="--tw:${TW}px"><div class="plin" style="grid-template-columns:${TW}px ${g.W}px">
    <div class="plth"><table class="pl">${cg}<thead><tr>${COLS.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead></table></div>
    <div class="plgh">${g.head}</div>
    <div class="pltb"><table class="pl">${cg}<tbody>${tr}</tbody></table></div>
    <div class="plgb">${g.body}</div></div></div>`;
}
function plGanttSvg(R, vis, RH, HH){
  const {cal} = R, dated = vis.filter(n => n.start), today = iso(Date.now());
  const px = plZoom === 'dag' ? 22 : plZoom === 'maand' ? 2.4 : 7;
  if(!dated.length) return {W:400, head:`<svg width="400" height="${HH}"></svg>`, body:`<svg width="400" height="${Math.max(RH, vis.length * RH)}"></svg>`};
  const mon = t => t - ((new Date(t).getUTCDay() + 6) % 7) * DAY;
  let t0 = Math.min(...dated.map(n => tOf(n.start)), ...dated.filter(n => n.base).map(n => tOf(n.base[0]))), t1 = Math.max(...dated.map(n => tOf(n.eind)), ...dated.filter(n => n.base).map(n => tOf(n.base[1])));
  const a = mon(t0) - 7 * DAY, weeks = Math.ceil((t1 - a) / DAY / 7) + 3, b = a + weeks * 7 * DAY, W = Math.max(400, Math.round(weeks * 5 * px));
  const x = t => { const d = Math.round((t - a) / DAY), wk = Math.floor(d / 7), dw = d - wk * 7; return (wk * 5 + Math.min(dw, 5)) * px; };
  const xs = s => x(tOf(s)), xe = s => x(tOf(s)) + px, H = Math.max(RH, vis.length * RH);
  let head = '', grid = '', lastM = -99;
  for(let i = 0; i < weeks; i++){ const t = a + i * 7 * DAY, xx = x(t), d = new Date(t);
    if(d.getUTCDate() <= 7 || i === 0){ if(xx - lastM > 40 || plZoom !== 'maand'){ head += `<text x="${xx + 3}" y="16" class="gmn">${MND[d.getUTCMonth()]} ${d.getUTCFullYear()}</text>`; lastM = xx; } if(plZoom === 'maand') grid += `<line x1="${xx}" y1="0" x2="${xx}" y2="${H}" class="gl"/>`; }
    if(plZoom !== 'maand'){ head += `<text x="${xx + 3}" y="36" class="gwk">${plZoom === 'dag' ? 'wk ' : ''}${weekNr(iso(t))}</text>`; grid += `<line x1="${xx}" y1="0" x2="${xx}" y2="${H}" class="gl"/>`; }
    if(plZoom === 'dag') for(let k = 1; k < 5; k++){ const dd = new Date(t + k * DAY); head += `<text x="${xx + k * px + 3}" y="36" class="gwk" opacity=".6">${dd.getUTCDate()}</text>`; } }
  let off = ''; for(let t = a; t < b; t += DAY){ const o = cal.off(t); if(o && o !== 'weekend' && !cal.vrij.has(iso(t))) off += `<rect x="${x(t)}" y="0" width="${Math.max(1, px)}" height="${H}" class="goff"><title>${fmtD(iso(t), true)}: ${esc(o)}</title></rect>`; }
  for(const v of vrijList(schemaCfg().vrij)){ const s0 = Math.max(tOf(v.van), a), e0 = Math.min(tOf(v.tm) + DAY, b); if(s0 < e0) off += `<g class="gvrij"><rect x="${x(s0)}" y="0" width="${Math.max(2, x(e0) - x(s0))}" height="${H}"/><title>${esc(v.naam || 'Vrij')}</title></g>`; }
  const rowY = {}; vis.forEach((n, i) => rowY[n.ref] = i * RH);
  let bars = '', links = '', zeb = '';
  vis.forEach((n, i) => { const y = i * RH; if(n.ref === plSel) zeb += `<rect x="0" y="${y}" width="${W}" height="${RH}" class="gsel"/>`; else if(n.type === 'hf' || n.type === 'uitv' || n.type === 'groep') zeb += `<rect x="0" y="${y}" width="${W}" height="${RH}" class="gzeb"/>`;
    if(!n.start) return; const x0 = xs(n.start), x1 = xe(n.eind), cr = n.crit && ['wg', 'taak', 'mijl', 'stop'].includes(n.type);
    let g = '';
    if(n.base){ const b0 = xs(n.base[0]), b1 = isMile(n) ? b0 + px : xe(n.base[1]); g += `<rect x="${b0}" y="${y + RH - 7}" width="${Math.max(2, b1 - b0)}" height="3.5" fill="#9aa3a9"/>`; }
    if(n.type === 'groep' || n.type === 'uitv' || n.type === 'hf'){ g += `<path d="M${x0} ${y + 9}H${x1}V${y + 17}L${x1 - 5} ${y + 13}H${x0 + 5}L${x0} ${y + 17}Z" fill="${n.type === 'hf' ? '#5d666d' : '#23303a'}"/>`; }
    else if(isMile(n)){ const cx = xe(n.eind) - (plZoom === 'maand' ? 0 : px / 2), cy = y + RH / 2 - 1;
      if(n.type === 'stop'){ const col = n.stop?.status === 'vrij' ? '#439034' : n.stop?.status === 'gemeld' ? '#c98a1a' : '#c0392b', r = 7, p = []; for(let k = 0; k < 8; k++){ const an = Math.PI / 8 + k * Math.PI / 4; p.push((cx + r * Math.cos(an)).toFixed(1) + ',' + (cy + r * Math.sin(an)).toFixed(1)); }
        g += `<polygon points="${p.join(' ')}" fill="${col}" stroke="#fff" stroke-width="1"/>`; }
      else g += `<path d="M${cx} ${cy - 7}L${cx + 7} ${cy}L${cx} ${cy + 7}L${cx - 7} ${cy}Z" fill="${cr ? '#c0392b' : '#23303a'}"/>`;
      g += `<text x="${cx + 10}" y="${y + 18}" class="gdur">${fmtD(n.eind)}</text>`; }
    else { const w = Math.max(3, x1 - x0), h = RH - 12, yb = y + 5;
      if(n.type === 'wg'){ const ks = kinds().filter(k => (n.vakken || []).some(v => v.kind === k)), hh = h / Math.max(1, ks.length); (ks.length ? ks : ['']).forEach((k, j) => g += `<rect x="${x0}" y="${yb + j * hh}" width="${w}" height="${hh}" fill="${k ? kColor(k) : '#7b858c'}"/>`); }
      else if(n.type === 'stop') g += `<rect x="${x0}" y="${yb}" width="${w}" height="${h}" fill="url(#stopHatch)" stroke="#c0392b"/>`;
      else g += `<rect x="${x0}" y="${yb}" width="${w}" height="${h}" fill="${cr ? '#c0392b' : '#5b7fa6'}" opacity="${n.intern ? .55 : 1}"/>`;
      if(n.pct) g += `<rect x="${x0}" y="${yb + h / 2 - 2}" width="${w * Math.min(100, n.pct) / 100}" height="4" fill="#111" opacity=".55"/>`;
      if(cr && n.type === 'wg') g += `<rect x="${x0 - 1}" y="${yb - 1}" width="${w + 2}" height="${h + 2}" fill="none" stroke="#c0392b" stroke-width="2"/>`;
      const lab = (n.res || []).map(resName).join(', ') || n.wie || ''; if(lab) g += `<text x="${x1 + 5}" y="${y + 18}" class="gdur">${esc(lab)}</text>`; }
    const movable = ['wg', 'taak', 'mijl', 'stop'].includes(n.type), sized = (n.type === 'wg' || n.type === 'taak') && !isMile(n);
    if(movable){ const hx0 = isMile(n) ? xe(n.eind) - 8 : x0, hx1 = isMile(n) ? xe(n.eind) + 8 : x1;
      g = `<rect class="ghit" x="${hx0}" y="${y + 2}" width="${Math.max(6, hx1 - hx0)}" height="${RH - 4}" fill="transparent"/>` + g;
      if(S.canWrite){ if(sized) g += `<rect class="gh gh-l" x="${x0 - 3}" y="${y + 4}" width="7" height="${RH - 8}"/><rect class="gh gh-r" x="${x1 - 4}" y="${y + 4}" width="7" height="${RH - 8}"/>`;
        g += `<circle class="gdot" cx="${hx1 + 7}" cy="${y + RH / 2}" r="4.5"><title>Sleep naar een andere balk: die start dan na het einde van deze</title></circle>`; } }
    bars += `<g class="gbar${movable ? ' mov' : ''}" data-ref="${n.ref}"${n.type === 'wg' ? ` data-see="${n.phase}|${n.step}"` : ''}><title>${esc((n.type === 'wg' ? 'Werkgang ' + n.key : n.naam) + ': ' + fmtD(n.start) + (n.eind !== n.start ? ' t/m ' + fmtD(n.eind, true) : '') + (n.wd ? ' · ' + n.wd + ' wd' : '') + (n.crit ? ' · kritiek' : n.float !== undefined ? ' · speling ' + n.float + ' wd' : '') + (movable ? '\nStart: ' + plReason(n, R) + (S.canWrite ? '\nSlepen = verschuiven · rand = duur · bolletje = koppelen · rechtsklik = menu' : '') : ''))}</title>${g}</g>`; });
  // koppellijnen voor zelf ingevoerde voorgangers (niet de automatische werkgangvolgorde)
  for(const n of vis){ if(!n.start || !n.explicit) continue; for(const p of [...(n.preds || []), ...(n.allPreds || []).filter(q => q.blok)]){ const q = R.by[p.r]; if(!q?.start || rowY[q.ref] === undefined) continue; const shown = (plSel && (plSel === n.ref || plSel === q.ref)) || (plView === 'kritiek' && q.crit && n.crit);
    const ya = rowY[q.ref] + RH / 2, yb = rowY[n.ref] + RH / 2, crit = q.crit && n.crit;
    let xa, xb; if(p.t === 'BB'){ xa = xs(q.start); xb = xs(n.start); } else if(p.t === 'VB'){ xa = xe(n.eind); xb = xs(q.start); } else if(p.t === 'EE'){ xa = xe(q.eind); xb = xe(n.eind); } else { xa = isMile(q) ? xe(q.eind) : xe(q.eind); xb = xs(n.start); }
    const [y1, y2] = p.t === 'VB' ? [yb, ya] : [ya, yb];
    links += `<path d="M${xa} ${y1}H${Math.max(xa + 6, Math.min(xb - 4, xa + 6))}V${y2}H${xb - 2}" class="glink${crit ? ' cr' : ''}${p.blok ? ' bl' : ''}${shown ? '' : ' hid'}" data-la="${q.ref}" data-lb="${n.ref}" marker-end="url(#arr${crit ? 'R' : ''})"/>`; } }
  const tt = tOf(today), now = tt >= a && tt < b ? `<line x1="${x(tt) + px / 2}" y1="0" x2="${x(tt) + px / 2}" y2="${H}" class="gnow"/>` : '';
  const defs = `<defs><pattern id="stopHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#f6d5d1"/><line x1="0" y1="0" x2="0" y2="6" stroke="#c0392b" stroke-width="2"/></pattern>
    <marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#7b858c"/></marker><marker id="arrR" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#c0392b"/></marker></defs>`;
  plGeo = {a, px, x};
  return {W, a, x, px,
    head:`<svg width="${W}" height="${HH}" class="gs">${head}${tt >= a && tt < b ? `<text x="${x(tt) + px / 2 + 3}" y="${HH - 2}" class="gnowt">vandaag</text>` : ''}</svg>`,
    body:`<svg width="${W}" height="${H}" class="gs">${defs}${zeb}${off}${grid}${now}${links}${bars}</svg>`};
}
function plDetail(n, R, ro){
  const dis = ro ? 'disabled' : '', t = n.task, by = R.by;
  const resChips = `<div class="row" style="gap:4px">${planOf().res.map(r => `<label class="chipck"><input type="checkbox" data-pres="${r.id}" ${(n.res || []).includes(r.id) ? 'checked' : ''} ${dis}> ${esc(r.naam)}</label>`).join('') || '<span class="faint">Nog geen ploegen of onderaannemers; voeg ze toe onder Uitvoerders en materieel.</span>'}</div>`;
  const when = n.start ? `${fmtD(n.start, true)}${n.eind !== n.start ? ' t/m ' + fmtD(n.eind, true) : ''}${n.wd ? ' · ' + n.wd + ' werkdagen' : ''}` : 'nog geen datum';
  const extra = n.base ? ` · basis ${fmtD(n.base[0])}–${fmtD(n.base[1])}${n.dev ? ` (<b class="${n.dev > 0 ? 'krit' : ''}">${n.dev > 0 ? '+' : ''}${n.dev} wd</b>)` : ''}` : '';
  const head = `<div class="row" style="justify-content:space-between"><div><span class="chip">${n.nr}</span> <b>${n.type === 'wg' ? 'Werkgang ' + n.key : esc(n.naam || TYPE_NAAM[n.type])}</b> <span class="muted">${TYPE_NAAM[n.type]} · ${when}${extra}${n.float !== undefined ? (n.crit ? ' · <b class="krit">kritiek pad</b>' : ' · speling ' + n.float + ' wd') : ''}</span></div><button class="btn sm ghost" type="button" id="plDetX" aria-label="Sluiten">✕</button></div>`;
  if(n.type === 'uitv' || n.type === 'hf') return `<div class="pldet">${head}<p class="muted" style="margin:0">${n.type === 'hf' ? 'Hoofdfase uit de fasering. Begin en einde volgen uit de werkgangen. Andere taken kun je eronder hangen: selecteer een werkgang en kies + Taak of + Stoppunt.' : 'De werkgangen uit de fasering, per hoofdfase. Verplaats deze regel met ↑ ↓ als de voorbereiding ervoor of de oplevering erna moet staan.'}</p></div>`;
  const common = `<label class="l">Voorgangers<input class="f" data-pd="pred" value="${esc(n.type === 'wg' && !n.explicit ? '' : predsText(n.preds, by))}" placeholder="${esc(n.type === 'wg' && !n.explicit ? 'automatisch: ' + n.autoTxt : 'bijv. 4; 2.3BB+2; H2VB-5')}" ${dis}></label>
    <label class="l">% gereed<input class="f" type="number" min="0" max="100" step="5" data-pd="pct" value="${n.pct || 0}" ${dis}></label>
    <details class="wide more" ${n.wie || n.partij || (n.res || []).length || n.intern || n.notitie || n.vast ? 'open' : ''}><summary>Meer: verantwoordelijke, partij, uitvoerders, notitie</summary><div class="form pf">${n.type === 'wg' ? `<label class="l">Vaste startdatum<input class="f" type="date" data-pd="vast" value="${esc(n.vast || '')}" ${dis}></label>` : ''}
    <label class="l">Verantwoordelijke<input class="f" data-pd="wie" value="${esc(n.wie || '')}" placeholder="bijv. werkvoorbereider" ${dis}></label>
    <label class="l">Externe partij<input class="f" data-pd="partij" value="${esc(n.partij || '')}" placeholder="bijv. gemeente, Stedin, ProRail" ${dis}></label>
    <label class="l wide">Uitvoerders en materieel${resChips}</label>
    <label class="ck"><input type="checkbox" data-pd="intern" ${n.intern ? 'checked' : ''} ${dis}> Intern (niet in de uitdraai voor de opdrachtgever)</label>
    <label class="l wide">Notitie<textarea class="f" rows="2" data-pd="notitie" ${dis}>${esc(n.notitie || '')}</textarea></label></div></details>`;
  if(n.type === 'wg') return `<div class="pldet">${head}<div class="row" style="gap:4px">${(n.vakken || []).map(v => `<span class="vak" ${kst(v.kind)}>${esc(v.phase + '.' + v.code)}</span>`).join('')}<button class="btn sm ghost" type="button" id="plOpenF">Openen in Fasering ›</button></div>
    <div class="tsmap" id="tsMap"><span class="muted">Kaart laden…</span></div>
    <div class="form pf"><label class="l">Duur (werkdagen)<input class="f" type="number" min="1" max="400" data-pd="duur" value="${n.duur}" ${dis}></label>${common}</div>
    ${plPostsHtml(n, R, ro)}</div>`;
  const st = n.stop || {};
  const stopF = n.type === 'stop' ? `<label class="l">Keurder (wie geeft vrij)<input class="f" data-ps="keurder" value="${esc(st.keurder || '')}" placeholder="Directie" ${dis}></label>
    <label class="l">Aanmelden (werkdagen vooraf)<input class="f" type="number" min="0" max="60" data-ps="meld" value="${st.meld ?? 2}" ${dis}></label>
    <label class="l">Beoordelingstermijn (werkdagen werk stil)<input class="f" type="number" min="0" max="60" data-pd="duur" value="${n.duur || 0}" ${dis}></label>
    <label class="l">Status<select class="f" data-ps="status" ${dis}>${Object.entries(STOP_STATUS).map(([k, v]) => `<option value="${k}" ${(st.status || 'open') === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
    <label class="l">Datum status<input class="f" type="date" data-ps="datum" value="${esc(st.datum || '')}" ${dis}></label>
    <label class="l">Bestek / keuringsplan<input class="f" data-ps="ref" value="${esc(st.ref || '')}" placeholder="bijv. S5, 01.13.05" ${dis}></label>
    <label class="l wide">Houdt tegen (deze taken starten pas na vrijgave)<input class="f" data-pd="blok" value="${esc(predsText((n.blok || []).map(r => ({r})), by))}" placeholder="bijv. 2.4; 15" ${dis}></label>` : '';
  return `<div class="pldet">${head}<div class="form pf">
    <label class="l">Naam<input class="f" data-pd="naam" value="${esc(n.naam)}" ${dis}></label>
    <label class="l">Soort<select class="f" data-pd="type" ${dis}>${['taak', 'mijl', 'stop', 'groep'].map(k => `<option value="${k}" ${n.type === k ? 'selected' : ''}>${TYPE_NAAM[k]}</option>`).join('')}</select></label>
    ${n.type === 'taak' ? `<label class="l">Duur (werkdagen)<input class="f" type="number" min="0" max="2000" data-pd="duur" value="${n.duur}" ${dis}></label>` : ''}
    ${n.type !== 'groep' ? `<label class="l">Niet eerder dan<input class="f" type="date" data-pd="snet" value="${esc(n.snet || '')}" ${dis}></label>` : ''}
    ${stopF}${n.type !== 'groep' ? common : `<label class="ck"><input type="checkbox" data-pd="intern" ${n.intern ? 'checked' : ''} ${dis}> Intern (niet in de uitdraai)</label><label class="l wide">Notitie<textarea class="f" rows="2" data-pd="notitie" ${dis}>${esc(n.notitie || '')}</textarea></label>`}</div>
    ${n.type === 'taak' ? plPostsHtml(n, R, ro) : ''}</div>`;
}
// veld van een regel wijzigen (planningstaak of werkgang)
function plSet(n, f, v, R){
  if(f === 'pr' || f === 'prt' || f === 'prl') return plSetFirstPred(n, f, v, R);
  if(n.type === 'wg'){
    setWg(n.key, w => { if(f === 'pred'){ const {preds, bad} = parsePredsText(v, R.nodes); if(bad.length) toast('Niet herkend: ' + bad.join(', ')); if(!String(v).trim()){ delete w.preds; } else { w.preds = preds.filter(p => p.r !== n.ref); } delete w.koppel; delete w.wacht; }
      else if(f === 'duur') w.duur = Math.max(1, Math.round(Number(v) || DEF_DUUR));
      else if(f === 'pct') w.pct = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
      else if(f === 'intern'){ if(v) w.intern = true; else delete w.intern; }
      else if(f === 'res') w.res = v;
      else if(['vast', 'wie', 'partij', 'notitie'].includes(f)){ if(v) w[f] = v; else delete w[f]; } });
    return; }
  if(!n.task) return;
  setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); if(!t) return;
    if(f === 'pred' || f === 'blok'){ const {preds, bad} = parsePredsText(v, R.nodes); if(bad.length) toast('Niet herkend: ' + bad.join(', ')); const ok = preds.filter(p => p.r !== n.ref); if(f === 'pred') t.preds = ok; else t.blok = ok.map(p => p.r); }
    else if(f === 'duur'){ const d = Math.max(0, Math.round(Number(v) || 0)); if(t.type === 'stop'){ t.stop = {...(t.stop || {}), beoord:d}; } else t.duur = d; }
    else if(f === 'pct') t.pct = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    else if(f === 'type'){ t.type = v; if(v === 'stop' && !t.stop) t.stop = {meld:2, status:'open', keurder:'Directie'}; if(v === 'taak' && !t.duur) t.duur = 5; }
    else if(f === 'intern') t.intern = !!v;
    else if(f === 'res') t.res = v;
    else if(f.startsWith('stop.')){ t.stop = {...(t.stop || {}), [f.slice(5)]:v}; if(f === 'stop.status' && v !== 'open' && !t.stop.datum) t.stop.datum = iso(Date.now()); }
    else t[f] = v; });
}
function plAdd(type, R){
  const sel = R.by[plSel], id = uid(), t = {id, type, naam:({taak:'Nieuwe taak', mijl:'Nieuwe mijlpaal', stop:'Stoppunt', groep:'Nieuwe groep'})[type], preds:[]};
  if(type === 'taak') t.duur = 5; if(type === 'stop') t.stop = {meld:2, status:'open', keurder:'Directie', beoord:0};
  setPlan(pl => { const T = pl.tasks;
    if(!sel){ t.parent = ''; T.push(t); }
    else if(sel.type === 'groep'){ t.parent = sel.task.id; T.push(t); }
    else if(sel.type === 'hf'){ t.parent = sel.ref; T.push(t); }
    else if(sel.type === 'wg'){ t.parent = 'H:' + sel.phase; t.na = sel.ref; t.preds = [{r:sel.ref, t:'EB'}];
      if(type === 'stop'){ const nx = R.nodes.find(k => k.type === 'wg' && k.phase === sel.phase && k.step > sel.step); if(nx) t.blok = [nx.ref]; }
      const last = T.map((x, i) => x.na === sel.ref ? i : -1).filter(i => i >= 0).pop(); T.splice(last === undefined ? T.length : last + 1, 0, t); }
    else if(sel.type === 'uitv'){ t.parent = ''; t.preds = type === 'groep' ? [] : [{r:'UITV', t:'EB'}]; T.splice(T.findIndex(x => x.type === 'uitv') + 1, 0, t); }
    else { const s = T.find(x => x.id === sel.task.id); t.parent = s.parent || ''; if(s.na) t.na = s.na; if(type !== 'groep' && (s.type === 'taak' || s.type === 'mijl' || s.type === 'stop')) t.preds = [{r:sel.ref, t:'EB'}];
      const desc = id0 => { const ids = [id0]; for(let k = 0; k < ids.length; k++) T.filter(x => x.parent === ids[k]).forEach(x => ids.push(x.id)); return ids; };
      const after = Math.max(...desc(s.id).map(i => T.findIndex(x => x.id === i))); T.splice(after + 1, 0, t); } });
  plSel = 'T:' + id; tijdRefresh(); setTimeout(() => { const i = $(`tr[data-ref="T:${id}"] [data-pf="naam"]`); if(i){ i.focus(); i.select(); } }, 30);
}
function plMove(dir, R){ const sel = R.by[plSel]; if(!sel?.task) return;
  setPlan(pl => { const T = pl.tasks, s = T.find(x => x.id === sel.task.id) || T.find(x => x.type === 'uitv'); if(!s) return;
    const sibs = T.filter(x => (x.parent || '') === (s.parent || '') && (x.na || '') === (s.na || '')), i = sibs.indexOf(s), o = sibs[i + dir];
    if(o){ const a = T.indexOf(s), b = T.indexOf(o); T[a] = o; T[b] = s; return; }
    if(s.parent?.startsWith('H:')){ const ph = s.parent.slice(2), st = plannedSteps(ph).map(n => 'W:' + ph + '.' + n), k = s.na ? st.indexOf(s.na) : st.length; const nk = k + dir; if(nk < -1 || nk > st.length) return; s.na = nk < 0 ? '' : nk >= st.length ? '' : st[nk]; if(nk < 0) toast('Dit is al de bovenste plek in deze hoofdfase.'); } }); }
function plIndent(R, out){ const sel = R.by[plSel]; if(!sel?.task) return;
  setPlan(pl => { const T = pl.tasks, s = T.find(x => x.id === sel.task.id); if(!s) return;
    if(out){ const par = T.find(x => x.id === s.parent); if(!par) return; s.parent = par.parent || ''; if(par.na) s.na = par.na; else delete s.na; T.splice(T.indexOf(s), 1); const desc = [par.id]; for(let k = 0; k < desc.length; k++) T.filter(x => x.parent === desc[k]).forEach(x => desc.push(x.id)); const at = Math.max(...desc.map(i => T.findIndex(x => x.id === i))); T.splice(at + 1, 0, s); return; }
    const sibs = T.filter(x => (x.parent || '') === (s.parent || '') && (x.na || '') === (s.na || '') && x.type !== 'uitv'), prev = sibs[sibs.indexOf(s) - 1];
    if(!prev) return toast('Er staat geen regel boven om onder te hangen.'); if(prev.type !== 'groep'){ prev.type = 'groep'; delete prev.duur; } s.parent = prev.id; delete s.na; }); }
function plDelete(R){ const sel = R.by[plSel]; if(!sel?.task || sel.type === 'uitv') return; const btn = $('#plDel');
  const ids = [sel.task.id]; const T0 = planOf().tasks; for(let k = 0; k < ids.length; k++) T0.filter(x => x.parent === ids[k]).forEach(x => ids.push(x.id));
  if(ids.length > 1 && !btn.classList.contains('armed')){ btn.classList.add('armed'); btn.textContent = ids.length + ' regels weg? Klik nogmaals'; setTimeout(() => { if(btn.isConnected){ btn.classList.remove('armed'); btn.textContent = '✕'; } }, 4000); return; }
  const gone = new Set(ids.map(i => 'T:' + i)); plSel = '';
  setPlan(pl => { pl.tasks = pl.tasks.filter(x => !ids.includes(x.id)); remapRefs(r => gone.has(r) ? null : r); }, 'Verwijderd. Ctrl+Z zet het terug.'); }
function plWire(R, vis, ro, att){
  const tb = $('#tabBody'), by = R.by, cfg = R.cfg;
  // kalender
  if(!ro){
    ($('#tsStart') || {}).onchange = e => { setSchema(s => { s.start = e.target.value || ''; }); tijdRefresh(); };
    ($('#plStart') || {}).onchange = e => setPlan(pl => { pl.start = e.target.value || ''; });
    tb.querySelectorAll('[data-feest]').forEach(f => f.onchange = () => { const d = f.dataset.feest, std = f.dataset.std === '1'; setSchema(s => { s.feest = {...(s.feest || {})}; if(f.checked === std) delete s.feest[d]; else s.feest[d] = f.checked; }); tijdRefresh(); const dd = $('details.feest'); if(dd) dd.open = true; });
    ($('#tsFeest') || {}).onchange = e => { setSchema(s => { s.feestdagen = e.target.checked; }); tijdRefresh(); };
    const setVrij = fn => { const list = vrijList(cfg.vrij); fn(list); setSchema(s => { s.vrij = vrijText(list); }); tijdRefresh(); };
    tb.querySelectorAll('[data-vv],[data-vt],[data-vn]').forEach(f => f.onchange = () => { const i = Number(f.dataset.vv ?? f.dataset.vt ?? f.dataset.vn); setVrij(l => { const v = l[i]; if(!v) return; if(f.dataset.vv !== undefined){ v.van = f.value; if(!v.tm || v.tm < v.van) v.tm = v.van; } else if(f.dataset.vt !== undefined) v.tm = f.value < v.van ? v.van : f.value; else v.naam = f.value.trim(); }); });
    tb.querySelectorAll('[data-vdel]').forEach(b => b.onclick = () => setVrij(l => l.splice(Number(b.dataset.vdel), 1)));
    const base = cfg.start || iso(Date.now());
    ($('#vAdd') || {}).onclick = () => setVrij(l => l.push({van:base, tm:base, naam:''}));
    ($('#vBouw') || {}).onclick = () => { const y = Number(base.slice(0, 4)); setVrij(l => l.push({van:y + '-07-26', tm:y + '-08-13', naam:'Bouwvak'})); toast('Bouwvak ' + y + ' toegevoegd als 26 jul t/m 13 aug. Pas de data aan voor jullie regio.'); };
  }
  // selecteren
  const select = ref => { if(plSel === ref) return; plSel = ref; tijdRefresh(); };
  tb.querySelectorAll('.pltb tr[data-ref]').forEach(tr => tr.addEventListener('mousedown', e => { if(e.target.closest('input,button,select,textarea')) { if(plSel !== tr.dataset.ref){ plSel = tr.dataset.ref; tb.querySelectorAll('.pltb tr.sel').forEach(x => x.classList.remove('sel')); tr.classList.add('sel'); } return; } select(tr.dataset.ref); }));
  tb.querySelectorAll('.plgb .gbar').forEach(g => g.addEventListener('click', () => select(g.dataset.ref)));
  tb.querySelectorAll('[data-tw]').forEach(b => b.onclick = e => { e.stopPropagation(); const c = plCollapsed(); c.has(b.dataset.tw) ? c.delete(b.dataset.tw) : c.add(b.dataset.tw); plSetCollapsed(c); tijdRefresh(); });
  ($('#plAll') || {}).onclick = () => { plSetCollapsed(new Set()); tijdRefresh(); };
  ($('#plNone') || {}).onclick = () => { plSetCollapsed(new Set(R.nodes.filter(n => n.type === 'groep' || n.type === 'hf').map(n => n.ref))); tijdRefresh(); };
  ($('#plView') || {}).value = plView; ($('#plView') || {}).onchange = e => { plView = e.target.value; lsSet('lw-plView', plView); tijdRefresh(); };
  ($('#plZoom') || {}).value = plZoom; ($('#plZoom') || {}).onchange = e => { plZoom = e.target.value; lsSet('lw-plZoom', plZoom); tijdRefresh(); };
  const toToday = () => { const g = $('.plg'), x = $('.plgb .gnow'); if(g && x) g.scrollLeft = Math.max(0, Number(x.getAttribute('x1')) - 120); }; ($('#plToday') || {}).onclick = toToday;
  // cellen in de tabel
  tb.querySelectorAll('.pltb [data-pf]').forEach(f => f.onchange = () => { const n = by[f.closest('tr').dataset.ref]; if(n) plSet(n, f.dataset.pf, f.value, R); });
  tb.querySelectorAll('.pltb input[data-pf]').forEach(f => f.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); f.blur(); } if(e.key === 'Escape'){ f.value = f.defaultValue; f.blur(); } }));
  // detailpaneel
  const sel = by[plSel];
  if(sel){ $('#plDetX') && (($('#plDetX') || {}).onclick = () => { plSel = ''; tijdRefresh(); });
    $('#plOpenF') && (($('#plOpenF') || {}).onclick = () => gotoStep(sel.phase, sel.step));
    tb.querySelectorAll('.pldet [data-pd]').forEach(f => f.onchange = () => plSet(sel, f.dataset.pd, f.type === 'checkbox' ? f.checked : f.value, R));
    tb.querySelectorAll('.pldet [data-ps]').forEach(f => f.onchange = () => plSet(sel, 'stop.' + f.dataset.ps, f.type === 'number' ? Number(f.value) : f.value, R));
    tb.querySelectorAll('.pldet [data-pres]').forEach(f => f.onchange = () => { const cur = new Set(sel.res || []); f.checked ? cur.add(f.dataset.pres) : cur.delete(f.dataset.pres); plSet(sel, 'res', [...cur], R); });
    plPostsWire(sel, R); }
  if(!ro){
    tb.querySelectorAll('[data-add]').forEach(b => b.onclick = () => plAdd(b.dataset.add, R));
    ($('#plUp') || {}).onclick = () => plMove(-1, R); ($('#plDown') || {}).onclick = () => plMove(1, R); ($('#plIn') || {}).onclick = () => plIndent(R, false); ($('#plOut') || {}).onclick = () => plIndent(R, true); ($('#plDel') || {}).onclick = () => plDelete(R);
    ($('#plBase') || {}).onclick = () => { const items = {}; for(const n of R.nodes) if(n.start) items[n.ref] = [n.start, n.eind]; setPlan(pl => { pl.base = {at:new Date().toISOString(), by:S.meId || '', items}; }, 'Basisplanning vastgelegd. Afwijkingen zie je nu als grijs balkje en in de kolom van het detailpaneel.'); };
    $('#plBaseDel') && (($('#plBaseDel') || {}).onclick = () => setPlan(pl => { delete pl.base; }, 'Basisplanning gewist.'));
    ($('#plTpl') || {}).onclick = () => plTemplates(R); ($('#plBestek') || {}).onclick = () => plBestekImport(R); ($('#plBegr') || {}).onclick = () => plBegrotingImport(R);
    tb.querySelector('#plResAdd') && plResWire(R);
  }
  tb.querySelectorAll('[data-att]').forEach(b => b.onclick = () => { const a = att[Number(b.dataset.att)]; if(!a?.ref) return; plSel = a.ref; const c = plCollapsed(); let p = by[a.ref]?.parent; while(p){ c.delete(p); p = by[p]?.parent; } plSetCollapsed(c); if(plView !== 'alles'){ plView = 'alles'; lsSet('lw-plView', plView); } tijdRefresh(); setTimeout(() => { const tr = $(`.pltb tr[data-ref="${CSS.escape(a.ref)}"]`); tr?.scrollIntoView({block:'center'}); }, 30); });
  ($('#attAll') || {}).onclick = () => { plAttAll = !plAttAll; tijdRefresh(); };
  $('#attCopy') && (($('#attCopy') || {}).onclick = async () => { const txt = att.map(a => a.todo || a.txt).join('\n'); try{ await navigator.clipboard.writeText(txt); toast(att.length + ' punten gekopieerd. Plak ze in Microsoft To Do: elke regel wordt een taak.'); }catch{ toast('Kopiëren lukte niet in deze weergave.'); } });
  $('#plAI') && (($('#plAI') || {}).onclick = () => plAskClaude(R));
  plBronWire(R, ro); plKoppelWire(R, ro); plDragWire(R, ro);
  $('#tabBody').querySelectorAll('details.menu .menuc button').forEach(b => b.addEventListener('click', () => { const d = b.closest('details'); if(d) d.open = false; }));
  if(!plWire.did){ plWire.did = true; setTimeout(toToday, 0); document.addEventListener('keydown', e => { if(S.view !== 'project' || S.tab !== 'tijd' || !S.canWrite || e.target.closest?.('input,textarea,select') || document.querySelector('.mdl')) return; const k = e.key.toLowerCase();
      if((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'y')){ e.preventDefault(); plUndo(k === 'y' || e.shiftKey); } }); document.addEventListener('keydown', e => { if(e.key === 'Escape' && S.tab === 'tijd' && plSel && !document.querySelector('.mdl') && !e.target.closest?.('input,textarea,select')){ plSel = ''; tijdRefresh(); } }); }
}
/* ---------- planning met de muis: balken slepen, duur trekken, koppelingen trekken, rechtsklikmenu ----------
   Uitgangspunt (Pieter): de koppelingen zijn belangrijker dan de datum. Slepen past daarom de wachtdagen van de koppeling aan,
   en alles wat erachter hangt schuift vanzelf mee. Een vaste datum is 'niet eerder dan'. */
let plGeo = null, plDrag = null;
function plUndo(redo){ const from = redo ? future : history, to = redo ? history : future; if(!from.length) return toast(redo ? 'Niets om opnieuw te doen.' : 'Niets om ongedaan te maken.'); to.push(JSON.stringify(P)); P = JSON.parse(from.pop()); changed(); tijdRefresh(); toast(redo ? 'Opnieuw gedaan.' : 'Ongedaan gemaakt.'); }
function toastUndo(msg){ toast(msg, 7000); const t = $('#toast'); if(!t) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'tundo'; b.textContent = 'Ongedaan maken'; b.onclick = () => { t.hidden = true; plUndo(false); }; t.append(' ', b); }
const refName = (ref, R) => ref.startsWith('W:') ? ref.slice(2) : ref.startsWith('H:') ? 'hoofdfase ' + ref.slice(2) : (R.by[ref]?.naam || '?');
function plPredPlain(p, R){ const l = p.l || 0, nm = refName(p.r, R);
  const lag = l ? (l > 0 ? ' + ' + l + ' wd' : ' − ' + (-l) + ' wd') : '';
  if(p.t === 'VB') return 'klaar vóór start van ' + nm + lag;
  if(p.t === 'BB') return 'tegelijk met start van ' + nm + lag;
  if(p.t === 'EE') return 'tegelijk klaar met ' + nm + lag;
  if(p.t === 'BE') return 'klaar na start van ' + nm + lag;
  return l < 0 ? 'na einde van ' + nm + ', met ' + (-l) + ' wd overlap' : 'na einde van ' + nm + lag; }
// waarom start deze werkgang/taak wanneer hij start, in gewone taal
function plReason(n, R){ const parts = [];
  if(n.type === 'wg' && !n.explicit){ const w = n.wacht || 0, lag = w > 0 ? ' + ' + w + ' wd' : w < 0 ? ', met ' + (-w) + ' wd overlap' : '';
    if(n.autoTxt === 'start uitvoering'){ if(!n.vast) parts.push('start van de uitvoering'); }
    else parts.push(n.autoTxt.startsWith('na H') ? 'na hoofdfase ' + n.autoTxt.slice(4) + lag : 'na einde van ' + n.autoTxt + ' (vorige werkgang)' + lag); }
  else for(const p of n.preds || []) parts.push(plPredPlain(p, R));
  if(n.vast) parts.push('niet eerder dan ' + fmtD(n.vast, true));
  if(n.snet && n.type !== 'wg') parts.push('niet eerder dan ' + fmtD(n.snet, true));
  return parts.join('; ') || 'start van het project'; }
// wat elke koppeling vraagt als startdag; de 'sturende' koppeling bepaalt nu de start
function plDemand(p, n, R){ const q = R.by[p.r]; if(!q || q.S === null || q.S === undefined) return null; const l = p.l || 0, D = isMile(n) ? 0 : n.duur;
  return p.t === 'BB' ? q.S + l : p.t === 'EE' ? q.E + l - D : p.t === 'BE' ? q.S + l - D : p.t === 'VB' ? q.S - l - D : q.E + l; }
function plDriving(n, R){ const ps = (n.preds || []).map(p => ({p, d:plDemand(p, n, R)})).filter(x => x.d !== null); if(!ps.length) return [];
  const vb = ps.filter(x => x.p.t === 'VB'), rest = ps.filter(x => x.p.t !== 'VB');
  if(n.jit && vb.length){ const m = Math.min(...vb.map(x => x.d)); return vb.filter(x => x.d === m).map(x => x.p); }
  if(!rest.length) return []; const m = Math.max(...rest.map(x => x.d)); return rest.filter(x => x.d === m).map(x => x.p); }
function plDependsOn(a, b, R){ const seen = new Set(), st = [a]; while(st.length){ const r = st.pop(); if(r === b) return true; if(seen.has(r)) continue; seen.add(r); const n = R.by[r]; if(!n) continue;
    for(const p of n.allPreds || n.preds || []) st.push(p.r); if(!['wg', 'taak', 'mijl', 'stop'].includes(n.type)) for(const k of R.nodes.filter(x => x.parent === r)) st.push(k.ref); } return false; }
// voorgangers van een werkgang als expliciete lijst (bij automatisch: alleen de sturende)
function plExplicitPreds(n, R){ if(n.explicit) return clone(n.preds || []); const dr = plDriving(n, R); return dr.length ? [{...clone(dr[0]), ...(n.wacht ? {l:n.wacht} : {})}] : []; }
function plWriteWgPreds(n, preds){ setWg(n.key, w => { if(preds === null){ delete w.preds; delete w.koppel; delete w.wacht; } else { w.preds = preds; delete w.koppel; delete w.wacht; } }); }
// verschuif start met d werkdagen; geeft een uitleg terug
function plShift(n, d, R){ if(!d) return null; const cal = R.cal, newDate = cal.ds(n.S + d);
  if(n.type === 'wg'){
    if(n.vast || !(n.allPreds || []).length){ setWg(n.key, w => { w.vast = newDate; }); return 'niet eerder dan ' + fmtD(newDate, true); }
    if(!n.explicit && !n.fromKoppel){ setWg(n.key, w => { const v = (n.wacht || 0) + d; if(v) w.wacht = v; else delete w.wacht; }); return null; }
    const dr = new Set(plDriving(n, R).map(p => p.r)), preds = clone(n.preds).map(p => dr.has(p.r) ? {...p, l:(p.l || 0) + (p.t === 'VB' ? -d : d)} : p).map(p => { if(!p.l) delete p.l; return p; });
    plWriteWgPreds(n, preds); return null; }
  if(!n.task) return null;
  setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); if(!t) return;
    if((t.preds || []).length){ const dr = new Set(plDriving(n, R).map(p => p.r)); t.preds = t.preds.map(p => dr.has(p.r) ? {...p, l:(p.l || 0) + (p.t === 'VB' ? -d : d)} : p).map(p => { if(!p.l) delete p.l; return p; }); }
    else { t.snet = newDate; delete t.deadline; } });
  return null; }
function plSetDuur(n, D){ D = Math.max(1, Math.min(2000, D)); if(n.type === 'wg') setWg(n.key, w => { w.duur = D; }); else if(n.task) setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); if(t) t.duur = D; }); }
function plAddLink(from, to, t, mode, R, l){ // mode: 'vervang' | 'erbij'; l = wachtdagen (negatief = overlap)
  if(from.ref === to.ref) return;
  if(plDependsOn(from.ref, to.ref, R)) return toast(`Kan niet: ${refName(from.ref, R)} wacht zelf al (via andere koppelingen) op ${refName(to.ref, R)}. Dat zou een kringetje worden.`);
  const link = {r:from.ref, t, ...(l ? {l} : {})};
  if(to.type === 'wg'){ const cur = mode === 'erbij' ? plExplicitPreds(to, R).filter(p => p.r !== from.ref) : []; plWriteWgPreds(to, [...cur, link]); }
  else if(to.task) setPlan(pl => { const t2 = pl.tasks.find(x => x.id === to.task.id); if(!t2) return; t2.preds = [...(mode === 'erbij' ? (t2.preds || []).filter(p => p.r !== from.ref) : []), link]; });
  plSel = to.ref; tijdRefresh();
  toastUndo(`${refName(to.ref, R)} start nu ${plPredPlain(link, R)}${mode === 'erbij' ? ' (extra koppeling)' : ''}. Alles erachter schuift mee.`); }
function plClearLinks(n, R){ if(n.type === 'wg'){ setWg(n.key, w => { delete w.preds; delete w.koppel; delete w.wacht; }); }
  else if(n.task) setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); if(t){ t.preds = []; } });
  tijdRefresh(); toastUndo(n.type === 'wg' ? `${n.key} volgt weer automatisch: na de vorige werkgang.` : 'Koppelingen gewist.'); }
// klein menuutje bij de muis
function plMenu(x, y, head, items){ plMenuClose(); const m = document.createElement('div'); m.id = 'plCtx'; m.className = 'ctx'; m.setAttribute('role', 'menu');
  m.innerHTML = `<div class="ctx-h">${head}</div>` + items.map((it, i) => it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-i="${i}" class="${it.cls || ''}">${esc(it.t)}</button>`).join('');
  document.body.appendChild(m); const r = m.getBoundingClientRect(); m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px'; m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
  m.querySelector('button')?.focus();
  m.onclick = e => { const b = e.target.closest('[data-i]'); if(!b) return; const it = items[Number(b.dataset.i)]; plMenuClose(); it.fn(); };
  m.onkeydown = e => { const bs = [...m.querySelectorAll('button')], i = bs.indexOf(document.activeElement); if(e.key === 'ArrowDown'){ e.preventDefault(); bs[(i + 1) % bs.length].focus(); } else if(e.key === 'ArrowUp'){ e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); } else if(e.key === 'Escape'){ e.stopPropagation(); plMenuClose(); } }; }
function plMenuClose(){ $('#plCtx')?.remove(); }
document.addEventListener('pointerdown', e => { if(!e.target.closest?.('#plCtx')) plMenuClose(); }, true);
// venster: koppeling kiezen met lijstjes in gewone taal
function plLinkDialog(n, R, preset){
  const opts = R.nodes.filter(q => q.ref !== n.ref && (['wg', 'taak', 'mijl', 'stop', 'hf'].includes(q.type)) && !plDependsOn(q.ref, n.ref, R));
  const label = q => q.type === 'wg' ? 'Werkgang ' + q.key + ' · ' + wgLabel(q) : q.type === 'hf' ? (q.naam || 'Hoofdfase') : q.naam;
  const cur = n.type === 'wg' && !n.explicit ? [] : (n.preds || []);
  const html = `<p class="muted" style="margin:0"><b>${esc(n.type === 'wg' ? 'Werkgang ' + n.key : n.naam)}</b> start nu: ${esc(plReason(n, R))}.</p>
    ${cur.length ? `<div class="stack" style="gap:4px">${cur.map((p, i) => `<div class="row tplr"><span style="flex:1">${esc(plPredPlain(p, R))}</span><button type="button" class="btn sm danger" data-lx="${i}">Weghalen</button></div>`).join('')}</div>` : ''}
    <div class="form" style="grid-template-columns:1fr 2fr 110px">
      <label class="l">Start<select class="f" id="lkT"><option value="EB">na einde van</option><option value="BB">tegelijk met start van</option><option value="EE">tegelijk klaar met</option><option value="VB">klaar vóór start van</option></select></label>
      <label class="l">Werkgang of taak<select class="f" id="lkR">${opts.map(q => `<option value="${q.ref}">${esc(label(q))}</option>`).join('')}</select></label>
      <label class="l">Wachtdagen<input class="f" id="lkL" type="number" value="0" min="-60" max="200" title="Negatief = overlap"></label></div>
    <label class="ck"><input type="checkbox" id="lkV" checked> In plaats van de huidige koppeling(en)</label>
    <p class="faint" style="margin:0;font-size:13px">Alles wat na deze ${n.type === 'wg' ? 'werkgang' : 'taak'} komt, schuift automatisch mee.</p>`;
  const ov = modal('Koppeling', html, {ok:'Toepassen', onOk:o => { const r = o.querySelector('#lkR').value, t = o.querySelector('#lkT').value, l = Math.round(Number(o.querySelector('#lkL').value) || 0), q = R.by[r]; if(!q) return;
    plAddLink(q, n, t, o.querySelector('#lkV').checked ? 'vervang' : 'erbij', R, l); }});
  if(preset) ov.querySelector('#lkT').value = preset;
  const prev = (n.preds || [])[0]?.r; if(prev && ov.querySelector(`#lkR option[value="${CSS.escape(prev)}"]`)) ov.querySelector('#lkR').value = prev;
  ov.querySelectorAll('[data-lx]').forEach(b => b.onclick = () => { const i = Number(b.dataset.lx), rest = cur.filter((_, k) => k !== i); ov.remove();
    if(n.type === 'wg') plWriteWgPreds(n, rest.length ? rest : null); else setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); if(t) t.preds = rest; });
    tijdRefresh(); toastUndo('Koppeling weggehaald.'); });
}
function plDateDialog(n, R){ const cur = n.type === 'wg' ? (n.vast || '') : (n.task?.snet || '');
  const ov = modal('Niet eerder dan', `<p class="muted" style="margin:0">De koppelingen gaan voor: loopt een voorganger uit, dan schuift ${n.type === 'wg' ? 'werkgang ' + esc(n.key) : 'deze taak'} later. Vóór deze datum begint hij nooit.</p><label class="l">Datum<input class="f" type="date" id="nedD" value="${cur || n.start || ''}"></label>${cur ? '<label class="ck"><input type="checkbox" id="nedX"> Datum weghalen</label>' : ''}`,
    {ok:'Toepassen', onOk:o => { const v = o.querySelector('#nedX')?.checked ? '' : o.querySelector('#nedD').value;
      if(n.type === 'wg') setWg(n.key, w => { if(v) w.vast = v; else delete w.vast; }); else setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); if(t){ if(v) t.snet = v; else delete t.snet; } });
      tijdRefresh(); toastUndo(v ? 'Niet eerder dan ' + fmtD(v, true) + '.' : 'Datum weggehaald; alleen de koppelingen tellen nog.'); }}); }
function plCtxFor(n, R, x, y){ if(!S.canWrite || !n) return; const isW = n.type === 'wg', nm = isW ? 'Werkgang ' + n.key : n.naam;
  plSel = n.ref; tijdRefresh();
  const items = [
    {t:'Start na einde van…', fn:() => plLinkDialog(n, R, 'EB')},
    {t:'Tegelijk met start van…', fn:() => plLinkDialog(n, R, 'BB')},
    {t:'Niet eerder dan datum…', fn:() => plDateDialog(n, R)},
    ...((isW ? n.explicit || n.wacht : (n.preds || []).length) ? [{t:isW ? 'Koppelingen wissen (weer na vorige werkgang)' : 'Koppelingen wissen', fn:() => plClearLinks(n, R)}] : []),
    '-',
    ...(isW ? [{t:'Toon in Fasering', fn:() => gotoStep(n.phase, n.step)}] : []),
    {t:'Details', fn:() => { plSel = n.ref; tijdRefresh(); }}];
  plMenu(x, y, `<b>${esc(nm)}</b><br><small>start: ${esc(plReason(n, R))}</small>`, items); }
// slepen
function plDateAtX(px){ const col = Math.round(px / plGeo.px), wk = Math.floor(col / 5), d = col - wk * 5; return plGeo.a + (wk * 7 + d) * DAY; }
function plDragWire(R, ro){
  const body = $('.plgb svg'); if(!body) return;
  body.querySelectorAll('.gbar.mov').forEach(g => { g.addEventListener('mouseenter', () => body.querySelectorAll(`.glink[data-la="${CSS.escape(g.dataset.ref)}"],.glink[data-lb="${CSS.escape(g.dataset.ref)}"]`).forEach(l => l.classList.add('hov')));
    g.addEventListener('mouseleave', () => body.querySelectorAll('.glink.hov').forEach(l => l.classList.remove('hov'))); });
  const tb = $('#tabBody');
  tb.querySelectorAll('.plgb .gbar, .pltb tr[data-ref]').forEach(el => el.addEventListener('contextmenu', e => { const n = R.by[el.dataset.ref]; if(ro || !n || !['wg', 'taak', 'mijl', 'stop'].includes(n.type)) return; e.preventDefault(); plCtxFor(n, R, e.clientX, e.clientY); }));
  if(ro || !plGeo) return;
  body.addEventListener('pointerdown', e => { if(e.button > 0) return; const g = e.target.closest('.gbar.mov'); if(!g) return; const n = R.by[g.dataset.ref]; if(!n || n.S === null) return;
    const mode = e.target.classList.contains('gdot') ? 'link' : e.target.classList.contains('gh-l') ? 'l' : e.target.classList.contains('gh-r') ? 'r' : 'mv';
    const pt = body.getBoundingClientRect();
    plDrag = {n, mode, g, x0:e.clientX, y0:e.clientY, moved:false, left:pt.left, top:pt.top, bx0:plGeo.x(tOf(n.start)), bx1:plGeo.x(tOf(n.eind)) + plGeo.px};
    try{ body.setPointerCapture(e.pointerId); }catch{} e.preventDefault(); });
  body.addEventListener('pointermove', e => { const d = plDrag; if(!d) return; const dx = e.clientX - d.x0;
    if(!d.moved && Math.hypot(dx, e.clientY - d.y0) < 4) return; if(!d.moved){ d.moved = true; document.body.classList.add('pldragging'); }
    const rowH = 28, y = Math.floor((d.y0 - d.top) / rowH) * rowH;
    let ghost = body.querySelector('#plGhost'); if(!ghost){ ghost = document.createElementNS(NS, 'g'); ghost.id = 'plGhost'; body.appendChild(ghost); }
    if(d.mode === 'link'){ const sx = d.bx1 + 6, sy = y + rowH / 2, ex = e.clientX - d.left, ey = e.clientY - d.top;
      const tgt = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.plgb .gbar.mov'); body.querySelectorAll('.gbar.lktgt').forEach(x => x.classList.remove('lktgt')); if(tgt && tgt !== d.g) tgt.classList.add('lktgt');
      ghost.innerHTML = `<path d="M${sx} ${sy}L${ex} ${ey}" class="glink lkdraw" marker-end="url(#arr)"/>`; d.tgt = tgt && tgt !== d.g ? tgt.dataset.ref : null; return; }
    const step = Math.round(dx / plGeo.px) * plGeo.px; let a0 = d.bx0, a1 = d.bx1;
    if(d.mode === 'mv'){ a0 += step; a1 += step; } else if(d.mode === 'r') a1 = Math.max(a0 + plGeo.px, a1 + step); else a0 = Math.min(a1 - plGeo.px, a0 + step);
    const s0 = plDateAtX(a0), s1 = plDateAtX(a1) - DAY, cal = R.cal, S0 = cal.idx(s0), E1 = cal.idx(s1 + DAY);
    d.newS = S0; d.newE = Math.max(S0 + 1, E1);
    const txt = d.mode === 'mv' ? `${fmtD(cal.ds(S0))} – ${fmtD(cal.ds(d.newE - 1))}` : `${d.newE - S0} wd · ${fmtD(cal.ds(S0))} – ${fmtD(cal.ds(d.newE - 1))}`;
    ghost.innerHTML = `<rect x="${a0}" y="${y + 3}" width="${Math.max(4, a1 - a0)}" height="${rowH - 6}" class="gghost"/><text x="${a1 + 6}" y="${y + rowH / 2 + 4}" class="gghostt">${esc(txt)}</text>`; });
  const up = e => { const d = plDrag; if(!d) return; plDrag = null; document.body.classList.remove('pldragging'); body.querySelector('#plGhost')?.remove(); body.querySelectorAll('.gbar.lktgt').forEach(x => x.classList.remove('lktgt'));
    const n = d.n; if(!d.moved){ if(plSel !== n.ref){ plSel = n.ref; tijdRefresh(); } return; }
    if(d.mode === 'link'){ const to = d.tgt && R.by[d.tgt]; if(!to) return;
      const hasLinks = to.type === 'wg' ? (to.explicit || to.wacht) : (to.preds || []).length, nmTo = refName(to.ref, R), nmFrom = refName(n.ref, R);
      const go = mode => plAddLink(n, to, 'EB', mode, R);
      if(!hasLinks && to.type !== 'wg') return go('vervang');
      return plMenu(e.clientX, e.clientY, `<b>${esc(nmTo)}</b> start na einde van <b>${esc(nmFrom)}</b><br><small>nu: ${esc(plReason(to, R))}</small>`,
        [{t:'In plaats van de huidige koppeling', fn:() => go('vervang')}, {t:'Als extra koppeling (wacht op allebei)', fn:() => go('erbij')}, {t:'Tegelijk met start van ' + nmFrom, fn:() => plAddLink(n, to, 'BB', 'vervang', R)}]); }
    const was = {S:n.S, E:n.E}, nm = n.type === 'wg' ? n.key : n.naam;
    if(d.mode === 'mv'){ const dd = d.newS - n.S; if(!dd) return; const note = plShift(n, dd, R); tijdRefresh(); plAfterMove(n.ref, d.newS, was, nm, note); }
    else if(d.mode === 'r'){ const D = d.newE - n.S; if(D === n.duur) return; plSetDuur(n, D); tijdRefresh(); toastUndo(`${nm} duurt nu ${Math.max(1, D)} werkdagen. Alles erachter schuift mee.`); }
    else { const dd = d.newS - n.S; if(!dd) return; const D = n.duur - dd, h0 = history.length; plSetDuur(n, D); const R2 = planCompute(), n2 = R2.by[n.ref]; plShift(n2, dd, R2); history.splice(h0 + 1); tijdRefresh(); plAfterMove(n.ref, d.newS, was, nm, null); } };
  body.addEventListener('pointerup', up); body.addEventListener('pointercancel', () => { plDrag = null; document.body.classList.remove('pldragging'); body.querySelector('#plGhost')?.remove(); });
}
function plAfterMove(ref, want, was, nm, note){ const R2 = planCompute(), n2 = R2.by[ref]; if(!n2) return;
  if(n2.S !== want){ const dr = plDriving(n2, R2).map(p => refName(p.r, R2)); toastUndo(`${nm} kan niet eerder dan ${fmtD(n2.start)}: hij wacht ook op ${dr.join(', ') || 'een andere koppeling'}. Pas die koppeling aan via rechtsklik.`); return; }
  const d = n2.S - was.S; toastUndo(`${nm} ${d > 0 ? d + ' werkdag' + (d === 1 ? '' : 'en') + ' later' : -d + ' werkdag' + (d === -1 ? '' : 'en') + ' eerder'}: start nu ${plReason(n2, R2)}. Alles erachter schuift mee.`); }
// vanuit de Fasering naar een werkgang in de Planning springen
function gotoPlan(ref){ if(!finish(false)) return; stop(); S.tab = 'tijd'; plSub = 'planning'; lsSet('lw-plSub', plSub); plSel = ref; if(plView !== 'alles'){ plView = 'alles'; lsSet('lw-plView', plView); }
  const R = planCompute(), c = plCollapsed(); let p = R.by[ref]?.parent; while(p){ c.delete(p); p = R.by[p]?.parent; } plSetCollapsed(c); renderProject();
  setTimeout(() => $(`.pltb tr[data-ref="${CSS.escape(ref)}"]`)?.scrollIntoView({block:'center'}), 60); }
// kolommen 'Volgt op', 'Relatie' en 'Vertraging': keuzelijstjes in plaats van MS Project-tekst. De eerste koppeling is hier te bewerken; meer via rechtsklik.
const REL_OPT = [['EB', 'volgend op'], ['BB', 'gelijk beginnen'], ['EE', 'gelijk eindigen'], ['VB', 'klaar vóór start'], ['BE', 'klaar na start']];
function plPredOptions(n, R){ if(plPredOptions.sig !== R){ plPredOptions.sig = R; plPredOptions.c = {}; } const c = plPredOptions.c; if(c[n.ref]) return c[n.ref];
  return c[n.ref] = R.nodes.filter(q => q.ref !== n.ref && ['wg', 'taak', 'mijl', 'stop', 'hf'].includes(q.type) && !plDependsOn(q.ref, n.ref, R)); }
function plPredCells(n, R, canEdit){
  const auto = n.type === 'wg' && !n.explicit, ps = auto ? [] : (n.preds || []), p0 = ps[0], more = Math.max(0, ps.length - 1);
  const lag = auto ? (n.wacht || 0) : (p0?.l || 0), t = auto ? 'EB' : (p0?.t || 'EB');
  const at = n.autoTxt || '', autoLbl = n.type === 'wg' ? (!at ? 'automatisch' : at === 'start uitvoering' ? 'start (auto)' : at.startsWith('na H') ? 'H' + at.slice(4) + ' (auto)' : at + ' (auto)') : '— geen —';
  const lbl = q => q.type === 'wg' ? q.key : q.type === 'hf' ? (q.naam || 'Hoofdfase') : q.nr + ' · ' + q.naam;
  if(!canEdit){ const txt = auto ? autoLbl.replace(' (auto)', '') : p0 ? refName(p0.r, R) + (more ? ' +' + more : '') : ''; return `<td>${esc(txt)}</td><td>${p0 || auto ? esc((REL_OPT.find(o => o[0] === t) || REL_OPT[0])[1]) : ''}</td><td class="num">${lag ? lag + ' wd' : ''}</td>`; }
  const opts = plPredOptions(n, R), cur = p0?.r || '';
  const sel = `<select class="f cell" data-pf="pr" aria-label="Volgt op" title="${esc(plReason(n, R))}${more ? ' (en ' + more + ' koppeling' + (more > 1 ? 'en' : '') + ' meer: rechtsklik)' : ''}"><option value="" ${cur ? '' : 'selected'}>${esc(autoLbl)}</option>${opts.map(q => `<option value="${q.ref}" ${q.ref === cur ? 'selected' : ''}>${esc(lbl(q))}</option>`).join('')}</select>${more ? `<span class="pmore" title="Nog ${more} koppeling${more > 1 ? 'en' : ''}; rechtsklik voor alles">+${more}</span>` : ''}`;
  const rel = `<select class="f cell" data-pf="prt" aria-label="Relatie" ${!p0 && !(auto && at !== 'start uitvoering') ? 'disabled' : ''}>${REL_OPT.map(([k, l]) => `<option value="${k}" ${k === t ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const lg = `<input class="f cell n" type="number" min="-200" max="200" data-pf="prl" value="${lag}" title="Vertraging in werkdagen; negatief = overlap" ${!p0 && !(auto && at !== 'start uitvoering') ? 'disabled' : ''}>`;
  return `<td><div class="prc">${sel}</div></td><td>${rel}</td><td>${lg}</td>`; }
function plSetFirstPred(n, f, v, R){
  const auto = n.type === 'wg' && !n.explicit;
  if(f === 'prl' && auto){ const l = Math.round(Number(v) || 0); setWg(n.key, w => { if(l) w.wacht = l; else delete w.wacht; }); return; }
  let ps = n.type === 'wg' ? plExplicitPreds(n, R) : clone(n.preds || []);
  if(f === 'pr'){ if(!v){ if(n.type === 'wg') return plClearLinks(n, R); ps = ps.slice(1); }
    else { const p0 = ps[0] || {t:'EB'}; ps = [{...p0, r:v}, ...ps.slice(1).filter(p => p.r !== v)]; } }
  else { if(!ps.length) return; if(f === 'prt') ps[0] = {...ps[0], t:v}; else { const l = Math.round(Number(v) || 0); ps[0] = {...ps[0]}; if(l) ps[0].l = l; else delete ps[0].l; } }
  if(n.type === 'wg') plWriteWgPreds(n, ps); else if(n.task) setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); if(t) t.preds = ps; });
  tijdRefresh(); }
