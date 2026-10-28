/* ---------- ondersteuning: aandachtslijst, uitvoerders, bronnen (bestek/begroting), standaardtaken, Claude ---------- */
function planAttention(R){
  const {nodes, cal} = R, today = iso(Date.now()), tI = cal.idx(tOf(today)), out = [], pl = planOf();
  const nm = n => n.type === 'wg' ? 'werkgang ' + n.key : n.naam;
  const wdTxt = d => d === 0 ? 'vandaag' : d === 1 ? 'morgen' : d < 0 ? Math.abs(d) + ' wd geleden' : 'over ' + d + ' wd';
  // stoppunten
  for(const n of nodes.filter(n => n.type === 'stop')){ const st = n.stop || {};
    if(!n.start){ out.push({lvl:'info', ref:n.ref, txt:`Stoppunt "${n.naam}" hangt nog niet aan werk: geef een voorganger op (bijv. de werkgang waarin het valt).`}); continue; }
    if(st.status === 'vrij') continue;
    const meldI = n.S - (st.meld ?? 2), d = meldI - tI;
    if(st.status !== 'gemeld' && d <= 10) out.push({lvl:d < 0 ? 'hoog' : d <= 3 ? 'middel' : 'info', ref:n.ref, when:fmtD(cal.ds(Math.max(meldI, 0))), txt:`Stoppunt "${n.naam}" aanmelden bij ${st.keurder || 'de directie'} (${st.meld ?? 2} wd vooraf) – ${d < 0 ? 'had al gemeld moeten zijn' : wdTxt(d)}`, todo:`Stoppunt ${n.naam} aanmelden bij ${st.keurder || 'directie'} uiterlijk ${fmtD(cal.ds(Math.max(meldI, 0)), true)}`});
    else if(n.S < tI) out.push({lvl:'hoog', ref:n.ref, when:fmtD(n.start), txt:`Stoppunt "${n.naam}" is nog niet vrijgegeven; het werk erna mag pas door na vrijgave.`, todo:`Vrijgave stoppunt ${n.naam} regelen`}); }
  // achterstand en starts
  for(const n of nodes.filter(n => ['wg', 'taak', 'mijl'].includes(n.type) && n.start)){ const pct = n.pct || 0;
    if(pct < 100 && n.E <= tI) out.push({late:n.type !== 'wg', nm:nm(n), lvl:n.crit ? 'hoog' : 'middel', ref:n.ref, when:fmtD(n.eind), txt:`${nm(n)} had klaar moeten zijn (${pct}% gereed)${n.crit ? ' – ligt op het kritieke pad' : ''}. Vul de voortgang in of pas de planning aan.`, todo:`Voortgang ${nm(n)} bijwerken of opnieuw plannen`});
    else if(pct === 0 && n.S < tI && n.type !== 'mijl') out.push({late:n.type !== 'wg', nm:nm(n), lvl:'middel', ref:n.ref, when:fmtD(n.start), txt:`${nm(n)} had al gestart moeten zijn (0% gereed).`, todo:`Start ${nm(n)} controleren`});
    else if(n.type !== 'wg' && pct === 0 && n.S >= tI && n.S - tI <= 10) out.push({lvl:n.S - tI <= 3 ? 'middel' : 'info', ref:n.ref, when:fmtD(n.start), txt:`${n.type === 'mijl' ? 'Mijlpaal' : 'Start'} ${n.naam}${n.partij ? ' (' + n.partij + ')' : ''}${n.wie ? ' – ' + n.wie : ''} ${wdTxt(n.S - tI)}`, todo:`${n.naam}${n.partij ? ' (' + n.partij + ')' : ''} – ${fmtD(n.start, true)}`}); }
  // contractdata (mijlpaal met 'niet eerder dan' die door voorgangers later uitvalt)
  for(const n of nodes.filter(n => n.type === 'mijl' && n.task?.deadline && n.start)){ const dl = cal.idx(tOf(n.task.deadline)), lim = n.S - dl;
    if(lim > 0) out.push({lvl:'hoog', ref:n.ref, when:fmtD(n.task.deadline), txt:`${n.naam}: volgens de planning ${lim} wd te laat (${fmtD(n.start, true)} i.p.v. ${fmtD(n.task.deadline, true)}).${R.cfg.start && n.task.deadline < R.cfg.start ? ' De contractdatum ligt vóór de start van de uitvoering: controleer het bestek (tikfout?).' : ''}`, todo:`Planning ${n.naam} terugbrengen naar ${fmtD(n.task.deadline, true)}`}); }
  // uitvoerders dubbel
  for(const r of pl.res){ const days = new Map(); for(const n of nodes.filter(n => n.start && n.wd && (n.res || []).includes(r.id))) for(let i = n.S; i < n.E; i++) days.set(i, (days.get(i) || []).concat(n));
    const dbl = [...days.entries()].filter(([, l]) => l.length > 1); if(dbl.length){ const f = dbl[0]; out.push({lvl:'middel', ref:f[1][1].ref, when:fmtD(cal.ds(f[0])), txt:`${r.naam} staat ${dbl.length} werkdagen dubbel ingepland (eerst: ${f[1].map(nm).join(' en ')}).`, todo:`Inzet ${r.naam} oplossen (dubbel vanaf ${fmtD(cal.ds(f[0]), true)})`}); } }
  // basisplanning
  const uitv = nodes.find(n => n.type === 'uitv'); if(pl.base && uitv?.dev > 0){ const slip = nodes.filter(n => n.dev > 0 && ['wg', 'taak'].includes(n.type)).sort((a, b) => b.dev - a.dev).slice(0, 3);
    out.push({lvl:'middel', ref:slip[0]?.ref || uitv.ref, txt:`Uitvoering loopt ${uitv.dev} wd achter op de basisplanning. Grootste verschuiving: ${slip.map(n => nm(n) + ' (+' + n.dev + ')').join(', ')}.`, todo:`Achterstand ${uitv.dev} wd bespreken met opdrachtgever`}); }
  // begroting
  const bg = pl.begroting; if(bg?.posts?.length){ const cov = postCoverage(R), open = bg.posts.filter(p => p.q && !isVolg(p.c) && (cov[p.c] || 0) < .99 && !/^EUR$/i.test(p.eh));
    if(open.length) out.push({lvl:'info', txt:`${open.length} begrotingsposten zitten (nog) niet volledig in de planning. Zie Bronnen › Begroting.`}); }
  // veel achterstallige losse taken samenvatten tot één punt
  const lateT = out.filter(a => a.late); if(lateT.length > 3){ const keep = out.filter(a => !a.late); keep.push({lvl:lateT.some(a => a.lvl === 'hoog') ? 'hoog' : 'middel', ref:lateT[0].ref, txt:`${lateT.length} taken zijn volgens de planning al begonnen of klaar, maar staan nog op 0% of zijn niet af (o.a. ${lateT.slice(0, 3).map(a => a.nm).join(', ')}). Vul de voortgang in of schuif ze op.`, todo:lateT.map(a => a.todo).join('\n')}); out.length = 0; out.push(...keep); }
  const ord = {hoog:0, middel:1, info:2}; return out.sort((a, b) => ord[a.lvl] - ord[b.lvl]);
}
/* uitvoerders en materieel */
function plResPanel(R, ro){
  const pl = planOf(), {cal, nodes} = R, dated = nodes.filter(n => n.start && n.wd && (n.res || []).length);
  let tbl = '';
  if(pl.res.length && dated.length){ const s0 = Math.min(...dated.map(n => n.S)), e0 = Math.max(...dated.map(n => n.E)), wk = new Map();
    for(let i = s0; i < e0; i++){ const d = cal.ds(i), k = weekNr(d) + '|' + d.slice(0, 4); if(!wk.has(k)) wk.set(k, {nr:weekNr(d), days:[]}); wk.get(k).days.push(i); }
    const W = [...wk.values()].slice(0, 60);
    tbl = `<div class="scroll"><table class="t bez"><thead><tr><th>Week</th>${W.map(w => `<th class="num">${w.nr}</th>`).join('')}</tr></thead><tbody>${pl.res.map(r => { const busy = new Map(); for(const n of dated.filter(n => n.res.includes(r.id))) for(let i = n.S; i < n.E; i++) busy.set(i, (busy.get(i) || 0) + 1);
      return `<tr><td>${esc(r.naam)}</td>${W.map(w => { const c = w.days.filter(i => busy.get(i)).length, dbl = w.days.some(i => busy.get(i) > 1); return `<td class="num ${dbl ? 'dbl' : c ? 'bz' : ''}" title="${c} van ${w.days.length} werkdagen ingezet${dbl ? ', DUBBEL' : ''}">${c || ''}</td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div><p class="faint" style="margin:0">Getal = werkdagen ingezet in die week. Rood = op een dag dubbel ingepland.</p>`; }
  return `<section class="panel" data-fold="res"><h2>Uitvoerders en materieel</h2>
    <p class="muted" style="margin:0">Eigen ploegen, onderaannemers en belangrijk materieel. Koppel ze in het detailpaneel van een taak of werkgang; dubbel ingeplande inzet komt in de aandachtslijst.</p>
    <div class="stack" style="gap:6px">${pl.res.map(r => `<div class="row"><input class="f" data-rn="${r.id}" value="${esc(r.naam)}" style="flex:1;min-width:140px" ${ro ? 'disabled' : ''}><select class="f" data-rs="${r.id}" style="width:auto" ${ro ? 'disabled' : ''}>${Object.entries(RES_SOORT).map(([k, v]) => `<option value="${k}" ${r.soort === k ? 'selected' : ''}>${v}</option>`).join('')}</select>${ro ? '' : `<button class="btn sm ghost" type="button" data-rdel="${r.id}" aria-label="Verwijderen">✕</button>`}</div>`).join('') || '<p class="faint" style="margin:0">Nog niets toegevoegd.</p>'}</div>
    ${ro ? '' : '<div class="row"><button class="btn sm" type="button" id="plResAdd">+ Ploeg / onderaannemer / materieel</button></div>'}${tbl}</section>`;
}
function plResWire(R){ const tb = $('#tabBody');
  $('#plResAdd').onclick = () => setPlan(pl => { pl.res.push({id:uid(), naam:'Ploeg ' + (pl.res.length + 1), soort:'ploeg'}); });
  tb.querySelectorAll('[data-rn]').forEach(f => f.onchange = () => setPlan(pl => { const r = pl.res.find(x => x.id === f.dataset.rn); if(r) r.naam = f.value.trim() || r.naam; }));
  tb.querySelectorAll('[data-rs]').forEach(f => f.onchange = () => setPlan(pl => { const r = pl.res.find(x => x.id === f.dataset.rs); if(r) r.soort = f.value; }));
  tb.querySelectorAll('[data-rdel]').forEach(b => b.onclick = () => setPlan(pl => { const id = b.dataset.rdel; pl.res = pl.res.filter(x => x.id !== id); for(const t of pl.tasks) if(t.res) t.res = t.res.filter(x => x !== id); const w = P.schema?.werkgangen; if(w) for(const v of Object.values(w)) if(v.res) v.res = v.res.filter(x => x !== id); })); }
/* begrotingsposten per taak en duurvoorstel */
function postCoverage(R){ const cov = {}; for(const n of R.nodes) for(const p of (n.type === 'wg' ? n.it?.posts : n.posts) || []) cov[p.c] = (cov[p.c] || 0) + (p.f ?? 1); const bg = planOf().begroting; if(bg && planOf().hmap) for(const p of bg.posts) if(postKind(p.c) === 'alg') cov[p.c] = Math.max(1, cov[p.c] || 0); return cov; }
function duurVoorstel(n){ const bg = planOf().begroting, norm = planOf().norm, ps = (n.type === 'wg' ? n.it?.posts : n.posts) || []; if(!bg || !ps.length) return null; let d = 0, miss = [];
  for(const p of ps){ const post = bg.posts.find(x => x.c === p.c); if(!post) continue; const nr = Number(norm[p.c]); if(!(nr > 0)){ miss.push(p.c); continue; } d += (post.q || 0) * (p.f ?? 1) / nr; }
  if(miss.length === ps.length) return {d:null, miss}; return {d:Math.max(1, Math.ceil(d - 1e-9)), miss}; }
function plPostsHtml(n, R, ro){ const bg = planOf().begroting; if(!bg?.posts?.length) return '';
  const ps = (n.type === 'wg' ? n.it?.posts : n.posts) || [], v = duurVoorstel(n), cov = postCoverage(R);
  return `<div class="posts"><b style="font-size:13px">Begrotingsposten</b>${ps.map((p, i) => { const post = bg.posts.find(x => x.c === p.c); return `<div class="row prow"><span class="code">${esc(p.c)}</span><span class="pn">${esc(post?.o || '?')}</span><span class="num">${post ? fmtQ(post.q * (p.f ?? 1)) + ' ' + esc(post.eh) : ''}</span><label class="l" style="flex-direction:row;align-items:center;gap:4px">deel <input class="f n" type="number" min="1" max="100" data-pp="${i}" value="${Math.round((p.f ?? 1) * 100)}" style="width:62px" ${ro ? 'disabled' : ''}>%</label>${ro ? '' : `<button class="btn sm ghost" type="button" data-ppdel="${i}" aria-label="Post loskoppelen">✕</button>`}</div>`; }).join('')}
    ${ro ? '' : `<div class="row"><input class="f" list="postList" id="ppAdd" placeholder="Post toevoegen: typ code of omschrijving" style="flex:1"><datalist id="postList">${bg.posts.filter(p => p.q).map(p => `<option value="${esc(p.c)} ${esc(p.o)}">${Math.round((1 - Math.min(1, cov[p.c] || 0)) * 100)}% nog vrij</option>`).join('')}</datalist></div>`}
    ${v && v.d === null ? '<div class="faint" style="font-size:12.5px">Vul bij Bronnen › Begroting een productie per dag in voor een duurvoorstel.</div>' : ''}${v && v.d !== null ? `<div class="row"><span>Duur volgens normen: <b>${v.d} werkdagen</b>${v.miss.length ? ` <span class="faint">(${v.miss.length} post${v.miss.length > 1 ? 'en' : ''} zonder productie per dag)</span>` : ''}</span>${!ro && v.d !== n.duur && !v.miss.length ? `<button class="btn sm" type="button" id="ppUse">Overnemen (nu ${n.duur} wd)</button>` : ''}</div>` : ''}</div>`; }
function fmtQ(q){ return (Math.round(q * 100) / 100).toLocaleString('nl-NL'); }
function plPostsWire(n, R){ const tb = $('#tabBody'), set = fn => { if(n.type === 'wg') setWg(n.key, w => { w.posts = [...(w.posts || [])]; fn(w.posts); }); else setPlan(pl => { const t = pl.tasks.find(x => x.id === n.task.id); t.posts = [...(t.posts || [])]; fn(t.posts); }); };
  tb.querySelectorAll('[data-pp]').forEach(f => f.onchange = () => set(ps => { const i = Number(f.dataset.pp); ps[i] = {...ps[i], f:Math.max(.01, Math.min(1, Number(f.value) / 100))}; }));
  tb.querySelectorAll('[data-ppdel]').forEach(b => b.onclick = () => set(ps => ps.splice(Number(b.dataset.ppdel), 1)));
  const add = $('#ppAdd'); if(add) add.onchange = () => { const c = add.value.trim().split(/\s+/)[0], post = planOf().begroting.posts.find(p => p.c === c); if(!post) return toast('Post ' + c + ' staat niet in de begroting.'); const rest = Math.max(.01, 1 - Math.min(1, postCoverage(R)[c] || 0)); set(ps => { if(!ps.some(p => p.c === c)) ps.push({c, f:Math.round(rest * 100) / 100}); }); };
  $('#ppUse') && ($('#ppUse').onclick = () => plSet(n, 'duur', duurVoorstel(n).d, R)); }
/* bronnen: bestek en begroting */
function plBronPanel(R, ro){ const pl = planOf(), bs = pl.bestek, bg = pl.begroting;
  const cov = bg ? postCoverage(R) : {};
  const where = {}; for(const n of R.nodes) for(const p of (n.type === 'wg' ? n.it?.posts : n.posts) || []) (where[p.c] = where[p.c] || []).push(n.type === 'wg' ? n.key : '#' + n.nr);
  const hs = bg ? bg.hs.map(h => ({...h, posts:bg.posts.filter(p => p.h === h.c)})).filter(h => h.posts.length) : [];
  return `<section class="panel" data-fold="bron"><h2>Bronnen: bestek en begroting</h2>
    <div class="row">${bs ? `<span class="chip ok">Bestek: ${esc(bs.naam)} · ${bs.n || 0} punten ingelezen ${stamp(bs.at)}</span>` : '<span class="chip">Nog geen bestek ingelezen</span>'}${bg ? `<span class="chip ok">Begroting: ${esc(bg.naam)} · ${bg.posts.length} posten</span>` : '<span class="chip">Nog geen begroting ingelezen</span>'}${ro ? '' : `<button class="btn sm" type="button" id="bronBestek">${bs ? 'Bestek opnieuw inlezen…' : 'Bestek inlezen…'}</button><button class="btn sm" type="button" id="bronBegr">${bg ? 'Begroting opnieuw inlezen…' : 'Begroting inlezen…'}</button>`}</div>
    ${bg ? `<p class="muted" style="margin:0">Vul per post de <b>productie per dag</b> in (bijv. 40 m per dag). Koppel posten aan werkgangen of taken in het detailpaneel; Leeghwater rekent dan een duur voor, die jij overneemt of niet. Er verandert niets aan de planning zonder dat jij op Overnemen klikt.</p>
      <div class="scroll" style="max-height:60vh"><table class="t bg"><thead><tr><th>Post</th><th>Omschrijving</th><th class="num">Hoeveelheid</th><th>Productie per dag</th><th class="num">Dagen</th><th>In planning</th></tr></thead><tbody>
      ${hs.map(h => `<tr class="grp"><td colspan="6">${esc(h.c)} ${esc(h.n)}</td></tr>` + h.posts.map(p => { const nr = Number(pl.norm[p.c]), c = Math.min(1, cov[p.c] || 0);
        return `<tr><td class="code">${esc(p.c)}</td><td>${esc(p.o)}</td><td class="num">${p.q ? fmtQ(p.q) + ' ' + esc(p.eh) : esc(p.eh || '')}</td><td>${p.q && !/^EUR$/i.test(p.eh) ? `<input class="f n" type="number" min="0" step="any" data-norm="${esc(p.c)}" value="${nr > 0 ? nr : ''}" style="width:80px" ${ro ? 'disabled' : ''}> <span class="faint">${esc(p.eh)}/dag</span>` : ''}</td><td class="num">${nr > 0 && p.q ? Math.ceil(p.q / nr) : ''}</td><td>${where[p.c] ? `<span class="${c < .99 ? 'warnt' : ''}">${where[p.c].join(', ')}${c < .99 ? ' (' + Math.round(c * 100) + '%)' : ''}</span>` : p.q && !/^EUR$/i.test(p.eh) ? '<span class="faint">–</span>' : ''}</td></tr>`; }).join('')).join('')}</tbody></table></div>` : ''}
  </section>`; }
function plBronWire(R, ro){ if(ro) return; ($('#bronBestek') || {}).onclick = () => plBestekImport(R); ($('#bronBegr') || {}).onclick = () => plBegrotingImport(R); $('#tabBody').querySelectorAll('[data-norm]').forEach(f => f.onchange = () => setPlan(pl => { pl.norm = {...(pl.norm || {})}; const v = Number(String(f.value).replace(',', '.')); if(v > 0) pl.norm[f.dataset.norm] = v; else delete pl.norm[f.dataset.norm]; })); }
/* venster */
function modal(title, html, {ok = 'Toevoegen', onOk, wide} = {}){ const ov = document.createElement('div'); ov.className = 'mdl'; ov.innerHTML = `<div class="mdlc${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(title)}</h2><button class="btn sm ghost" type="button" data-mx aria-label="Sluiten">✕</button></div><div class="mdlb">${html}</div><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-mx>Annuleren</button>${onOk ? `<button class="btn primary" type="button" data-mok>${esc(ok)}</button>` : ''}</div></div>`;
  document.body.append(ov); const close = () => { ov.remove(); document.removeEventListener('keydown', k); }; const k = e => { if(e.key === 'Escape') close(); }; document.addEventListener('keydown', k);
  ov.querySelectorAll('[data-mx]').forEach(b => b.onclick = close); ov.addEventListener('mousedown', e => { if(e.target === ov) close(); });
  if(onOk) ov.querySelector('[data-mok]').onclick = async () => { if(await onOk(ov) !== false) close(); }; return ov; }
function firstPhaseRef(){ const ph = P.phases.find(p => plannedSteps(p.id).length); return ph ? 'H:' + ph.id : 'UITV'; }
function lastPhaseRef(){ const ph = [...P.phases].reverse().find(p => plannedSteps(p.id).length); return ph ? 'H:' + ph.id : 'UITV'; }
// taken toevoegen in een groep (groep wordt aangemaakt als die er nog niet is); bestaande namen worden overgeslagen
function addTasksTo(pl, groepNaam, where, items){ let g = pl.tasks.find(t => t.type === 'groep' && !t.parent && t.naam.toLowerCase() === groepNaam.toLowerCase());
  if(!g){ g = {id:uid(), type:'groep', naam:groepNaam, parent:''}; const ui = pl.tasks.findIndex(t => t.type === 'uitv'); if(where === 'voor') pl.tasks.splice(Math.max(0, ui), 0, g); else pl.tasks.push(g); }
  const have = new Set(pl.tasks.filter(t => t.parent === g.id).map(t => t.naam.toLowerCase())); const idMap = {}; let n = 0;
  for(const it of items){ if(have.has(it.naam.toLowerCase())) continue; const t = {id:uid(), parent:g.id, ...it}; idMap[it.key || it.naam] = t.id; delete t.key; t.preds = (t.preds || []).map(p => ({...p, r:p.r.startsWith('#') ? 'T:' + (idMap[p.r.slice(1)] || '') : p.r})).filter(p => p.r !== 'T:');
    const desc = [g.id]; for(let k = 0; k < desc.length; k++) pl.tasks.filter(x => x.parent === desc[k]).forEach(x => desc.push(x.id)); const at = Math.max(...desc.map(i => pl.tasks.findIndex(x => x.id === i))); pl.tasks.splice(at + 1, 0, t); n++; }
  return n; }
const TPL_VOOR = [
  {naam:'Opdracht verstrekt', type:'mijl', rel:'start', partij:'Opdrachtgever'},
  {naam:'Kwaliteits-/uitvoeringsplan opstellen en laten accepteren', type:'taak', duur:10, vb:15, partij:'Directie', why:'RAW 01.13: binnen 5 wd na opdracht, 5 wd beoordeling'},
  {naam:'Werkvoorbereiding (tekeningen, inkoop, planning)', type:'taak', duur:20, vb:0},
  {naam:'Materiaal bestellen (levertijd)', type:'taak', duur:30, vb:0, why:'Duur = levertijd; start = uiterste besteldatum'},
  {naam:'Verkeersbesluit / tijdelijke verkeersmaatregelen aanvragen', type:'taak', duur:30, vb:5, partij:'Gemeente'},
  {naam:'BLVC-plan opstellen en laten goedkeuren', type:'taak', duur:15, vb:5, partij:'Gemeente'},
  {naam:'Plan van aanpak ondersteuning kabels en leidingen indienen', type:'taak', duur:5, vb:20, partij:'Directie', why:'Vaak 4 weken voor aanvang'},
  {naam:'Afstemming kabels en leidingen / nutsbedrijven', type:'taak', duur:20, vb:5, partij:'Netbeheerders'},
  {naam:'Kick-off met nutsbeheerders en directie', type:'mijl', vb:5, partij:'Netbeheerders'},
  {naam:'KLIC-melding (graafmelding)', type:'mijl', vb:5, why:'Max. 20 wd vóór graven'},
  {naam:'Bewonersbrief laten goedkeuren en bezorgen', type:'taak', duur:3, vb:10, partij:'Bewoners', why:'Vaak uiterlijk 2 weken voor start'},
  {naam:'Bewonersavond / inloopavond', type:'mijl', vb:15, partij:'Bewoners'},
  {naam:'Startwerkoverleg', type:'mijl', vb:2, partij:'Directie'},
  {naam:'Uitzetten en maatvoering', type:'taak', duur:2, vb:0}];
const TPL_NA = [
  {naam:'Opneming en oplevering', type:'mijl', key:'opl', partij:'Directie'},
  {naam:'Restpunten opneming afwerken', type:'taak', duur:10, after:'opl'},
  {naam:'Revisiegegevens en -tekeningen aanleveren', type:'taak', duur:10, after:'opl', partij:'Directie'},
  {naam:'Opleveringsdossier', type:'taak', duur:10, after:'opl'},
  {naam:'Eindafrekening / meer- en minderwerk', type:'taak', duur:15, after:'opl'}];
function plTemplates(R){
  const f = firstPhaseRef(), have = new Set(planOf().tasks.map(t => (t.naam || '').toLowerCase()));
  const row = (it, i, g) => `<label class="ck tpl${have.has(it.naam.toLowerCase()) ? ' faint' : ''}"><input type="checkbox" data-tpl="${g}${i}" ${have.has(it.naam.toLowerCase()) ? 'disabled' : 'checked'}> <span>${it.type === 'mijl' ? '◆ ' : ''}${esc(it.naam)}<small class="faint">${it.duur ? ' · ' + it.duur + ' wd' : ''}${it.vb !== undefined ? ' · klaar ' + (it.vb ? it.vb + ' wd ' : '') + 'vóór start uitvoering' : it.after ? ' · na oplevering' : ''}${it.partij ? ' · ' + esc(it.partij) : ''}${it.why ? ' · ' + esc(it.why) : ''}${have.has(it.naam.toLowerCase()) ? ' · staat er al' : ''}</small></span></label>`;
  modal('Standaardtaken GWW', `<p class="muted" style="margin:0">Vink aan wat bij dit project hoort. Voorbereidingstaken worden <b>terug gerekend vanaf de start van de uitvoering</b> (VB-koppeling), dus de planning van de werkgangen verandert niet. Duur en koppelingen pas je daarna aan.</p>
    <label class="l" style="max-width:260px">Datum opdracht / start voorbereiding<input class="f" type="date" id="tplStart" value="${esc(planOf().start || (R.cfg.start ? R.cal.ds(R.cal.idx(tOf(R.cfg.start)) - 40) : ''))}"></label>
    <h3 class="sub">Voorbereiding</h3><div class="stack" style="gap:4px">${TPL_VOOR.map((it, i) => row(it, i, 'v')).join('')}</div>
    <h3 class="sub">Oplevering en nazorg</h3><div class="stack" style="gap:4px">${TPL_NA.map((it, i) => row(it, i, 'n')).join('')}</div>`, {wide:true, onOk:ov => {
    const pick = (list, g) => list.filter((it, i) => ov.querySelector(`[data-tpl="${g}${i}"]`)?.checked);
    const voor = pick(TPL_VOOR, 'v').map(it => ({naam:it.naam, type:it.type, ...(it.duur ? {duur:it.duur} : {}), ...(it.partij ? {partij:it.partij} : {}), ...(it.why ? {notitie:it.why} : {}), preds:it.vb !== undefined ? [{r:f, t:'VB', ...(it.vb ? {l:it.vb} : {})}] : []}));
    const na = pick(TPL_NA, 'n').map(it => ({key:it.key, naam:it.naam, type:it.type, ...(it.duur ? {duur:it.duur} : {}), ...(it.partij ? {partij:it.partij} : {}), preds:it.after ? [{r:'#' + it.after, t:'EB'}] : [{r:'UITV', t:'EB'}]}));
    const st0 = ov.querySelector('#tplStart')?.value; let n = 0; setPlan(pl => { if(st0) pl.start = st0; if(voor.length) n += addTasksTo(pl, 'Voorbereiding', 'voor', voor); if(na.length){ if(na[0].key !== 'opl' && !pl.tasks.some(t => t.naam === 'Opneming en oplevering')) na.forEach(t => { if(t.preds[0]?.r === '#opl') t.preds = [{r:'UITV', t:'EB'}]; });
      else { const o = pl.tasks.find(t => t.naam === 'Opneming en oplevering'); if(o && na[0].key !== 'opl') na.forEach(t => { if(t.preds[0]?.r === '#opl') t.preds = [{r:'T:' + o.id, t:'EB'}]; }); }
      n += addTasksTo(pl, 'Oplevering en nazorg', 'na', na); } }); toast(n + ' taken toegevoegd. De werkgangen houden hun data.'); }});
}
/* PDF-tekst als regels (zoals pdftotext -layout) */
async function pdfLines(file, prog){
  const lib = await pdfLib(), pdf = await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()), isEvalSupported:false}).promise, out = [];
  for(let p = 1; p <= pdf.numPages; p++){ prog?.(`Pagina ${p} van ${pdf.numPages} lezen…`); const pg = await pdf.getPage(p), tc = await pg.getTextContent(), rows = new Map();
    for(const it of tc.items){ if(!it.str?.trim()) continue; const y = Math.round(it.transform[5] / 2.5), x = it.transform[4]; if(!rows.has(y)) rows.set(y, []); rows.get(y).push({x, s:it.str, w:it.width || it.str.length * 4}); }
    for(const y of [...rows.keys()].sort((a, b) => b - a)){ const its = rows.get(y).sort((a, b) => a.x - b.x); let line = '', lastX = null; for(const it of its){ if(lastX !== null){ const gap = it.x - lastX; line += gap > 14 ? '   ' : gap > 1.5 ? ' ' : ''; } line += it.s; lastX = it.x + it.w; } out.push({p, x:its[0].x, t:line}); } }
  return out; }
