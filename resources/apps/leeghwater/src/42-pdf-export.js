/* ================= PDF-export ================= */
const JSPDF_URL = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
let pdfBusy = false;
function stateOf(s, st){ const inS = st === 'all' || s.step > 0 && (st === 'done' || s.step <= Number(st));
  const ready = isDone(s, st), active = st === 'all' || s.step === Number(effStep(st, s.phase));
  return {inS, ready, active}; }
// Tekent één beeld van een hoofdfase op een werkgang, zoals in de editor.
async function frameCanvas(img, box, maxPx, ph, st, opts = {}){
  await signsReady();
  const w = box[2] - box[0], h = box[3] - box[1], sc = maxPx / Math.max(w, h), cw = Math.round(w * sc), ch = Math.round(h * sc);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d');
  const kx = img.naturalWidth / P.w, ky = img.naturalHeight / P.h;
  c.fillStyle = '#fff'; c.fillRect(0, 0, cw, ch); if(bgGray) c.filter = 'grayscale(1)'; c.drawImage(img, box[0] * kx, box[1] * ky, w * kx, h * ky, 0, 0, cw, ch); c.filter = 'none';
  const T = q => [(q[0] - box[0]) * sc, (q[1] - box[1]) * sc];
  const path = (rings, close = true) => { c.beginPath(); for(const pts of rings){ pts.forEach((q, i) => { const [x, y] = T(q); i ? c.lineTo(x, y) : c.moveTo(x, y); }); if(close) c.closePath(); } };
  const e0 = ext(), lw = Math.max(1, cw / 1400);
  const clipExt = () => { if(e0.length){ path(e0); c.clip(); } };
  if(opts.outline && ph){ // overzicht van één hoofdfase: alleen omkaderen, zonder vakken, routes en hekken
    const idx = P.phases.indexOf(ph), col = PHASE_COLORS[idx % PHASE_COLORS.length];
    c.save(); clipExt(); for(const p of P.phases.slice(0, Math.max(0, idx))) if(p.outline){ path([p.outline]); c.globalAlpha = .12; c.fillStyle = '#4a5660'; c.fill(); } c.restore(); c.globalAlpha = 1;
    const ring = ph.outline || (() => { const b = bboxOf(P.shapes.filter(s => s.phase === ph.id).flatMap(s => s.points)); return isFinite(b[0]) ? [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]] : null; })();
    if(ring){ c.save(); clipExt(); path([ring]); c.globalAlpha = .16; c.fillStyle = col; c.fill(); c.globalAlpha = 1; c.strokeStyle = '#fff'; c.lineWidth = 9 * lw; c.stroke(); c.strokeStyle = col; c.lineWidth = 5 * lw; c.stroke(); c.restore();
      if(e0.length){ c.save(); path([ring]); c.clip(); path(e0); c.strokeStyle = col; c.lineWidth = 5 * lw; c.stroke(); c.restore(); }
      const b = bboxOf(ring.filter(q => !e0.length || e0.some(r => inPoly(q, r))).concat(P.shapes.filter(s => s.phase === ph.id).flatMap(s => s.points)));
      if(isFinite(b[0])){ const [x, y] = T([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]); c.font = `bold ${Math.round(30 * lw)}px Helvetica, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 7 * lw; c.strokeStyle = '#fff'; c.fillStyle = col; c.strokeText(ph.name, x, y); c.fillText(ph.name, x, y); } }
    return cv; }
  if(opts.overview){
    c.save(); clipExt();
    P.phases.forEach((p, i) => { if(!p.outline) return; const col = PHASE_COLORS[i % PHASE_COLORS.length]; c.save(); path([p.outline]); c.clip(); c.globalAlpha = .28; c.fillStyle = col; c.fillRect(0, 0, cw, ch); c.restore(); });
    c.restore();
    P.phases.forEach((p, i) => { if(!p.outline) return; const col = PHASE_COLORS[i % PHASE_COLORS.length]; c.save(); clipExt(); path([p.outline]); c.strokeStyle = col; c.lineWidth = 3 * lw; c.stroke(); c.restore();
      const b = bboxOf(p.outline.filter(q => !e0.length || e0.some(r => inPoly(q, r))).concat(P.shapes.filter(s => s.phase === p.id).flatMap(s => s.points)));
      if(isFinite(b[0])){ const [x, y] = T([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]); c.font = `bold ${Math.round(22 * lw)}px Helvetica, Arial`; c.textAlign = 'center'; c.lineWidth = 5 * lw; c.strokeStyle = '#fff'; c.fillStyle = col; c.strokeText(p.name, x, y); c.fillText(p.name, x, y); } });
    return cv;
  }
  const idx = P.phases.indexOf(ph);
  // eerdere hoofdfases: licht grijs waas
  c.save(); clipExt(); for(const p of P.phases.slice(0, Math.max(0, idx))) if(p.outline){ path([p.outline]); c.globalAlpha = .13; c.fillStyle = '#4a5660'; c.fill(); } c.restore();
  // werkvakken, begrensd door werkgrens, fasegrens en extra werkgrens
  c.save(); clipExt(); if(ph.outline){ path([ph.outline]); c.clip(); } const bs = P.boundaries.filter(b => b.phase === ph.id); if(bs.length){ path(bs.map(b => b.points)); c.clip(); }
  const shapes = P.shapes.filter(s => s.phase === ph.id && stateOf(s, st).inS).sort((a, b) => { const r = s => st === 'all' ? rankAll(s.kind) : isOpenK(s.kind) ? 0 : stateOf(s, st).ready ? 1 : s.step === Number(st) ? 3 : 2; return r(a) - r(b); });
  for(const s of shapes){ const {ready, active} = stateOf(s, st); path([s.points]); c.globalAlpha = ready ? .3 : active ? .27 : .1; c.fillStyle = ready ? COLORS.G : kColor(s.kind); c.fill(); c.globalAlpha = active ? 1 : .25; c.strokeStyle = kColor(s.kind); c.lineWidth = lw; c.stroke(); }
  c.restore(); c.globalAlpha = 1;
  // gelijktijdige werkgangen uit andere hoofdfases: gestippeld
  if(Number(st) > 0 && showPar){ c.save(); clipExt();
    for(const o of relatedRows(ph.id, st)){ const r = o.r, col = '#3b4650', vs = P.shapes.filter(s => s.phase === r.phase && s.step === r.step), soft = o.rel === 'voor';
      c.setLineDash([7 * lw, 4 * lw]); c.lineWidth = 2 * lw;
      for(const v of vs){ path([v.points]); c.globalAlpha = soft ? .05 : .1; c.fillStyle = kColor(v.kind); c.fill(); c.globalAlpha = soft ? .55 : .9; c.strokeStyle = col; c.stroke(); }
      for(const rt of P.routes.filter(x => x.phase === r.phase && (x.step === r.step || x.step === 0))){ path([rt.points], false); c.globalAlpha = .5; c.setLineDash([4 * lw, 4 * lw]); c.strokeStyle = rt.kind === 'fence' || rt.kind === 'baken' ? (rt.kind === 'baken' ? '#d62828' : COLORS.fence) : rt.kind === 'plate' ? COLORS.plate : COLORS.walk; c.lineWidth = (rt.kind === 'fence' ? 1.6 : 4) * lw; c.stroke(); }
      c.setLineDash([]);
      for(const b of (P.barriers || []).filter(b => b.phase === r.phase && r.step - 1 >= b.start && r.step - 1 < b.end)){ const q = barPos(b, r.step - 1).pos, [x, y] = T([q.x, q.y]), s2 = (b.scale || .645) * sc;
        c.save(); c.globalAlpha = soft ? .35 : .5; c.translate(x, y); c.rotate((q.angle || 0) * Math.PI / 180); c.scale(s2, s2); symCv(c, b);
        c.restore(); }
      c.globalAlpha = soft ? .6 : 1;
      if(vs.length){ const bb = bboxOf(vs.flatMap(v => v.points)), [x, y] = T([(bb[0] + bb[2]) / 2, bb[1]]); c.font = `italic bold ${Math.round(14 * lw)}px Helvetica, Arial`; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.lineJoin = 'round'; c.lineWidth = 4 * lw; c.strokeStyle = '#fff'; c.fillStyle = col; c.strokeText(relLabel(o), x, y - 4 * lw); c.fillText(relLabel(o), x, y - 4 * lw); c.textBaseline = 'alphabetic'; } }
    c.restore(); c.globalAlpha = 1; c.setLineDash([]); }
  // fasegrens zoals hij echt werkt: binnen de werkgrens + langs de werkgrens
  if(ph.outline){ c.save(); clipExt(); path([ph.outline]); c.strokeStyle = COLORS.fase; c.lineWidth = 2.2 * lw; c.setLineDash([9 * lw, 5 * lw]); c.stroke(); c.restore();
    if(e0.length){ c.save(); path([ph.outline]); c.clip(); path(e0); c.strokeStyle = COLORS.fase; c.lineWidth = 2.2 * lw; c.setLineDash([9 * lw, 5 * lw]); c.stroke(); c.restore(); } }
  c.setLineDash([]);
  // routes en bouwhekken
  const rw = sc * 2065 / 1600;
  for(const r of P.routes.filter(r => r.phase === ph.id && (st === 'all' || r.step === 0 || String(r.step) === String(st))).sort((a, b) => (b.kind === 'depot') - (a.kind === 'depot'))){
    c.globalAlpha = 1; path([r.points], false); c.lineJoin = 'round'; c.lineCap = 'round';
    if(r.kind === 'depot'){ path([r.points]); c.save(); c.clip(); const bb = bboxOf(r.points).map(v => v * sc), o = T([0, 0]); c.fillStyle = 'rgba(207,216,220,.8)'; c.fillRect(bb[0] + o[0] - 2, bb[1] + o[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
      const pw = 14 * sc; c.strokeStyle = DEPOT; c.lineWidth = Math.max(.5, 1.3 * sc); c.lineCap = 'round'; c.beginPath();
      for(let yy = Math.floor((bb[1] + o[1]) / pw) * pw; yy < bb[3] + o[1] + pw; yy += pw) for(let xx = Math.floor((bb[0] + o[0]) / pw) * pw; xx < bb[2] + o[0] + pw; xx += pw){ const a0 = 4 * sc, a1 = 10 * sc; c.moveTo(xx + a0, yy + a0); c.lineTo(xx + a1, yy + a1); c.moveTo(xx + a1, yy + a0); c.lineTo(xx + a0, yy + a1); }
      c.stroke();
      c.restore(); path([r.points]); c.strokeStyle = '#fff'; c.lineWidth = Math.max(2, 5 * sc); c.stroke(); c.strokeStyle = DEPOT; c.lineWidth = Math.max(1.4, 2.4 * sc); c.stroke();
      { const [x, y] = T(polyCenter(r.points)), a = depotM2(r), t = (r.code && r.code !== 'Depot' ? r.code : 'DEPOT').toUpperCase() + (a !== null ? ' · ' + Math.round(a).toLocaleString('nl-NL') + ' m²' : '');
        c.font = `800 ${Math.max(9, 12 * Math.min(1.4, sc * 2))}px Roboto, Arial, sans-serif`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText(t, x, y + 4); c.fillStyle = '#1f2a30'; c.fillText(t, x, y + 4); }
      continue; }
    if(r.kind === 'baken'){ c.strokeStyle = 'rgba(214,40,40,.55)'; c.lineWidth = Math.max(.8, sc * .8); c.setLineDash([3 * sc, 3 * sc]); c.stroke(); c.setLineDash([]); const bs = r.scale || .645; for(const q of bakenPos(r)){ const [x, y] = T([q.x, q.y]); c.save(); c.translate(x, y); c.rotate(q.angle * Math.PI / 180); c.scale(bs * sc, bs * sc); symCv(c, {type:'baken'}); c.restore(); } continue; }
    if(r.kind === 'fence'){ c.strokeStyle = '#fff'; c.lineWidth = 6.5 * sc; c.stroke(); c.strokeStyle = COLORS.fence; c.lineWidth = Math.max(1.5, 1.8 * sc); c.stroke(); c.lineCap = 'butt'; c.setLineDash([1.6 * sc, 10 * sc]); c.lineWidth = 7 * sc; c.stroke(); c.setLineDash([]); continue; }
    const w = (r.width || 14) * rw * (r.kind === 'plate' ? 1.5 : 1); if(r.cond) c.globalAlpha = .5;
    if(r.kind === 'plate'){ c.strokeStyle = '#2b2f33'; c.lineWidth = w + 3 * sc; c.stroke(); c.strokeStyle = '#f2c200'; c.lineWidth = w; c.stroke(); c.strokeStyle = '#5a6066'; c.lineWidth = w * .82; c.stroke(); continue; }
    c.strokeStyle = '#fff'; c.lineWidth = w + 4 * sc; c.stroke(); c.strokeStyle = COLORS.walk; c.lineWidth = w; c.stroke(); c.strokeStyle = '#e3f3f1'; c.lineWidth = w * .7; c.stroke();
    c.strokeStyle = 'rgba(0,126,136,.6)'; c.lineWidth = Math.max(.6, w * .06); c.lineCap = 'butt'; c.setLineDash([w * .35, w * .35]); c.stroke(); c.setLineDash([]);
    for(const q of posAlong(r.points, w / sc * 9, w / sc * 3)){ const [x, y] = T(q); walkerCv(c, x, y, w * .62); } }
  c.globalAlpha = 1;
  // routes met voorwaarde (bv. alleen buiten werktijden): label
  for(const r of P.routes.filter(r => r.cond && r.phase === ph.id && (st === 'all' || r.step === 0 || String(r.step) === String(st)))){ const m = routeMid(r); if(!m) continue; const [x, y] = T(m), t = '⏱ ' + condText(r);
    c.font = `700 ${Math.max(9, 11 * Math.min(1.4, sc * 2))}px Roboto, Arial, sans-serif`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText(t, x, y - 8); c.fillStyle = '#7a4a00'; c.fillText(t, x, y - 8); }
  // hekken
  if(Number(st) > 0){ const i = Number(st) - 1; for(const b of P.barriers || []){ if(b.phase !== ph.id || i < b.start || i >= b.end) continue; const {pos} = barPos(b, i), [x, y] = T([pos.x, pos.y]), s2 = (b.scale || .645) * sc;
    c.save(); c.translate(x, y); c.rotate(pos.angle * Math.PI / 180); c.scale(s2, s2); symCv(c, b);
    c.restore(); } }
  // labels
  c.font = `bold ${Math.round(15 * lw)}px Helvetica, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for(const s of shapes){ if(!stateOf(s, st).active) continue; const [x, y] = T(s.label || [s.points.reduce((a, p) => a + p[0], 0) / s.points.length, s.points.reduce((a, p) => a + p[1], 0) / s.points.length]); const t = shortTxt(s.phase + '.' + s.code, 18);
    c.lineWidth = 4 * lw; c.strokeStyle = '#fff'; c.strokeText(t, x, y); c.fillStyle = '#122f43'; c.fillText(t, x, y); }
  return cv;
}
function phaseBox(ph){ const e0 = ext(); let pts = P.shapes.filter(s => s.phase === ph.id).flatMap(s => s.points);
  if(ph.outline) pts = pts.concat(ph.outline.filter(q => !e0.length || e0.some(r => inPoly(q, r))));
  if(!pts.length) pts = e0.flat(); if(!pts.length) pts = [[0, 0], [P.w, P.h]];
  const b = bboxOf(pts), pad = Math.max(30, (b[2] - b[0]) * .04); return [Math.max(0, b[0] - pad), Math.max(0, b[1] - pad), Math.min(P.w, b[2] + pad), Math.min(P.h, b[3] + pad)]; }

// Afdrukvoorbeeld: de PDF pagina voor pagina tonen (pdf.js), met Opslaan/Sluiten. Geeft true als er opgeslagen is.
function pdfPreview(blob, name, title){ return new Promise(async resolve => {
  const ov = document.createElement('div'); ov.className = 'pvw'; ov.innerHTML = `<div class="pvbar"><b>Afdrukvoorbeeld · ${esc(title)}</b><span class="faint" id="pvInfo">laden…</span><span class="spacer"></span>
    <button class="btn sm" id="pvZo" type="button" title="Kleiner">−</button><button class="btn sm" id="pvZi" type="button" title="Groter">+</button><button class="btn primary" id="pvSave" type="button">Opslaan als PDF</button><button class="btn" id="pvClose" type="button">Sluiten</button></div><div class="pvpages" id="pvPages"></div>`;
  document.body.append(ov); let done = false, zoom = 1;
  const close = ok => { if(done) return; done = true; ov.remove(); document.removeEventListener('keydown', esc1); resolve(ok); };
  const esc1 = e => { if(e.key === 'Escape') close(false); }; document.addEventListener('keydown', esc1);
  ov.querySelector('#pvClose').onclick = () => close(false);
  ov.querySelector('#pvSave').onclick = async () => { const ok = await saveFile(name, blob); if(ok) close(true); };
  try{ const lib = await pdfLib(), pdf = await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()), isEvalSupported:false}).promise, box = ov.querySelector('#pvPages');
    ov.querySelector('#pvInfo').textContent = pdf.numPages + (pdf.numPages === 1 ? ' pagina' : " pagina's");
    const render = async () => { box.replaceChildren(); const W = Math.min(1400, box.clientWidth - 40) * zoom;
      for(let i = 1; i <= pdf.numPages && !done; i++){ const pg = await pdf.getPage(i), v1 = pg.getViewport({scale:1}), dpr = Math.min(2, devicePixelRatio || 1), vp = pg.getViewport({scale:W / v1.width * dpr});
        const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; cv.style.width = (vp.width / dpr) + 'px'; cv.style.height = (vp.height / dpr) + 'px';
        const wrap = document.createElement('div'); wrap.className = 'pvpage'; wrap.append(cv); const lab = document.createElement('div'); lab.className = 'faint'; lab.textContent = 'Pagina ' + i + ' van ' + pdf.numPages; wrap.append(lab); box.append(wrap);
        await pg.render({canvasContext:cv.getContext('2d'), viewport:vp}).promise; } };
    ov.querySelector('#pvZi').onclick = () => { zoom = Math.min(2.5, zoom * 1.25); render(); }; ov.querySelector('#pvZo').onclick = () => { zoom = Math.max(.4, zoom / 1.25); render(); };
    await render();
  }catch(e){ ov.querySelector('#pvInfo').textContent = 'Voorbeeld kon niet geladen worden; je kunt de PDF wel opslaan.'; }
}); }
// Planning afdrukken: A3 liggend, tabel met data + balkenplanning (alleen werkdagen op de tijdas)
async function exportPlanningPdf(sink, o = {}){
  if(pdfBusy) return; const prog = t => { const el = $('#pdfProg'); if(el){ el.hidden = false; el.textContent = t; } };
  const R = planCompute(), cal = R.cal, lvl = o.lvl || 'alles';
  const fz = o.fases && o.fases.length && o.fases.length < P.phases.length ? new Set(o.fases) : null;
  const keep = n => { if(!n.start) return false; if(fz && n.type === 'uitv') return false; if(fz && (n.type === 'wg' || n.type === 'hf') && !fz.has(n.phase)) return false; if(fz && n.parent?.startsWith('H:') && !fz.has(n.parent.slice(2))) return false; if(o.int !== false && n.intern) return false; if(o.stop === false && n.type === 'stop') return false; if(lvl === 'hoofd' && !['groep', 'uitv', 'hf', 'mijl', 'stop'].includes(n.type)) return false; if(lvl === 'fase' && !['groep', 'uitv', 'hf', 'mijl'].includes(n.type)) return false; return true; };
  // regels van een interne groep vallen ook weg
  const hidden = new Set(R.nodes.filter(n => o.int !== false && n.intern).map(n => n.ref)); const items = R.nodes.filter(n => { let p = n.parent; while(p){ if(hidden.has(p)) return false; p = R.by[p]?.parent; } return keep(n); });
  if(!items.length) return prog('Vul eerst in het Tijdschema een startdatum in.');
  pdfBusy = true;
  try{
    prog('PDF-module laden…'); if(!window.jspdf) await loadScript(JSPDF_URL);
    const {jsPDF} = window.jspdf, doc = new jsPDF({orientation:'landscape', unit:'mm', format:'a3', compress:true}), logo = await gkbLogo();
    const PW = 420, PH = 297, MG = 12, when = new Date().toLocaleDateString('nl-NL', {day:'numeric', month:'long', year:'numeric'});
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const txt = (t, x, y, o2 = {}) => { doc.setFont('helvetica', o2.bold ? 'bold' : 'normal'); doc.setFontSize(o2.size || 9); doc.setTextColor(...hex(o2.color || '#262a26')); doc.text(pdfSan(t), x, y, {baseline:'top', align:o2.align || 'left'}); };
    const fit = (t, w, size) => { doc.setFontSize(size); let s2 = pdfSan(t); if(doc.getTextWidth(s2) <= w) return s2; while(s2.length > 1 && doc.getTextWidth(s2 + '…') > w) s2 = s2.slice(0, -1); return s2 + '…'; };
    const st0 = items.reduce((a, n) => n.start < a ? n.start : a, items[0].start), en0 = items.reduce((a, n) => n.eind > a ? n.eind : a, items[0].eind);
    const t0 = Math.min(tOf(st0), ...(o.base ? items.filter(n => n.base).map(n => tOf(n.base[0])) : [])), t1 = Math.max(tOf(en0), ...(o.base ? items.filter(n => n.base).map(n => tOf(n.base[1])) : []));
    const mon = t => t - ((new Date(t).getUTCDay() + 6) % 7) * DAY, a = mon(t0), weeks = Math.ceil((t1 - a) / DAY / 7) + 1, b = a + weeks * 7 * DAY;
    const C = [{t:'Nr', w:9}, {t:'Omschrijving', w:96}, {t:'Duur', w:14}, {t:'Start', w:21}, {t:'Eind', w:21}], TX = MG, GX = MG + C.reduce((s2, c) => s2 + c.w, 0) + 3, GW = PW - MG - GX;
    const x = t => { const d = (t - a) / DAY, wk = Math.floor(d / 7), dw = d - wk * 7; return GX + (wk * 5 + Math.min(dw, 5)) / (weeks * 5) * GW; };
    const RH = 5.6, TOP = 46, BOTTOM = PH - 24, vrij = vrijList(R.cfg.vrij), today = tOf(iso(Date.now()));
    const wdSpan = cal.idx(tOf(en0)) - cal.idx(tOf(st0)) + 1;
    let page = 0, y = 0;
    const head = () => { if(page++) doc.addPage();
      gkbHeader(doc, {PW, MG, title:lvl === 'alles' ? 'Planning' : 'Planning hoofdlijnen', sub:when, sub2:'', logo});
      txt(`${fmtD(st0, true)} t/m ${fmtD(en0, true)} · ${wdSpan} werkdagen · ${weeks} weken · weekenden niet getoond${o.base && planOf().base ? ' · grijs balkje = basisplanning ' + fmtD(iso(Date.parse(planOf().base.at)), true) : ''}`, MG, 25, {size:10, color:'#565c56'});
      let xx = TX; doc.setFillColor(...hex('#eef0ec')); doc.rect(TX, 33, GX - TX - 3, 13, 'F'); C.forEach(c => { txt(c.t, xx + 1.2, 40, {size:8.5, bold:true}); xx += c.w; });
      doc.setFillColor(...hex('#eef0ec')); doc.rect(GX, 33, GW, 13, 'F');
      let lastM = -99; const every = Math.max(1, Math.ceil(5 / (GW / weeks)));
      for(let i = 0; i < weeks; i++){ const t = a + i * 7 * DAY, xx2 = x(t), d = new Date(t);
        if((i === 0 || d.getUTCDate() <= 7) && xx2 - lastM > 17){ txt(MND[d.getUTCMonth()] + ' ' + d.getUTCFullYear(), xx2 + .8, 34.5, {size:8, bold:true, color:'#3b4650'}); lastM = xx2; }
        if(i % every === 0) txt(String(weekNr(iso(t))), xx2 + .5, 40.5, {size:6.5, color:'#6f756f'}); }
      y = TOP; };
    const grid = (y0, y1) => { doc.setDrawColor(...hex('#e1e4de')); doc.setLineWidth(.12); for(let i = 0; i <= weeks; i++){ const xx2 = x(a + i * 7 * DAY); doc.line(xx2, 33, xx2, y1); }
      for(let t = a; t < b; t += DAY){ const of = cal.off(t); if(of && of !== 'weekend' && !cal.vrij.has(iso(t))){ doc.setFillColor(...hex('#fff1d9')); doc.rect(x(t), y0, Math.max(.3, x(t + DAY) - x(t)), y1 - y0, 'F'); } }
      for(const v of vrij){ const s0 = Math.max(tOf(v.van), a), e0 = Math.min(tOf(v.tm) + DAY, b); if(!(s0 < e0)) continue; doc.setFillColor(...hex('#dfe3e6')); doc.rect(x(s0), y0, Math.max(.4, x(e0) - x(s0)), y1 - y0, 'F'); txt(v.naam || 'Vrij', x(s0) + .6, y1 + .8, {size:7, bold:true, color:'#565c56'}); }
      if(today >= a && today < b){ doc.setDrawColor(...hex('#b1402c')); doc.setLineWidth(.5); const tx = x(today + DAY / 2); doc.line(tx, y0, tx, y1); txt('vandaag', tx + .8, y1 + .8, {size:7, bold:true, color:'#b1402c'}); } };
    const diamond = (cx, cy, r, col) => { doc.setFillColor(...hex(col)); doc.triangle(cx - r, cy, cx, cy - r, cx + r, cy, 'F'); doc.triangle(cx - r, cy, cx, cy + r, cx + r, cy, 'F'); };
    const octa = (cx, cy, r, col) => { doc.setFillColor(...hex(col)); const pts = []; for(let k = 0; k < 8; k++){ const an = Math.PI / 8 + k * Math.PI / 4; pts.push([cx + r * Math.cos(an), cy + r * Math.sin(an)]); } for(let k = 0; k < 8; k++) doc.triangle(cx, cy, pts[k][0], pts[k][1], pts[(k + 1) % 8][0], pts[(k + 1) % 8][1], 'F'); };
    prog('Planning tekenen…');
    const minDepth = Math.min(...items.map(n => n.depth)), per = Math.max(1, Math.floor((BOTTOM - TOP) / RH));
    for(let i0 = 0; i0 < items.length; i0++){ const n = items[i0];
      if(i0 % per === 0){ head(); grid(TOP, TOP + Math.min(per, items.length - i0) * RH); }
      const grp = ['groep', 'uitv', 'hf'].includes(n.type), ind = (n.depth - minDepth) * 3;
      if(grp){ doc.setFillColor(...hex('#f4f5f2')); doc.rect(TX, y, GX - TX - 3, RH, 'F'); }
      const nm = n.type === 'wg' ? 'Werkgang ' + n.key + ' – ' + wgLabel(n) : (n.type === 'stop' ? 'STOP ' : '') + n.naam;
      let xx = TX; [String(n.nr), fit(nm, C[1].w - 2 - ind, grp ? 8.5 : 8), n.type === 'mijl' || (n.type === 'stop' && !n.wd) ? '' : n.wd + ' wd', fmtD(n.start, true), fmtD(n.eind, true)].forEach((v, i) => { txt(v, xx + 1.2 + (i === 1 ? ind : 0), y + 1.4, {size:i === 1 ? (grp ? 8.5 : 8) : 7.8, bold:grp || (i === 1 && n.type === 'stop'), color:i === 1 && n.type === 'stop' ? '#b1402c' : i === 0 ? '#6f756f' : '#262a26'}); xx += C[i].w; });
      if(o.base && n.base){ const b0 = x(tOf(n.base[0])), b1 = isMile(n) ? b0 + 1 : x(tOf(n.base[1]) + DAY); doc.setFillColor(...hex('#9aa3a9')); doc.rect(b0, y + RH - 1.6, Math.max(.6, b1 - b0), 1, 'F'); }
      const xs = x(tOf(n.start)), xe = x(tOf(n.eind) + DAY), w = Math.max(.8, xe - xs), cy = y + RH / 2 - .2;
      if(grp){ doc.setFillColor(...hex(n.type === 'hf' ? '#5d666d' : '#23303a')); doc.rect(xs, y + 1.6, w, 1.4, 'F'); doc.triangle(xs, y + 1.6, xs + 1.4, y + 1.6, xs, y + 3.8, 'F'); doc.triangle(xe, y + 1.6, xe - 1.4, y + 1.6, xe, y + 3.8, 'F'); }
      else if(n.type === 'stop' && !n.wd){ octa(xe - .4, cy, 1.5, n.stop?.status === 'vrij' ? '#439034' : n.stop?.status === 'gemeld' ? '#c98a1a' : '#c0392b'); txt(fmtD(n.eind), xe + 1.8, y + 1.5, {size:6.8, color:'#565c56'}); }
      else if(n.type === 'mijl'){ diamond(xe - .4, cy, 1.6, n.crit ? '#c0392b' : '#23303a'); txt(fmtD(n.eind), xe + 1.8, y + 1.5, {size:6.8, color:'#565c56'}); }
      else if(n.type === 'wg'){ const ks = kinds().filter(k => (n.vakken || []).some(v => v.kind === k)), hh = (RH - 2) / Math.max(1, ks.length); (ks.length ? ks : ['']).forEach((k, j) => { doc.setFillColor(...hex(k ? kColor(k) : '#7b858c')); doc.rect(xs, y + 1 + j * hh, w, hh, 'F'); }); doc.setDrawColor(...hex(n.crit ? '#c0392b' : '#23303a')); doc.setLineWidth(n.crit ? .45 : .15); doc.rect(xs, y + 1, w, RH - 2); }
      else { doc.setFillColor(...hex(n.type === 'stop' ? '#f0b7af' : n.crit ? '#c0392b' : '#5b7fa6')); doc.rect(xs, y + 1, w, RH - 2, 'F'); }
      if(!grp && n.pct){ doc.setFillColor(...hex('#1d211d')); doc.rect(xs, cy - .4, w * Math.min(100, n.pct) / 100, .8, 'F'); }
      doc.setDrawColor(...hex('#ebede8')); doc.setLineWidth(.12); doc.line(TX, y + RH, PW - MG, y + RH); y += RH; }
    // legenda
    let lx = MG; const ly = Math.min(BOTTOM + 4, y + 9), L = (col, l, shape) => { if(shape === 'd') diamond(lx + 2, ly + 2, 1.6, col); else if(shape === 'o') octa(lx + 2, ly + 2, 1.6, col); else { doc.setFillColor(...hex(col)); doc.rect(lx, ly + .5, 4, 3, 'F'); } txt(l, lx + 5.5, ly, {size:8.5}); lx += 10 + doc.getTextWidth(l); };
    L('#5b7fa6', 'Taak'); L('#c0392b', 'Kritiek pad'); L('#23303a', 'Mijlpaal', 'd'); if(o.stop !== false) L('#c0392b', 'Stoppunt', 'o'); WZ().forEach(w => L(w.kleur, w.naam)); L('#fff1d9', 'Feestdag'); L('#dfe3e6', 'Vrije periode');
    const tot = gkbFooter(doc, {PW, PH, MG, label:'Planning', when});
    if(sink){ prog(''); return sink(doc.output('blob'), slug(M.name) + '-planning-' + iso(Date.now()) + '.pdf', tot); }
    const ok = await pdfPreview(doc.output('blob'), slug(M.name) + '-planning-' + iso(Date.now()) + '.pdf', 'Planning');
    prog(ok ? `Planning-PDF gemaakt: ${tot} pagina${tot > 1 ? "'s" : ''}.` : 'Afdrukvoorbeeld gesloten zonder opslaan.');
  }catch(e){ prog('Planning afdrukken mislukt: ' + (e.message || e)); }
  finally{ pdfBusy = false; }
}
// GKB-huisstijl voor de PDF's: logo op elke pagina, witte kop met groene lijn
let gkbLogoCache = null;
async function gkbLogo(){ if(gkbLogoCache) return gkbLogoCache; const el = document.querySelector('.brand-logo'); if(!el) return null;
  try{ let s = el.outerHTML.replace(/class="brand-logo"[^>]*?(xmlns)/, '$1').replace('<svg ', '<svg width="600" height="600" ').replace('</svg>', '<style>.color-primary{fill:#439034}.color-grey{fill:#6d7175}.color-white{fill:#ffffff}</style></svg>');
    if(!/xmlns=/.test(s)) s = s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); await img.decode();
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const c = cv.getContext('2d'); c.drawImage(img, 0, 0, 600, 600); gkbLogoCache = cv.toDataURL('image/png'); return gkbLogoCache; }catch{ return null; } }
const pdfSan = t => String(t).replace(/≈\s?/g, 'ca. ').replace(/″/g, '"').replace(/′/g, "'").replace(/∥/g, '||').replace(/[→⇒]/g, '->').replace(/[✓✔]/g, 'v').replace(/[▦◆]/g, '');
function gkbHeader(doc, {PW, MG, title, sub, sub2, logo}){
  doc.setFillColor(255, 255, 255); doc.rect(0, 0, PW, 22, 'F');
  if(logo) doc.addImage(logo, 'PNG', MG - 1, 2.2, 17, 17, 'gkblogo', 'FAST');
  const tx = MG + (logo ? 20 : 0);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(29, 33, 29); doc.text(pdfSan(title), tx, 5.2, {baseline:'top'});
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(86, 92, 86); doc.text(pdfSan(M.name + (M.nummer ? '  ·  ' + M.nummer : '') + (M.opdrachtgever ? '  ·  ' + M.opdrachtgever : '')), tx, 13, {baseline:'top'});
  if(sub){ doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(67, 144, 52); doc.text(pdfSan(sub), PW - MG, 5.6, {baseline:'top', align:'right'}); }
  if(sub2){ doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(111, 117, 111); doc.text(pdfSan(sub2), PW - MG, 13, {baseline:'top', align:'right'}); }
  doc.setFillColor(67, 144, 52); doc.rect(0, 20.6, PW, 1.4, 'F'); doc.setFillColor(98, 102, 107); doc.rect(0, 22, PW, .35, 'F'); }
