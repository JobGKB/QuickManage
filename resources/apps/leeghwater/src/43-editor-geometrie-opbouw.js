/* ================= editor: geometrie ================= */
const ext = () => M?.workExtent || [];
function inPoly(p, ring){ let c = false; for(let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const a = ring[i], b = ring[j]; if((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// Welke werkgrens-uitsnede(n) horen bij een hoofdfase: de uitsnede waar de meeste fasegrenspunten in liggen.
function ringsFor(phId){ const e = ext(); if(e.length < 2) return e; const o = P.phases.find(p => p.id === phId)?.outline; if(!o) return e;
  // overlap per uitsnede benaderd met een raster over de fasegrens
  const xs = o.map(p => p[0]), ys = o.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), dx = (Math.max(...xs) - x0) / 40, dy = (Math.max(...ys) - y0) / 40, sc = e.map(() => 0);
  for(let i = 0; i <= 40; i++) for(let j = 0; j <= 40; j++){ const q = [x0 + i * dx, y0 + j * dy]; if(!inPoly(q, o)) continue; e.forEach((r, k) => { if(inPoly(q, r)) sc[k]++; }); }
  // een hoofdfase kan in meerdere viewports liggen: alle uitsneden waar een wezenlijk deel van de fase in valt
  const mx = Math.max(...sc); return mx ? e.filter((_, k) => sc[k] >= Math.max(3, mx * .08)) : e; }
function records(){ return [...P.shapes, ...P.boundaries, ...P.routes]; }
function item(){ if(selected.startsWith('ext-')){ const i = Number(selected.slice(4)), r = ext()[i]; if(r) return {id:selected, phase, kind:'extent', code:'Uitsnede ' + (i + 1), points:r}; }
  if(selected === 'phase-outline-' + phase){ const p = P.phases.find(p => p.id === phase); if(p?.outline) return {id:selected, phase, kind:'phaseBoundary', code:'Fasegrens ' + phase, points:p.outline}; } return records().find(s => s.id === selected); }
function stash(){ history.push(JSON.stringify(P)); if(history.length > 80) history.shift(); future = []; }
function px(){ return view[2] / Math.max(1, svg?.getBoundingClientRect().width || 1); }
function point(e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(ov.getScreenCTM().inverse()); return [Math.max(0, Math.min(P.w, q.x)), Math.max(0, Math.min(P.h, q.y))]; }
function nearestEdge(p, ring){ let best = {distance:Infinity}; ring.forEach((a, i) => { const b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))), q = [a[0] + t * dx, a[1] + t * dy], distance = Math.hypot(p[0] - q[0], p[1] - q[1]); if(distance < best.distance) best = {distance, i, t, q}; }); return best; }
// Snappen: eerst naar een hoekpunt, anders naar de dichtstbijzijnde lijn. Shift ingedrukt = vrij plaatsen.
let snapHit = null;
function edgeHit(p, pts, open){ const h = nearestEdge(p, pts); if(open && h.i === pts.length - 1) return nearestEdge(p, pts.slice(0, -1).concat([pts[pts.length - 2]])); return h; }
function snapTargets(mode){
  const T = [], add = (points, open) => { if(points && points.length > 1) T.push({points, open}); };
  const own = drag?.type === 'vertex' ? drag.id : selected;
  ext().forEach((r, i) => { if(own !== 'ext-' + i) add(r); });
  const origin = drag?.type === 'vertex' ? drag.oldPoints[drag.index] : null;
  for(const ph of P.phases){ if(!ph.outline || own === 'phase-outline-' + ph.id) continue;
    const base = origin ? drag.base.phases.find(x => x.id === ph.id)?.outline : null;
    if(base && mode === 'boundary' && nearestEdge(origin, base).distance <= 15) continue; // beweegt mee met deze grens
    add(base || ph.outline); }
  for(const b of P.boundaries) if(b.id !== own) add(b.points);
  // werkvakken en routes van andere hoofdfases bewegen nooit mee: altijd snappen
  for(const s of P.shapes) if(s.phase !== phase) add(s.points);
  for(const r of P.routes) if(r.phase !== phase) add(r.points, true);
  if(mode === 'boundary') return T;
  const moving = drag?.type === 'vertex' ? drag.oldPoints[drag.index] : null;
  for(const s of P.shapes){ if(s.phase !== phase || s.id === own) continue;
    if(moving){ const prior = drag.base.shapes.find(x => x.id === s.id); if(prior && nearestEdge(moving, prior.points).distance <= .2 && P.shapes.some(x => x.id === own && sameFamily(x.kind, s.kind))) continue; }
    add(s.points); }
  for(const r of P.routes) if(r.phase === phase && r.id !== own) add(r.points, true);
  return T;
}
function snap(p, e, mode){
  snapHit = null; if(e?.shiftKey) return p.map(x => Math.round(x * 10) / 10);
  const tol = Math.min(12 * px(), 30), T = snapTargets(mode);
  let bv = null, dv = tol * .8; for(const t of T) for(const q of t.points){ const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if(d < dv){ dv = d; bv = q; } }
  if(bv){ snapHit = {q:[...bv], v:true}; return [...bv]; }
  let be = null, de = tol; for(const t of T){ const h = edgeHit(p, t.points, t.open); if(h.distance < de){ de = h.distance; be = h.q; } }
  if(be){ snapHit = {q:[...be], v:false}; return [...be]; }
  return p.map(x => Math.round(x * 10) / 10);
}
function boundaryPoint(old, ring, i, edit){ if(edit?.insert !== undefined) return ring[i >= edit.insert ? i + 1 : i]; if(edit?.remove !== undefined){ if(i === edit.remove){ const a = ring[(i - 1 + ring.length) % ring.length], b = ring[i % ring.length]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; } return ring[i > edit.remove ? i - 1 : i]; } return ring[i]; }
function moveAttached(p, old, ring, edit){ const hit = nearestEdge(p, old); if(hit.distance > 15) return [...p]; const a = boundaryPoint(old, ring, hit.i, edit), b = boundaryPoint(old, ring, (hit.i + 1) % old.length, edit), q = [a[0] + hit.t * (b[0] - a[0]), a[1] + hit.t * (b[1] - a[1])]; return [Math.max(0, Math.min(P.w, p[0] + q[0] - hit.q[0])), Math.max(0, Math.min(P.h, p[1] + q[1] - hit.q[1]))]; }
function sameRing(a, b){ return a.length === b.length && a.every((p, i) => Math.hypot(p[0] - b[i][0], p[1] - b[i][1]) < .2); }
function followShape(source, base, edit){
  const old = base.shapes.find(s => s.id === source.id); if(!old) return;
  for(const peer of P.shapes){
    if(peer.id === source.id || peer.phase !== source.phase) continue;
    const orig = base.shapes.find(s => s.id === peer.id); if(!orig) continue;
    if(!sameFamily(peer.kind, source.kind)) continue;
    if(sameRing(old.points, orig.points)){ peer.points = clone(source.points); peer.label = null; continue; }
    peer.points = orig.points.map(p => { const hit = nearestEdge(p, old.points); if(hit.distance > .2) return [...p]; const a = boundaryPoint(old.points, source.points, hit.i, edit), b = boundaryPoint(old.points, source.points, (hit.i + 1) % old.points.length, edit); return [p[0] + a[0] + hit.t * (b[0] - a[0]) - hit.q[0], p[1] + a[1] + hit.t * (b[1] - a[1]) - hit.q[1]]; });
    if(edit?.insert !== undefined){ const q = source.points[edit.insert], hit = nearestEdge(q, peer.points); if(hit.distance < .2 && hit.t > .00001 && hit.t < .99999) peer.points.splice(hit.i + 1, 0, [...q]); }
    if(!sameRing(peer.points, orig.points)) peer.label = null;
  }
  if(source.sourceShape) delete source.sourceShape;
  if(source.boundarySource) delete source.boundarySource;
}
function followBoundaryChange(base, boundary, old, edit){
  let n = 0;
  for(const key of ['shapes','routes']) for(const s of P[key]){ if(s.phase !== boundary.phase) continue; const orig = base[key].find(x => x.id === s.id); if(!orig) continue;
    s.points = s.boundarySource === boundary.id ? clone(boundary.points) : orig.points.map(p => moveAttached(p, old, boundary.points, edit)); if(!sameRing(orig.points, s.points)){ n++; s.label = null; } }
  for(const s of P.shapes.filter(s => s.phase === boundary.phase && s.sourceShape)){ const src = P.shapes.find(x => x.id === s.sourceShape && x.phase === s.phase); if(src){ s.points = clone(src.points); s.label = null; } }
  for(const b of P.barriers.filter(b => b.phase === boundary.phase)){ const orig = base.barriers.find(x => x.id === b.id); if(!orig) continue; const pos = moveAttached([orig.x, orig.y], old, boundary.points, edit); b.x = pos[0]; b.y = pos[1]; (b.moves || []).forEach((m, i) => { const pr = orig.moves?.[i]; if(pr){ const q = moveAttached([pr.x, pr.y], old, boundary.points, edit); m.x = q[0]; m.y = q[1]; } }); }
  if(boundary.kind === 'phaseBoundary') for(const p of P.phases){ if(p.id === boundary.phase || !p.outline) continue; const orig = base.phases.find(x => x.id === p.id); if(orig?.outline) p.outline = orig.outline.map(q => moveAttached(q, old, boundary.points, edit)); }
  hint('Grens gewijzigd · ' + n + ' aansluitende vakken/routes bewegen mee. Alles blijft binnen de zwarte werkgrens.');
}

