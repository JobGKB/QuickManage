/* ================= editor: tekenen ================= */
function render2(){ cancelAnimationFrame(rafId); rafId = requestAnimationFrame(draw); }
function draw(){
  if(!svg || !P) return;
  svg.setAttribute('viewBox', view.join(' ')); ov.replaceChildren(); sharpSoon();
  const k = px(), e0 = ext();
  const defs = node('defs');
  const extClip = node('clipPath', {id:'extClip', clipPathUnits:'userSpaceOnUse'}, defs); e0.forEach(r => node('polygon', {points:pts(r)}, extClip));
  // alles buiten de actieve hoofdfase naar de achtergrond: wit waas met een gat op de fasegrens
  const actOut = !projectMode && P.phases.find(p => p.id === phase)?.outline;
  if(actOut){ const W = P.w, H = P.h; node('path', {d:`M${-W} ${-H}H${2 * W}V${2 * H}H${-W}Z M${actOut.map(q => q.join(' ')).join('L')}Z`, 'fill-rule':'evenodd', fill:'white', 'fill-opacity':.6, 'pointer-events':'none'}); }
  const extLayer = node('g', e0.length ? {'clip-path':'url(#extClip)'} : {});
  const bounds = P.boundaries.filter(b => b.phase === phase), wc = node('clipPath', {id:'workClip', clipPathUnits:'userSpaceOnUse'}, defs); bounds.forEach(b => node('polygon', {points:pts(b.points)}, wc));
  if(projectMode || showOthers){ const ci = P.phases.findIndex(p => p.id === phase);
    for(const p of P.phases.filter(p => p.id !== phase)){ const bs = P.boundaries.filter(b => b.phase === p.id); const w = node('clipPath', {id:'ow' + p.id, clipPathUnits:'userSpaceOnUse'}, defs); bs.forEach(b => node('polygon', {points:pts(b.points)}, w)); const pc = node('clipPath', {id:'op' + p.id, clipPathUnits:'userSpaceOnUse'}, defs); if(p.outline) node('polygon', {points:pts(p.outline)}, pc);
      const outer = node('g', bs.length ? {'clip-path':'url(#ow' + p.id + ')'} : {}, extLayer), inner = node('g', p.outline ? {'clip-path':'url(#op' + p.id + ')'} : {}, outer);
      for(const s of P.shapes.filter(s => s.phase === p.id)){ const ready = projectMode && P.phases.findIndex(x => x.id === p.id) < ci && isDone(s, 'phase'); node('polygon', {points:pts(s.points), fill:ready ? COLORS.G : '#9aabb4', 'fill-opacity':ready ? .28 : .05, stroke:ready ? COLORS.G : '#abb9c1', 'stroke-width':k, 'stroke-opacity':.3, 'pointer-events':'none'}, inner); } } }
  // eerdere hoofdfases (al uitgevoerd) heel subtiel grijs
  const ci0 = P.phases.findIndex(p => p.id === phase), done = P.phases.slice(0, Math.max(0, ci0)).filter(p => p.outline);
  if(done.length){ const g = node('g', {opacity:.13, 'pointer-events':'none'}, extLayer); for(const p of done) node('polygon', {points:pts(p.outline), fill:'#4a5660', stroke:'none'}, g); } // effen grijs waas, geen strepen
  const outline = P.phases.find(p => p.id === phase)?.outline;
  const pc = node('clipPath', {id:'phaseClip', clipPathUnits:'userSpaceOnUse'}, defs); if(outline) node('polygon', {points:pts(outline)}, pc);
  const workLayer = node('g', bounds.length ? {'clip-path':'url(#workClip)'} : {}, extLayer);
  const polys = node('g', outline ? {'clip-path':'url(#phaseClip)'} : {}, workLayer);
  if(e0.length && !P.shapes.some(s => s.phase === phase)) for(const r of e0) node('polygon', {points:pts(r), fill:'#e8bd60', 'fill-opacity':.12, stroke:COLORS.boundary, 'stroke-width':1.3 * k, 'pointer-events':'none'}, polys);
  const shapes = P.shapes.filter(s => s.phase === phase && inStep(s));
  shapes.sort((a, b) => { const r = s => stepVal === 'all' ? rankAll(s.kind) : isOpenK(s.kind) ? 0 : isDone(s, stepVal) ? 1 : s.step === Number(stepVal) ? 3 : 2; return r(a) - r(b); });
  const labels = [];
  const doneG = node('g', {opacity:.3, 'pointer-events':'none'}, polys); // gereed als één effen groen vlak (geen donkere overlap)
  const effSt = effStep(stepVal, phase);
  for(const s of shapes){ const ready = isDone(s, stepVal), active = stepVal === 'all' || s.step === Number(effSt), dim = kindFilter !== 'all' && kindFilter !== s.kind, op = dim ? .03 : ready ? .3 : stepVal === 'all' ? .16 : active ? .27 : .1, sel = s.id === selected;
    if(ready && !dim) node('polygon', {points:pts(s.points), fill:COLORS.G}, doneG);
    const n = node('polygon', {points:pts(s.points), fill:ready ? COLORS.G : kColor(s.kind), 'fill-opacity':ready && !dim ? 0 : op, stroke:sel ? '#102e43' : kColor(s.kind), 'stroke-width':(sel ? 2.5 : 1) * k, 'stroke-opacity':sel ? 1 : dim ? .12 : active ? 1 : .25}, polys); if(editableHere(s)) n.addEventListener('click', ev => beginSelect(s, ev)); else n.style.pointerEvents = 'none';
    if(active && !dim) labels.push(s); }
  for(const s of labels){ const x = s.label?.[0] ?? s.points.reduce((a, p) => a + p[0], 0) / s.points.length, y = s.label?.[1] ?? s.points.reduce((a, p) => a + p[1], 0) / s.points.length;
    const t = node('text', {x, y, fill:'#122f43', stroke:'white', 'stroke-width':3 * k, 'paint-order':'stroke', 'font-size':13 * k, 'text-anchor':'middle', 'font-weight':600, 'font-family':'Roboto,Arial,sans-serif'}, polys); t.textContent = shortTxt(workCode(s), 18); node('title', {}, t).textContent = workCode(s); if(editableHere(s)) t.addEventListener('click', ev => beginSelect(s, ev)); else t.style.pointerEvents = 'none'; }
  if(showPar && Number(stepVal) > 0) drawConcurrent(k);
  const lostN = e0.length ? P.shapes.filter(s => s.phase === phase && !s.points.some(q => e0.some(r => inPoly(q, r)))).length : 0;
  if(lostN && !draft.length) hint(`Let op: ${lostN} ${lostN === 1 ? 'werkvak ligt' : 'werkvakken liggen'} helemaal buiten de werkgrens en ${lostN === 1 ? 'is' : 'zijn'} daardoor onzichtbaar. Pas de werkgrens aan via Werkgrensvlakken.`);
  if(showOutline && outline){
    const editing = selected === 'phase-outline-' + phase;
    if(!e0.length) node('polygon', {points:pts(outline), fill:'none', stroke:COLORS.fase, 'stroke-width':(editing ? 2.2 : 1.5) * k, 'stroke-dasharray':`${8 * k} ${6 * k}`, 'pointer-events':'none'});
    else {
      // buiten de werkgrens: alleen een grove, lichte markering
      if(editing) node('polygon', {points:pts(outline), fill:'none', stroke:COLORS.fase, 'stroke-width':k, 'stroke-opacity':.35, 'stroke-dasharray':`${5 * k} ${6 * k}`, 'pointer-events':'none'});
      // de echte fasegrens = fasegrens binnen de werkgrens + werkgrens binnen de fasegrens
      const eff = node('g', {'pointer-events':'none'});
      node('polygon', {points:pts(outline), fill:'none', stroke:COLORS.fase, 'stroke-width':(editing ? 2.6 : 1.8) * k, 'stroke-linejoin':'round', 'clip-path':'url(#extClip)', ...(editing ? {} : {'stroke-dasharray':`${8 * k} ${5 * k}`})}, eff);
      const wg = node('g', {'clip-path':'url(#phaseClip)'}, eff); e0.forEach(r => node('polygon', {points:pts(r), fill:'none', stroke:COLORS.fase, 'stroke-width':(editing ? 2.6 : 1.8) * k, 'stroke-linejoin':'round', ...(editing ? {} : {'stroke-dasharray':`${8 * k} ${5 * k}`})}, wg));
    }
  }
  bounds.forEach(b => { if(b.id !== selected && untouchedCopy(b)) return; const n = node('polygon', {points:pts(b.points), fill:'none', stroke:COLORS.boundary, 'stroke-width':2 * k, 'stroke-dasharray':`${4 * k} ${3 * k}`}); n.style.pointerEvents = 'stroke'; n.addEventListener('click', ev => beginSelect(b, ev)); });
  if(S.canWrite && e0.length && (tool === 'extent' || (tool === 'select' && (stepVal === 'all' || selected.startsWith('ext-'))))){ const showNr = tool === 'extent' || selected.startsWith('ext-');
    e0.forEach((r, i) => { const id = 'ext-' + i;
      if(tool === 'select'){ const n = node('polygon', {points:pts(r), fill:'none', stroke:'transparent', 'stroke-width':10 * k}); n.style.pointerEvents = 'stroke'; n.style.cursor = 'pointer'; n.addEventListener('click', ev => { ev.stopPropagation(); stop(); multi.clear(); selBar = ''; selected = id; drawCtx(); drawList(); drawToolState(); render2(); }); }
      if(showNr){ const b = bboxOf(r); node('polygon', {points:pts(r), fill:id === selected ? '#167b70' : 'none', 'fill-opacity':.1, stroke:COLORS.boundary, 'stroke-width':(id === selected ? 3 : 2) * k, 'pointer-events':'none'});
        const t = node('text', {x:(b[0] + b[2]) / 2, y:(b[1] + b[3]) / 2, fill:'#0d4f48', stroke:'white', 'stroke-width':4 * k, 'paint-order':'stroke', 'font-size':22 * k, 'text-anchor':'middle', 'font-weight':700, 'font-family':'Roboto,Arial,sans-serif', 'pointer-events':'none'}); t.textContent = String(i + 1); } }); }
  P.routes.filter(r => r.phase === phase && routeVisible(r)).sort((a, b) => (b.kind === 'depot') - (a.kind === 'depot')).forEach(r => route(r)); // depots onderop, schildjes/routes erboven
  if(Number(stepVal) > 0){ const i = frameIndex(); for(const b of P.barriers){ if(b.phase !== phase || i < b.start || i >= b.end) continue; barrier(b, barPos(b, i).pos); } }
  if(draft.length){ const col = tool === 'fence' ? COLORS.fence : tool === 'baken' ? '#d62828' : tool === 'depot' ? DEPOT : tool === 'boundary' || tool === 'extent' ? COLORS.boundary : tool === 'outline' ? COLORS.fase : tool === 'polygon' ? kColor(newKind) : COLORS.walk, closed = ['polygon','boundary','outline','extent','depot'].includes(tool);
    node('polyline', {points:pts(draft), fill:closed ? col : 'none', 'fill-opacity':.13, stroke:col, 'stroke-width':2 * k, 'stroke-dasharray':`${6 * k} ${3 * k}`, 'pointer-events':'none'});
    draft.forEach(p => node('circle', {cx:p[0], cy:p[1], r:6.5 * k, fill:col, stroke:'white', 'stroke-width':1.8 * k, 'pointer-events':'none'})); }
  if(snapHit){ node(snapHit.v ? 'rect' : 'circle', snapHit.v ? {x:snapHit.q[0] - 9 * k, y:snapHit.q[1] - 9 * k, width:18 * k, height:18 * k, fill:'none', stroke:'#f5a300', 'stroke-width':2.5 * k, 'pointer-events':'none'} : {cx:snapHit.q[0], cy:snapHit.q[1], r:10 * k, fill:'none', stroke:'#f5a300', 'stroke-width':2.5 * k, 'pointer-events':'none'}); }
  if(autoEx?.status === 'result' && autoEx.cands[autoEx.ci]?.lines){ const g = node('g', {'pointer-events':'none'}); for(const [a, b] of autoEx.cands[autoEx.ci].lines) node('line', {x1:a[0], y1:a[1], x2:b[0], y2:b[1], stroke:'#f5a300', 'stroke-width':3 * k, 'stroke-dasharray':`${4 * k} ${3 * k}`}, g); }
  if(autoEx?.status === 'result'){ const c = autoEx.cands[autoEx.ci]; if(c) c.rings.forEach((r, i) => { const on = c.on[i], b = bboxOf(r);
    node('polygon', {points:pts(r), fill:on ? '#f5a300' : 'none', 'fill-opacity':.16, stroke:on ? '#c47f00' : '#8a949b', 'stroke-width':(on ? 3 : 1.5) * k, ...(on ? {} : {'stroke-dasharray':`${5 * k} ${4 * k}`}), 'pointer-events':'none'});
    const t = node('text', {x:(b[0] + b[2]) / 2, y:(b[1] + b[3]) / 2, fill:on ? '#7a4a00' : '#6f756f', stroke:'white', 'stroke-width':4 * k, 'paint-order':'stroke', 'font-size':24 * k, 'text-anchor':'middle', 'font-weight':700, 'font-family':'Roboto,Arial,sans-serif', 'pointer-events':'none'}); t.textContent = String(i + 1); }); }
  if(focusMark && focusMark.phase === phase){ const f = focusMark; node('circle', {cx:f.x, cy:f.y, r:26 * k, fill:'none', stroke:'#f5a300', 'stroke-width':3 * k, 'pointer-events':'none'}); node('circle', {cx:f.x, cy:f.y, r:4 * k, fill:'#f5a300', 'pointer-events':'none'});
    const t = node('text', {x:f.x + 30 * k, y:f.y - 18 * k, fill:'#7a4a00', stroke:'white', 'stroke-width':3 * k, 'paint-order':'stroke', 'font-size':14 * k, 'font-weight':700, 'font-family':'Roboto,Arial,sans-serif', 'pointer-events':'none'}); t.textContent = f.label; }
  const s = item(); if(s && tool === 'select' && !s.wholePhase && S.canWrite) handles(s, k);
  else if(s && s.wholePhase && tool === 'select') node('polygon', {points:pts(s.points), fill:'none', stroke:'#123f59', 'stroke-width':2 * k, 'stroke-dasharray':`${3 * k} ${3 * k}`, 'pointer-events':'none'});
  for(const id of multi){ const m = records().find(x => x.id === id); if(m && m.phase === phase) node(isClosedK(m.kind) ? 'polygon' : 'polyline', {points:pts(m.points), fill:'none', stroke:'#123f59', 'stroke-width':2.5 * k, 'stroke-dasharray':`${5 * k} ${3 * k}`, 'pointer-events':'none'}); }
}
// 'Selecteer gelijke': alle onderdelen van dezelfde soort in de getoonde werkgang (of de hele hoofdfase in het overzicht)
function selectSimilar(ref){ const st = Number(stepVal), i = frameIndex(); let list;
  if(P.barriers.includes(ref)) list = P.barriers.filter(b => b.phase === phase && (b.type || 'hek') === (ref.type || 'hek') && (i < 0 || (i >= b.start && i < b.end)));
  else { const isR = P.routes.includes(ref), src = isR ? P.routes : P.shapes; list = src.filter(x => x.phase === phase && x.kind === ref.kind && (!(st > 0) || x.step === st || (isR && x.step === 0))); }
  if(!list.includes(ref)) list.unshift(ref);
  multi.clear(); list.forEach(x => multi.add(x.id)); selected = ''; selBar = '';
  if(multi.size === 1){ multi.clear(); if(P.barriers.includes(ref)) selBar = ref.id; else selected = ref.id; }
  drawCtx(); drawList(); drawToolState(); render2();
  const nm = P.barriers.includes(ref) ? barLabel(ref, true) : P.shapes.includes(ref) ? 'vakken ' + kName(ref.kind).toLowerCase() : KIND_NAME[ref.kind].toLowerCase();
  toast(list.length + ' ' + nm + ' geselecteerd' + (st > 0 ? ' in werkgang ' + phase + '.' + st : ' in deze hoofdfase') + '.'); }