function pickFile(accept){ return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); }); }
const NUMW = {een:1, één:1, twee:2, drie:3, vier:4, vijf:5, zes:6, zeven:7, acht:8, negen:9, tien:10};
const MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
function nlDate(s){ const m = String(s).toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/); if(!m) return ''; const mi = MAANDEN.findIndex(x => x.startsWith(m[2].slice(0, 3))); return mi < 0 ? '' : `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
function parseBestek(lines){
  const T = lines.map(l => l.t), out = {stops:[], data:[], meld:null, onderhoud:null, eisen:[]};
  for(let i = 0; i < T.length; i++){ const t = T[i].trim();
    if(/^Stoppunten\s*:?$/i.test(t) || /^Bijwoonpunten\s*:?$/i.test(t)){ const bij = /^Bijwoon/i.test(t); for(let j = i + 1; j < Math.min(T.length, i + 40); j++){ const m = T[j].trim().match(/^([SBR]\s?\d{1,2})[.:)]?\s+(.{4,})$/); if(!m){ if(T[j].trim() && !/^(Stoppunten|Bijwoonpunten|Registratiepunten)/i.test(T[j].trim())) break; else continue; } const code = m[1].replace(/\s/g, ''); if(!out.stops.some(s => s.code === code)) out.stops.push({code, naam:m[2].trim(), soort:bij || code[0] === 'B' ? 'bijwoonpunt' : 'stoppunt'}); } }
    let m = t.match(/(Start uitvoering|Aanvang (?:uitvoering|werkzaamheden)|Oplevering[^:]{0,30}|Gereed[^:]{0,30}|Mijlpaal[^:]{0,40})\s*:\s*(\d{1,2}\s+[a-z]+\s+\d{4})/i); if(m){ const d = nlDate(m[2]); if(d) out.data.push({naam:m[1].trim(), datum:d}); }
    m = t.match(/ten minste (\w+) werkdag(?:en)? van tevoren.*?(stoppunt|bijwoonpunt)/i) || (t.match(/ten minste (\w+) werkdag(?:en)? van tevoren/i) && /stoppunt|bijwoonpunt/i.test(T[i + 1] || '') ? t.match(/ten minste (\w+) werkdag/i) : null); if(m && out.meld === null) out.meld = NUMW[m[1].toLowerCase()] || Number(m[1]) || 2;
    m = t.match(/onderhoudstermijn.*bedraagt\s+(\d+)\s+(maand|week|weken|maanden|dagen|werkdagen)/i); if(m) out.onderhoud = m[1] + ' ' + m[2];
    m = t.match(/(?:ten ?minste|uiterlijk|minimaal)?\s*(\d+|een|twee|drie|vier|vijf|zes|acht|tien)\s+(weken|week|werkdagen|dagen)\s+(?:voor|vóór)\s+(?:de\s+)?(?:aanvang|start|het bezorgen|uitvoering)/i);
    if(m){ const ctx = T.slice(Math.max(0, i - 4), i + 1).map(s => s.replace(/^[\s.]*\d{0,6}\s*\d{0,6}\s*/, '').replace(/[. ]{4,}/g, ' ').trim()).join(' ').replace(/\s+/g, ' '), at = ctx.toLowerCase().lastIndexOf(m[0].trim().toLowerCase().slice(0, 12));
      let zin = ctx.slice(0, at < 0 ? ctx.length : at); zin = zin.split(/[.:;]\s+(?=[A-Z])/).pop().replace(/^(-\s*|Betreft:\s*)/i, '').replace(/\s*(ten ?minste|uiterlijk|minimaal)\s*$/i, '').trim();
      out.eisen.push({txt:ctx.slice(-240), naam:zin.slice(0, 70) || 'Bestekeis', n:NUMW[m[1].toLowerCase()] || Number(m[1]), eh:m[2].toLowerCase()}); } }
  if(out.meld === null && T.some(t => /stoppunt/i.test(t))) out.meld = 2;
  return out; }
function guessKind(txt){ const t = txt.toLowerCase(), W = WZ(); const find = re => W.find(w => re.test(w.naam.toLowerCase()))?.code || '';
  if(/opbreken|sloop|verwijder|frezen|zagen/.test(t)) return find(/opbr|sloop/);
  if(/zandbed|fundering|verharding|bestrat|asfalt|openstelling/.test(t)) return find(/straat|verhard|bestrat|asfalt/);
  if(/riool|persleiding|leiding|waterdicht|liggingsgegevens|duiker/.test(t)) return find(/riol|leiding|pers/);
  if(/aanvul|grond|eps|folie/.test(t)) return find(/grond|riol/);
  if(/opbreken|sloop/.test(t)) return find(/opbr|sloop/); return ''; }
async function plBestekImport(R){
  const file = await pickFile('application/pdf,.pdf'); if(!file) return; toast('Bestek lezen…');
  let lines; try{ lines = await pdfLines(file, t => toast(t)); }catch(e){ return toast('Bestek kon niet gelezen worden: ' + (e.message || e)); }
  const b = parseBestek(lines), cfg = R.cfg, f = firstPhaseRef(), have = new Set(planOf().tasks.map(t => (t.naam || '').toLowerCase()));
  const start = b.data.find(d => /start|aanvang/i.test(d.naam))?.datum;
  const kindOpt = sel => `<option value="">niet koppelen (zelf doen)</option>${WZ().map(w => `<option value="${w.code}" ${sel === w.code ? 'selected' : ''}>bij elke werkgang met ${esc(w.naam)}</option>`).join('')}`;
  const phOpt = d => { const fm = d.naam.match(/fase\s*(\d+)/i), g = fm && P.phases.some(p => p.id === fm[1] && plannedSteps(p.id).length) ? 'H:' + fm[1] : /opleve|gereed/i.test(d.naam) && !fm ? 'UITV' : ''; return `<option value="">niet koppelen</option><option value="UITV" ${g === 'UITV' ? 'selected' : ''}>einde uitvoering</option>${P.phases.filter(p => plannedSteps(p.id).length).map(p => `<option value="H:${p.id}" ${g === 'H:' + p.id ? 'selected' : ''}>einde ${esc(p.name)}</option>`).join('')}`; };
  const html = `<p class="muted" style="margin:0">Gevonden in <b>${esc(file.name)}</b>. Vink aan wat je wilt overnemen. Stoppunten worden <b>meldmomenten</b> in de planning (aanmelden ${b.meld ?? 2} werkdagen vooraf); ze schuiven de werkgangen niet op. Wil je dat het werk wacht op vrijgave, vul dan bij het stoppunt een beoordelingstermijn in.</p>
    ${b.stops.length ? `<h3 class="sub">Stop- en bijwoonpunten (${b.stops.length})</h3><div class="stack" style="gap:6px">${b.stops.map((s, i) => `<div class="row tplr"><label class="ck" style="flex:1;min-width:260px"><input type="checkbox" data-bs="${i}" ${have.has((s.code + ' ' + s.naam).toLowerCase()) ? 'disabled' : 'checked'}> <span><b>${esc(s.code)}</b> ${esc(s.naam)} <small class="faint">${s.soort}</small></span></label><select class="f" data-bk="${i}" style="width:auto;max-width:300px">${kindOpt(guessKind(s.naam))}</select></div>`).join('')}</div>` : '<p class="faint">Geen lijst met stoppunten gevonden (zoek in het bestek naar "Stoppunten:").</p>'}
    ${b.data.length ? `<h3 class="sub">Contractdata</h3><div class="stack" style="gap:6px">${b.data.map((d, i) => { const odd = start && d.datum < start && !/start|aanvang/i.test(d.naam); return `<div class="row tplr"><label class="ck" style="flex:1;min-width:260px"><input type="checkbox" data-bd="${i}" ${/start|aanvang/i.test(d.naam) ? '' : 'checked'}> <span><b>${esc(d.naam)}</b>: ${fmtD(d.datum, true)}${odd ? ' <b class="krit">ligt vóór de start, tikfout in het bestek?</b>' : ''}</span></label>${/start|aanvang/i.test(d.naam) ? `<label class="ck"><input type="checkbox" id="bsStart" ${cfg.start ? '' : 'checked'}> als start uitvoering gebruiken${cfg.start ? ' (nu ' + fmtD(cfg.start, true) + ')' : ''}</label>` : `<select class="f" data-bdl="${i}" style="width:auto">${phOpt(d)}</select>`}</div>`; }).join('')}</div>` : ''}
    ${b.eisen.length ? `<h3 class="sub">Termijnen vóór aanvang</h3><div class="stack" style="gap:6px">${b.eisen.map((e, i) => `<label class="ck tpl"><input type="checkbox" data-be="${i}" checked> <span><b>${esc(e.naam)}</b>: ${esc(e.n + ' ' + e.eh + ' vóór aanvang')} <small class="faint">… ${esc(e.txt)}</small></span></label>`).join('')}</div><p class="faint" style="margin:0">Deze komen als taak in Voorbereiding met de juiste termijn vóór de start; geef ze daarna een korte naam.</p>` : ''}
    ${b.onderhoud ? `<p class="muted" style="margin:0">Onderhoudstermijn volgens bestek: <b>${esc(b.onderhoud)}</b> (genoteerd bij de oplevering).</p>` : ''}`;
  modal('Bestek inlezen', html, {wide:true, ok:'Overnemen', onOk:ov => {
    const meld = b.meld ?? 2, stops = b.stops.filter((s, i) => ov.querySelector(`[data-bs="${i}"]`)?.checked).map(s => ({...s, kind:ov.querySelector(`[data-bk="${b.stops.indexOf(s)}"]`)?.value || ''}));
    const data = b.data.filter((d, i) => ov.querySelector(`[data-bd="${i}"]`)?.checked && !/start|aanvang/i.test(d.naam)).map(d => ({...d, link:ov.querySelector(`[data-bdl="${b.data.indexOf(d)}"]`)?.value || ''}));
    const eisen = b.eisen.filter((e, i) => ov.querySelector(`[data-be="${i}"]`)?.checked), useStart = ov.querySelector('#bsStart')?.checked;
    let nS = 0;
    if(useStart && start){ setSchema(s => { s.start = start; }); }
    setPlan(pl => {
      // stoppunten: per gekozen werkzaamheid bij elke werkgang die dat werk bevat, anders los in de groep
      let g = pl.tasks.find(t => t.type === 'groep' && t.naam === 'Stop- en bijwoonpunten (bestek)');
      for(const s of stops){ const nm = s.code + ' ' + s.naam, ws = s.kind ? R.nodes.filter(n => n.type === 'wg' && n.vakken.some(v => v.kind === s.kind)) : [];
        const base = {type:'stop', stop:{meld, status:'open', keurder:'Directie', ref:s.code + (s.soort === 'bijwoonpunt' ? ' (bijwoonpunt)' : ''), beoord:0}};
        if(ws.length){ for(const w of ws){ const t = {id:uid(), ...base, naam:nm, parent:'H:' + w.phase, na:w.ref, preds:[{r:w.ref, t:'BB'}]}; if(!pl.tasks.some(x => x.naam === nm && x.na === w.ref)){ pl.tasks.push(t); nS++; } } }
        else { if(!g){ g = {id:uid(), type:'groep', naam:'Stop- en bijwoonpunten (bestek)', parent:''}; pl.tasks.splice(Math.max(0, pl.tasks.findIndex(t => t.type === 'uitv') + 1), 0, g); }
          if(!pl.tasks.some(x => x.naam === nm && x.parent === g.id)){ pl.tasks.push({id:uid(), ...base, naam:nm, parent:g.id, preds:[]}); nS++; } } }
      if(data.length) addTasksTo(pl, 'Contractdata (bestek)', 'na', data.map(d => ({naam:d.naam + ' (contract)', type:'mijl', deadline:d.datum, snet:'', preds:d.link ? [{r:d.link, t:'EB'}] : [], notitie:'Contractdatum ' + fmtD(d.datum, true) + (b.onderhoud && /opleve/i.test(d.naam) ? '. Onderhoudstermijn ' + b.onderhoud : '')})));
      if(eisen.length) addTasksTo(pl, 'Voorbereiding', 'voor', eisen.map((e, i) => { const wd = /week/.test(e.eh) ? e.n * 5 : e.n; return {naam:e.naam + ' (' + e.n + ' ' + e.eh + ' vóór aanvang)', type:'mijl', preds:[{r:f, t:'VB', l:wd}], notitie:e.txt}; }));
      pl.bestek = {naam:file.name, at:new Date().toISOString(), n:stops.length + data.length + eisen.length, meld, onderhoud:b.onderhoud || ''}; });
    toast(`Overgenomen: ${nS} stop-/bijwoonmomenten, ${data.length} contractdata, ${eisen.length} termijnen. De werkgangen houden hun data.`); }});
}
function parseBegroting(lines){
  const posts = [], hs = []; let cur = null, h = '';
  const UNIT = '(m1|m2|m3|m¹|m²|m³|m|st|stuks|ton|kg|post|keer|EUR|ha|uur|dag|week|l|are|km|won|pst)';
  const reH = new RegExp('^(\\d{5,6})\\s+(.+?)(?:\\s{2,}|\\s)' + UNIT + '(?:\\s+([\\d.]+,\\d{1,3}))?\\s*$'), reHn = /^(\d{5,6})\s+(\S.*)$/, reQ = new RegExp('\\s' + UNIT + '\\s+([\\d.]+,\\d{1,3})\\s*$');
  const T = lines.map(l => l.t.trim()), used = new Set(), skip = t => /^(RAW|BESTEKS|POST|NUMMER|OPDRACHTGEVER|PROJECT|BESTEKNUMMER|HEID|VERPLICHTING|RESULTAATS|EEN-|OMSCHRIJVING|TOTAAL)/i.test(t) || /Bladnr\./.test(t);
  // een postnummer van 6 cijfers loopt soms door naar de volgende regel: '13021' … '0'
  const wrapDigit = i => { for(let j = i + 1; j <= i + 3 && j < T.length; j++){ if(used.has(j)) continue; if(/^\d$/.test(T[j]) && !/^[A-Z][A-Z .,&'-]{3,}$/.test(T[j - 1] || '')){ used.add(j); return T[j]; } const m2 = T[j].match(/^(\d)\s{2,}(Betreft|\S)/); if(m2 && !/^\d\s{2,}[A-Z]{3,}/.test(T[j])){ T[j] = T[j].replace(/^\d\s+/, ''); return m2[1]; } } return ''; };
  for(let i = 0; i < T.length; i++){ const t = T[i]; if(used.has(i) || !t || skip(t)) continue;
    let m = t.match(/^(\d{1,4})\s{2,}(\S.{2,80})$/) || t.match(/^(\d{1,4})\s+([A-Z][A-Za-z].{2,80})$/);
    if(!m && /^\d$/.test(t) && i > 0 && /^[A-Z][A-Z .,&'-]{3,}$/.test(T[i - 1])) m = [t, t, T[i - 1]];
    if(!m && /^\d{2,4}$/.test(t) && i > 0 && /^[A-Za-z]/.test(T[i - 1]) && !reQ.test(T[i - 1])) m = [t, t, T[i - 1]];
    if(m && /^Betreft/i.test(m[2])) m = null;
    if(m && m[1].length === 1 && /[a-z]/.test(m[2])) m = null; // hoofdhoofdstukken staan in hoofdletters
    if(m && !reQ.test(t)){ h = m[1]; const ex = hs.find(x => x.c === h); if(!ex) hs.push({c:h, n:m[2].trim()}); else if(h.length === 1) ex.n = m[2].trim(); cur = null; continue; }
    m = t.match(reH) || (!/^\d{5,6}\s+\d/.test(t) ? t.match(reHn) : null);
    if(m){ let c = m[1]; if(c.length === 5) c += wrapDigit(i); const full = m.length > 4;
      cur = {c, o:m[2].replace(/\s+/g, ' ').replace(/\.$/, '').trim(), eh:full ? m[3] : '', q:full && m[4] ? Number(m[4].replace(/\./g, '').replace(',', '.')) : 0, h};
      if(!cur.o || /^en \d{6}/.test(cur.o)){ cur = null; continue; } posts.push(cur); continue; }
    if(cur){ m = t.match(reQ); if(m){ const q = Number(m[2].replace(/\./g, '').replace(',', '.')); if(!cur.q && (/^EUR$/i.test(cur.eh) || !cur.eh)){ cur.eh = m[1]; cur.q = q; } } } }
  // hoofdstuk = langste hoofdstukcode die een voorvoegsel is van de post
  for(const p of posts){ const hh = hs.filter(x => p.c.startsWith(x.c)).sort((a, b) => b.c.length - a.c.length)[0]; if(hh) p.h = hh.c; }
  // dubbele nummers (zelfde post op meerdere regels) samenvoegen tot unieke codes
  const seen = {}; for(const p of posts){ if(seen[p.c] !== undefined){ seen[p.c]++; p.c = p.c + '-' + seen[p.c]; } else seen[p.c] = 0; }
  return {posts, hs}; }
async function plBegrotingImport(R){
  const file = await pickFile('application/pdf,.pdf'); if(!file) return; toast('Begroting lezen…');
  let lines; try{ lines = await pdfLines(file, t => toast(t)); }catch(e){ return toast('Begroting kon niet gelezen worden: ' + (e.message || e)); }
  const bg = parseBegroting(lines), withQ = bg.posts.filter(p => p.q && !/^EUR$/i.test(p.eh));
  if(!bg.posts.length) return toast('Geen begrotingsposten gevonden in dit bestand.');
  const old = planOf().begroting;
  modal('Begroting inlezen', `<p class="muted" style="margin:0">In <b>${esc(file.name)}</b> staan <b>${bg.posts.length} posten</b> in ${bg.hs.length} hoofdstukken, waarvan ${withQ.length} met een hoeveelheid. ${old ? 'De vorige begroting wordt vervangen; ingevulde productie per dag en koppelingen blijven staan.' : ''}</p>
    <div class="scroll" style="max-height:46vh"><table class="t bg"><thead><tr><th>Post</th><th>Omschrijving</th><th class="num">Hoeveelheid</th></tr></thead><tbody>${bg.hs.map(h => `<tr class="grp"><td colspan="3">${esc(h.c)} ${esc(h.n)}</td></tr>` + bg.posts.filter(p => p.h === h.c).map(p => `<tr><td class="code">${p.c}</td><td>${esc(p.o)}</td><td class="num">${p.q ? fmtQ(p.q) + ' ' + esc(p.eh) : esc(p.eh)}</td></tr>`).join('')).join('')}</tbody></table></div>
    <p class="faint" style="margin:0">In deze export staan geen uren per post. Vul daarom straks per post een productie per dag in (Bronnen › Begroting). Een export mét normuren kan Leeghwater later direct omrekenen.</p>`, {ok:'Begroting gebruiken', wide:true, onOk:() => { setPlan(pl => { pl.begroting = {naam:file.name, at:new Date().toISOString(), posts:bg.posts, hs:bg.hs}; }, 'Begroting ingelezen. Koppel posten aan werkgangen of taken in het detailpaneel.'); }});
}
/* Claude laten meekijken */
async function plAskClaude(R){
  if(!S.sample || plAskClaude.busy) return; plAskClaude.busy = true; const st = $('#plAIst'), out = $('#plAIres'); if(st) st.textContent = 'Claude kijkt naar de planning…';
  const pl = planOf(), by = R.by;
  const rows = R.nodes.map(n => [n.nr, TYPE_NAAM[n.type], '  '.repeat(n.depth) + (n.type === 'wg' ? 'Werkgang ' + n.key + ' (' + wgLabel(n) + ')' : n.naam), n.wd ? n.wd + 'wd' : '', n.start || '', n.eind || '', n.type === 'wg' && !n.explicit ? 'auto ' + n.autoTxt : predsText(n.preds, by), n.partij || '', n.crit ? 'kritiek' : n.float !== undefined ? 'speling ' + n.float : '', n.pct ? n.pct + '%' : '', n.type === 'stop' ? 'stop: ' + (n.stop?.status || 'open') + ', melden ' + (n.stop?.meld ?? 2) + 'wd' : ''].join(' | ')).join('\n');
  const prompt = `Je bent een ervaren projectleider/planner in de GWW (civiele techniek, Nederland, RAW/UAV 2012). Hieronder de planning van project "${M.name}" (${M.plaats || ''}, opdrachtgever ${M.opdrachtgever || 'onbekend'}). Vandaag is ${iso(Date.now())}.