function gkbFooter(doc, {PW, PH, MG, label, when}){ const tot = doc.getNumberOfPages();
  for(let i = 1; i <= tot; i++){ doc.setPage(i); doc.setFillColor(67, 144, 52); doc.rect(MG, PH - 12.5, 14, .8, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(67, 144, 52); doc.text('GKB Groep', MG, PH - 10.6, {baseline:'top'});
    doc.setFont('helvetica', 'normal'); doc.setTextColor(111, 117, 111); doc.text(pdfSan(`${M.name}${M.nummer ? ' · ' + M.nummer : ''} · ${label} · ${when}`), MG + 18, PH - 10.6, {baseline:'top'}); doc.text(`Pagina ${i} van ${tot}`, PW - MG, PH - 10.6, {baseline:'top', align:'right'}); }
  return tot; }
async function exportPdf(opts, sink){
  if(pdfBusy) return; pdfBusy = true;
  const prog = t => { const el = $('#pdfProg'); if(el){ el.hidden = false; el.textContent = t; } };
  try{
    prog('PDF-module laden…');
    if(!window.jspdf) await loadScript(JSPDF_URL);
    const {jsPDF} = window.jspdf;
    prog('Tekening laden…');
    const img = new Image(); img.src = '/_blob/' + M.bg; await img.decode();
    if(!analysisDoc && analysisPid !== S.pid && S.db){ try{ const d = await S.db.doc('analyses/' + S.pid).get(); analysisDoc = d.exists ? d.data() : null; analysisPid = S.pid; }catch{} }
    const doc = new jsPDF({orientation:'landscape', unit:'mm', format:'a3', compress:true}), logo = await gkbLogo();
    const PW = 420, PH = 297, MG = 12, when = new Date().toLocaleDateString('nl-NL', {day:'numeric', month:'long', year:'numeric'});
    const sched = scheduleRows(), hasDates = sched.rows.some(r => r.start), PLN = sched.plan;
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const txt = (t, x, y, o = {}) => { doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size || 10); doc.setTextColor(...hex(o.color || '#262a26')); const s0 = pdfSan(t), lines = o.w ? doc.splitTextToSize(s0, o.w) : [s0]; doc.text(lines, x, y, {align:o.align || 'left', baseline:'top'}); return lines.length * (o.size || 10) * .3528 * 1.25; };
    const header = (title, sub, sub2) => gkbHeader(doc, {PW, MG, title, sub, sub2, logo});
    // legenda in groepen, met symbolen zoals op de kaart
    const LEG = () => { const W = WZ(), g = [['Werkzaamheden', W.map(w => ({t:w.naam, sw:'fill', col:w.kleur}))]];
      const st = [{t:'Nu bezig (vol gekleurd)', sw:'fill', col:'#7b858c'}, {t:'Volgt nog (licht)', sw:'fillL', col:'#7b858c'}]; if(wzOpt().afwerk && kinds().length > 1) st.push({t:'Gereed (groen)', sw:'fill', col:COLORS.G}); st.push({t:'Eerdere hoofdfase (grijs)', sw:'fillL', col:'#4a5660'}); g.push(['Status van een vak', st]);
      g.push(['Afzetting en routes', [{t:'Fasegrens', sw:'dash', col:COLORS.fase}, {t:'Bouwhekken', sw:'fence', col:COLORS.fence}, {t:'Rijroute', sw:'road'}, {t:'Looproute', sw:'walk', col:COLORS.walk}, {t:'Depot', sw:'depot'}]]); return g; };
    const grpH = g => 5.2 + g[1].length * 4.8 + 2, legendH = (cols = 1) => { const G = LEG(); return cols === 2 ? Math.max(grpH(G[0]) + grpH(G[1]), grpH(G[2])) : G.reduce((a, g) => a + grpH(g), 0); };
    const legend = (x, y, cols = 1, cw = 44) => { let yy = y, maxY = y; LEG().forEach(([kop, its], gi) => { if(cols === 2 && gi === 2){ maxY = Math.max(maxY, yy); yy = y; x += cw; } txt(kop, x, yy, {size:8.5, bold:true, color:'#6f756f'}); yy += 5.2;
        for(const it of its){ const sx = x, sy2 = yy + 1.9;
          if(it.sw === 'fill' || it.sw === 'fillL'){ doc.setFillColor(...hex(it.col)); if(it.sw === 'fillL'){ doc.setGState(new doc.GState({opacity:.3})); } doc.rect(sx, yy + .4, 7, 3.2, 'F'); doc.setGState(new doc.GState({opacity:1})); doc.setDrawColor(...hex(it.col)); doc.setLineWidth(.25); doc.rect(sx, yy + .4, 7, 3.2); }
          else if(it.sw === 'dash'){ doc.setDrawColor(...hex(it.col)); doc.setLineWidth(.6); doc.setLineDashPattern([1.6, .9], 0); doc.line(sx, sy2, sx + 7, sy2); doc.setLineDashPattern([], 0); }
          else if(it.sw === 'fence'){ doc.setDrawColor(...hex(it.col)); doc.setLineWidth(.45); doc.line(sx, sy2, sx + 7, sy2); doc.setFillColor(...hex(it.col)); for(let k = 0; k < 4; k++) doc.rect(sx + .3 + k * 2.1, sy2 - .9, .5, 1.8, 'F'); }
          else if(it.sw === 'road'){ doc.setFillColor(43, 47, 51); doc.rect(sx, sy2 - 1.5, 7, 3, 'F'); doc.setFillColor(242, 194, 0); doc.rect(sx, sy2 - 1.2, 7, 2.4, 'F'); doc.setFillColor(90, 96, 102); doc.rect(sx, sy2 - .95, 7, 1.9, 'F'); }
          else if(it.sw === 'walk'){ doc.setFillColor(...hex(it.col)); doc.rect(sx, sy2 - 1.2, 7, 2.4, 'F'); doc.setFillColor(227, 243, 241); doc.rect(sx, sy2 - .8, 7, 1.6, 'F'); }
          else if(it.sw === 'depot'){ doc.setFillColor(207, 216, 220); doc.rect(sx, yy + .2, 7, 3.4, 'F'); doc.setDrawColor(...hex(DEPOT)); doc.setLineWidth(.25); doc.rect(sx, yy + .2, 7, 3.4); for(let k = 0; k < 3; k++){ const cx = sx + 1.2 + k * 2.3; doc.line(cx - .6, yy + 1.2, cx + .6, yy + 2.6); doc.line(cx + .6, yy + 1.2, cx - .6, yy + 2.6); } }
          txt(cols === 2 ? fitTxt(it.t, cw - 10, 8.5) : it.t, sx + 9, yy + .1, {size:8.5}); yy += 4.8; } yy += 2; });
      return Math.max(maxY, yy) - y; };
    const place = (cv, x, y, w, h) => { const r = Math.min(w / cv.width, h / cv.height), iw = cv.width * r, ih = cv.height * r; doc.addImage(cv.toDataURL('image/jpeg', .78), 'JPEG', x + (w - iw) / 2, y + (h - ih) / 2, iw, ih, undefined, 'FAST'); doc.setDrawColor(...hex('#dfe2dc')); doc.setLineWidth(.3); doc.rect(x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); };
    const table = (x, y, cols, rows, o = {}) => { const rh = o.rh || 6.2, maxY = PH - 18; let yy = y; doc.setFillColor(...hex('#eef0ec')); doc.rect(x, yy, cols.reduce((a, c) => a + c.w, 0), rh, 'F'); let xx = x; cols.forEach(c => { txt(c.t, xx + 1.5, yy + 1.4, {size:8.5, bold:true, color:'#6f756f'}); xx += c.w; }); yy += rh;
      const TW = cols.reduce((a, c) => a + c.w, 0);
      for(const r of rows){ const hgt = r.group ? rh + 1 : Math.max(rh, ...cols.map((c, i) => r.cells[i] ? doc.splitTextToSize(pdfSan(r.cells[i]), c.w - 3).length * 4.1 + 2.2 : rh));
        if(yy + hgt > maxY){ o.onBreak?.(); yy = o.topY || 30; }
        if(r.group){ doc.setFillColor(...hex('#f4f5f2')); doc.rect(x, yy, cols.reduce((a, c) => a + c.w, 0), hgt, 'F'); }
        xx = x; if(r.group) txt(r.cells[0], x + 1.5, yy + 1.6, {size:9.5, w:TW - 3, bold:true}); else cols.forEach((c, i) => { if(r.cells[i] !== undefined && r.cells[i] !== '') txt(r.cells[i], xx + 1.5, yy + 1.3, {size:9, w:c.w - 3, color:r.colors?.[i]}); xx += c.w; });
        doc.setDrawColor(...hex('#ebede8')); doc.setLineWidth(.2); doc.line(x, yy + hgt, x + cols.reduce((a, c) => a + c.w, 0), yy + hgt); yy += hgt; }
      return yy; };
    const phases = P.phases.filter(p => opts.fases.includes(p.id));
    const pages = [];
    // gantt per hoofdfase: werkgangen van deze hoofdfase (met soort werk), stoppunten als rood teken, andere hoofdfases als grijze balk
    const wkName = r => kinds().filter(k => r.vakken.some(v => v.kind === k)).map(k => kName(k).replace(/werkzaamheden$/i, '').trim()).join(', ') || '—';
    const ganttRows = ph => { const out = []; for(const p of P.phases){ const rs = sched.rows.filter(x => x.phase === p.id && x.start); if(!rs.length) continue;
        if(p.id === ph.id){ out.push({kop:true, p, sp:spanOf(rs)}); rs.forEach(r => out.push({r, stops:PLN ? PLN.nodes.filter(n => n.type === 'stop' && n.start && n.task?.na === 'W:' + r.key) : []})); }
        else out.push({other:true, p, sp:spanOf(rs)}); } return out; };
    const ganttH = ph => { const n = ganttRows(ph).length; return n ? 7 + 9 + n * 5.4 + 5 : 0; };
    const phaseGantt = (x0, y0, w, ph, row) => { const rowsG = ganttRows(ph); if(!rowsG.length) return 0;
      // tijdas ingezoomd op deze hoofdfase (één week marge); andere hoofdfases lopen er afgekapt doorheen
      const mine = sched.rows.filter(r => r.start && r.phase === ph.id), t0 = Math.min(...mine.map(r => tOf(r.start))), t1 = Math.max(...mine.map(r => tOf(r.eind)));
      const a = t0 - ((new Date(t0).getUTCDay() + 6) % 7) * DAY - 7 * DAY, weeks = Math.max(8, Math.ceil((t1 + DAY - a) / DAY / 7) + 1), LW = 30, gx = x0 + LW, gw = w - LW, ww = gw / weeks, gEnd = a + weeks * 7 * DAY;
      const X0 = t => { const d = (t - a) / DAY, wk = Math.floor(d / 7), dw = d - wk * 7; return gx + (wk + Math.min(dw, 5) / 5) * ww; }, X = t => Math.max(gx, Math.min(gx + gw, X0(t))), RH = 5.4, top = y0 + 7 + 9;
      txt('Planning per week', x0, y0, {size:10.5, bold:true, color:'#439034'});
      doc.setFillColor(...hex('#eef0ec')); doc.rect(gx, y0 + 7, gw, 9, 'F');
      const step = Math.max(1, Math.ceil(4.6 / ww)); let lastM = -99;
      for(let i = 0; i <= weeks; i++){ const t = a + i * 7 * DAY, xx = gx + i * ww, d = new Date(t); if(ww > 5){ doc.setDrawColor(...hex('#f0f2ee')); doc.setLineWidth(.08); for(let k = 1; k < 5 && i < weeks; k++) doc.line(xx + k * ww / 5, top, xx + k * ww / 5, top + rowsG.length * RH); }
        doc.setDrawColor(...hex('#e1e4de')); doc.setLineWidth(.12); if(i % step === 0) doc.line(xx, y0 + 7, xx, top + rowsG.length * RH); if(i === weeks) break;
        if((d.getUTCDate() <= 7 || i === 0) && xx - lastM > 9){ txt(MND[d.getUTCMonth()] + (d.getUTCMonth() === 0 || i === 0 ? ' ' + d.getUTCFullYear() : ''), xx + .4, y0 + 7.4, {size:6.5, bold:true, color:'#3b4650'}); lastM = xx; }
        if(i % step === 0) txt((i === 0 ? 'wk ' : '') + weekNr(iso(t)), xx + .4, y0 + 11.6, {size:6, color:'#6f756f'}); }
      for(const v of vrijList(sched.cfg.vrij)){ const s0 = Math.max(tOf(v.van), a), e0 = Math.min(tOf(v.tm) + DAY, gEnd); if(s0 < e0){ doc.setFillColor(...hex('#dfe3e6')); doc.rect(X(s0), top, Math.max(.4, X(e0) - X(s0)), rowsG.length * RH, 'F'); txt(v.naam || 'vrij', X(s0) + .4, top + rowsG.length * RH + .5, {size:5.5, color:'#6f756f'}); } }
      rowsG.forEach((o, i) => { const yy = top + i * RH;
        if(o.kop || o.other){ if(o.kop){ doc.setFillColor(...hex('#e6f1e2')); doc.rect(x0, yy, w, RH, 'F'); }
          txt(fitTxt(o.p.name, LW - 1.5, 8), x0 + .8, yy + 1.2, {size:8, bold:true, color:o.kop ? '#1d211d' : '#8a9096'});
          const xs = X(tOf(o.sp.start)), xe = X(tOf(o.sp.eind) + DAY); if(xe - xs > .3){ doc.setFillColor(...hex(o.kop ? '#23303a' : '#c3c9cd')); doc.rect(xs, yy + 1.8, xe - xs, RH - 3.6, 'F'); }
          if(o.other){ const before = tOf(o.sp.eind) < a, after = tOf(o.sp.start) >= gEnd; if(before || after) txt(before ? '‹ eerder (' + fmtD(o.sp.start) + '–' + fmtD(o.sp.eind) + ')' : 'later (' + fmtD(o.sp.start) + '–' + fmtD(o.sp.eind) + ') ›', before ? gx + 1 : gx + gw - 1, yy + 1.4, {size:6, color:'#8a9096', align:before ? 'left' : 'right'}); } return; }
        const r = o.r, cur = row && r.key === row.key, dim = row && !cur, ks = kinds().filter(k => r.vakken.some(v => v.kind === k));
        if(cur){ doc.setFillColor(...hex('#fff4c8')); doc.rect(x0, yy, w, RH, 'F'); }
        txt(fitTxt(r.key + '  ' + wkName(r), LW - 2.5, 7.5), x0 + 2, yy + 1.3, {size:7.5, bold:cur, color:dim ? '#8a9096' : '#262a26'});
        const xs = X(tOf(r.start)), xe = X(tOf(r.eind) + DAY), bw = Math.max(.7, xe - xs), hh = (RH - 1.6) / Math.max(1, ks.length); txt(fmtD(r.start) + (r.eind !== r.start ? '–' + fmtD(r.eind) : ''), Math.min(xe + 1, gx + gw - 14), yy + 1.5, {size:5.8, color:dim ? '#a0a6aa' : '#565c56'});
        if(dim) doc.setGState(new doc.GState({opacity:.45}));
        (ks.length ? ks : ['']).forEach((k, j) => { doc.setFillColor(...hex(k ? kColor(k) : '#7b858c')); doc.rect(xs, yy + .8 + j * hh, bw, hh, 'F'); });
        doc.setGState(new doc.GState({opacity:1}));
        if(cur){ doc.setDrawColor(29, 33, 29); doc.setLineWidth(.5); doc.rect(xs - .3, yy + .5, bw + .6, RH - 1); }
        for(const s of o.stops){ const cx = X(tOf(s.start) + DAY / 2), cy = yy + RH / 2, rr = 1.15; doc.setFillColor(...hex(s.stop?.status === 'vrij' ? '#439034' : '#c0392b')); const pts = []; for(let k = 0; k < 8; k++){ const an = Math.PI / 8 + k * Math.PI / 4; pts.push([cx + rr * Math.cos(an), cy + rr * Math.sin(an)]); } for(let k = 0; k < 8; k++) doc.triangle(cx, cy, pts[k][0], pts[k][1], pts[(k + 1) % 8][0], pts[(k + 1) % 8][1], 'F'); } });
      doc.setDrawColor(...hex('#dfe2dc')); doc.setLineWidth(.2); doc.rect(gx, y0 + 7, gw, 9 + rowsG.length * RH);
      const today = tOf(iso(Date.now())), H = 9 + rowsG.length * RH; if(today >= a && today < gEnd){ const tx = X(today + DAY / 2); doc.setDrawColor(...hex('#b1402c')); doc.setLineWidth(.45); doc.line(tx, y0 + 7, tx, y0 + 7 + H); txt('vandaag', tx + .6, y0 + 7 + H + .5, {size:6, bold:true, color:'#b1402c'}); }
      const hasStop = rowsG.some(o => o.stops?.length); if(hasStop){ txt('rood achthoekje = stoppunt (melden bij directie)', x0, y0 + 7 + H + .5, {size:6.5, color:'#6f756f'}); }
      return 7 + H + 5; };
    const fitTxt = (t, wmax, size) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); let s2 = pdfSan(t); if(doc.getTextWidth(s2) <= wmax) return s2; while(s2.length > 1 && doc.getTextWidth(s2 + '…') > wmax) s2 = s2.slice(0, -1); return s2 + '…'; };
    // 1. informatiepagina
    prog('Informatiepagina…');
    header('Faseringsplanning', when, hasDates ? 'Uitvoering ' + fmtD(spanOf(sched.rows).start, true) + ' t/m ' + fmtD(spanOf(sched.rows).eind, true) : '');
    let y = 30; y += txt(M.name, MG, y, {size:24, bold:true, color:'#1d211d'}) + 2;
    const info = [['Projectnummer', M.nummer], ['Plaats', M.plaats], ['Opdrachtgever', M.opdrachtgever], ['Tekening', M.bgNaam], ['Schaal', M.schaal ? '1:' + M.schaal : ''], ['Hoofdfases', P.phases.length], ['Werkgangen', counts(P).steps], ['Werkvakken', P.shapes.length + (counts(P).pending ? ' (' + counts(P).pending + ' nog niet ingepland)' : '')],
      ...(hasDates ? [['Start uitvoering', fmtD(spanOf(sched.rows).start, true)], ['Gereed', fmtD(spanOf(sched.rows).eind, true)]] : []), ['Afgedrukt', when + (nameOf(S.meId) ? ' door ' + nameOf(S.meId) : '')]].filter(r => r[1] !== undefined && r[1] !== '');
    for(const [k, v] of info){ txt(k, MG, y, {size:10, color:'#6f756f'}); txt(v, MG + 38, y, {size:10, bold:true, w:95}); y += 6; }
    y += 4; txt('Legenda', MG, y, {size:11, bold:true, color:'#439034'}); y += 7; y += legend(MG, y) + 4;
    txt('Leeswijzer', MG, y, {size:11, bold:true, color:'#439034'}); y += 7;
    y += txt('Hoofdfases worden na elkaar uitgevoerd. Werkgang 2.3 is de derde werkgang van hoofdfase 2; vakken in dezelfde werkgang lopen tegelijk. Per hoofdfase volgt eerst een overzicht met de planning, daarna per werkgang een pagina met wat nu gebeurt (vol gekleurd), wat al gereed is (groen) en wat nog volgt (licht).', MG, y, {size:9.5, w:125, color:'#565c56'}) + 4;
    if(analysisDoc?.discipline?.naam){ txt('Discipline', MG, y, {size:11, bold:true, color:'#439034'}); y += 7; y += txt(analysisDoc.discipline.naam + '. ' + (analysisDoc.discipline.toelichting || ''), MG, y, {size:9.5, w:125, color:'#565c56'}); }
    const ovBox = ext().length ? bboxOf(ext().flat()) : [0, 0, P.w, P.h];
    place(await frameCanvas(img, [Math.max(0, ovBox[0] - 20), Math.max(0, ovBox[1] - 20), Math.min(P.w, ovBox[2] + 20), Math.min(P.h, ovBox[3] + 20)], 2600, null, 'all', {overview:true}), 150, 30, PW - 150 - MG, PH - 30 - 18);
    pages.push('Informatie');
    // 2. aandachtspunten uit de analyse
    if(opts.analyse && analysisDoc?.knelpunten?.length){
      prog('Aandachtspunten…'); doc.addPage(); header('Aandachtspunten', 'analyse ' + (analysisDoc.at ? fmtD(iso(Date.parse(analysisDoc.at)), true) : ''));
      let yy = 30; if(analysisDoc.samenvatting) yy += txt(analysisDoc.samenvatting, MG, yy, {size:10, w:PW - 2 * MG, color:'#565c56'}) + 4;
      const kn = [...analysisDoc.knelpunten].sort((a, b) => (ERNST_ORDER[a.ernst] ?? 3) - (ERNST_ORDER[b.ernst] ?? 3));
      const ec = {hoog:'#b1402c', middel:'#8a5a0f', laag:'#3d5f8f'};
      table(MG, yy, [{t:'Ernst', w:20}, {t:'Hoofdfase', w:28}, {t:'Knelpunt', w:90}, {t:'Toelichting', w:150}, {t:'Actie', w:108}], kn.map(k => ({cells:[k.ernst, P.phases.find(p => p.id === k.fase)?.name || '', k.titel, k.tekst, k.actie || ''], colors:[ec[k.ernst]]})),
        {onBreak:() => { doc.addPage(); header('Aandachtspunten (vervolg)', ''); }, topY:30});
      pages.push('Aandachtspunten');
    }
    // 3. per hoofdfase: overzicht, elke werkgang, eindbeeld
    for(const ph of phases){
      const steps = plannedSteps(ph.id), box = phaseBox(ph), frames = ['all', ...steps.map(String), ...(steps.length ? ['done'] : [])];
      for(const st of frames){
        prog(`${ph.name} · ${st === 'all' ? 'overzicht' : st === 'done' ? 'eindbeeld' : 'werkgang ' + ph.id + '.' + st}…`);
        await new Promise(r => setTimeout(r, 0));
        const r = st !== 'all' && st !== 'done' ? sched.rows.find(x => x.phase === ph.id && x.step === Number(st)) : null;
        doc.addPage(); header(st === 'all' ? ph.name + ' · overzicht' : st === 'done' ? ph.name + ' · eindbeeld' : 'Werkgang ' + ph.id + '.' + st, r?.start ? fmtD(r.start) + ' t/m ' + fmtD(r.eind, true) : ph.name, r?.start ? 'week ' + weekNr(r.start) + (weekNr(r.eind) !== weekNr(r.start) ? '–' + weekNr(r.eind) : '') : '');
        place(await frameCanvas(img, box, 2200, ph, st, st === 'all' ? {outline:true} : {}), MG, 27, 300, PH - 27 - 16);
        let sy = 29; const sx = 320, sw = PW - sx - MG;
        const line = (t, o) => { sy += txt(t, sx, sy, {w:sw, ...o}) + 1.5; };
        const byKind = arr => kinds().map(k => [k, arr.filter(s => s.kind === k).length]).filter(([, c]) => c).map(([k, c]) => kName(k) + ': ' + c + (c > 1 ? ' vakken' : ' vak'));
        const list = (title, arr, codes) => { if(!arr.length) return; line(title, {size:10.5, bold:true, color:'#439034'}); if(codes) for(const s of arr) line(s.phase + '.' + s.code + '  ' + kName(s.kind) + (s.step ? '' : ' (ongepland)'), {size:9.5}); else for(const t of byKind(arr)) line(t, {size:9.5}); sy += 2; };
        const sh = P.shapes.filter(s => s.phase === ph.id), gantt = () => { if(hasDates){ sy += 2; sy += phaseGantt(sx, sy, sw, ph, r); } };
        if(st === 'all'){ line(ph.name, {size:16, bold:true, color:'#1d211d'}); const g = sched.rows.filter(x => x.phase === ph.id); if(spanOf(g)) line(fmtD(spanOf(g).start, true) + ' t/m ' + fmtD(spanOf(g).eind, true), {size:10, color:'#565c56'});
          line(steps.length + ' werkgangen · ' + sh.length + ' werkvakken', {size:10}); gantt();
          const pend = sh.filter(s => !s.step); if(pend.length){ sy += 2; list('Nog niet ingepland', pend, true); } }
        else if(st === 'done'){ line('Eindbeeld ' + ph.name, {size:16, bold:true, color:'#1d211d'}); line('Alle werkgangen van deze hoofdfase uitgevoerd.' + (wzOpt().afwerk ? ' Groen = gereed.' : ''), {size:9.5, color:'#565c56'}); gantt(); list('Gereed', sh.filter(s => isDone(s, 'done'))); }
        else { const n = Number(st); line('Werkgang ' + ph.id + '.' + n, {size:16, bold:true, color:'#1d211d'});
          if(r?.start) line(fmtD(r.start, true) + ' t/m ' + fmtD(r.eind, true) + ' · ' + r.duur + ' werkdagen', {size:10, color:'#565c56'});
          if(r?.notitie) line(r.notitie, {size:9.5}); gantt();
          const cc = relatedRows(ph.id, st); if(cc.length){ line('Gelijktijdig (gestippeld op de kaart)', {size:10.5, bold:true, color:'#b8700f'}); for(const o of cc) line(relLabel(o), {size:9.5}); sy += 2; }
          list('Nu aan de beurt', sh.filter(s => s.step === n), true);
          if(wzOpt().afwerk) list('Al gereed', sh.filter(s => isDone(s, n)));
          list('Nog te doen', sh.filter(s => s.step > n));
          const stops = PLN ? PLN.nodes.filter(x => x.type === 'stop' && x.task?.na === 'W:' + ph.id + '.' + n && x.start) : [];
          if(stops.length){ line('Stoppunten in deze werkgang', {size:10.5, bold:true, color:'#b1402c'}); for(const s of stops) line(fmtD(s.start) + '  ' + s.naam + ' (melden ' + (s.stop?.meld ?? 2) + ' wd vooraf)', {size:9}); sy += 2; }
          const nb = hbText(ph.id, n), rt = P.routes.filter(x => x.phase === ph.id && x.step === n);
          if(nb || rt.length){ line('Afzetting en routes', {size:10.5, bold:true, color:'#439034'}); if(nb) line(nb, {size:9.5}); for(const k of ROUTE_KINDS){ const xs = rt.filter(x => x.kind === k); if(!xs.length || k === 'baken') continue; if(k === 'depot'){ line('Depot: ' + xs.map(x => { const a = depotM2(x); return a === null ? x.code : Math.round(a).toLocaleString('nl-NL') + ' m²'; }).join(', '), {size:9.5}); continue; } const m = xs.map(routeLen).reduce((a, v) => v === null ? a : (a || 0) + v, null); line(KIND_NAME[k] + ': ' + (m !== null ? fmtM(m) : xs.length + 'x') + (xs.some(x => x.cond) ? ' (' + [...new Set(xs.filter(x => x.cond).map(condText))].join('; ') + ')' : ''), {size:9.5}); } } }
        const lgH = legendH(2), lgY = Math.max(sy + 3, PH - 16 - lgH); if(lgY + lgH <= PH - 13) legend(sx, lgY, 2, sw / 2);
        pages.push(ph.id + '.' + st);
      }
    }
    const tot = gkbFooter(doc, {PW, PH, MG, label:'Faseringsplanning', when});
    prog('PDF opslaan…');
    const blob = doc.output('blob');
    if(sink){ prog(''); return sink(blob, slug(M.name) + '-faseringsplanning-' + iso(Date.now()) + '.pdf', tot); }
    prog('Afdrukvoorbeeld…'); const ok = await pdfPreview(blob, slug(M.name) + '-faseringsplanning-' + iso(Date.now()) + '.pdf', 'Faseringsplanning');
    prog(ok ? `PDF gemaakt: ${tot} pagina's.` : `Afdrukvoorbeeld gesloten zonder opslaan.`);
  }catch(e){ prog('PDF maken mislukt: ' + (e.message || e.code || e)); }
  finally{ pdfBusy = false; }
}