function toggleMulti(id){ if(!multi.size){ if(selected && !selected.startsWith('phase-outline-') && !P.boundaries.some(b => b.id === selected)) multi.add(selected); if(selBar) multi.add(selBar); }
  multi.has(id) ? multi.delete(id) : multi.add(id);
  if(multi.size === 1){ const only = [...multi][0]; multi.clear(); if(P.barriers.some(b => b.id === only)){ selBar = only; selected = ''; } else { selected = only; selBar = ''; } } else { selected = ''; selBar = ''; }
  drawCtx(); drawList(); drawToolState(); render2(); }
// in een werkgang kun je alleen de onderdelen van die werkgang (en routes die voor de hele hoofdfase gelden) aanpassen; de rest is alleen zichtbaar
function editableHere(s){ const n = Number(stepVal); return !(n > 0) || !(s.step > 0) || s.step === n || P.boundaries.includes(s); }
function beginSelect(s, e){ if(tool !== 'select' || space) return; if(!editableHere(s)) return; e.stopPropagation(); stop();
  if(e.shiftKey && (P.shapes.includes(s) || P.routes.includes(s))) return toggleMulti(s.id);
  multi.clear(); selected = s.id; selBar = ''; drawCtx(); drawList(); drawToolState(); render2(); }
// werkgangen die volgens het tijdschema tegelijk lopen: gestippeld, niet klikbaar
function drawConcurrent(k){ const cc = relatedRows(phase, stepVal); if(!cc.length) return;
  const g = node('g', {'pointer-events':'none', class:'conc'});
  for(const o of cc){ const r = o.r, soft = o.rel === 'voor', col = '#3b4650', vs = P.shapes.filter(s => s.phase === r.phase && s.step === r.step), sg = node('g', {opacity:soft ? .6 : 1}, g);
    for(const s of vs) node('polygon', {points:pts(s.points), fill:kColor(s.kind), 'fill-opacity':soft ? .06 : .12, stroke:col, 'stroke-width':1.8 * k, 'stroke-dasharray':`${7 * k} ${4 * k}`}, sg);
    for(const rt of P.routes.filter(x => x.phase === r.phase && (x.step === r.step || x.step === 0))) node('polyline', {points:pts(rt.points), fill:'none', stroke:rt.kind === 'fence' || rt.kind === 'baken' ? (rt.kind === 'baken' ? '#d62828' : COLORS.fence) : rt.kind === 'plate' ? COLORS.plate : COLORS.walk, 'stroke-width':(rt.kind === 'fence' ? 1.6 : 4) * k, 'stroke-opacity':.55, 'stroke-dasharray':`${4 * k} ${4 * k}`, 'stroke-linejoin':'round'}, sg);
    for(const b of (P.barriers || []).filter(b => b.phase === r.phase && r.step - 1 >= b.start && r.step - 1 < b.end)){ const q = barPos(b, r.step - 1).pos, hg = node('g', {transform:`translate(${q.x} ${q.y}) rotate(${q.angle || 0}) scale(${b.scale || .645})`, opacity:soft ? .35 : .5}, sg);
      symSvg(hg, b); }
    if(vs.length){ const all = vs.flatMap(s => s.points), bb = bboxOf(all);
      const t = node('text', {x:(bb[0] + bb[2]) / 2, y:bb[1] - 6 * k, fill:col, stroke:'white', 'stroke-width':3 * k, 'paint-order':'stroke', 'font-size':12 * k, 'text-anchor':'middle', 'font-style':'italic', 'font-weight':700, 'font-family':'Roboto,Arial,sans-serif'}, sg); t.textContent = relLabel(o); } } }