/* ================= editor: planning-helpers ================= */
const workCode = s => s.phase + '.' + s.code;
const shortTxt = (t, n = 16) => t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
// een werkgang bestaat zodra er iets in staat: werkvakken, routes/voorzieningen of hekken
function plannedSteps(ph = phase){ const set = new Set(P.shapes.filter(s => s.phase === ph && s.step > 0).map(s => s.step));
  for(const r of P.routes) if(r.phase === ph && r.step > 0) set.add(r.step);
  for(const b of P.barriers || []) if(b.phase === ph) for(let k = b.start; k < b.end; k++) set.add(k + 1);
  return [...set].sort((a,b) => a - b); }
function stepCodes(n){ return P.shapes.filter(s => s.phase === phase && s.step === n).map(workCode).join(' + '); }
function nextCode(kind){ let i = 1; while(P.shapes.some(s => s.phase === phase && s.code === kind + i)) i++; return kind + i; }
function inStep(s){ return stepVal === 'all' || s.step > 0 && (stepVal === 'done' || s.step <= Number(stepVal)); }
function routeVisible(s){ return stepVal === 'all' || s.step === 0 || String(s.step) === stepVal; }
function planningState(s){ if(s.kind === 'boundary') return 'Werkgrenzen'; if(!s.step) return 'Nog in te plannen'; if(stepVal === 'all') return 'Ingepland'; if(stepVal === 'done' || s.step < Number(stepVal)) return 'Al geweest'; if(s.step === Number(stepVal)) return 'Nu aan de beurt'; return 'Nog te doen'; }
function stepOptions(cur){ const steps = plannedSteps(), last = steps.at(-1) || 0; return [0, ...steps, ...(last < 99 ? [last + 1] : [])].map(n => `<option value="${n}" ${n === cur ? 'selected' : ''}>${n === 0 ? 'Nog in te plannen' : steps.includes(n) ? 'Werkgang ' + phase + '.' + n + ' (tegelijk met ' + esc(stepCodes(n)) + ')' : 'Nieuwe werkgang ' + phase + '.' + n + ' · achteraan'}</option>`).join(''); }
function frameIndex(){ return Number(stepVal) - 1; }
function barPos(b, i){ const pos = {x:b.x, y:b.y, angle:b.angle}; let src = null; (b.moves || []).forEach(m => { if(i >= m.step){ Object.assign(pos, {x:m.x, y:m.y, angle:m.angle ?? pos.angle}); src = m; } }); return {pos, src}; }
/* Elk werkgang heeft zijn eigen hekken: een oud hek dat over meerdere werkgangen loopt wordt bij bewerken gesplitst. */
function ensureSingle(b){ const i = frameIndex(); if(i < 0 || i < b.start || i >= b.end || b.end - b.start <= 1 && !(b.moves || []).length) return b;
  const extra = [];
  for(let k = b.start; k < b.end; k++){ if(k === i) continue; const {pos} = barPos(b, k); extra.push({id:'hek-' + Math.random().toString(36).slice(2, 7), ...(b.type ? {type:b.type} : {}), ...(b.sign ? {sign:b.sign} : {}), phase:b.phase, scale:b.scale, x:pos.x, y:pos.y, angle:pos.angle ?? 0, start:k, end:k + 1, moves:[]}); }
  const {pos} = barPos(b, i); Object.assign(b, {x:pos.x, y:pos.y, angle:pos.angle ?? 0, start:i, end:i + 1, moves:[]});
  P.barriers.push(...extra); return b; }
