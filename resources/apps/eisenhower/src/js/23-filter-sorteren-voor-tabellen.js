/* ---------- filter + sorteren voor tabellen ---------- */
function tblCtl(id, list, o){
  S.tf ||= {}; const f = S.tf[id] ||= {q:'', f:{}, sort:null, dir:1};
  const opts = (o.filters || []).map(fl => ({...fl, list:[...new Set(list.map(fl.v).filter(v => v !== '' && v != null))].sort((a, b) => String(a).localeCompare(String(b), 'nl', {numeric:true}))}));
  let rows = list.filter(x => opts.every(fl => !f.f[fl.k] || fl.v(x) === f.f[fl.k]));
  const col = o.cols.find(c => c[0] && c[0] === f.sort);
  rows = col ? [...rows].sort((a, b) => { const va = col[2](a), vb = col[2](b); if(!va !== !vb) return va ? -1 : 1; return f.dir * String(va).localeCompare(String(vb), 'nl', {numeric:true}) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}); }) : (o.sort ? [...rows].sort(o.sort) : rows);
  const actief = f.q || Object.values(f.f).some(Boolean) || f.sort;
  const tools = `<div class="toolbar tfbar" data-tf="${id}"><input class="f" type="search" data-tfq="${id}" placeholder="${esc(o.ph || 'Zoek op werkorder of omschrijving')}" value="${esc(f.q)}" style="max-width:260px">
    ${opts.map(fl => `<select class="f" data-tff="${id}" data-k="${fl.k}" style="max-width:220px"><option value="">${esc(fl.leeg)}</option>${fl.list.map(v => `<option value="${esc(v)}" ${f.f[fl.k] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`).join('')}
    ${actief ? `<button class="btn sm ghost" type="button" data-tfreset="${id}">Filters wissen</button>` : ''}<span class="spacer"></span><span class="hint" data-tfcnt="${id}">${rows.length} van ${list.length}</span></div>`;
  const thead = `<thead><tr>${o.cols.map(c => c[0] ? `<th><button type="button" class="thsort" data-tfsort="${id}" data-k="${c[0]}" aria-sort="${f.sort === c[0] ? (f.dir > 0 ? 'ascending' : 'descending') : 'none'}">${c[1]}${f.sort === c[0] ? (f.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>` : `<th>${c[1]}</th>`).join('')}</tr></thead>`;
  const tr = (x, html) => html.replace('<tr ', `<tr data-zoek="${esc(o.zoek(x).toLowerCase())}" `);
  return {tools, thead, rows, tr, total:list.length};
}
function tfZoek(id){ const f = S.tf?.[id]; if(!f) return; const q = f.q.trim().toLowerCase(); const trs = [...document.querySelectorAll(`[data-tfbody="${id}"] tbody tr[data-zoek]`)]; let n = 0;
  trs.forEach(tr => { const ok = !q || q.split(/\s+/).every(w => tr.dataset.zoek.includes(w)); tr.hidden = !ok; if(ok) n++; });
  const c = document.querySelector(`[data-tfcnt="${id}"]`); if(c) c.textContent = c.textContent.replace(/^\d+/, n); }
function wireTf(m){
  m.querySelectorAll('[data-tfq]').forEach(i => { i.oninput = () => { S.tf[i.dataset.tfq].q = i.value; tfZoek(i.dataset.tfq); }; tfZoek(i.dataset.tfq); });
  m.querySelectorAll('[data-tff]').forEach(sl => sl.onchange = () => { S.tf[sl.dataset.tff].f[sl.dataset.k] = sl.value; render(); });
  m.querySelectorAll('[data-tfreset]').forEach(b => b.onclick = () => { S.tf[b.dataset.tfreset] = {q:'', f:{}, sort:null, dir:1}; render(); });
  m.querySelectorAll('[data-tfsort]').forEach(b => b.onclick = () => { const f = S.tf[b.dataset.tfsort], k = b.dataset.k;
    if(f.sort !== k){ f.sort = k; f.dir = 1; } else if(f.dir > 0) f.dir = -1; else { f.sort = null; f.dir = 1; } render(); });
}
function renderOffPage(P){
  const all = P.filter(x => x.i.fase === 'offerte');
  const t = tblCtl('off', all, {zoek:x => x.p.code + ' ' + x.p.oms + ' ' + (x.p.opdrachtgever || ''), ph:'Zoek op werkorder, omschrijving of opdrachtgever',
    sort:(a, b) => a.i.n - b.i.n || String(a.p.faseSinds).localeCompare(String(b.p.faseSinds)) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}),
    filters:[{k:'st', leeg:'Alle statussen', v:x => statusKort(x.p.status)}, {k:'og', leeg:'Alle opdrachtgevers', v:x => x.p.opdrachtgever || ''}],
    cols:[['code', 'Werkorder', x => x.p.code], ['oms', 'Omschrijving', x => x.p.oms], ['st', 'Status', x => String(x.i.n).padStart(2, '0')], ['og', 'Opdrachtgever', x => x.p.opdrachtgever || ''], ['wvb', 'Wvb', x => firstName(x.p.wvb) || ''], ['sinds', 'Sinds', x => x.p.faseSinds || '']]});
  return `<section class="pagehead"><h2>Offertes</h2><span class="muted">Nog niet gegund. Staat een offerte lang stil, dan zie je dat bij "Sinds".</span></section>${t.tools}
    <div class="tblwrap"><table class="tbl" data-tfbody="off">${t.thead}<tbody>
    ${t.rows.map(x => t.tr(x, `<tr data-proj="${esc(x.p.code)}"><td class="mono">${esc(x.p.code)}</td><td class="om">${esc(x.p.oms)}</td><td>${esc(statusKort(x.p.status))}</td><td>${esc(x.p.opdrachtgever || '')}</td><td>${esc(firstName(x.p.wvb) || '–')}</td><td>${x.p.faseSinds ? esc(fD(x.p.faseSinds.slice(0, 10))) + ` <span class="faint">(${daysSince(x.p.faseSinds)} d)</span>` : ''}</td></tr>`)).join('') || '<tr><td colspan="6" class="faint">Geen offertes met deze filters.</td></tr>'}</tbody></table></div>`;
}
function renderVoorbPage(P, sigCodes){
  const list0 = P.filter(x => x.i.fase === 'voorb'); const vsort = (a, b) => { if(!!a.p.geenPlanning !== !!b.p.geenPlanning) return a.p.geenPlanning ? 1 : -1;
    if(a.i.start && b.i.start && a.i.start !== b.i.start) return a.i.start < b.i.start ? -1 : 1; if(!a.i.start !== !b.i.start) return a.i.start ? -1 : 1; return a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}); };
  const pl0 = x => [...new Set(x.i.items.map(it => ploegOf(it.ploeg)?.naam).filter(Boolean))].join(', ');
  const wachtSt = x => !x.p.wacht?.op ? 'Wacht nergens op' : x.p.wacht.tot && x.i.start && x.p.wacht.tot >= x.i.start ? 'Kritiek pad' : 'Wacht ergens op';
  const t = tblCtl('voorb', list0, {zoek:x => x.p.code + ' ' + x.p.oms + ' ' + (x.p.wacht?.op || ''), sort:vsort,
    filters:[{k:'pl', leeg:'Alle ploegen', v:x => pl0(x) || (x.p.geenPlanning ? '' : 'Niet ingepland')}, {k:'vb', leeg:'Alle voorbereiding', v:x => x.p.geenPlanning ? '' : VB[x.i.vb]}, {k:'w', leeg:'Wacht op: alles', v:wachtSt}],
    cols:[['code', 'Werkorder', x => x.p.code], ['oms', 'Omschrijving', x => x.p.oms], ['start', 'Start', x => x.i.start || ''], ['pl', 'Ploeg', pl0], ['wvb', 'Wvb', x => firstName(x.p.wvb) || ''], ['w', 'Wacht op', x => x.p.wacht?.op || ''], ['vb', 'Voorbereiding', x => x.p.geenPlanning ? '' : {niet:1, bezig:2, gereed:3}[x.i.vb]]]});
  const list = t.rows;
  const c = {niet:0, bezig:0, gereed:0}; list0.forEach(x => { if(!x.p.geenPlanning) c[x.i.vb]++; });
  const soon = R.days[Math.min((R.idx.get(TODAYISO) ?? 0) + 10, R.days.length - 1)];
  const row = x => { const pl = x.i.items.map(it => ploegOf(it.ploeg)?.naam).filter(Boolean); const lvl = sigCodes.get(x.p.code);
    const urgent = x.i.start && x.i.start <= soon && x.i.vb !== 'gereed' && !x.p.geenPlanning;
    return t.tr(x, `<tr class="${urgent ? 'urg' : ''}" data-proj="${esc(x.p.code)}"><td class="mono">${esc(x.p.code)}</td><td class="om">${esc(x.p.oms)}</td>
      <td>${x.p.geenPlanning ? '<span class="faint">geen buitenwerk</span>' : x.i.start ? `<b>${esc(fWD(x.i.start))}</b>` : `<span class="warnt">niet ingepland</span>`}${x.p.nietVoor ? `<br><span class="${x.i.start && x.i.start < x.p.nietVoor ? 'kp' : 'faint'}" style="font-size:12.5px">niet vóór ${esc(fD(x.p.nietVoor))}</span>` : ''}</td>
      <td>${esc([...new Set(pl)].join(', ') || '–')}</td><td title="${esc(x.p.wvb || '')}">${esc(firstName(x.p.wvb) || '–')}</td>
      <td>${x.p.wacht?.op ? `<span class="${x.p.wacht.tot && x.i.start && x.p.wacht.tot >= x.i.start ? 'kp' : 'wt'}">${esc(x.p.wacht.op)}${x.p.wacht.tot ? ' · ' + esc(fD(x.p.wacht.tot)) : ''}</span>` : '<span class="faint">–</span>'}</td>
      <td>${x.p.geenPlanning ? '' : `<span class="vbd vb-${x.i.vb}" data-vbcycle="${esc(x.p.code)}" title="${S.canWrite ? 'Klik om te wijzigen' : ''}">${VB[x.i.vb]}</span>`}</td></tr>`); };
  return `<section class="pagehead"><h2>Voorbereiding</h2><span class="muted">Werk dat binnen is en nog moet starten. Bovenaan wat het eerst begint.</span>
      <span class="spacer"></span><span class="vbd vb-niet">${c.niet} niet gestart</span><span class="vbd vb-bezig">${c.bezig} bezig</span><span class="vbd vb-gereed">${c.gereed} gereed</span></section>
    ${t.tools}<div class="tblwrap"><table class="tbl" data-tfbody="voorb">${t.thead}<tbody>${list.map(row).join('') || `<tr><td colspan="7" class="faint">${list0.length ? 'Geen projecten met deze filters.' : 'Geen werk in voorbereiding.'}</td></tr>`}</tbody></table></div>`;
}
function renderArchief(flt){
  const al = adminList();
  const all = S.projecten.filter(p => !flt || p.wvb === flt).map(p => ({p, i:projInfo(p)})).map(x => {
    if(x.p.actief === false) return {...x, reden:'Niet meer in IW-lijst', sinds:x.p.weg || x.p.laatstGezien || ''};
    if(x.i.fase === 'vervallen') return {...x, reden:'Vervallen', sinds:x.p.faseOp || x.p.faseSinds || ''};
    if(x.i.fase === 'gereed' && adminInfo(x.p).open.length === 0) return {...x, reden:'Afgerond', sinds:x.p.faseSinds || ''};
    return null; }).filter(Boolean);
  const t = tblCtl('arch', all, {zoek:x => x.p.code + ' ' + x.p.oms + ' ' + (x.p.opdrachtgever || ''), ph:'Zoek op werkorder, omschrijving of opdrachtgever',
    sort:(a, b) => String(b.sinds).localeCompare(String(a.sinds)) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}),
    filters:[{k:'r', leeg:'Alles', v:x => x.reden}, {k:'og', leeg:'Alle opdrachtgevers', v:x => x.p.opdrachtgever || ''}],
    cols:[['code', 'Werkorder', x => x.p.code], ['oms', 'Omschrijving', x => x.p.oms], ['r', 'Archief', x => x.reden], ['og', 'Opdrachtgever', x => x.p.opdrachtgever || ''], ['wvb', 'Wvb', x => firstName(x.p.wvb) || ''], ['sinds', 'Sinds', x => x.sinds]]});
  const cls = {'Afgerond':'vb-gereed', 'Vervallen':'vb-niet', 'Niet meer in IW-lijst':'vb-bezig'};
  return `<section class="pagehead"><h2>Archief</h2><span class="muted">Afgeronde en vervallen werken, en werkorders die niet meer in de IW-lijst staan. Klik een project open om het terug te halen.</span></section>${t.tools}
    <div class="tblwrap"><table class="tbl" data-tfbody="arch">${t.thead}<tbody>
    ${t.rows.map(x => t.tr(x, `<tr data-proj="${esc(x.p.code)}"><td class="mono">${esc(x.p.code)}</td><td class="om">${esc(x.p.oms)}</td><td><span class="vbd ${cls[x.reden]}">${esc(x.reden)}</span></td><td>${esc(x.p.opdrachtgever || '')}</td><td>${esc(firstName(x.p.wvb) || '–')}</td><td>${x.sinds ? esc(fD(String(x.sinds).slice(0, 10))) : ''}</td></tr>`)).join('') || `<tr><td colspan="6" class="faint">${all.length ? 'Niets met deze filters.' : 'Het archief is nog leeg.'}</td></tr>`}</tbody></table></div>`;
}
function renderGereedPage(P, sigCodes){
  const al = adminList();
  const list = P.filter(x => x.i.fase === 'gereed').map(x => ({...x, a:adminInfo(x.p)}));
  const open = list.filter(x => x.a.done < x.a.total).sort((a, b) => String(a.p.faseSinds).localeCompare(String(b.p.faseSinds)) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}));
  const klaar = list.filter(x => x.a.done >= x.a.total);
  const row = x => `<tr data-proj="${esc(x.p.code)}"><td class="mono">${esc(x.p.code)}</td><td class="om">${esc(x.p.oms)}</td><td>${esc(firstName(x.p.wvb) || '–')}</td><td>${x.p.faseSinds ? esc(fD(x.p.faseSinds.slice(0, 10))) + ` <span class="faint">(${daysSince(x.p.faseSinds)} d)</span>` : ''}</td>
    <td><span class="admchips">${al.map(k => `<span class="adm adm-${admState(x.p, k)}" data-admtog="${esc(x.p.code)}" data-adm="${esc(k)}" title="${({nvt:'Niet van toepassing', open:'Van toepassing, nog te doen', gereed:'Gereed'})[admState(x.p, k)]}${S.canWrite ? ' · klik om te wijzigen' : ''}">${esc(k)}</span>`).join('')}</span></td></tr>`;
  return `<section class="pagehead"><h2>Afronding</h2><span class="muted">Technisch gereed. Klik een punt 1× als het van toepassing is (○), 2× als het gereed is (✓), 3× om het weer uit te zetten. Is alles wat van toepassing is gereed, dan verhuist het project naar "Afgerond".</span></section>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Werkorder</th><th>Omschrijving</th><th>Wvb</th><th>Gereed sinds</th><th>Administratief afronden</th></tr></thead><tbody>${open.map(row).join('') || '<tr><td colspan="5" class="faint">Alles is administratief afgerond.</td></tr>'}</tbody></table></div>
    <p class="hint" style="margin:8px 0 0">${klaar.length ? `${klaar.length} ${klaar.length === 1 ? 'afgerond project staat' : 'afgeronde projecten staan'} in het <button class="linkbtn" type="button" data-gotab="archief">Archief</button>.` : 'Afgeronde projecten gaan naar het Archief.'}</p>`;
}
const COL_MAX = 8;
const VB = {niet:'Niet gestart', bezig:'Bezig', gereed:'Gereed'};
const VB_NEXT = {niet:'bezig', bezig:'gereed', gereed:'niet'};
function colBody(key, list, sigCodes){
  if(!list.length) return '<span class="hint">Geen projecten.</span>';
  // groepeer werkorders met hetzelfde basisnummer
  const groups = []; const byBase = new Map();
  for(const x of list){ const b = baseOf(x.p.code); if(byBase.has(b)) byBase.get(b).items.push(x); else { const g = {base:b, items:[x]}; byBase.set(b, g); groups.push(g); } }
  const open = S.colOpen?.[key]; const shown = open ? groups : groups.slice(0, COL_MAX);
  let h = shown.map(g => { if(g.items.length === 1) return card2(g.items[0], sigCodes.get(g.items[0].p.code));
    const lvl = g.items.map(x => sigCodes.get(x.p.code)).find(Boolean); const gOpen = S.grpOpen?.[key + g.base];
    return `<details class="c2g ${lvl ? 's-' + lvl : ''}" data-grp="${esc(key + g.base)}" ${gOpen ? 'open' : ''}><summary><span class="cc">${esc(g.base)}</span><span class="co">${esc(g.items[0].p.oms)}</span><span class="cm">${g.items.length} werkorders</span></summary>${g.items.map(x => card2(x, sigCodes.get(x.p.code))).join('')}</details>`; }).join('');
  if(groups.length > COL_MAX) h += `<button class="btn ghost sm colmore" type="button" data-colmore="${key}">${open ? 'Minder tonen' : `+ ${groups.length - COL_MAX} meer`}</button>`;
  return h;
}
function card2(x, lvl){
  const p = x.p, i = x.i;
  const when = (i.fase === 'offerte' || i.fase === 'vervallen') ? statusKort(p.status) : i.start ? (i.start > TODAYISO ? 'start ' + fD(i.start) : 'tot ' + fD(i.eind)) : (p.geenPlanning ? 'geen buitenwerk' : 'niet ingepland');
  const showCheck = i.fase === 'voorb' && !p.geenPlanning;
  const ini = p.wvb ? p.wvb.split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('') : '';
  return `<button type="button" class="c2 ${lvl ? 's-' + lvl : ''}" data-proj="${esc(p.code)}" draggable="${S.canWrite}" title="${esc(p.code + ' ' + p.oms + ' · ' + when + (p.wvb ? ' · ' + p.wvb : ''))}"><span class="cc">${esc(p.code)}</span><span class="co">${esc(p.oms)}</span>
    <span class="cm">${showCheck ? `<span class="vbd vb-${i.vb}" data-vbcycle="${esc(p.code)}" title="Voorbereiding: ${VB[i.vb]}${S.canWrite ? ' (klik om te wijzigen)' : ''}">${VB[i.vb]}</span>` : ''}<span>${esc(when)}</span>${ini ? `<span class="ini">${esc(ini)}</span>` : ''}</span></button>`;
}