const COND = {buiten:'alleen buiten werktijden', tijdens:'alleen tijdens werktijden', anders:''};
function condText(r){ return r.cond === 'anders' ? (r.condTxt || 'met voorwaarde') : (COND[r.cond] || '') + (r.condTxt && r.cond !== 'anders' ? ' · ' + r.condTxt : ''); }
function routeMid(r){ let L = 0; for(let i = 1; i < r.points.length; i++) L += Math.hypot(r.points[i][0] - r.points[i - 1][0], r.points[i][1] - r.points[i - 1][1]); return L ? posAlong(r.points, L, L / 2)[0] : null; }
function route(s){ if(s.kind === 'fence') return fenceLine(s); if(s.kind === 'baken') return bakenLine(s); if(s.kind === 'depot') return depotShape(s); const g = node('g'), base = {points:pts(s.points), fill:'none', 'stroke-linejoin':'round', 'stroke-linecap':'round'}, w = (s.width || 14) * 2065/1600 * (s.kind === 'plate' ? 1.5 : 1);
  if(s.kind === 'plate'){ // rijroute als weg: asfalt met gele (tijdelijke) kantstrepen, geen middenlijn (geen twee rijrichtingen suggereren)
    node('polyline', {...base, stroke:'#2b2f33', 'stroke-width':w + 3}, g); node('polyline', {...base, stroke:'#f2c200', 'stroke-width':w}, g);
    node('polyline', {...base, stroke:'#5a6066', 'stroke-width':w * .82}, g); }
  else { // looproute: voetpad met tegelrand en voetganger-bordjes
    node('polyline', {...base, stroke:'white', 'stroke-width':w + 4}, g); node('polyline', {...base, stroke:COLORS.walk, 'stroke-width':w}, g); node('polyline', {...base, stroke:'#e3f3f1', 'stroke-width':w * .7}, g);
    node('polyline', {...base, stroke:COLORS.walk, 'stroke-width':Math.max(.8, w * .06), 'stroke-dasharray':`${w * .35} ${w * .35}`, 'stroke-opacity':.6, 'stroke-linecap':'butt'}, g);
    const rr = w * .62; for(const [x, y] of posAlong(s.points, w * 9, w * 3)){ const sg = node('g', {transform:`translate(${x} ${y})`, 'pointer-events':'none'}, g); node('circle', {r:rr, fill:'#1f5fa8', stroke:'white', 'stroke-width':rr * .14}, sg);
      const ig = node('g', {transform:`scale(${rr})`}, sg); node('path', {d:WALKER, stroke:'white', 'stroke-width':.16, 'stroke-linecap':'round', 'stroke-linejoin':'round', fill:'none'}, ig); node('circle', {cx:.02, cy:-.52, r:.15, fill:'white'}, ig); } }
  if(s.cond){ g.setAttribute('opacity', .5); node('polyline', {...base, stroke:'white', 'stroke-width':w * .8, 'stroke-dasharray':`${w * .25} ${w * .5}`, 'stroke-linecap':'butt', 'stroke-opacity':.8}, g); // gestreept = niet altijd beschikbaar
    const m = routeMid(s), k = px(); if(m){ const t = node('text', {x:m[0], y:m[1] - w / 2 - 4 * k, fill:'#7a4a00', stroke:'white', 'stroke-width':3 * k, 'paint-order':'stroke', 'font-size':12 * k, 'font-weight':700, 'text-anchor':'middle', 'font-family':'Roboto,Arial,sans-serif', 'pointer-events':'none'}); t.textContent = '⏱ ' + condText(s); } }
  const hit = node('polyline', {...base, stroke:'transparent', 'stroke-width':Math.max(w, 15 * px()), 'pointer-events':'stroke'}, g); hit.addEventListener('click', e => beginSelect(s, e)); }