function hint(t){ const h = $('#hint'); if(h) h.textContent = t; }

/* ================= editor: opbouw ================= */
const TOOLS = [
  ['select','Selecteren','V'], ['polygon','Werkvak tekenen','W'], ['barrier','Hek plaatsen','H'],
  ['plate','Rijroute','R'], ['walk','Looproute','L'], ['fence','Bouwhekken (lijn)','B'], ['baken','Schildjes (lijn)','S'], ['depot','Depotruimte','D'], ['sign','Verkeersborden','T'],
];
function edInit(){
  const ro = !S.canWrite;
  $('#tabBody').innerHTML = `
  <div class="stack" style="gap:10px">
    <div id="remoteBanner" class="banner" hidden></div>
    <div class="edtop"><div class="phases" id="phaseBar"></div>
      <div class="row"><select class="f" id="playScope" style="width:auto"><option value="project">Hele project</option><option value="phase">Deze hoofdfase</option></select><button class="btn primary" id="play" type="button">▶ Afspelen</button></div></div>
    <div class="wgrow"><button class="btn sm" id="prevStep" type="button" aria-label="Vorige werkgang">←</button><div class="wg" id="stepStrip"></div><button class="btn sm" id="nextStep" type="button" aria-label="Volgende werkgang">→</button></div>
    <div class="ed">
      <section class="stagecol">
        <div class="stage" id="stage">
          <svg id="cv" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Planningstekening met werkvakken"></svg>
          <div class="savechip" id="saveChip"></div>
          <div class="zoom"><button type="button" id="zIn" aria-label="Inzoomen">+</button><button type="button" id="zOut" aria-label="Uitzoomen">−</button><button type="button" id="zFit">Passend</button><button type="button" id="zAll">Hele blad</button></div>
          <div class="frame" id="frame" hidden></div>
          <div class="drawbar" id="drawbar" hidden><span id="drawInfo"></span><button class="btn sm" id="dBack" type="button">Laatste punt weg</button><button class="btn sm" id="dCancel" type="button">Annuleren</button><button class="btn sm primary" id="dFinish" type="button">Afronden</button></div>
        </div>
        <div class="hint" id="hint"></div>
        <div class="legend">
          ${WZ().map(w => `<span ${kst(w.code)}><i class="sw"></i>${esc(w.naam)}${isFinalK(w.code) ? ' bezig' : ''}</span>`).join('')}${wzOpt().afwerk && kinds().length > 1 ? `<span class="k-G" title="Laatste werkzaamheid uitgevoerd; bij Einde de hele hoofdfase"><i class="sw"></i>Gereed</span>` : ''}
          <span style="--k:var(--k-fase)"><i class="ln"></i>Fasegrens</span><span style="--k:var(--k-werk)"><i class="ln"></i>Werkgrens</span><span class="k-plate"><i class="sw"></i>Rijroute</span><span class="k-fence"><i class="ln solid"></i>Bouwhekken</span><span class="k-walk"><i class="ln"></i>Looproute</span>
        </div>
      </section>
      <aside class="side" id="side">
        ${ro ? `<div class="banner info"><p>Je bekijkt deze planning. Bewerken kan met rechten “Kan bewerken” of “Kan gebruiken”.</p></div>` : `
        <div class="panel tight"><h3 class="sub">Gereedschap</h3>
          <div class="tools" id="tools">${TOOLS.map(([k, l, key]) => `<button type="button" data-tool="${k}">${l}${key ? `<kbd>${key}</kbd>` : ''}</button>`).join('')}</div>
          <div class="signcat" id="signCat" hidden></div>
          <h3 class="sub" style="margin-top:6px">Grenzen</h3>
          <div class="tools" id="btools"></div>
          <div class="row" style="margin-top:4px"><button class="btn sm" id="undo" type="button">↶ Ongedaan</button><button class="btn sm" id="redo" type="button">↷ Opnieuw</button></div>
        </div>`}
        <div class="panel tight"><h3 class="sub">Weergave</h3>
          <label class="ck"><input type="checkbox" id="showOutline"> Fasegrens tonen</label>
          <label class="ck" title="Vakken, routes en hekken van werkgangen die volgens het tijdschema tegelijk lopen, gestippeld"><input type="checkbox" id="showPar"> Gelijktijdige werkgangen tonen</label>
          <label class="ck" title="Alleen de achtergrondtekening grijs; vakken en routes houden hun kleur. Geldt ook voor de kaartjes en de PDF."><input type="checkbox" id="bgGray"> Tekening zwart-wit</label>
        </div>
        <div id="ctx"></div>
        <div class="panel tight"><h3 class="sub" id="listTitle">Werkvakken</h3><div class="kfilter" id="kFilter" role="group" aria-label="Filter op werkzaamheid"></div><div class="list" id="itemList"></div></div>
      </aside>
    </div>
  </div>`;
  svg = $('#cv'); svg.replaceChildren();
  const defs0 = node('defs', {}, svg);
  { // depot: zandkleurige ondergrond met hopen (gronddepot)
    const pt = node('pattern', {id:'depotHatch', patternUnits:'userSpaceOnUse', width:14, height:14}, defs0); node('rect', {width:14, height:14, fill:'#cfd8dc', 'fill-opacity':.7}, pt);
    node('path', {d:'M4 4 L10 10 M10 4 L4 10', stroke:DEPOT, 'stroke-width':1.3, 'stroke-linecap':'round'}, pt); } // arcering met kruisjes
  bgLayer = node('g', {}, svg);
  if(M.bg) node('image', {href:'/_blob/' + M.bg, width:P.w, height:P.h, x:0, y:0}, bgLayer);
  else node('rect', {width:P.w, height:P.h, fill:'#fff'}, bgLayer);
  bgLayer.style.filter = bgGray ? 'grayscale(1)' : '';
  sharpImg = M.pdf ? node('image', {x:0, y:0, width:0, height:0, preserveAspectRatio:'none', 'pointer-events':'none'}, bgLayer) : null; sharpKey = '';
  ov = node('g', {}, svg);
  void defs0;
  bindEditor(); wireSizeFields($('#ctx'));
  $('#showOutline').checked = showOutline; $('#showPar').checked = showPar; $('#playScope').value = playScope;
  setSave(S.canWrite ? (S.noDb ? 'lokaal' : dirty ? 'wacht' : 'ok') : 'lezen');
  if(view[2] === 100) fit(false);
  edRefresh();
  if(remotePending) showRemoteBanner();
  if(!ext().length && S.canWrite) hint('Deze tekening heeft nog geen werkgrens. Kies “Werkgrens uit tekening halen” om hem automatisch te vinden (ook bij gesplitste viewports), of “Projectwerkgrens tekenen” om hem zelf in te klikken. Daarna teken je per hoofdfase de fasegrens.');
  else defaultHint();
}