Werkdagen; feestdagen en vrije periodes tellen niet mee. Werkgangen komen uit de ruimtelijke fasering en hun duur/volgorde is bewust gekozen: stel GEEN wijzigingen van werkgangduren voor.
Kolommen: nr | soort | naam | duur | start | eind | voorgangers | partij | speling | % | stoppunt
${rows}
${pl.bestek ? `Bestek ingelezen: ${pl.bestek.naam}, meldtermijn stoppunten ${pl.bestek.meld} wd, onderhoudstermijn ${pl.bestek.onderhoud || 'onbekend'}.` : 'Geen bestek ingelezen.'}
${pl.begroting ? 'Begroting hoofdstukken: ' + pl.begroting.hs.map(h => h.c + ' ' + h.n).join('; ') : ''}
Beoordeel als sparringpartner: wat ontbreekt er (voorbereiding, vergunningen, verkeersbesluit, nutsbedrijven, levertijden, stoppunten, keuringen, oplevering), welke koppelingen zijn onlogisch, waar zitten risico's op het kritieke pad, wat moet de projectleider deze en volgende week regelen?
Antwoord in het Nederlands als JSON: {"samenvatting": "2-3 zinnen", "punten": [{"ernst": "hoog|middel|laag", "tekst": "wat je ziet", "actie": "concrete actie"}], "voorstellen": [{"soort": "taak|mijlpaal|stoppunt", "naam": "korte naam", "duur": werkdagen (0 bij mijlpaal), "groep": "Voorbereiding|Uitvoering|Oplevering en nazorg", "voorganger": "in de notatie van de planning, bijv. H1VB-5 of 12 of 2.3", "partij": "", "reden": "waarom"}]}. Maximaal 8 punten en 8 voorstellen; alleen zinvolle.`;
  try{ const res = await S.sample.json(prompt, {modelTier:'complex', cache:false, onText:({text}) => { if(st) st.textContent = 'Claude schrijft… (' + text.length + ' tekens)'; }});
    plAskClaude.last = res; plAIRender(R);
  }catch(e){ if(st) st.textContent = ''; if(e?.code !== 'cancelled') toast(sampleErr(e)); }
  finally{ plAskClaude.busy = false; if(st) st.textContent = ''; } }
function plAIRender(R){ const res = plAskClaude.last, out = $('#plAIres'); if(!res || !out) return;
  const vs = (res.voorstellen || []).slice(0, 8), ps = (res.punten || []).slice(0, 8);
  out.innerHTML = `<div class="aibox"><b>Claude kijkt mee</b>${res.samenvatting ? `<p class="prose" style="margin:4px 0">${esc(res.samenvatting)}</p>` : ''}
    ${ps.map(p => `<div class="ai ${p.ernst === 'hoog' ? 'hoog' : p.ernst === 'middel' ? 'middel' : 'info'}"><span class="al">${p.ernst === 'hoog' ? '!' : '•'}</span><span>${esc(p.tekst)}${p.actie ? ` <b>→ ${esc(p.actie)}</b>` : ''}</span></div>`).join('')}
    ${vs.length ? `<h3 class="sub" style="margin-top:6px">Voorstellen</h3>${vs.map((v, i) => `<div class="row aiv"><span style="flex:1">${v.soort === 'stoppunt' ? 'STOP ' : v.soort === 'mijlpaal' ? '◆ ' : ''}<b>${esc(v.naam)}</b>${v.duur ? ' · ' + v.duur + ' wd' : ''} · ${esc(v.groep || '')}${v.voorganger ? ' · na/voor ' + esc(v.voorganger) : ''}${v.partij ? ' · ' + esc(v.partij) : ''}<br><small class="muted">${esc(v.reden || '')}</small></span>${S.canWrite ? `<button class="btn sm" type="button" data-aiadd="${i}">Toevoegen</button>` : ''}</div>`).join('')}` : ''}
    <p class="faint" style="margin:4px 0 0">Voorstellen van Claude; jij beslist. Toevoegen verandert de werkgangen niet.</p></div>`;
  out.querySelectorAll('[data-aiadd]').forEach(b => b.onclick = () => { const v = vs[Number(b.dataset.aiadd)], type = v.soort === 'stoppunt' ? 'stop' : v.soort === 'mijlpaal' ? 'mijl' : 'taak';
    const {preds} = parsePredsText(v.voorganger || '', R.nodes), item = {naam:v.naam, type, ...(type === 'taak' ? {duur:Math.max(1, Math.round(Number(v.duur) || 5))} : {}), ...(type === 'stop' ? {stop:{meld:planOf().bestek?.meld ?? 2, status:'open', keurder:'Directie', beoord:0}} : {}), ...(v.partij ? {partij:v.partij} : {}), notitie:v.reden || '', preds};
    const grp = /voorbereid/i.test(v.groep) ? ['Voorbereiding', 'voor'] : /opleve|nazorg/i.test(v.groep) ? ['Oplevering en nazorg', 'na'] : ['Aanvullend (Claude)', 'na'];
    setPlan(pl => addTasksTo(pl, grp[0], grp[1], [item]), v.naam + ' toegevoegd aan ' + grp[0] + '.'); b.disabled = true; b.textContent = 'Toegevoegd'; setTimeout(() => plAIRender(planCompute()), 50); }); }

// tijdelijke voorzieningen in de tijd: hoeveel ligt er, hoe lang
function voorzTijd(rows, cal){
  const wd = (a, b) => { let n = 0; for(let t = tOf(a); t <= tOf(b); t += DAY) if(!cal.off(t)) n++; return n; };
  const KS = [['plate', 'Rijroute', 'm'], ['fence', 'Bouwhekken', 'm'], ['walk', 'Looproute', 'm'], ['hek', 'Losse hekken', 'st.'], ['baken', 'Schildjes', 'st.']];
  const per = rows.filter(r => r.start).map(r => { const v = {plate:0, fence:0, walk:0, hek:barsIn(r.phase, r.step), baken:barsIn(r.phase, r.step, 'baken')};
    for(const rt of P.routes.filter(x => x.phase === r.phase && (x.step === r.step || x.step === 0))){ const l = routeLen(rt); if(l !== null && v[rt.kind] !== undefined) v[rt.kind] += l; }
    return {r, v, wd:wd(r.start, r.eind)}; });
  const agg = list => { const o = {wd:0, span:spanOf(list.map(x => x.r))}; for(const [k] of KS){ o[k] = {max:0, mwd:0}; }
    const dd = new Map();
    for(const x of list) for(let t = tOf(x.r.start); t <= tOf(x.r.eind); t += DAY){ if(cal.off(t)) continue; const d = dd.get(t) || {plate:0, fence:0, walk:0, hek:0, baken:0}; for(const [k] of KS) d[k] += x.v[k]; dd.set(t, d); }
    o.wd = dd.size; for(const d of dd.values()) for(const [k] of KS){ o[k].max = Math.max(o[k].max, d[k]); o[k].mwd += d[k]; } return o; };
  const phases = P.phases.map(ph => ({ph, list:per.filter(x => x.r.phase === ph.id)})).filter(g => g.list.length).map(g => ({...g, a:agg(g.list)}));
  return {KS, per, phases, tot:agg(per), noScale:!(Number(M?.schaal) > 0)};
}
function voorzTijdHtml(rows, cal){
  const {KS, phases, tot, noScale} = voorzTijd(rows, cal), n = v => Math.round(v).toLocaleString('nl-NL');
  const cells = a => KS.map(([k, , u]) => `<td class="num">${a[k].max ? n(a[k].max) + ' ' + u : '–'}</td><td class="num muted">${a[k].mwd ? n(a[k].mwd) : '–'}</td>`).join('');
  const per = (a) => a.span ? `${fmtD(a.span.start)} t/m ${fmtD(a.span.eind, true)}` : '–';
  return `<section class="panel"><h2>Tijdelijke voorzieningen in de tijd</h2>
    <p class="muted" style="margin:0">Per hoofdfase: hoeveel er maximaal tegelijk ligt, hoe lang (werkdagen dat er gewerkt wordt) en de totale inzet in <b>meter-werkdagen</b> (m·wd): 100 m rijroute die 10 werkdagen liggen is 1.000 m·wd. Handig voor huur en inkoop. Routes die voor de hele hoofdfase gelden tellen in elke werkgang mee.${noScale ? ' <b>Vul de schaal in op het tabblad Project om meters te berekenen.</b>' : ''}</p>
    <div class="scroll"><table class="t vt"><thead><tr><th rowspan="2">Hoofdfase</th><th rowspan="2">Periode</th><th rowspan="2" class="num">Werkdagen</th>${KS.map(([, l]) => `<th colspan="2" class="num">${l}</th>`).join('')}</tr>
      <tr>${KS.map(([k]) => `<th class="num">max</th><th class="num">${k === 'hek' || k === 'baken' ? 'st·wd' : 'm·wd'}</th>`).join('')}</tr></thead><tbody>
      ${phases.map(g => `<tr><td><b>${esc(g.ph.name)}</b></td><td>${per(g.a)}</td><td class="num">${g.a.wd}</td>${cells(g.a)}</tr>`).join('')}
      <tr class="tot"><td><b>Project</b></td><td>${per(tot)}</td><td class="num"><b>${tot.wd}</b></td>${cells(tot)}</tr>
    </tbody></table></div>
    <p class="faint" style="margin:0">"max" bij Project is het meeste dat op één dag tegelijk ligt, ook als hoofdfases overlappen.</p>
  </section>`;
}
// alleen-bekijken kaartje bij de balkenplanning
let tsSel = '', tsImg = null, tsTok = 0;
async function showTsMap(key){
  const el = $('#tsMap'); if(!el) return; tsSel = key; const tok = ++tsTok;
  const {rows} = scheduleRows(), idx = rows.findIndex(r => r.key === key), r = rows[idx]; if(!r) return;
  $('#gantt')?.querySelectorAll('.gbar').forEach(g => g.classList.toggle('on', g.dataset.see === r.phase + '|' + r.step));
  $('#tabBody').querySelectorAll('tr[data-row]').forEach(t => t.classList.toggle('sel', t.dataset.row === key));
  const rel = relatedRows(r.phase, r.step);
  el.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center"><div><b>Werkgang ${r.key}</b> <span class="muted">${fmtD(r.start)} t/m ${fmtD(r.eind, true)} · ${r.duur} wd</span></div>
    <span class="row" style="gap:4px"><button class="btn sm" id="tsPrev" type="button" ${idx ? '' : 'disabled'} aria-label="Vorige werkgang">‹</button><button class="btn sm" id="tsNext" type="button" ${idx < rows.length - 1 ? '' : 'disabled'} aria-label="Volgende werkgang">›</button></span></div>
    <div class="muted" style="font-size:13px">${r.vakken.map(v => `<span class="vak" ${kst(v.kind)}>${esc(v.phase + '.' + v.code)}</span>`).join(' ')}${rel.length ? ` <span class="par">${rel.map(o => (o.rel === 'voor' ? 'na ' : '∥ ') + o.r.key).join(' ')}</span>` : ''}</div>
    <div class="tsimg"><span class="muted">Kaart laden…</span></div>
    <button class="btn sm ghost" id="tsOpen" type="button">Openen in Fasering</button>`;
  $('#tsPrev').onclick = () => showTsMap(rows[idx - 1].key); $('#tsNext').onclick = () => showTsMap(rows[idx + 1].key);
  $('#tsOpen').onclick = () => gotoStep(r.phase, r.step);
  try{ if(!M.bg) throw 0; if(!tsImg || tsImg._bg !== M.bg){ const img = new Image(); img.src = '/_blob/' + M.bg; await img.decode(); img._bg = M.bg; tsImg = img; }
    if(tok !== tsTok) return; const ph = P.phases.find(p => p.id === r.phase);
    let box = phaseBox(ph); for(const o of rel){ const vs = P.shapes.filter(s => s.phase === o.r.phase && s.step === o.r.step); if(vs.length){ const b = bboxOf(vs.flatMap(v => v.points)); box = [Math.max(0, Math.min(box[0], b[0] - 20)), Math.max(0, Math.min(box[1], b[1] - 20)), Math.min(P.w, Math.max(box[2], b[2] + 20)), Math.min(P.h, Math.max(box[3], b[3] + 20))]; } }
    const cv = await frameCanvas(tsImg, box, 1300, ph, String(r.step)); if(tok !== tsTok) return;
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Kaart van werkgang ' + r.key);
    const holder = el.querySelector('.tsimg'); holder.replaceChildren(cv);
  }catch(e){ const holder = el.querySelector('.tsimg'); if(holder) holder.innerHTML = '<span class="muted">Kaart kon niet geladen worden.</span>'; }
}
function gotoStep(ph, n){ phase = ph; stepVal = String(n); projectMode = false; selected = ''; selBar = ''; focusMark = null; view = [0, 0, 100, 100]; S.tab = 'planning'; renderProject(); }
let ganttArgs = null, ganttRO = null;
function drawGantt(rows, cal, today){
  const el = $('#gantt'); if(!el) return; ganttArgs = [rows, cal, today];
  if(!ganttRO){ let lastW = 0; ganttRO = new ResizeObserver(() => { const g = $('#gantt'); if(!g || !ganttArgs) return; const w = Math.round(g.clientWidth); if(Math.abs(w - lastW) > 8){ lastW = w; drawGantt(...ganttArgs); } }); }
  ganttRO.disconnect(); ganttRO.observe(el);
  const dated = rows.filter(r => r.start); if(!dated.length) return;
  const sp = spanOf(dated), t0 = tOf(sp.start), t1 = tOf(sp.eind);
  const mon = t => t - ((new Date(t).getUTCDay() + 6) % 7) * DAY, a = mon(t0), weeks = Math.ceil((t1 - a) / DAY / 7) + 1, b = a + weeks * 7 * DAY;
  const LW = 118, RH = 22, HH = 42, W = Math.max(Math.floor(el.getBoundingClientRect().width || el.clientWidth || 0) - 2, LW + weeks * 26, 360), wx = (W - LW) / (weeks * 5 * DAY);
  // tijdas alleen over werkdagen (ma–vr): weekenden worden weggelaten, dus geen gaten tussen werkgangen
  const x = t => { const d = (t - a) / DAY, wk = Math.floor(d / 7), dw = d - wk * 7; return LW + (wk * 5 + Math.min(dw, 5)) * DAY * wx; }, grp = [], zb = [];
  let y = HH, svgRows = '';
  for(const ph of P.phases){ const rs = dated.filter(r => r.phase === ph.id); if(!rs.length) continue; const y0 = y, zebra = grp.length % 2;
    svgRows += `<text x="8" y="${y + 15}" class="gph">${esc(ph.name)}</text>`; const psp = spanOf(rs), ps = tOf(psp.start), pe = tOf(psp.eind) + DAY;
    svgRows += `<rect x="${x(ps)}" y="${y + 8}" width="${Math.max(2, x(pe) - x(ps))}" height="6" rx="3" fill="#7b858c" opacity=".35"/>`; y += RH;
    for(const r of rs){ const s = tOf(r.start), e = tOf(r.eind) + DAY, lab = r.vakken.map(v => v.code).join('+');
      svgRows += `<g class="gbar" data-see="${r.phase}|${r.step}" tabindex="0" role="button" aria-label="Werkgang ${r.key} ${fmtD(r.start)} t/m ${fmtD(r.eind)}"><rect x="0" y="${y}" width="${W}" height="${RH}" fill="transparent" class="ghit"/><text x="14" y="${y + 15}" class="glab">${r.key} <tspan class="gsub">${esc(lab.length > 12 ? lab.slice(0, 11) + '…' : lab)}</tspan></text>
        ${(() => { const ks = kinds().filter(k => r.vakken.some(v => v.kind === k)), h = (RH - 8) / Math.max(1, ks.length), w = Math.max(3, x(e) - x(s)); return (ks.length ? ks : ['']).map((k, j) => `<rect x="${x(s)}" y="${y + 4 + j * h}" width="${w}" height="${h}" fill="${k ? kColor(k) : '#7b858c'}"/>`).join('') + `<rect x="${x(s)}" y="${y + 4}" width="${w}" height="${RH - 8}" fill="none" stroke="#23303a" stroke-opacity=".35"/>`; })()}
        <text x="${x(e) + 5}" y="${y + 15}" class="gdur">${r.duur} wd</text><title>${r.key}: ${fmtD(r.start)} t/m ${fmtD(r.eind, true)} · ${r.duur} werkdagen · ${esc(lab)}</title></g>`; y += RH; }
    zb.push([y0, y, zebra]); grp.push(y); }
  let grid = '';
  for(let i = 0; i < weeks; i++){ const t = a + i * 7 * DAY, xx = x(t), s = iso(t); grid += `<line x1="${xx}" y1="${HH - 14}" x2="${xx}" y2="${y}" class="gl"/><text x="${xx + 3}" y="${HH - 4}" class="gwk">${weekNr(s)}</text>`;
    const d = new Date(t); if(i === 0 || d.getUTCDate() <= 7) grid += `<text x="${xx + 3}" y="${HH - 22}" class="gmn">${MND[d.getUTCMonth()]} ${d.getUTCFullYear()}</text>`; }
  // vrije dagen (door de week) grijs
  let off = ''; for(let t = a; t < b; t += DAY){ const o = cal.off(t); if(o && o !== 'weekend' && !cal.vrij.has(iso(t))) off += `<rect x="${x(t)}" y="${HH - 14}" width="${Math.max(1, x(t + DAY) - x(t))}" height="${y - HH + 14}" class="goff"><title>${fmtD(iso(t), true)}: ${esc(o)}</title></rect>`; }
  for(const v of vrijList(schemaCfg().vrij)){ const s0 = Math.max(tOf(v.van), a), e0 = Math.min(tOf(v.tm) + DAY, b); if(!(s0 < e0)) continue;
    off += `<g class="gvrij"><rect x="${x(s0)}" y="${HH - 14}" width="${Math.max(2, x(e0) - x(s0))}" height="${y - HH + 14}"/><text x="${x(s0) + 3}" y="${y + 12}">${esc(v.naam || 'Vrij')}</text><title>${esc(v.naam || 'Vrij')}: ${fmtD(v.van, true)} t/m ${fmtD(v.tm, true)}</title></g>`; }
  const tt = tOf(today), now = tt >= a && tt <= b ? `<line x1="${x(tt + DAY / 2)}" y1="${HH - 14}" x2="${x(tt + DAY / 2)}" y2="${y}" class="gnow"/><text x="${x(tt + DAY / 2) + 3}" y="${y + 12}" class="gnowt">vandaag</text>` : '';
  const legend = `<div class="glegend">${kinds().map(k => `<span><i style="background:${kColor(k)}"></i>${esc(kName(k))}</span>`).join('')}</div>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${y + 16}" width="${W}" height="${y + 16}" role="img" aria-label="Balkenplanning per werkgang">${zb.filter(z => z[2]).map(z => `<rect x="0" y="${z[0]}" width="${W}" height="${z[1] - z[0]}" class="gzeb"/>`).join('')}${off}${grid}${grp.map(yy => `<line x1="0" y1="${yy}" x2="${W}" y2="${yy}" class="gsep"/>`).join('')}${svgRows}${now}</svg>${legend}`;
  el.querySelectorAll('[data-see]').forEach(g => { const go = () => { const [ph, n] = g.dataset.see.split('|'); showTsMap(ph + '.' + n); }; g.addEventListener('click', go); g.addEventListener('keydown', e => { if(e.key === 'Enter') go(); }); });
}