function depotShape(s){ const g = node('g'), k = px(), sel = s.id === selected;
  node('polygon', {points:pts(s.points), fill:'none', stroke:'white', 'stroke-width':(sel ? 6 : 5) * k, 'stroke-linejoin':'round', 'pointer-events':'none'}, g);
  const n = node('polygon', {points:pts(s.points), fill:'url(#depotHatch)', stroke:DEPOT, 'stroke-width':(sel ? 3 : 2.4) * k, 'stroke-linejoin':'round'}, g); n.addEventListener('click', e => beginSelect(s, e));
  const a = depotM2(s), [cx, cy] = polyCenter(s.points), l1 = (s.code && s.code !== 'Depot' ? s.code : 'DEPOT').toUpperCase(), l2 = a !== null ? Math.round(a).toLocaleString('nl-NL') + ' m²' : '';
  const bw = Math.max(l1.length * 8.6, l2.length * 7, 50) * k, bh = (l2 ? 36 : 22) * k;
  node('rect', {x:cx - bw / 2, y:cy - bh / 2, width:bw, height:bh, rx:3 * k, fill:'white', 'fill-opacity':.9, stroke:DEPOT, 'stroke-width':1.2 * k, 'pointer-events':'none'}, g);
  const t = node('text', {x:cx, y:cy + (l2 ? -2.5 : 4.5) * k, fill:'#1f2a30', 'font-size':13 * k, 'font-weight':800, 'letter-spacing':.5 * k, 'text-anchor':'middle', 'font-family':'Roboto,Arial,sans-serif', 'pointer-events':'none'}, g); t.textContent = l1;
  if(l2){ const t2 = node('text', {x:cx, y:cy + 12.5 * k, fill:'#1f2a30', 'font-size':11 * k, 'text-anchor':'middle', 'font-family':'Roboto,Arial,sans-serif', 'pointer-events':'none'}, g); t2.textContent = l2; } }
