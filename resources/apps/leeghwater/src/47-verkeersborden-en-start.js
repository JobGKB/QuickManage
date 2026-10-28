/* ---------- verkeersborden (TVM): catalogus en symbolen ---------- */
const SG_Y = '#ffd200', SG_R = '#c8102e', SG_B = '#1f5fa8', SG_K = '#1d1d1b';
const sgTri = f => `<path d="M50 8 L94 86 H6 Z" fill="${f}" stroke="${SG_R}" stroke-width="9" stroke-linejoin="round"/>`;
const sgCirc = f => `<circle cx="50" cy="50" r="42" fill="${f}" stroke="${SG_R}" stroke-width="11"/>`;
const sgRect = (f = SG_Y) => `<rect x="4" y="20" width="92" height="60" rx="5" fill="${f}" stroke="${SG_K}" stroke-width="3"/>`;
const sgTxt = (t, y, s = 15, w = 800) => `<text x="50" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${s}" font-weight="${w}" text-anchor="middle" fill="${SG_K}">${t}</text>`;
const SIGNS = [
  {c:'J16', n:'Werk in uitvoering', g:'Werk in uitvoering (TVM)', s:sgTri(SG_Y) + `<g stroke="${SG_K}" stroke-width="4.5" stroke-linecap="round" fill="none"><path d="M43 47 L50 63 L44 76 M50 63 L58 76 M36 55 L46 52 L60 46 M60 46 L70 70"/></g><circle cx="42" cy="40" r="6" fill="${SG_K}"/><path d="M60 78 Q70 64 82 78 Z" fill="${SG_K}"/>`},
  {c:'J17', n:'Rijbaanversmalling', g:'Werk in uitvoering (TVM)', s:sgTri('#fff') + `<path d="M38 80 V63 L45 50 V36 M62 80 V63 L55 50 V36" stroke="${SG_K}" stroke-width="5" fill="none"/>`},
  {c:'J37', n:'Gevaar (overig)', g:'Werk in uitvoering (TVM)', s:sgTri('#fff') + `<rect x="45.5" y="32" width="9" height="30" rx="2" fill="${SG_K}"/><circle cx="50" cy="72" r="5.5" fill="${SG_K}"/>`},
  {c:'VL', n:'Verkeerslichten', g:'Werk in uitvoering (TVM)', s:sgTri('#fff') + `<rect x="41" y="32" width="18" height="44" rx="4" fill="${SG_K}"/><circle cx="50" cy="40" r="5" fill="${SG_R}"/><circle cx="50" cy="54" r="5" fill="#f5a300"/><circle cx="50" cy="68" r="5" fill="#2e9e44"/>`},
  {c:'OML-L', n:'Omleiding links', g:'Werk in uitvoering (TVM)', s:sgRect() + `<path d="M80 44 H34" stroke="${SG_K}" stroke-width="9"/><path d="M18 44 L36 31 V57 Z" fill="${SG_K}"/>` + sgTxt('OMLEIDING', 72, 13)},
  {c:'OML-R', n:'Omleiding rechts', g:'Werk in uitvoering (TVM)', s:sgRect() + `<path d="M20 44 H66" stroke="${SG_K}" stroke-width="9"/><path d="M82 44 L64 31 V57 Z" fill="${SG_K}"/>` + sgTxt('OMLEIDING', 72, 13)},
  {c:'UB', n:'Let op: uitrit bouwverkeer', g:'Werk in uitvoering (TVM)', s:sgRect('#fff') + sgTxt('UITRIT', 46, 16) + sgTxt('BOUWVERKEER', 66, 12)},
  {c:'FA', n:'Fietsers afstappen', g:'Werk in uitvoering (TVM)', s:sgRect('#fff') + sgTxt('FIETSERS', 46, 15) + sgTxt('AFSTAPPEN', 66, 14)},
  {c:'A1-30', n:'Maximumsnelheid 30 km/u', g:'Geboden en verboden', s:sgCirc('#fff') + sgTxt('30', 63, 38)},
  {c:'A1-50', n:'Maximumsnelheid 50 km/u', g:'Geboden en verboden', s:sgCirc('#fff') + sgTxt('50', 63, 38)},
  {c:'C1', n:'Gesloten voor alle verkeer', g:'Geboden en verboden', s:sgCirc('#fff')},
  {c:'C2', n:'In te rijden verboden', g:'Geboden en verboden', s:`<circle cx="50" cy="50" r="46" fill="${SG_R}"/><rect x="17" y="42" width="66" height="16" fill="#fff"/>`},
  {c:'C7', n:'Verboden voor vrachtauto’s', g:'Geboden en verboden', s:sgCirc('#fff') + `<rect x="22" y="38" width="38" height="24" fill="${SG_K}"/><path d="M62 44 H71 L78 53 V62 H62 Z" fill="${SG_K}"/><circle cx="33" cy="66" r="5.5" fill="${SG_K}"/><circle cx="70" cy="66" r="5.5" fill="${SG_K}"/>`},
  {c:'C14', n:'Verboden voor fietsers', g:'Geboden en verboden', s:sgCirc('#fff') + `<g stroke="${SG_K}" stroke-width="4" fill="none" stroke-linejoin="round"><circle cx="33" cy="60" r="11"/><circle cx="67" cy="60" r="11"/><path d="M33 60 L45 44 H61 L67 60 M45 44 L52 60 H33 M61 44 L58 37 H52"/></g>`},
  {c:'B6', n:'Voorrang verlenen', g:'Geboden en verboden', s:`<path d="M6 14 H94 L50 92 Z" fill="#fff" stroke="${SG_R}" stroke-width="9" stroke-linejoin="round"/>`},
  {c:'D2', n:'Rechts aanhouden', g:'Geboden en verboden', s:`<circle cx="50" cy="50" r="45" fill="${SG_B}" stroke="#fff" stroke-width="3"/><path d="M32 30 L60 58" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M71 69 L48 64 L66 46 Z" fill="#fff"/>`},
  {c:'G7', n:'Voetpad', g:'Geboden en verboden', s:`<rect x="6" y="6" width="88" height="88" rx="8" fill="${SG_B}"/><circle cx="52" cy="26" r="7" fill="#fff"/><path d="M50 36 L46 58 L36 80 M46 58 L60 80 M34 50 L48 38 L62 50" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`},
];
const signOf = code => SIGNS.find(x => x.c === code) || SIGNS[0];
const signSvgStr = code => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${signOf(code).s}</svg>`;
const signUrl = code => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(signSvgStr(code));
const signImgs = {}; let signPromise = null;
function signsReady(){ if(signPromise) return signPromise; signPromise = Promise.all(SIGNS.map(sg => new Promise(res => { const im = new Image(); im.onload = () => res(); im.onerror = () => res(); im.src = signUrl(sg.c); signImgs[sg.c] = im; }))); return signPromise; }
const isBord = b => b.type === 'bord';
let curSign = lsGet('lw-sign') || 'J16';
function barLabel(b, plural){ return isBord(b) ? (plural ? 'verkeersborden' : 'Verkeersbord ' + signOf(b.sign).c.replace(/-.*$/, '') + ' · ' + signOf(b.sign).n) : isBaken(b) ? (plural ? 'schildjes' : 'Schildje') : (plural ? 'hekken' : 'Hek'); }
function bordText(n){ return n ? n + ' ' + (n === 1 ? 'verkeersbord' : 'verkeersborden') : ''; }
function signCatalog(){ const groups = [...new Set(SIGNS.map(s => s.g))];
  return groups.map(g => `<div class="sgg"><span class="sgh">${esc(g)}</span><div class="sgl">${SIGNS.filter(s => s.g === g).map(s => `<button type="button" class="sgb" data-sign="${s.c}" aria-pressed="${curSign === s.c}" title="${esc((/^[A-J]\d/.test(s.c) ? s.c.replace(/-.*$/, '') + ' ' : '') + s.n)}"><img src="${signUrl(s.c)}" alt=""><span>${esc(s.n)}</span></button>`).join('')}</div></div>`).join(''); }

const lastHekScale = {};
// grootte-schuif met invulveld in procenten (100% = standaardgrootte), zodat je overal exact dezelfde maat kunt zetten
function sizeField(id, label, val, ro, mixed){ return `<label class="l">${label}<span class="szrow"><input type="range" id="${id}" min="0.129" max="1.935" step="any" value="${val}" ${ro ? 'disabled' : ''}><input class="f szn" type="number" id="${id}N" min="20" max="300" step="1" value="${mixed ? '' : Math.round(val / .645 * 100)}" placeholder="${mixed ? 'verschillend' : ''}" ${ro ? 'disabled' : ''} aria-label="${label} in procenten"><span class="faint">%</span></span></label>`; }
function wireSizeFields(root){ if(!root || root._sz) return; root._sz = true;
  root.addEventListener('input', e => { const t = e.target; if(t.type !== 'range') return; const n = root.querySelector('#' + t.id + 'N'); if(n) n.value = Math.round(Number(t.value) / .645 * 100); });
  root.addEventListener('change', e => { const n = e.target; if(!n.classList?.contains('szn')) return; const r = root.querySelector('#' + n.id.slice(0, -1)); const pct = Math.max(20, Math.min(300, Number(n.value) || 100)); n.value = pct; if(!r) return;
    r.value = pct / 100 * .645; r.dispatchEvent(new Event('input', {bubbles:true})); r.dispatchEvent(new Event('change', {bubbles:true})); }); }
// schaal voor een nieuw hek: die van het laatst geplaatste of geschaalde hek in dit project
function nextHekScale(){ const k = S.pid + '|hek'; return lastHekScale[k] || P.hekScale || [...(P.barriers || [])].reverse().find(b => !isBaken(b) && !isBord(b))?.scale || .6453125000000001; }
function nextSignScale(){ return lastHekScale[S.pid + '|bord'] || [...(P.barriers || [])].reverse().find(isBord)?.scale || 1; }
// schildjes langs een lijn: tussenafstand in meters (standaard 2,5 m)
function bakenGap(r){ const u = unitM(); return u ? Math.max(18, (r.gap || 2.5) / u) : 30; }
// punten op vaste afstand langs een lijn (eerste op 'start')
function posAlong(points, gap, start = 0){ const out = []; let carry = start;
  for(let i = 1; i < points.length; i++){ const [a, b] = [points[i - 1], points[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if(!L) continue;
    for(let d = carry; d <= L + 1e-6; d += gap){ out.push([a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]); if(out.length > 300) return out; }
    carry = (carry - L) % gap; if(carry < 0) carry += gap; }
  return out; }
// voetganger-pictogram (wit) in een eenheidscirkel, als SVG-pad en voor canvas
const WALKER = 'M-.05 -.32 L-.08 .12 M-.08 .12 L-.38 .62 M-.08 .12 L.28 .62 M-.38 -.02 L-.06 -.26 L.32 .02';
function walkerCv(c, x, y, r){ c.save(); c.translate(x, y); c.fillStyle = '#1f5fa8'; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * .16; c.lineCap = 'round'; c.lineJoin = 'round'; c.scale(r, r);
  c.lineWidth = .16; const p = new Path2D(WALKER); c.stroke(p); c.fillStyle = '#fff'; c.beginPath(); c.arc(.02, -.52, .15, 0, Math.PI * 2); c.fill(); c.restore(); }
function bakenPos(r){ const out = [], gap = bakenGap(r); let carry = 0;
  for(let i = 1; i < r.points.length; i++){ const [a, b] = [r.points[i - 1], r.points[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if(!L) continue; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    for(let d = carry; d <= L + 1e-6; d += gap){ out.push({x:a[0] + (b[0] - a[0]) * d / L, y:a[1] + (b[1] - a[1]) * d / L, angle:ang}); if(out.length > 600) return out; }
    carry = (carry - L) % gap; if(carry < 0) carry += gap; }
  return out; }
// zwaartepunt van een vlak (valt het erbuiten, dan het midden van de breedste horizontale doorsnede)
function polyCenter(pts){ let a = 0, x = 0, y = 0; for(let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i + 1) % pts.length], f = p[0] * q[1] - q[0] * p[1]; a += f; x += (p[0] + q[0]) * f; y += (p[1] + q[1]) * f; }
  if(Math.abs(a) > 1e-9){ const c = [x / (3 * a), y / (3 * a)]; if(inPoly(c, pts)) return c; }
  const b = bboxOf(pts); let best = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], bw = -1;
  for(let t = 1; t < 10; t++){ const yy = b[1] + (b[3] - b[1]) * t / 10, xs = []; for(let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i + 1) % pts.length]; if((p[1] > yy) !== (q[1] > yy)) xs.push(p[0] + (yy - p[1]) * (q[0] - p[0]) / (q[1] - p[1])); }
    xs.sort((u, v) => u - v); for(let i = 0; i + 1 < xs.length; i += 2) if(xs[i + 1] - xs[i] > bw){ bw = xs[i + 1] - xs[i]; best = [(xs[i] + xs[i + 1]) / 2, yy]; } }
  return best; }
function depotM2(r){ const u = unitM(); return u ? polyArea(r.points) * u * u : null; }
function bakenCount(r){ const l = routeLen(r); return l === null ? bakenPos(r).length : Math.floor(l / (r.gap || 2.5)) + 1; }
// ware grootte: een los hek is 3,5 m (symbool 90 eenheden breed), een schildje ca. 0,8 m voet (26 eenheden)
function unitM(){ const sc = Number(M?.schaal); return sc > 0 ? 0.0254 / 72 * sc : null; }
function hekTrue(b){ const u = unitM(); if(!u) return null; return Math.round((isBord(b) ? .7 / u / 50 : isBaken(b) ? .8 / u / 26 : 3.5 / u / 90) * 1000) / 1000; }
// losse hekken (standaard) of schildjes/bakens (type 'baken'); n = werkgang
function barsIn(ph, n, type = 'hek'){ return (P.barriers || []).filter(b => b.phase === ph && (b.type || 'hek') === type && (n === undefined || (n - 1 >= b.start && n - 1 < b.end))).length
  + (type === 'baken' ? P.routes.filter(r => r.kind === 'baken' && r.phase === ph && (n === undefined || r.step === n || r.step === 0)).reduce((a, r) => a + bakenCount(r), 0) : 0); }
// symbool in lokale coördinaten (vóór schaal en rotatie)
function symSvg(g, b){
  if(isBord(b)){ node('rect', {x:-2, y:22, width:4, height:14, fill:'#55606a'}, g); node('rect', {x:-9, y:34, width:18, height:5, rx:1.5, fill:'#2f3a42'}, g); node('image', {href:signUrl(b.sign), x:-25, y:-25, width:50, height:50}, g); return; }
  if(isBaken(b)){ node('rect', {x:-13, y:4, width:26, height:9, rx:2, fill:'#2f3a42'}, g); node('rect', {x:-6, y:-26, width:12, height:32, fill:'white', stroke:'#394650', 'stroke-width':1.6}, g);
    [-26, -15, -4].forEach(y => node('polygon', {points:`-6,${y + 6} 6,${y} 6,${y + 5} -6,${y + 11}`, fill:'#d62828'}, g)); return; }
  [-28, 28].forEach(x => node('path', {d:`M${x} -2 V32 M${x - 10} 32 H${x + 10}`, stroke:'#394650', 'stroke-width':5, fill:'none'}, g));
  node('rect', {x:-45, y:-12, width:90, height:20, fill:'white', stroke:'#394650', 'stroke-width':2}, g);
  [-40, -10, 20].forEach(x => node('polygon', {points:`${x},6 ${x + 13},6 ${x + 23},-10 ${x + 10},-10`, fill:'#d62828'}, g)); }
function symCv(c, b){ const poly = pts => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
  if(isBord(b)){ c.fillStyle = '#55606a'; c.fillRect(-2, 22, 4, 14); c.fillStyle = '#2f3a42'; c.fillRect(-9, 34, 18, 5); const im = signImgs[b.sign]; if(im?.complete && im.naturalWidth) c.drawImage(im, -25, -25, 50, 50); return; }
  if(isBaken(b)){ c.fillStyle = '#2f3a42'; c.fillRect(-13, 4, 26, 9); c.fillStyle = '#fff'; c.strokeStyle = '#394650'; c.lineWidth = 1.6; c.fillRect(-6, -26, 12, 32); c.strokeRect(-6, -26, 12, 32);
    c.fillStyle = '#d62828'; for(const y of [-26, -15, -4]) poly([[-6, y + 6], [6, y], [6, y + 5], [-6, y + 11]]); return; }
  c.strokeStyle = '#394650'; c.lineWidth = 5; for(const x of [-28, 28]){ c.beginPath(); c.moveTo(x, -2); c.lineTo(x, 32); c.moveTo(x - 10, 32); c.lineTo(x + 10, 32); c.stroke(); }
  c.fillStyle = '#fff'; c.lineWidth = 2; c.fillRect(-45, -12, 90, 20); c.strokeRect(-45, -12, 90, 20);
  c.fillStyle = '#d62828'; for(const x of [-40, -10, 20]) poly([[x, 6], [x + 13, 6], [x + 23, -10], [x + 10, -10]]); }
function totalsText(list, sep = ' · '){ return routeTotals(list).map(t => KIND_NAME[t.kind] + ' ' + fmtM(t.m)).join(sep); }
function fixSel(){ if(!P.phases.some(p => p.id === phase)) phase = P.phases[0].id; if(selected && !item()) selected = ''; if(selBar && !P.barriers.some(b => b.id === selBar)) selBar = ''; }
function fitView(points, pad = 80){ const xs = points.map(p => p[0]), ys = points.map(p => p[1]), x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  const r = svg?.getBoundingClientRect(), ar = r && r.width ? r.height / r.width : .5; let vw = Math.max(250, w + 2 * pad), vh = Math.max(250, h + 2 * pad); if(vh / vw > ar) vw = vh / ar; else vh = vw * ar; return [x + w / 2 - vw / 2, y + h / 2 - vh / 2, vw, vh]; }
function fit(draw = true){ if(!P) return; const p = P.phases.find(p => p.id === phase), e0 = ext(); let points = p?.outline ? ringsFor(phase).flat().filter(q => inPoly(q, p.outline)).concat(p.outline.filter(q => !e0.length || e0.some(r => inPoly(q, r)))) : records().filter(s => s.phase === phase).flatMap(s => s.points); if(!points.length) points = ext().flat(); if(!points.length) points = [[0,0],[P.w,P.h]]; view = fitView(points); if(draw) render2(); }
function zoom(f, anchor){ const p = anchor || [view[0] + view[2] / 2, view[1] + view[3] / 2], w = Math.max(80, Math.min(P.w * 1.6, view[2] * f)), r = w / view[2]; view = [p[0] - (p[0] - view[0]) * r, p[1] - (p[1] - view[1]) * r, w, view[3] * r]; render2(); }
function finish(keep = true){
  if(!draft.length) return true; const closed = ['polygon','boundary','outline','extent','depot'].includes(tool);
  if(draft.length < (closed ? 3 : 2)){ draft = []; drawToolState(); render2(); return true; }
  if(tool === 'extent'){ const ring = draft.map(p => [...p]); draft = []; M.workExtent = [...ext(), ring]; saveExt('Uitsnede ' + ext().length + ' bewaard.'); if(!keep) tool = 'select'; edRefresh(); hint('Uitsnede ' + ext().length + ' bewaard. Teken het volgende losse vlak, of kies Klaar.'); return true; }
  const step = tool === 'boundary' || tool === 'outline' ? 0 : newStep;
  if(tool === 'outline'){ stash(); P.phases.find(p => p.id === phase).outline = draft.map(p => [...p]); draft = []; tool = 'select'; selected = 'phase-outline-' + phase; changed(); edRefresh(); hint('Fasegrens bewaard. Sleep de punten om hem bij te stellen.'); return true; }
  const code = tool === 'polygon' ? (newCode || '').trim() : tool === 'boundary' ? 'Werkgrens' : tool === 'plate' ? 'Rijroute' : tool === 'fence' ? 'Bouwhekken' : tool === 'baken' ? 'Schildjes' : tool === 'depot' ? 'Depot' : 'Looproute';
  if(!code){ hint('Geef het vak een code.'); return false; }
  if(tool === 'polygon' && P.shapes.some(s => s.phase === phase && s.code === code)){ hint('Code ' + code + ' bestaat al in deze hoofdfase. Kies een unieke code.'); toast('Code ' + code + ' bestaat al.'); return false; }
  stash(); const s = {id:uid(), phase, code, kind:tool === 'polygon' ? newKind : tool, step, width:14, points:draft.map(p => [...p])};
  (tool === 'boundary' ? P.boundaries : closed && tool !== 'depot' ? P.shapes : P.routes).push(s); draft = []; selected = s.id;
  if(tool === 'polygon'){ newCode = nextCode(newKind); if(step > 0) stepVal = String(step); } // meteen naar de werkgang van het nieuwe vak
  // na afronden meteen het nieuwe vak/de nieuwe route geselecteerd, zodat je het direct kunt aanpassen
  const was = tool; tool = 'select'; changed(); edRefresh(); if(keep) hint((was === 'polygon' ? 'Werkvak ' + code : KIND_NAME[was] || code) + ' bewaard en geselecteerd: pas het hiernaast of met de punten aan. Volgende tekenen? Druk ' + ({polygon:'W', plate:'R', walk:'L', fence:'B', baken:'S', depot:'D'}[was] || 'opnieuw op de knop') + '.'); return true;
}
function stop(){ clearInterval(timer); timer = null; const b = $('#play'); if(b) b.textContent = '▶ Afspelen'; }
function projectSequence(){ return P.phases.flatMap(p => { const st = plannedSteps(p.id); return st.length ? [...st.map(n => ({phase:p.id, step:String(n)})), {phase:p.id, step:'done'}] : []; }); }
function play(){
  if(timer){ stop(); $('#frame').hidden = true; return; } if(!finish(false)) return;
  tool = 'select'; selected = ''; selBar = ''; projectMode = playScope === 'project';
  const frames = projectMode ? projectSequence() : [...plannedSteps().map(String), 'done'].filter(() => plannedSteps().length).map(step => ({phase, step}));
  if(!frames.length) return hint('Plan eerst werkvakken in een werkgang.');
  const pend = P.shapes.filter(s => !s.step).length;
  hint(projectMode ? 'Het project speelt hoofdfase voor hoofdfase af.' + (pend ? ' ' + pend + ' ongeplande vakken worden overgeslagen.' : '') : 'Werkgangen binnen deze hoofdfase.');
  if(projectMode) view = fitView(P.phases.flatMap(p => p.outline || []).concat(ext().flat()).length ? P.phases.flatMap(p => p.outline || []).concat(ext().flat()) : [[0,0],[P.w,P.h]], 40);
  let i = 0; const show = () => { const f = frames[i]; phase = f.phase; stepVal = f.step; const ph = P.phases.find(p => p.id === phase);
    $('#frame').hidden = false; const sd = f.step !== 'done' ? schedFor(phase, f.step) : null; $('#frame').textContent = (ph?.name || '') + ' · ' + (f.step === 'done' ? 'gereed' : 'werkgang ' + phase + '.' + f.step) + (sd?.start ? ' · ' + fmtD(sd.start) + ' t/m ' + fmtD(sd.eind, true) : '');
    drawPhaseBar(); drawSteps(); drawCtx(); drawList(); drawToolState(); render2(); };
  show(); $('#play').textContent = '❚❚ Pauzeren';
  timer = setInterval(() => { i++; if(i >= frames.length){ stop(); return; } show(); }, 2600);
}
document.addEventListener('keydown', e => {
  if(S.view !== 'project' || S.tab !== 'planning' || !svg) return;
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if(e.code === 'Space'){ e.preventDefault(); space = true; return; }
  if(e.key === 'Escape'){ if(draft.length){ draft = []; drawToolState(); render2(); } else if(tool !== 'select') setTool('select'); else { selected = ''; selBar = ''; edRefresh(); } return; }
  if(e.key === 'Enter'){ if(draft.length){ e.preventDefault(); finish(); } return; }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); return; }
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key === 'Delete'){ if(selected || selBar || multi.size){ e.preventDefault(); removeSelected(); } return; }
  if(selBar && S.canWrite && ['q','e','Q','E'].includes(e.key)){ const b = P.barriers.find(x => x.id === selBar); if(b){ e.preventDefault(); rotateBar(b, (e.key.toLowerCase() === 'q' ? -1 : 1) * (e.shiftKey ? 1 : 15)); } return; }
  if(e.key === 'ArrowRight'){ stepBy(1); return; } if(e.key === 'ArrowLeft'){ stepBy(-1); return; }
  const map = {v:'select', w:'polygon', h:'barrier', s:'baken', r:'plate', l:'walk', b:'fence', d:'depot', t:'sign'}; const t = map[e.key.toLowerCase()]; if(t && S.canWrite) setTool(t);
});
document.addEventListener('keyup', e => { if(e.code === 'Space') space = false; });
window.addEventListener('blur', () => { space = false; });

render();
boot();
})();
