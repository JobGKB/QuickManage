/* ================= analyse ================= */
const ERNST = {hoog:['crit','Hoog'], middel:['warn','Middel'], laag:['info','Laag']};
const ERNST_ORDER = {hoog:0, middel:1, laag:2};
function m2Factor(){ const sc = Number(M?.schaal); return sc > 0 ? Math.pow(0.0254 / 72 * sc, 2) : null; }
function fmtArea(pt2, ofArea){ const f = m2Factor(); if(f){ const a = pt2 * f; return 'ca. ' + (a >= 100 ? Math.round(a / 10) * 10 : Math.max(1, Math.round(a))).toLocaleString('nl-NL') + ' m²'; } return ofArea ? 'ca. ' + Math.max(1, Math.round(100 * pt2 / ofArea)) + '% van het vak' : 'een deel'; }
function bboxOf(pts){ let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for(const [x, y] of pts){ if(x < a) a = x; if(y < b) b = y; if(x > c) c = x; if(y > d) d = y; } return [a, b, c, d]; }
function polyArea(pts){ let s = 0; for(let i = 0; i < pts.length; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s / 2); }
const inBox = (q, b) => q[0] >= b[0] && q[0] <= b[2] && q[1] >= b[1] && q[1] <= b[3];

// Controle op de huidige planning: per plek op de tekening moet opbreken vóór riolering en riolering vóór straatwerk komen.
function liveChecks(){
  const out = [], e0 = ext(), step = 5, cell = step * step, f = m2Factor(), minA = f ? 8 / f : 400;
  const inExt = q => !e0.length || e0.some(r => inPoly(q, r));
  const wc = s => s.phase + '.' + s.code, anyBars = (P.barriers || []).length > 0 || P.routes.some(r => r.kind === 'fence');
  for(const ph of P.phases){
    const sh = P.shapes.filter(s => s.phase === ph.id).map(s => ({s, b:bboxOf(s.points), n:0}));
    const bs = P.boundaries.filter(b => b.phase === ph.id);
    const inEff = q => inExt(q) && (!ph.outline || inPoly(q, ph.outline)) && (!bs.length || bs.some(b => inPoly(q, b.points)));
    const box = ph.outline ? bboxOf(ph.outline) : sh.length ? bboxOf(sh.flatMap(v => v.s.points)) : null;
    const cnt = {}, add = (key, q, meta) => { const c = cnt[key] || (cnt[key] = {n:0, sx:0, sy:0, ...meta}); c.n++; c.sx += q[0]; c.sy += q[1]; };
    const K = kinds(), openK = isOpenK(K[0]) ? K[0] : null, finK = isFinalK(K.at(-1)) ? K.at(-1) : null, lc = k => kName(k).toLowerCase();
    const hasOpen = openK && sh.some(v => v.s.kind === openK), hasFin = finK && sh.some(v => v.s.kind === finK);
    if(box) for(let x = box[0] + step / 2; x < box[2]; x += step) for(let y = box[1] + step / 2; y < box[3]; y += step){
      const q = [x, y]; if(!inEff(q)) continue;
      const hit = sh.filter(v => inBox(q, v.b) && inPoly(q, v.s.points)); hit.forEach(v => v.n++);
      if(!hit.length){ add('G', q, {}); continue; }
      const H = hit.map(v => v.s), O = openK ? H.filter(s => s.kind === openK) : [];
      for(const b of H){ if(!b.step) continue; const ib = K.indexOf(b.kind);
        // eerst het terrein openen
        if(openK && b.kind !== openK && hasOpen && !O.some(o => o.step > 0 && o.step < b.step)) add((b.kind === finK ? 'D|' : 'A|') + b.id, q, {r:b, a:b, same:O.some(o => o.step === b.step)});
        // eerdere werkzaamheid op dezelfde plek moet eerder klaar zijn
        for(const a of H){ if(a === b || K.indexOf(a.kind) >= ib || (a.kind === openK && b.kind !== finK)) continue; if(a.step === 0 || a.step >= b.step) add('B|' + b.id + '|' + a.id, q, {a:b, b:a}); } }
      if(finK && hasFin) for(const o of O){ if(o.step && !H.some(x => x.kind === finK && x.step > o.step)) add('C|' + o.id, q, {a:o}); }
    }
    const areaOf = s => (sh.find(v => v.s === s)?.n || 0) * cell, loc = c => [c.sx / c.n, c.sy / c.n];
    for(const [key, c] of Object.entries(cnt)){
      const a = c.n * cell; if(a < minA) continue; const t = key[0], own = c.r || c.a; if(own && a < .015 * areaOf(own)) continue;
      if(t === 'A') out.push({ernst:c.same ? 'middel' : 'hoog', fase:ph.id, werkgang:c.r.step, vakken:[c.r.id], locatie:loc(c),
        titel:`${wc(c.r)} (${lc(c.r.kind)}) ligt in gebied waar ${c.same ? 'pas in dezelfde werkgang' : 'nog geen'} ${lc(openK)} ${c.same ? 'gebeurt' : 'is gedaan'}`,
        tekst:`${fmtArea(a, areaOf(c.r))} van ${wc(c.r)} (werkgang ${ph.id}.${c.r.step}) ligt niet in een ${lc(openK)}-vak uit een eerdere werkgang.`});
      if(t === 'B') out.push({ernst:c.b.step && c.b.step === c.a.step ? 'middel' : 'hoog', fase:ph.id, werkgang:c.a.step, vakken:[c.a.id, c.b.id], locatie:loc(c),
        titel:`${kName(c.a.kind)} ${wc(c.a)} ligt op ${lc(c.b.kind)} ${wc(c.b)} die ${!c.b.step ? 'nog niet is ingepland' : c.b.step === c.a.step ? 'in dezelfde werkgang komt' : 'pas later komt'}`,
        tekst:`${fmtArea(a, areaOf(c.a))} overlap tussen ${wc(c.a)} (werkgang ${ph.id}.${c.a.step}) en ${wc(c.b)}${c.b.step ? ' (werkgang ' + ph.id + '.' + c.b.step + ')' : ''}. ${kName(c.b.kind)} hoort op deze plek eerder klaar te zijn.`});
      if(t === 'D') out.push({ernst:'laag', fase:ph.id, werkgang:c.a.step, vakken:[c.a.id], locatie:loc(c),
        titel:`Deel van ${wc(c.a)} ligt buiten elk ${lc(openK)}-vak`,
        tekst:`${fmtArea(a, areaOf(c.a))} van ${wc(c.a)} ligt niet in een eerder ${lc(openK)}-vak. Is dat nieuw werk, of is het ${lc(openK)}-vak te krap getekend?`});
      if(t === 'C') out.push({ernst:'hoog', fase:ph.id, werkgang:c.a.step, vakken:[c.a.id], locatie:loc(c),
        titel:`${wc(c.a)} (${lc(openK)}) wordt daarna niet afgewerkt met ${lc(finK)}`,
        tekst:`${fmtArea(a, areaOf(c.a))} van ${wc(c.a)} (werkgang ${ph.id}.${c.a.step}) valt in geen enkel ${lc(finK)}-vak uit een latere werkgang.`});
      if(t === 'G') out.push({ernst:'laag', fase:ph.id, vakken:[], locatie:loc(c),
        titel:`Deel van het werkgebied van ${ph.name} valt in geen werkvak`, tekst:`${fmtArea(a)} binnen fasegrens en werkgrens is niet toegewezen. Geen werk nodig, of nog een vak tekenen?`});
    }
    const lost = e0.length ? sh.filter(v => !v.s.points.some(inExt)).map(v => v.s) : [];
    if(lost.length) out.push({ernst:'hoog', fase:ph.id, vakken:lost.map(s => s.id), locatie:null, titel:`${lost.length} ${lost.length === 1 ? 'vak valt' : 'vakken vallen'} buiten de werkgrens en ${lost.length === 1 ? 'is' : 'zijn'} onzichtbaar`, tekst:lost.map(wc).join(', ') + '. Pas de werkgrens aan (Grenzen › Werkgrensvlakken) of zet de vorige werkgrens terug.'});
    const pend = sh.filter(v => !v.s.step).map(v => v.s);
    if(pend.length) out.push({ernst:'middel', fase:ph.id, vakken:pend.map(s => s.id), locatie:null, titel:`${pend.length} ${pend.length === 1 ? 'vak' : 'vakken'} in ${ph.name} nog niet ingepland`, tekst:pend.map(wc).join(', ') + '. Kies een werkgang in de lijst Werkvakken.'});
    const st = plannedSteps(ph.id);
    if(st.length && (st[0] !== 1 || st.some((n, i) => i && n !== st[i - 1] + 1))) out.push({ernst:'laag', fase:ph.id, vakken:[], locatie:null, titel:`Werkgangnummers in ${ph.name} lopen niet door`, tekst:`Ingeplande werkgangen: ${st.map(n => ph.id + '.' + n).join(', ')}. Lege werkgangen tellen niet mee bij afspelen, maar de nummering is dan verwarrend.`});
    if(hasOpen && hasFin) for(const mk of K.slice(1, -1)) if(P.shapes.some(s => s.kind === mk) && !sh.some(v => v.s.kind === mk)) out.push({ernst:'middel', fase:ph.id, vakken:[], locatie:null, titel:`Geen ${lc(mk)} in ${ph.name}`, tekst:`Er zijn vakken voor ${lc(openK)} en ${lc(finK)}, maar geen ${lc(mk)}. Klopt dat met de tekening?`});
    if(anyBars && st.length && !(P.barriers || []).some(b => b.phase === ph.id) && !P.routes.some(r => r.phase === ph.id && r.kind === 'fence')) out.push({ernst:'laag', fase:ph.id, vakken:[], locatie:null, titel:`Nog geen hekken in ${ph.name}`, tekst:`Afzetting en bereikbaarheid zijn voor deze hoofdfase nog niet ingetekend.`});
    if(!ph.outline) out.push({ernst:'laag', fase:ph.id, vakken:[], locatie:null, titel:`${ph.name} heeft nog geen fasegrens`, tekst:'Teken de fasegrens via Grenzen › Fasegrens tekenen.'});
  }
  // overlap tussen hoofdfases
  const groups = P.phases.map(ph => { const sh = P.shapes.filter(s => s.phase === ph.id); return {ph, sh:sh.map(s => ({s, b:bboxOf(s.points)})), b:sh.length ? bboxOf(sh.flatMap(s => s.points)) : null}; });
  for(let i = 0; i < groups.length; i++) for(let j = i + 1; j < groups.length; j++){
    const A = groups[i], B = groups[j]; if(!A.b || !B.b) continue;
    const bx = [Math.max(A.b[0], B.b[0]), Math.max(A.b[1], B.b[1]), Math.min(A.b[2], B.b[2]), Math.min(A.b[3], B.b[3])]; if(bx[0] >= bx[2] || bx[1] >= bx[3]) continue;
    let n = 0, sx = 0, sy = 0;
    for(let x = bx[0] + step / 2; x < bx[2]; x += step) for(let y = bx[1] + step / 2; y < bx[3]; y += step){ const q = [x, y];
      if(A.sh.some(v => inBox(q, v.b) && inPoly(q, v.s.points)) && B.sh.some(v => inBox(q, v.b) && inPoly(q, v.s.points)) && inExt(q)){ n++; sx += x; sy += y; } }
    if(n * cell >= minA) out.push({ernst:'middel', fase:A.ph.id, vakken:[], locatie:[sx / n, sy / n], titel:`${A.ph.name} en ${B.ph.name} overlappen`, tekst:`${fmtArea(n * cell)} valt in werkvakken van beide hoofdfases. Dat geeft dubbel werk of onduidelijkheid over wie dat stuk doet.`});
  }
  // werkgangen die volgens het tijdschema tegelijk lopen (verschillende hoofdfases)
  const SA = schedAny(), srows = SA.rows.filter(r => r.start && r.vakken.length);
  for(let i = 0; i < srows.length; i++) for(let j = i + 1; j < srows.length; j++){
    const A = srows[i], B = srows[j]; if(A.phase === B.phase || !overlapT(A, B)) continue;
    const per = SA.virt ? 'volgens de koppeling in het tijdschema' : `${fmtD(A.start > B.start ? A.start : B.start)} t/m ${fmtD(A.eind < B.eind ? A.eind : B.eind, true)}`;
    const av = A.vakken.map(s => ({s, b:bboxOf(s.points)})), bv = B.vakken.map(s => ({s, b:bboxOf(s.points)}));
    const ab = bboxOf(A.vakken.flatMap(s => s.points)), bb = bboxOf(B.vakken.flatMap(s => s.points)), bx = [Math.max(ab[0], bb[0]), Math.max(ab[1], bb[1]), Math.min(ab[2], bb[2]), Math.min(ab[3], bb[3])];
    if(bx[0] < bx[2] && bx[1] < bx[3]){ let n = 0, sx = 0, sy = 0;
      for(let x = bx[0] + step / 2; x < bx[2]; x += step) for(let y = bx[1] + step / 2; y < bx[3]; y += step){ const q = [x, y]; if(inExt(q) && av.some(v => inBox(q, v.b) && inPoly(q, v.s.points)) && bv.some(v => inBox(q, v.b) && inPoly(q, v.s.points))){ n++; sx += x; sy += y; } }
      if(n * cell >= minA) out.push({ernst:'hoog', fase:B.phase, werkgang:B.step, vakken:[...A.vakken, ...B.vakken].map(s => s.id), locatie:[sx / n, sy / n], titel:`Werkgang ${A.key} en ${B.key} lopen tegelijk op dezelfde plek`, tekst:`${fmtArea(n * cell)} valt in vakken van beide werkgangen, terwijl ze tegelijk lopen (${per}). Schuif een van de twee in de tijd of pas de vakken aan.`}); }
    // routes van de ene werkgang door een actief vak van de andere
    for(const [X, Yv, Y] of [[A, bv, B], [B, av, A]]) for(const rt of P.routes.filter(r => r.phase === X.phase && (r.step === X.step || r.step === 0) && r.kind !== 'fence' && r.kind !== 'baken')){
      let hit = null; for(let k2 = 1; k2 < rt.points.length && !hit; k2++){ const [p0, p1] = [rt.points[k2 - 1], rt.points[k2]], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), m = Math.max(1, Math.ceil(L / step));
        for(let t = 0; t <= m; t++){ const q = [p0[0] + (p1[0] - p0[0]) * t / m, p0[1] + (p1[1] - p0[1]) * t / m], v = Yv.find(v => inBox(q, v.b) && inPoly(q, v.s.points)); if(v){ hit = {q, v:v.s}; break; } } }
      if(hit) out.push({ernst:'middel', fase:X.phase, werkgang:X.step, vakken:[hit.v.id], locatie:hit.q, titel:`${rt.kind === 'plate' ? 'Rijroute' : 'Looproute'} van ${X.key} loopt door een actief vak van ${Y.key}`, tekst:`Tegelijk (${per}) wordt in ${hit.v.phase}.${hit.v.code} gewerkt. Controleer of de ${rt.kind === 'plate' ? 'rijroute' : 'looproute'} daar kan blijven liggen of verleg hem.`});
    }
  }
  return out.sort((a, b) => ERNST_ORDER[a.ernst] - ERNST_ORDER[b.ernst]);
}