function bakenLine(s){ const g = node('g'), base = {points:pts(s.points), fill:'none', 'stroke-linejoin':'round'}, sel = s.id === selected, sc = s.scale || lastHekScale.baken || .645;
  node('polyline', {...base, stroke:'#d62828', 'stroke-width':(sel ? 1.6 : 1) * px(), 'stroke-opacity':.55, 'stroke-dasharray':`${3 * px()} ${3 * px()}`, 'pointer-events':'none'}, g);
  for(const q of bakenPos(s)){ const sg = node('g', {transform:`translate(${q.x} ${q.y}) rotate(${q.angle}) scale(${sc})`, 'pointer-events':'none'}, g); symSvg(sg, {type:'baken'}); }
  const hit = node('polyline', {...base, stroke:'transparent', 'stroke-width':Math.max(10, 15 * px()), 'pointer-events':'stroke'}, g); hit.addEventListener('click', e => beginSelect(s, e)); }
function fenceLine(s){ const g = node('g'), base = {points:pts(s.points), fill:'none', 'stroke-linejoin':'round'}, sel = s.id === selected;
  node('polyline', {...base, stroke:'white', 'stroke-width':6.5, 'stroke-opacity':.95, 'stroke-linecap':'round'}, g);
  node('polyline', {...base, stroke:COLORS.fence, 'stroke-width':sel ? 2.6 : 1.8, 'stroke-linecap':'round'}, g);
  node('polyline', {...base, stroke:COLORS.fence, 'stroke-width':7, 'stroke-dasharray':'1.6 10', 'stroke-linecap':'butt'}, g);
  const hit = node('polyline', {...base, stroke:'transparent', 'stroke-width':Math.max(8, 14 * px()), 'pointer-events':'stroke'}, g); hit.addEventListener('click', e => beginSelect(s, e)); }
function barrier(b, pos){ const sel = b.id === selBar || multi.has(b.id), g = node('g', {'data-bid':b.id, transform:`translate(${pos.x} ${pos.y}) rotate(${pos.angle}) scale(${b.scale || .645})`, cursor:S.canWrite && tool === 'select' ? 'move' : 'default'});
  const bk = isBaken(b), bd = isBord(b); if(sel) node('rect', bd ? {x:-30, y:-30, width:60, height:72, fill:'none', stroke:'#102e43', 'stroke-width':3, 'stroke-dasharray':'6 4'} : bk ? {x:-20, y:-32, width:40, height:50, fill:'none', stroke:'#102e43', 'stroke-width':3, 'stroke-dasharray':'6 4'} : {x:-56, y:-22, width:112, height:62, fill:'none', stroke:'#102e43', 'stroke-width':3, 'stroke-dasharray':'6 4'}, g);
  symSvg(g, b);
  node('rect', bd ? {x:-27, y:-27, width:54, height:66, fill:'transparent'} : bk ? {x:-18, y:-30, width:36, height:46, fill:'transparent'} : {x:-50, y:-16, width:100, height:52, fill:'transparent'}, g);
  g.addEventListener('pointerdown', e => { if(tool !== 'select' || e.button !== 0 || space) return; e.stopPropagation(); e.preventDefault(); stop(); if(e.shiftKey) return toggleMulti(b.id); multi.clear(); selBar = b.id; selected = '';
    if(S.canWrite){ stash(); ensureSingle(b); drag = {type:'bar', b, target:b, start:point(e), orig:[b.x, b.y], moved:false}; svg.setPointerCapture(e.pointerId); }
    drawCtx(); drawList(); render2(); });
  g.addEventListener('click', e => e.stopPropagation());
  // draaigreep: sleep om te roteren (stappen van 5°, Shift = vrij)
  if(sel && S.canWrite && tool === 'select'){ const sc = b.scale || .645, k = px(), r = (isBaken(b) ? 34 : isBord(b) ? 36 : 58) * sc + 18 * k, a = pos.angle * Math.PI / 180, hx = pos.x + Math.sin(a) * r, hy = pos.y - Math.cos(a) * r;
    node('line', {x1:pos.x, y1:pos.y, x2:hx, y2:hy, stroke:'#102e43', 'stroke-width':1.2 * k, 'stroke-dasharray':`${3 * k} ${2 * k}`, 'pointer-events':'none'});
    const h = node('circle', {cx:hx, cy:hy, r:8.5 * k, fill:'#f5a300', stroke:'#102e43', 'stroke-width':1.5 * k, cursor:'grab'});
    const t = node('text', {x:hx + 9 * k, y:hy - 7 * k, 'font-size':11 * k, fill:'#102e43', stroke:'white', 'stroke-width':3 * k, 'paint-order':'stroke', 'font-weight':700, 'pointer-events':'none'}); t.textContent = Math.round(((pos.angle % 360) + 360) % 360) + '°';
    h.addEventListener('pointerdown', e => { if(e.button !== 0) return; e.stopPropagation(); e.preventDefault(); stash(); ensureSingle(b); drag = {type:'rot', b, target:b, c:[pos.x, pos.y], moved:false}; svg.setPointerCapture(e.pointerId); });
    h.addEventListener('click', e => e.stopPropagation()); } }