/* ---------- afdrukvoorbeeld op de pagina (altijd zichtbaar, maakt zichzelf bij) ---------- */
const pvS = {key:'', blob:null, name:'', tot:0, zoom:1, tok:0, want:false, pdf:null, pdfKey:''};
function pdfPhSel(){ try{ const v = JSON.parse(lsGet('lw-pdfph-' + S.pid) || 'null'); if(Array.isArray(v)){ const ok = v.filter(id => P.phases.some(p => p.id === id)); if(ok.length) return ok; } }catch{} return P.phases.map(p => p.id); }
function pdfKind(){ return lsGet('lw-pdfKind') === 'planning' ? 'planning' : 'fasering'; }
function pdfOpts(){ return {fases:[...document.querySelectorAll('[data-pdfph]')].filter(x => x.checked).map(x => x.dataset.pdfph), analyse:$('#pdfAn') ? $('#pdfAn').checked : true, lvl:$('#ppLvl')?.value || 'alles', int:$('#ppInt') ? $('#ppInt').checked : true, base:$('#ppBase') ? $('#ppBase').checked : false, stop:$('#ppStop') ? $('#ppStop').checked : true}; }
function hashStr(t){ let h = 0; for(let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; }
function pvKey(kind, o){ return kind + '|' + S.pid + '|' + hashStr(JSON.stringify([P, M.name, M.nummer, M.bg, o, analysisDoc?.at || '', iso(Date.now())])); }
function pvMsg(t){ const b = $('#pvInline'); if(b){ b.dataset.key = ''; b.innerHTML = `<div class="pvwait">${esc(t)}</div>`; } const sv = $('#pdfSave'); if(sv) sv.disabled = true; const inf = $('#pvInfo2'); if(inf) inf.textContent = ''; }
let pvTimer = 0; function pvSoon(){ clearTimeout(pvTimer); pvTimer = setTimeout(pvRefresh, 500); }
async function pvRefresh(){
  const box = $('#pvInline'); if(!box || box.closest('.closed')) return;
  const kind = pdfKind(), o = pdfOpts(), key = pvKey(kind, o);
  if(pvS.key === key && pvS.blob){ if(box.dataset.key !== key) pvShow(); return; }
  if(pdfBusy){ pvS.want = true; return; }
  if(kind === 'fasering' && !M.bg) return pvMsg('Nog geen tekening; laad eerst een tekening in op het tabblad Project.');
  if(kind === 'fasering' && !o.fases.length) return pvMsg('Kies minstens één hoofdfase.');
  pvS.want = false; pvMsg('Voorbeeld wordt gemaakt…');
  const got = await new Promise(res => { const sink = (blob, name, tot) => res({blob, name, tot}); (kind === 'fasering' ? exportPdf(o, sink) : exportPlanningPdf(sink, o)).then(() => res(null), () => res(null)); });
  if(got) Object.assign(pvS, got, {key});
  const b2 = $('#pvInline'); if(!b2) return;
  if(pvS.want || pvKey(pdfKind(), pdfOpts()) !== key) return pvRefresh();
  if(got) pvShow(); else pvMsg($('#pdfProg')?.textContent || 'Geen voorbeeld beschikbaar.');
}
async function pvShow(){
  const box = $('#pvInline'); if(!box || !pvS.blob) return; const tok = ++pvS.tok, key = pvS.key; box.dataset.key = key;
  $('#pvInfo2').textContent = pvS.tot + (pvS.tot === 1 ? ' pagina' : " pagina's"); $('#pdfSave').disabled = false; $('#pdfProg').hidden = true;
  try{ const lib = await pdfLib(); if(pvS.pdfKey !== key){ pvS.pdf = await lib.getDocument({data:new Uint8Array(await pvS.blob.arrayBuffer()), isEvalSupported:false}).promise; pvS.pdfKey = key; }
    if(tok !== pvS.tok || !box.isConnected) return; const pdf = pvS.pdf;
    box.replaceChildren(); const W = Math.max(280, (box.clientWidth - 44) * pvS.zoom), dpr = Math.min(2, devicePixelRatio || 1);
    const p1 = await pdf.getPage(1), v1 = p1.getViewport({scale:1}), Hh = W * v1.height / v1.width;
    const io = new IntersectionObserver(es => es.forEach(async e => { if(!e.isIntersecting) return; const wrap = e.target; io.unobserve(wrap); if(tok !== pvS.tok) return;
      const pg = await pdf.getPage(Number(wrap.dataset.pg)), vp = pg.getViewport({scale:W / pg.getViewport({scale:1}).width * dpr}), cv = wrap.querySelector('canvas');
      cv.width = vp.width; cv.height = vp.height; await pg.render({canvasContext:cv.getContext('2d'), viewport:vp}).promise; }), {root:box, rootMargin:'800px 0px'});
    for(let i = 1; i <= pdf.numPages; i++){ const wrap = document.createElement('div'); wrap.className = 'pvpage'; wrap.dataset.pg = i;
      const cv = document.createElement('canvas'); cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; wrap.append(cv);
      const lab = document.createElement('div'); lab.className = 'faint'; lab.textContent = 'Pagina ' + i + ' van ' + pdf.numPages; wrap.append(lab); box.append(wrap); io.observe(wrap); }
  }catch(e){ pvMsg('Voorbeeld kon niet getoond worden; je kunt de PDF wel opslaan.'); $('#pdfSave').disabled = false; }
}
function pvWire(){
  const sec = $('#pdfSec'); if(!sec) return;
  sec.querySelectorAll('[name="pdfKind"]').forEach(r => r.onchange = () => { lsSet('lw-pdfKind', r.value); renderAnalyse(); });
  sec.querySelectorAll('#pdfAn, #ppInt, #ppStop, #ppBase').forEach(c => c.onchange = pvSoon);
  const savePh = () => lsSet('lw-pdfph-' + S.pid, JSON.stringify([...sec.querySelectorAll('[data-pdfph]')].filter(x => x.checked).map(x => x.dataset.pdfph)));
  sec.querySelectorAll('[data-pdfph]').forEach(c => c.onchange = () => { savePh(); pvSoon(); });
  const q = sec.querySelector('#pdfPhQuick'); if(q) q.onchange = () => { if(!q.value) return; sec.querySelectorAll('[data-pdfph]').forEach(c => c.checked = q.value === '*' || c.dataset.pdfph === q.value); q.value = ''; savePh(); pvSoon(); }; const lv = sec.querySelector('#ppLvl'); if(lv){ lv.value = lsGet('lw-ppLvl') || 'alles'; lv.onchange = () => { lsSet('lw-ppLvl', lv.value); pvSoon(); }; }
  $('#pvZi2').onclick = () => { pvS.zoom = Math.min(2.5, pvS.zoom * 1.25); pvShow(); }; $('#pvZo2').onclick = () => { pvS.zoom = Math.max(.4, pvS.zoom / 1.25); pvShow(); };
  $('#pdfSave').onclick = async () => { if(!pvS.blob) return; const ok = await saveFile(pvS.name, pvS.blob); if(ok) toast('PDF opgeslagen: ' + pvS.name); };
  sec.addEventListener('unfold', pvRefresh);
  setTimeout(pvRefresh, 0);
}

/* ---------- handmatige backup ---------- */
function fullBackup(){ const mm = S.projects.find(p => p.id === S.pid) || M; return {format:'leeghwater-backup-v1', exportedAt:new Date().toISOString(),
  meta:{name:mm.name, nummer:mm.nummer, plaats:mm.plaats, opdrachtgever:mm.opdrachtgever, status:mm.status, schaal:mm.schaal || null, w:mm.w, h:mm.h, bg:mm.bg, bgNaam:mm.bgNaam, workExtent:mm.workExtent || []}, project:P}; }
async function manualBackup(label){
  if(!P) return; if(dirty) await flush();
  const json = JSON.stringify(P);
  await maybeBackup(S.pid, json, 'Handmatig' + (label ? ': ' + label : ''), true, 'handmatig');
  toast('Backup gemaakt en bewaard in Leeghwater.');
  const d = new Date(), stampF = iso(d.getTime()) + '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
  await saveFile(slug(M.name) + '-backup-' + stampF + (label ? '-' + slug(label).toLowerCase() : '') + '.json', JSON.stringify(fullBackup(), null, 2));
}