function kItem(k, idx, src){
  const [cls, lab] = ERNST[k.ernst] || ERNST.laag, ph = P.phases.find(p => p.id === k.fase);
  return `<div class="item c-${cls}"><div class="hd"><span class="ti">${esc(k.titel)}</span>${ph ? `<span class="chip">${esc(ph.name)}${k.werkgang ? ' · wg ' + esc(k.fase) + '.' + esc(k.werkgang) : ''}</span>` : ''}<span class="pill ${cls}">${lab}</span></div>
    <p class="tx">${esc(k.tekst)}</p>${k.actie ? `<p class="tx"><b>Actie:</b> ${esc(k.actie)}</p>` : ''}
    ${ph && (k.locatie || (k.vakken || []).length) ? `<div class="row"><button class="btn sm" type="button" data-show="${src}|${idx}">Toon op tekening</button></div>` : ''}</div>`;
}
function showOnMap(k){
  const ph = P.phases.find(p => p.id === k.fase); if(!ph) return;
  phase = ph.id; projectMode = false; selBar = ''; tool = 'select'; draft = [];
  stepVal = k.werkgang && plannedSteps(phase).includes(Number(k.werkgang)) ? String(k.werkgang) : 'all';
  const vak = (k.vakken || []).map(id => P.shapes.find(s => s.id === id && s.phase === phase)).find(Boolean);
  selected = vak ? vak.id : '';
  let loc = k.locatie;
  if(!loc && vak){ const b = bboxOf(vak.points); loc = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
  focusMark = loc ? {phase, x:loc[0], y:loc[1], label:k.titel.length > 60 ? k.titel.slice(0, 58) + '…' : k.titel} : null;
  view = loc ? fitView([[loc[0] - 220, loc[1] - 160], [loc[0] + 220, loc[1] + 160]], 0) : [0, 0, 100, 100];
  S.tab = 'planning'; renderProject();
  if(!loc){ fit(); }
}
async function renderAnalyse(){
  if(analysisPid !== S.pid){ analysisPid = S.pid; analysisDoc = null;
    $('#tabBody').innerHTML = '<p class="muted">Analyse wordt geladen…</p>';
    try{ if(S.db){ const d = await S.db.doc('analyses/' + S.pid).get(); analysisDoc = d.exists ? d.data() : null; } else analysisDoc = JSON.parse(lsGet('leeghwater-local-analyse-' + S.pid) || 'null'); }catch{}
  }
  if(S.view !== 'project' || S.tab !== 'analyse' || !$('#tabBody') || !P) return;
  const A = analysisDoc, checks = liveChecks(), busy = !!analysisBusy;
  const stale = A && A.planVersie && M.planAt && A.planVersie < M.planAt;
  await names([A?.by]);
  const kn = [...(A?.knelpunten || [])].sort((a, b) => (ERNST_ORDER[a.ernst] ?? 3) - (ERNST_ORDER[b.ernst] ?? 3));
  const cnt = l => ['hoog','middel','laag'].map(e => [e, l.filter(k => k.ernst === e).length]).filter(([, n]) => n).map(([e, n]) => `<span class="pill ${ERNST[e][0]}">${n} ${ERNST[e][1].toLowerCase()}</span>`).join(' ');
  const oordeel = {ok:['done','In orde'], 'let op':['stale','Let op'], knelpunt:['fout','Knelpunt']};
  $('#tabBody').innerHTML = `<div class="stack">
    <section class="panel" data-fold="analyse"><div class="row" style="justify-content:space-between;align-items:flex-start"><div class="stack" style="gap:4px;flex:1;min-width:240px"><h2>Inhoudelijke analyse</h2>
      ${A ? `<p class="kv" style="margin:0">${esc(A.discipline?.naam || '')}${A.at ? ' · gemaakt ' + stamp(A.at) : ''}${nameOf(A.by) ? ' door ' + esc(nameOf(A.by)) : ''}${A.bron ? ' · ' + esc(A.bron) : ''}</p>` : ''}</div>
      <div class="row">${S.sample ? `<button class="btn ${A ? '' : 'primary'}" id="anRun" type="button" ${busy ? 'disabled' : ''}>${A ? 'Analyse opnieuw maken' : 'Analyse laten maken'}</button>` : ''}</div></div>
      <div id="anProg" class="busybox" ${busy ? '' : 'hidden'}><div class="row"><b id="anProgT">Bezig…</b><button class="btn sm" id="anStop" type="button">Stoppen</button></div><div class="progress"><i style="width:100%" class="indet"></i></div></div>
      ${A ? `<p class="prose" style="margin:0;max-width:80ch">${esc(A.samenvatting || '')}</p>` : `<div class="empty"><b>Nog geen analyse voor dit project.</b><span class="muted">Claude bekijkt de tekening en de planning, bepaalt de discipline en werkzaamheden, beoordeelt of de volgorde van hoofdfases en werkgangen klopt en zet knelpunten op een rij. ${S.sample ? 'Dit kost een deel van je Claude-gebruik en duurt meestal 1 à 2 minuten.' : 'Een analyse laten maken kan in de Claude-app; hieronder zie je alvast de automatische controle.'}</span></div>`}
      ${stale ? `<div class="banner"><p>De planning is gewijzigd sinds deze analyse (${stamp(A.planVersie)}). De automatische controle hieronder is wel actueel.</p></div>` : ''}
    </section>
    ${A ? `<section class="panel" data-fold="knelpunten"><div class="row" style="justify-content:space-between"><h2>Knelpunten</h2><span class="row">${cnt(kn)}</span></div>${kn.map((k, i) => kItem(k, i, 'a')).join('') || '<p class="muted" style="margin:0">Geen knelpunten gevonden.</p>'}</section>` : ''}
    <section class="panel" data-fold="controle"><div class="row" style="justify-content:space-between"><h2>Automatische controle</h2><span class="row">${cnt(checks) || '<span class="pill done">Alles in orde</span>'}</span></div>
      <p class="muted" style="margin:0">Rekent live op de huidige planning. Per plek op de tekening moeten de werkzaamheden in deze volgorde komen: ${esc(WZ().map(w => w.naam.toLowerCase()).join(' → '))}.${wzOpt().open && wzOpt().afwerk ? ' Wat geopend wordt, moet ook weer worden afgewerkt.' : ''} Verder: ongeplande vakken, overlap tussen hoofdfases en werkgebied zonder vak.</p>
      ${checks.map((k, i) => k.ernst === 'laag' ? '' : kItem(k, i, 'c')).join('')}
      ${checks.some(k => k.ernst === 'laag') ? `<details class="meer"><summary>Kleinere punten (${checks.filter(k => k.ernst === 'laag').length})</summary><div class="stack" style="gap:8px;margin-top:8px">${checks.map((k, i) => k.ernst === 'laag' ? kItem(k, i, 'c') : '').join('')}</div></details>` : ''}</section>
    ${A ? `
    <section class="panel" data-fold="achtergrond"><h2>Achtergrond van de analyse</h2><details class="meer"><summary>Oordeel per hoofdfase</summary>${(A.logica || []).map(l => { const o = oordeel[l.oordeel] || oordeel['let op'], ph = P.phases.find(p => p.id === String(l.fase));
      return `<div class="lrow"><div class="lk"><b>${esc(ph ? ph.name : l.fase === 'volgorde' ? 'Volgorde hoofdfases' : l.fase)}</b><span class="pill ${o[0]}">${o[1]}</span></div><p class="tx">${esc(l.tekst)}</p></div>`; }).join('')}</details>
    <details class="meer"><summary>Werkvolgorde</summary><div class="flow">${(A.volgorde || []).map((v, i) => `<div class="fstep" style="--k:${kinds().includes(v.code) ? kColor(v.code) : 'var(--accent)'}"><span class="nr">${i + 1}</span><div><b>${esc(v.naam)}</b><p class="tx">${esc(v.omschrijving)}</p></div></div>`).join('<span class="farrow" aria-hidden="true">→</span>')}</div></details>
    <details class="meer"><summary>Wat staat er op de tekening</summary><div class="egrid">${(A.elementen || []).map(g => `<div class="eg"><h3 class="sub">${esc(g.groep)}</h3>${(g.items || []).map(it => `<div class="ei"><b>${esc(it.naam)}</b>${it.aantal ? ` <span class="chip">${esc(it.aantal)}</span>` : ''}<p class="tx">${esc(it.toelichting || '')}</p></div>`).join('')}</div>`).join('')}</div></details>
    ${(A.aannames || []).length ? `<details class="meer"><summary>Aannames bij deze analyse (${A.aannames.length})</summary><ul>${A.aannames.map(a => `<li>${esc(a)}</li>`).join('')}</ul></details>` : ''}</section>` : ''}
  <section class="panel" data-fold="afdrukken" id="pdfSec"><h2>Afdrukken (PDF)</h2>
    <div class="row"><label class="ck"><input type="radio" name="pdfKind" value="fasering" ${pdfKind() === 'fasering' ? 'checked' : ''}> <b>Faseringsplanning</b></label><label class="ck"><input type="radio" name="pdfKind" value="planning" ${pdfKind() === 'planning' ? 'checked' : ''}> <b>Planning werkgangen</b></label></div>
    <p class="muted" style="margin:0" id="pdfDesc">${pdfKind() === 'fasering' ? `A3 liggend: een informatiepagina met legenda en overzichtskaart, een overzicht van alle werkgangen${P.schema?.start ? ' met data' : ''}, eventueel de aandachtspunten uit de analyse, en per hoofdfase een overzicht, elke werkgang op een eigen pagina en het eindbeeld.` : 'A3 liggend: de planning uit het Tijdschema met balken (alleen werkdagen; feestdagen, vrije periodes en vandaag gemarkeerd). Kies het detailniveau; met “Interne taken weglaten” maak je een uitdraai voor de opdrachtgever.'}</p>
    <div class="row" ${pdfKind() === 'planning' ? '' : 'hidden'}><label class="l" style="flex-direction:row;align-items:center;gap:6px">Detail <select class="f" id="ppLvl" style="width:auto"><option value="alles">alle taken en werkgangen</option><option value="hoofd">hoofdlijnen: groepen, hoofdfases, mijlpalen, stoppunten</option><option value="fase">alleen groepen, hoofdfases en mijlpalen</option></select></label><label class="ck"><input type="checkbox" id="ppInt" checked> Interne taken weglaten (voor opdrachtgever)</label><label class="ck"><input type="checkbox" id="ppStop" checked> Stoppunten tonen</label><label class="ck"><input type="checkbox" id="ppBase" ${planOf().base ? '' : 'disabled'}> Basisplanning tonen</label></div>
    <div class="row"><b style="font-size:14px">Hoofdfases</b><select class="f" id="pdfPhQuick" style="width:auto"><option value="">snel kiezen…</option><option value="*">alle hoofdfases</option>${P.phases.map(p => `<option value="${esc(p.id)}">alleen ${esc(p.name)}</option>`).join('')}</select>${P.phases.map(p => `<label class="ck"><input type="checkbox" data-pdfph="${esc(p.id)}" ${pdfPhSel().includes(p.id) ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')}${pdfKind() === 'fasering' ? '<label class="ck"><input type="checkbox" id="pdfAn" checked> Aandachtspunten uit analyse</label>' : ''}</div>
    <div class="pvbar inl"><b>Afdrukvoorbeeld</b><span class="faint" id="pvInfo2"></span><span class="kv" id="pdfProg" hidden></span><span class="spacer"></span><button class="btn sm" id="pvZo2" type="button" title="Kleiner">−</button><button class="btn sm" id="pvZi2" type="button" title="Groter">+</button><button class="btn primary" id="pdfSave" type="button" disabled>Opslaan als PDF</button></div>
    <div class="pvpages pvinline" id="pvInline"></div>
  </section>
  </div>`;
  wireFolds($('#tabBody'));
  $('#tabBody').querySelectorAll('[data-show]').forEach(b => b.onclick = () => { const [src, i] = b.dataset.show.split('|'); showOnMap(src === 'a' ? kn[Number(i)] : checks[Number(i)]); });
  $('#anRun') && ($('#anRun').onclick = runAnalysis);
  pvWire();
  $('#anStop') && ($('#anStop').onclick = () => analysisBusy?.abort());
}

function wireFolds(root){
  root.querySelectorAll('.panel[data-fold]').forEach(sec => {
    const head = sec.firstElementChild, key = 'lw-fold-' + sec.dataset.fold; if (!head) return;
    head.classList.add('foldhead'); head.title = 'Klik om in of uit te klappen';
    sec.classList.toggle('closed', lsGet(key) === '1');
    head.addEventListener('click', e => { if (e.target.closest('button,a,input,select,label,textarea')) return; const c = sec.classList.toggle('closed'); lsSet(key, c ? '1' : ''); if(!c) sec.dispatchEvent(new Event('unfold')); });
  });
}
async function analysisImages(max){
  const img = new Image(); img.src = '/_blob/' + M.bg; await img.decode();
  const out = [];
  const shot = async (box, maxW, label, allPhases) => {
    const w = box[2] - box[0], h = box[3] - box[1], sc = Math.min(maxW / w, maxW / h), cw = Math.round(w * sc), ch = Math.round(h * sc);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d');
    const kx = img.naturalWidth / P.w, ky = img.naturalHeight / P.h;
    c.fillStyle = '#fff'; c.fillRect(0, 0, cw, ch); c.drawImage(img, box[0] * kx, box[1] * ky, w * kx, h * ky, 0, 0, cw, ch);
    const T = q => [(q[0] - box[0]) * sc, (q[1] - box[1]) * sc], path = pts => { c.beginPath(); pts.forEach((q, i) => { const [x, y] = T(q); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
    const shapes = P.shapes.filter(s => allPhases || s.phase === label.phase).sort((a, b) => rankAll(a.kind) - rankAll(b.kind));
    for(const s of shapes){ path(s.points); c.globalAlpha = .22; c.fillStyle = kColor(s.kind); c.fill(); c.globalAlpha = 1; c.strokeStyle = kColor(s.kind); c.lineWidth = 1.5; c.stroke(); }
    for(const ph of P.phases) if(ph.outline && (allPhases || ph.id === label.phase)){ path(ph.outline); c.strokeStyle = COLORS.fase; c.lineWidth = 2; c.setLineDash([8, 5]); c.stroke(); c.setLineDash([]); }
    c.font = `bold ${allPhases ? 13 : 15}px Arial`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#fff'; c.fillStyle = '#111';
    for(const s of shapes){ const b = bboxOf(s.points), t = T([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]), txt = s.phase + '.' + s.code + (s.step ? ' @' + s.step : ' @–'); c.strokeText(txt, t[0], t[1]); c.fillText(txt, t[0], t[1]); }
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .86));
    out.push({blob, label:{...label, box:box.map(v => Math.round(v)), px:[cw, ch]}});
  };
  await shot([0, 0, P.w, P.h], 1600, {naam:'Overzicht hele blad met alle hoofdfases'}, true);
  for(const ph of P.phases){ if(out.length >= max) break; const pts = [...(ph.outline || []), ...P.shapes.filter(s => s.phase === ph.id).flatMap(s => s.points)]; if(!pts.length) continue;
    const b = bboxOf(pts), pad = 40; await shot([Math.max(0, b[0] - pad), Math.max(0, b[1] - pad), Math.min(P.w, b[2] + pad), Math.min(P.h, b[3] + pad)], 1500, {naam:'Uitsnede ' + ph.name, phase:ph.id}, false); }
  return out;
}
function analysisPrompt(imgs, checks){
  const f = m2Factor();
  const data = {project:{naam:M.name, nummer:M.nummer, plaats:M.plaats, opdrachtgever:M.opdrachtgever, schaal:M.schaal ? '1:' + M.schaal : 'onbekend', tekening:M.bgNaam, coordinaten:`x 0–${P.w}, y 0–${P.h} (oorsprong linksboven)`},
    werkzaamheden_in_app:WZ().map((w, i) => ({code:w.code, naam:w.naam, kleur:w.kleur, volgorde:i + 1})), eerste_opent_terrein:wzOpt().open, laatste_maakt_af:wzOpt().afwerk,
    hoofdfases:P.phases.map((ph, i) => ({id:ph.id, naam:ph.name, uitvoeringsvolgorde:i + 1, heeft_fasegrens:!!ph.outline,
      hekken:(P.barriers || []).filter(b => b.phase === ph.id).length, routes:P.routes.filter(r => r.phase === ph.id).map(r => ({soort:r.kind === 'plate' ? 'rijroute' : r.kind === 'fence' ? 'bouwhekken' : 'looproute', werkgang:r.step})),
      werkvakken:P.shapes.filter(s => s.phase === ph.id).map(s => { const b = bboxOf(s.points); return {id:s.id, code:ph.id + '.' + s.code, soort:s.kind, werkgang:s.step || null, oppervlak:f ? Math.round(polyArea(s.points) * f) + ' m²' : Math.round(polyArea(s.points)) + ' pt²', midden:[Math.round((b[0] + b[2]) / 2), Math.round((b[1] + b[3]) / 2)], kader:b.map(Math.round)}; })})),
    automatische_controle:checks.slice(0, 40).map(k => ({ernst:k.ernst, titel:k.titel})),
    afbeeldingen:imgs.map((l, i) => ({nr:i + 1, wat:l.naam, tekening_kader:l.box, pixels:l.px}))};
  return `Je bent een ervaren werkvoorbereider en uitvoerder in de GWW (civiele techniek) in Nederland. Beoordeel de uitvoeringsfasering van dit project inhoudelijk en logisch. Schrijf in helder, zakelijk Nederlands.

Wat je krijgt:
- Afbeeldingen van de planningstekening. Afbeelding 1 is het hele blad, daarna uitsneden per hoofdfase. Over de tekening liggen de werkvakken, gekleurd per werkzaamheid (zie werkzaamheden_in_app in de data: code, naam en kleur); rode stippellijn = fasegrens. Labels zoals "2.O1 @3" betekenen: hoofdfase 2, vak O1, werkgang 3 ("@–" = nog niet ingepland). Per afbeelding staat in de data welk kader van de tekening (in tekeningcoördinaten) hij toont en hoeveel pixels hij is, zodat je pixelposities kunt omrekenen naar tekeningcoördinaten.
- De planningsdata en de uitkomst van de automatische controle (JSON hieronder).

Betekenis: hoofdfases worden na elkaar uitgevoerd, in de gegeven volgorde. Werkgang 2.3 = hoofdfase 2, derde werkgang. Vakken met dezelfde werkgang lopen tegelijk. De werkzaamheden in de app zijn per project ingesteld (zie data). Bepaal zelf uit de tekening welke discipline dit werk echt is en of de ingestelde werkzaamheden en hun volgorde daarbij passen; stel anders een betere indeling voor in 'volgorde'.

Opdracht:
1. Bepaal de discipline en de werkzaamheden, en de logische werkvolgorde per plek.
2. Benoem wat je op de tekening ziet (verharding, parkeervakken, riool- en putnummers, kabels en leidingen, groen, panden, bijzonderheden en notities).
3. Beoordeel per hoofdfase of de werkgangen logisch zijn. Denk aan: niet graven voordat is opgebroken, niet straten voordat riool en aanvulling klaar zijn, bouwen vanaf het aansluit- of lozingspunt stroomopwaarts, tijdelijke aansluitingen, bereikbaarheid, hoeveel tegelijk openligt. Beoordeel ook de volgorde van de hoofdfases.
4. Zet concrete knelpunten op een rij, met een actie en een locatie in tekeningcoördinaten. Verzin geen dingen die je niet ziet; zet onzekerheden bij aannames.

Antwoord met alleen één JSON-object in precies deze vorm:
{"samenvatting": string (2-4 zinnen),
 "discipline": {"naam": string, "toelichting": string},
 "volgorde": [{"code": "O"|"R"|"S"|string, "naam": string, "omschrijving": string}],
 "elementen": [{"groep": string, "items": [{"naam": string, "aantal": string (optioneel), "toelichting": string}]}],
 "logica": [{"fase": hoofdfase-id of "volgorde", "oordeel": "ok"|"let op"|"knelpunt", "tekst": string}],
 "knelpunten": [{"ernst": "hoog"|"middel"|"laag", "titel": string (max 80 tekens), "tekst": string, "actie": string, "fase": hoofdfase-id, "werkgang": getal of null, "vakken": [werkvak-id's uit de data], "locatie": [x, y] in tekeningcoördinaten of null}],
 "aannames": [string]}

Data:
${JSON.stringify(data)}`;
}
function normalizeAnalysis(r){
  if(!r || typeof r !== 'object') throw {code:'invalid_json', message:'Geen analyse ontvangen'};
  const str = v => typeof v === 'string' ? v.slice(0, 2000) : '', arr = v => Array.isArray(v) ? v : [];
  const ids = new Set(P.shapes.map(s => s.id)), phs = new Set(P.phases.map(p => p.id));
  return {samenvatting:str(r.samenvatting), discipline:{naam:str(r.discipline?.naam), toelichting:str(r.discipline?.toelichting)},
    volgorde:arr(r.volgorde).slice(0, 8).map(v => ({code:str(v.code).slice(0, 6), naam:str(v.naam), omschrijving:str(v.omschrijving)})),
    elementen:arr(r.elementen).slice(0, 12).map(g => ({groep:str(g.groep), items:arr(g.items).slice(0, 20).map(i => ({naam:str(i.naam), aantal:str(i.aantal), toelichting:str(i.toelichting)}))})),
    logica:arr(r.logica).slice(0, 20).map(l => ({fase:String(l.fase ?? ''), oordeel:['ok','let op','knelpunt'].includes(l.oordeel) ? l.oordeel : 'let op', tekst:str(l.tekst)})),
    knelpunten:arr(r.knelpunten).slice(0, 30).map((k, i) => ({id:'k' + (i + 1), ernst:['hoog','middel','laag'].includes(k.ernst) ? k.ernst : 'middel', titel:str(k.titel).slice(0, 120), tekst:str(k.tekst), actie:str(k.actie),
      fase:phs.has(String(k.fase)) ? String(k.fase) : '', werkgang:Number.isInteger(k.werkgang) ? k.werkgang : null, vakken:arr(k.vakken).map(String).filter(id => ids.has(id)),
      locatie:Array.isArray(k.locatie) && k.locatie.length === 2 && k.locatie.every(Number.isFinite) && k.locatie[0] >= 0 && k.locatie[0] <= P.w && k.locatie[1] >= 0 && k.locatie[1] <= P.h ? k.locatie : null})),
    aannames:arr(r.aannames).slice(0, 12).map(str)};
}
function sampleErr(e){ return ({not_granted:'Leeghwater mag in deze weergave geen vragen aan Claude stellen.', sampling_disabled:'Claude is niet beschikbaar voor dit account.', rate_limited:'Even te veel vragen of je gebruikslimiet is bereikt. Probeer het later opnieuw.',
  prompt_too_large:'Er ging te veel mee. Probeer het opnieuw met minder vakken.', invalid_json:'Het antwoord kwam niet goed door. Probeer het nog eens.', refused:'Claude weigerde deze vraag.', image_rejected:'De tekening kon niet worden meegestuurd.',
  session_expired:'Log opnieuw in bij Claude.', empty_completion:'Claude gaf geen antwoord. Probeer het opnieuw.'})[e?.code] || 'Analyse mislukt: ' + (e?.message || e?.code || e); }
async function runAnalysis(){
  if(!S.sample || analysisBusy) return;
  const ctl = new AbortController(); analysisBusy = ctl; const pid = S.pid; renderAnalyse();
  const prog = t => { const el = $('#anProgT'); if(el) el.textContent = t; };
  try{
    prog('Tekening voorbereiden…');
    const lim = await S.sample.limits().catch(() => null);
    const imgs = lim?.images && M.bg ? await analysisImages(Math.max(1, Math.min(lim.images.maxCount || 1, 5))).catch(() => []) : [];
    const checks = liveChecks();
    const opts = {modelTier:'complex', signal:ctl.signal, cache:false, onText:({text}) => prog('Claude schrijft de analyse… (' + text.length.toLocaleString('nl-NL') + ' tekens)')};
    if(imgs.length) opts.images = imgs.map(i => i.blob);
    prog('Claude bekijkt de tekening en de planning (meestal 1 à 2 minuten)…');
    const res = await S.sample.json(analysisPrompt(imgs.map(i => i.label), checks), opts);
    if(S.pid !== pid) return;
    const doc = normalizeAnalysis(res);
    Object.assign(doc, {at:new Date().toISOString(), by:S.meId, bron:'Claude in Leeghwater' + (imgs.length ? '' : ' (zonder afbeelding)'), planVersie:M.planAt || null});
    if(S.db && S.canWrite){ if(analysisDoc) await S.db.doc('analyses/' + pid + '-vorige').set(analysisDoc).catch(() => {}); await S.db.doc('analyses/' + pid).set(doc); }
    else lsSet('leeghwater-local-analyse-' + pid, JSON.stringify(doc));
    analysisDoc = doc; toast('Analyse bijgewerkt.');
  }catch(e){ if(e?.code !== 'cancelled') toast(sampleErr(e)); }
  finally{ analysisBusy = null; if(S.view === 'project' && S.tab === 'analyse') renderAnalyse(); }
}