function rotateBar(b, d){ stash(); const t = ensureSingle(b); t.angle = Math.round(((((t.angle ?? 0) + d) % 360) + 360) % 360); changed(); drawCtx(); render2(); }
function removeVertex(id, i){
  const s = editable(id); if(!s) return;
  const closed = isClosedK(s.kind);
  if(s.points.length <= (closed ? 3 : 2)){ hint('Dit punt kan niet weg: een vlak heeft minimaal 3 punten, een route 2.'); render2(); return; }
  stash(); const base = clone(P), old = clone(s.points); s.points.splice(i, 1);
  if(['boundary','phaseBoundary'].includes(s.kind) && followBoundary) followBoundaryChange(base, s, old, {remove:i}); else if(P.shapes.includes(s)) followShape(s, base, {remove:i});
  s.label = null; changed(); if(s.kind === 'extent') saveExt(); render2(); hint(s.kind === 'extent' ? 'Punt verwijderd.' : 'Punt verwijderd. Ongedaan (Ctrl+Z) zet het terug.');
}
function handles(s, k){
  node(isClosedK(s.kind) ? 'polygon' : 'polyline', {points:pts(s.points), fill:'none', stroke:'#123f59', 'stroke-width':(s.kind === 'phaseBoundary' ? .8 : 2) * k, 'stroke-opacity':s.kind === 'phaseBoundary' ? .45 : 1, 'pointer-events':'none'});
  const closed = isClosedK(s.kind), len = s.points.length, isB = ['boundary','phaseBoundary'].includes(s.kind);
  s.points.forEach((p, i) => {
    if(i < len - 1 || closed){ const q = s.points[(i + 1) % len], mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; const g = node('g', {cursor:'copy'}); node('circle', {cx:mid[0], cy:mid[1], r:6 * k, fill:'#edf6f7', stroke:COLORS.boundary, 'stroke-width':1.2 * k}, g); const t = node('text', {x:mid[0], y:mid[1] + 4 * k, 'text-anchor':'middle', 'font-size':12 * k, fill:COLORS.boundary, 'font-weight':700}, g); t.textContent = '+';
      g.addEventListener('pointerdown', e => e.stopPropagation());
      g.addEventListener('click', e => { e.stopPropagation(); stash(); const base = clone(P), old = clone(s.points); s.points.splice(i + 1, 0, mid); if(isB && followBoundary) followBoundaryChange(base, s, old, {insert:i + 1}); else if(P.shapes.includes(s)) followShape(s, base, {insert:i + 1}); s.label = null; changed(); if(s.kind === 'extent') saveExt(); render2(); }); }
    const outside = s.kind === 'phaseBoundary' && ext().length && !ext().some(r => inPoly(p, r));
    const h = node('circle', {cx:p[0], cy:p[1], r:(outside ? 7.5 : 8.5) * k, fill:outside ? '#f4d6d4' : 'white', stroke:outside ? '#b0625d' : '#174f65', 'stroke-width':(outside ? 2 : 2.5) * k, cursor:'move'});
    h.addEventListener('pointerdown', e => { if(e.button !== 0) return; e.stopPropagation(); e.preventDefault();
      if(e.altKey){ if(s.points.length > (closed ? 3 : 2)){ stash(); const base = clone(P), old = clone(s.points); s.points.splice(i, 1); if(isB && followBoundary) followBoundaryChange(base, s, old, {remove:i}); else if(P.shapes.includes(s)) followShape(s, base, {remove:i}); s.label = null; changed(); if(s.kind === 'extent') saveExt(); render2(); } return; }
      stop(); stash(); drag = {type:'vertex', id:s.id, index:i, base:clone(P), extBase:clone(ext()), oldPoints:clone(s.points), moved:false, t0:Date.now(), x0:e.clientX, y0:e.clientY}; svg.setPointerCapture(e.pointerId); });
    h.addEventListener('click', e => e.stopPropagation());
  });
}

/* ---------- interactie ---------- */
function bindEditor(){
  $('#tools')?.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
  $('#undo') && ($('#undo').onclick = undo); $('#redo') && ($('#redo').onclick = redo);
  $('#showOutline').onchange = e => { showOutline = e.target.checked; render2(); };
  $('#showPar').onchange = e => { showPar = e.target.checked; render2(); };
  $('#bgGray').checked = bgGray; $('#bgGray').onchange = e => { bgGray = e.target.checked; try{ localStorage.setItem('lw-bgGray', bgGray ? '1' : ''); }catch(err){} bgLayer.style.filter = bgGray ? 'grayscale(1)' : ''; };
  $('#playScope').onchange = e => playScope = e.target.value;
  $('#play').onclick = play;
  $('#prevStep').onclick = () => stepBy(-1); $('#nextStep').onclick = () => stepBy(1);
  $('#zIn').onclick = () => zoom(.8); $('#zOut').onclick = () => zoom(1.25); $('#zFit').onclick = () => fit(); $('#zAll').onclick = () => { view = fitView([[0,0],[P.w,P.h]], 0); render2(); };
  $('#dFinish').onclick = () => finish(); $('#dCancel').onclick = () => { draft = []; drawToolState(); render2(); }; $('#dBack').onclick = () => { draft.pop(); drawToolState(); render2(); };
  svg.addEventListener('pointerdown', e => { if(e.button !== 0 && e.button !== 1) return; if((tool === 'select' && (e.target === svg || e.target.tagName === 'image' || e.target.closest?.('g') === bgLayer)) || space || e.button === 1 || tool !== 'select'){ drag = {type:'pan', x:e.clientX, y:e.clientY, view:[...view], moved:false, pid:e.pointerId}; svg.setPointerCapture(e.pointerId); } });
  svg.addEventListener('pointermove', e => { if(!drag){ if(['polygon','boundary','outline', ...ROUTE_KINDS].includes(tool) && S.canWrite){ snap(point(e), e, ['boundary','outline'].includes(tool) ? 'boundary' : 'shape'); render2(); } return; }
    if(drag.type === 'vertex'){ const s = editable(drag.id); if(!s) return; const isB = ['boundary','phaseBoundary'].includes(s.kind);
      s.points[drag.index] = snap(point(e), e, isB ? 'boundary' : 'shape'); if(isB && followBoundary) followBoundaryChange(drag.base, s, drag.oldPoints); else if(P.shapes.includes(s)) followShape(s, drag.base); s.label = null; drag.moved = true; skipClick = true; render2(); }
    else if(drag.type === 'rot'){ const p = point(e); let ang = Math.atan2(p[0] - drag.c[0], -(p[1] - drag.c[1])) * 180 / Math.PI; ang = ((ang % 360) + 360) % 360; if(!e.shiftKey) ang = Math.round(ang / 5) * 5 % 360; drag.target.angle = Math.round(ang * 10) / 10; drag.moved = true; render2(); }
    else if(drag.type === 'bar'){ const p = point(e); drag.target.x = Math.round((drag.orig[0] + p[0] - drag.start[0]) * 100) / 100; drag.target.y = Math.round((drag.orig[1] + p[1] - drag.start[1]) * 100) / 100; drag.moved = true; render2(); }
    else { const r = svg.getBoundingClientRect(), sc = Math.max(drag.view[2] / r.width, drag.view[3] / r.height), dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = drag.moved || Math.abs(dx) + Math.abs(dy) > 4; if(drag.moved){ view = [drag.view[0] - dx * sc, drag.view[1] - dy * sc, drag.view[2], drag.view[3]]; render2(); } } });
  const end = e => { snapHit = null; if(!drag){ return; } const d = drag; drag = null; if(svg.hasPointerCapture?.(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    if(d.type === 'vertex' && d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 3 && Date.now() - d.t0 < 350){ // trilling tijdens een klik telt niet als slepen
      P = JSON.parse(history.at(-1)); if(String(d.id).startsWith('ext-') && M) M.workExtent = d.extBase; d.moved = false; }
    if(d.type === 'vertex' && !d.moved && String(d.id).startsWith('ext-')){ skipClick = true; history.pop(); hint('Punten van de werkgrens verwijder je met Alt+klik. Sleep om te verplaatsen.'); }
    else if(d.type === 'vertex' && !d.moved && Date.now() - d.t0 < 500){ skipClick = true; history.pop(); removeVertex(d.id, d.index); }
    else if(d.type === 'vertex' || d.type === 'bar' || d.type === 'rot'){ skipClick = true; if(d.moved){ changed(); if(String(d.id).startsWith('ext-')) saveExt(); drawCtx(); } else if(history[history.length - 1] === JSON.stringify(P)){ history.pop(); } else { changed(); } if(remotePending) showRemoteBanner(); }
    else if(d.moved) skipClick = true; drawToolState(); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('click', e => { if(skipClick){ skipClick = false; return; } if(space) return; if(focusMark){ focusMark = null; render2(); }
    if(tool === 'pickColor'){ const p = point(e); tool = 'select'; exPick(p); return; }
    if(tool === 'select'){ if(selected || selBar || multi.size){ multi.clear(); selected = ''; selBar = ''; drawCtx(); drawList(); drawToolState(); render2(); } return; }
    if(!S.canWrite) return;
    if(tool === 'sign'){ if(!(Number(stepVal) > 0)) return hint('Kies eerst een werkgang.'); const p = point(e), i = frameIndex(); stash(); const b = {id:'hek-' + Math.random().toString(36).slice(2, 7), type:'bord', sign:curSign, phase, x:Math.round(p[0] * 100) / 100, y:Math.round(p[1] * 100) / 100, angle:0, scale:nextSignScale(), start:i, end:i + 1, moves:[]}; P.barriers.push(b); selBar = b.id; changed(); edRefresh(); hint(signOf(b.sign).n + ' geplaatst. Klik nog eens om er nog een te zetten, of kies een ander bord. Draaien met Q/E; V of Esc stopt.'); return; }
    if(tool === 'barrier'){ if(!(Number(stepVal) > 0)) return hint('Kies eerst een werkgang.'); const p = point(e), i = frameIndex(), bk = false; stash(); const b = {id:'hek-' + Math.random().toString(36).slice(2, 7), ...(bk ? {type:'baken'} : {}), phase, x:Math.round(p[0] * 100) / 100, y:Math.round(p[1] * 100) / 100, angle:0, scale:nextHekScale(), start:i, end:i + 1, moves:[]}; lastHekScale[S.pid + '|hek'] = P.hekScale = b.scale; P.barriers.push(b); selBar = b.id; tool = 'select'; changed(); edRefresh(); hint((bk ? 'Schildje' : 'Hek') + ' geplaatst in deze werkgang. Draai het met de oranje greep; met Kopie naar volgende werkgang zet je het ook in de volgende werkgang.'); return; }
    const p = tool === 'extent' ? point(e) : snap(point(e), e, ['boundary','outline'].includes(tool) ? 'boundary' : 'shape'); snapHit = null; draft.push(p); drawToolState(); render2(); });
  svg.addEventListener('dblclick', e => { if(draft.length && tool !== 'select'){ e.preventDefault(); draft.pop(); finish(); } });
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, point(e)); }, {passive:false});
  new ResizeObserver(() => render2()).observe($('#stage'));
}
// nieuwe werkgang achteraan; neemt de tijdelijke voorzieningen over van de huidige werkgang (of de laatste)
function newWerkgang(){ if(!S.canWrite || !finish(false)) return; stop(); const st = plannedSteps(), last = st.at(-1) || 0, n = last + 1, src = Number(stepVal) > 0 ? Number(stepVal) : last;
  stash(); let nr = 0, nb = 0, nv = 0;
  if(src){ for(const v of P.shapes.filter(x => x.phase === phase && x.step === src)){ const c = clone(v); c.id = uid(); c.step = n; c.code = nextCode(v.kind); delete c.wholePhase; delete c.label; P.shapes.push(c); nv++; }
    for(const r of P.routes.filter(r => r.phase === phase && r.step === src)){ const c = clone(r); c.id = uid(); c.step = n; delete c.wholePhase; P.routes.push(c); nr++; }
    for(const b of (P.barriers || []).filter(b => b.phase === phase && src - 1 >= b.start && src - 1 < b.end)){ const q = barPos(b, src - 1).pos; P.barriers.push({id:'hek-' + Math.random().toString(36).slice(2, 7), ...(b.type ? {type:b.type} : {}), phase, x:q.x, y:q.y, angle:q.angle ?? 0, scale:b.scale || .6453125000000001, start:n - 1, end:n, moves:[]}); nb++; } }
  if(!nr && !nb && !nv){ history.pop(); stepVal = String(n); newStep = n; tool = 'polygon'; newCode = nextCode(newKind); edRefresh(); hint('Nieuwe werkgang ' + phase + '.' + n + ': teken het eerste werkvak (er was niets om over te nemen).'); return; }
  changed(); multi.clear(); selected = ''; selBar = ''; stepVal = String(n); newStep = n; edRefresh();
  toast('Werkgang ' + phase + '.' + n + ' gemaakt' + (src ? ' als kopie van ' + phase + '.' + src + ': ' + [nv ? nv + ' werkvakken' : '', nr ? nr + ' routes/voorzieningen' : '', nb ? nb + ' hekken' : ''].filter(Boolean).join(', ') : '') + '. Pas de vakken aan of gooi weg wat niet meer nodig is.'); }
// werkgang weggooien: vakken, routes en hekken van die werkgang weg, latere werkgangen schuiven op
function deleteWerkgang(n){ if(!S.canWrite) return; stop(); stash();
  P.shapes = P.shapes.filter(x => !(x.phase === phase && x.step === n)); P.routes = P.routes.filter(x => !(x.phase === phase && x.step === n));
  P.barriers = (P.barriers || []).flatMap(b => { if(b.phase !== phase) return [b];
    if(n - 1 >= b.start && n - 1 < b.end){ if(b.end - b.start <= 1) return []; const c = {...b, end:b.end - 1, moves:(b.moves || []).filter(m => m.step !== n - 1).map(m => m.step > n - 1 ? {...m, step:m.step - 1} : m)}; return [c]; }
    if(b.start >= n) return [{...b, start:b.start - 1, end:b.end - 1, moves:(b.moves || []).map(m => ({...m, step:m.step - 1}))}];
    return [b]; });
  const w = P.schema?.werkgangen; if(w) delete w[phase + '.' + n];
  remapRefs(r => { const m = r.match(/^W:(.+)\.(\d+)$/); if(m && m[1] === phase){ const k = Number(m[2]); if(k === n) return null; if(k > n) return 'W:' + phase + '.' + (k - 1); } return r; });
  // schuif latere werkgangen één op, zodat er geen gat ontstaat
  for(const x of [...P.shapes, ...P.routes]) if(x.phase === phase && x.step > n) x.step--;
  if(w){ const out = {}; for(const [k, v] of Object.entries(w)){ const [ph, m] = k.split('.'); out[ph === phase && Number(m) > n ? ph + '.' + (Number(m) - 1) : k] = v; }
    for(const v of Object.values(out)) if(v.koppel){ const [kph, km] = v.koppel.slice(2).split('.'); if(kph === phase && Number(km) === n) delete v.koppel; else if(kph === phase && Number(km) > n) v.koppel = v.koppel[0] + ':' + kph + '.' + (Number(km) - 1); }
    P.schema.werkgangen = out; }
  multi.clear(); selected = ''; selBar = ''; const st = plannedSteps(); stepVal = st.length ? String(Math.min(n, st.at(-1))) : 'all'; changed(); edRefresh();
  toast('Werkgang ' + phase + '.' + n + ' weggegooid; latere werkgangen zijn één opgeschoven. Ctrl+Z zet hem terug.'); }
function stepBy(o){ const vals = ['all', ...plannedSteps().map(String), 'done'], i = vals.indexOf(stepVal); chooseStep(vals[Math.max(0, Math.min(vals.length - 1, i + o))]); }
function undo(){ if(draft.length){ draft.pop(); drawToolState(); render2(); return; } if(!history.length) return; future.push(JSON.stringify(P)); P = JSON.parse(history.pop()); fixSel(); changed(); edRefresh(); }
function redo(){ if(!future.length) return; history.push(JSON.stringify(P)); P = JSON.parse(future.pop()); fixSel(); changed(); edRefresh(); }
// Een extra werkgrens die nog precies gelijk is aan de werkgrens uit de tekening voegt niets toe: niet tonen en opruimen zodra hij niet meer geselecteerd is.
function untouchedCopy(b){ return ext().some(r => sameRing(r, b.points)); }
function dropUntouched(){ if(!S.canWrite || !P) return; const drop = P.boundaries.filter(b => b.id !== selected && untouchedCopy(b) && !P.shapes.some(x => x.boundarySource === b.id)); if(!drop.length) return; P.boundaries = P.boundaries.filter(b => !drop.includes(b)); changed(); }
// Lengte van routes en bouwhekken in meters (alleen met bekende schaal bij een PDF-tekening).
function routeLen(r){ let l = 0; for(let i = 1; i < r.points.length; i++) l += Math.hypot(r.points[i][0] - r.points[i - 1][0], r.points[i][1] - r.points[i - 1][1]); const sc = Number(M?.schaal); return sc > 0 ? l * 0.0254 / 72 * sc : null; }
function fmtM(m){ return m === null ? '' : Math.round(m).toLocaleString('nl-NL') + ' m'; }
function routeTotals(list){ const t = {}; for(const r of list){ const l = routeLen(r); if(l === null) continue; t[r.kind] = (t[r.kind] || 0) + l; } return ROUTE_KINDS.filter(k => t[k] && k !== 'baken' && k !== 'depot').map(k => ({kind:k, m:t[k]})); }
// Tijdelijke voorzieningen per hoofdfase (meters en losse hekken); later te combineren met de duur uit het tijdschema.
function voorzieningen(){ return P.phases.map(ph => { const t = {plate:0, fence:0, walk:0}; for(const r of P.routes.filter(r => r.phase === ph.id)){ const l = routeLen(r); if(l !== null) t[r.kind] = (t[r.kind] || 0) + l; } return {ph, ...t, hekken:barsIn(ph.id), bakens:barsIn(ph.id, undefined, 'baken')}; }); }
function hekText(n){ return n ? n + ' losse hekken (≈ ' + fmtM(n * 3.5) + ')' : ''; }
function bakText(n){ return n ? n + ' ' + (n === 1 ? 'schildje' : 'schildjes') : ''; }
function hbText(ph, n){ return [hekText(barsIn(ph, n)), bakText(barsIn(ph, n, 'baken')), bordText(barsIn(ph, n, 'bord'))].filter(Boolean).join(' · '); }
const isBaken = b => b.type === 'baken';
