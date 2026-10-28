/* ---------- scherpe tekening: zichtbare stuk opnieuw uit de PDF renderen ---------- */
let bgGray = (() => { try{ return localStorage.getItem('lw-bgGray') === '1'; }catch(e){ return false; } })();
let pdfDoc = null, pdfFor = null, sharpImg = null, sharpKey = '', sharpTimer = 0, sharpTask = null, sharpUrl = null, sharpSeq = 0;
async function pdfLoad(){ if(!M?.pdf) return null; if(pdfFor === M.pdf) return pdfDoc; pdfFor = M.pdf; pdfDoc = null;
  try{ const lib = await pdfLib(); pdfDoc = await lib.getDocument({url:'/_blob/' + M.pdf, isEvalSupported:false}).promise; }catch(e){ console.warn('PDF laden mislukt', e); }
  return pdfDoc; }
function sharpSoon(){ if(!sharpImg || !svg) return; clearTimeout(sharpTimer); sharpTimer = setTimeout(sharpRender, 200); }
async function sharpRender(){
  const img = sharpImg, el = svg; if(!img || !el?.isConnected) return; const r = el.getBoundingClientRect(); if(!r.width || !r.height) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), sc = Math.min(r.width / view[2], r.height / view[3]), vw = r.width / sc, vh = r.height / sc;
  const x0 = view[0] - (vw - view[2]) / 2, y0 = view[1] - (vh - view[3]) / 2, base = (M.bgPx?.[0] || P.w) / P.w;
  if(sc * dpr <= base * .75){ img.setAttribute('width', 0); sharpKey = ''; return; } // basisafbeelding is scherp genoeg
  const rx0 = Math.max(0, x0), ry0 = Math.max(0, y0), rx1 = Math.min(P.w, x0 + vw), ry1 = Math.min(P.h, y0 + vh); if(rx1 <= rx0 || ry1 <= ry0) return;
  let f = sc * dpr; const maxPx = 16e6; if((rx1 - rx0) * (ry1 - ry0) * f * f > maxPx) f = Math.sqrt(maxPx / ((rx1 - rx0) * (ry1 - ry0)));
  const key = [rx0, ry0, rx1, ry1, f].map(v => Math.round(v * 10)).join(','); if(key === sharpKey) return;
  const doc = await pdfLoad(); if(!doc || img !== sharpImg) return;
  const seq = ++sharpSeq; try{ sharpTask?.cancel(); }catch(e){}
  try{ const page = await doc.getPage(1), vp1 = page.getViewport({scale:1}), S1 = f * vp1.width / P.w;
    const vp = page.getViewport({scale:S1, offsetX:-rx0 * f, offsetY:-ry0 * f}), cv = document.createElement('canvas');
    cv.width = Math.ceil((rx1 - rx0) * f); cv.height = Math.ceil((ry1 - ry0) * f); const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    sharpTask = page.render({canvasContext:ctx, viewport:vp, annotationMode:M.pdfAnnots ? window.pdfjsLib.AnnotationMode.ENABLE : window.pdfjsLib.AnnotationMode.DISABLE}); await sharpTask.promise;
    if(seq !== sharpSeq || img !== sharpImg) return;
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/png')); if(seq !== sharpSeq || !blob) return;
    if(sharpUrl) URL.revokeObjectURL(sharpUrl); sharpUrl = URL.createObjectURL(blob);
    Object.entries({href:sharpUrl, x:rx0, y:ry0, width:rx1 - rx0, height:ry1 - ry0}).forEach(([k, v]) => img.setAttribute(k, v)); sharpKey = key;
  }catch(e){ if(e?.name !== 'RenderingCancelledException') console.warn('Scherp renderen mislukt', e); }
}
function node(tag, attrs = {}, parent = ov){ const n = document.createElementNS(NS, tag); for(const k in attrs) n.setAttribute(k, attrs[k]); parent.append(n); return n; }
function edRefresh(){ if(!svg) return; drawPhaseBar(); drawSteps(); drawCtx(); drawList(); drawToolState(); render2(); updateTiles(); }
function defaultHint(){ hint(!S.canWrite ? 'Klik een werkgang om te zien wat al geweest is en wat nog volgt. Scroll om te zoomen, sleep om te verschuiven.' : tool === 'select' ? 'Klik een vak om het te bewerken; Shift+klik selecteert meerdere vakken, routes of hekken tegelijk. Sleep een hoekpunt; het snapt naar hoekpunten en lijnen van werkgrens, fasegrenzen en buurvakken (oranje markering). Houd Shift vast om vrij te plaatsen. + op een rand voegt een punt toe; kort klikken op een hoekpunt verwijdert het.' : tool === 'polygon' ? 'Klik de hoekpunten van het werkvak. Punten haken aan op werkgrens en buurvakken. Enter of Afronden sluit het vak.' : tool === 'barrier' ? 'Kies eerst een werkgang en klik dan op de kaart om een hek te plaatsen.' : tool === 'depot' ? 'Klik de hoekpunten van de depotruimte (opslag van grond, materiaal, keet). Enter of Afronden sluit het vlak; hij hoort bij de gekozen werkgang en mag buiten de werkgrens liggen.' : tool === 'baken' ? 'Klik de punten van de lijn met schildjes. Enter of Afronden bewaart hem; de schildjes komen op vaste afstand langs de lijn (aan te passen na selecteren).' : tool === 'fence' ? 'Klik de punten van de bouwhekken langs de afzetting. Enter of Afronden bewaart de lijn in de gekozen werkgang. Punten snappen naar vakken en grenzen.' : ROUTE_KINDS.includes(tool) ? 'Klik de routepunten. Enter of Afronden bewaart de route in de gekozen werkgang.' : tool === 'boundary' ? 'Teken een extra werkgrens voor deze hoofdfase. Deze beperkt het zichtbare gebied verder.' : tool === 'outline' ? 'Teken de rode fasegrens van deze hoofdfase. Binnen de werkgrens scheidt deze lijn de hoofdfases. Ligt de hoofdfase in twee viewports, teken dan één lijn om beide stukken heen; buiten de werkgrens mag hij over het lege papier lopen, dat telt niet mee.' : tool === 'extent' ? 'Klik de hoekpunten van de zwarte werkgrens (maximaal werkgebied). Je kunt meerdere losse uitsneden tekenen.' : ''); }

// Volgorde van hoofdfases = uitvoeringsvolgorde. Heten ze "Hoofdfase <nr>", dan worden nummer en naam meegenummerd (2.O1 wordt dan bijv. 3.O1).
function movePhase(dir){
  if(!S.canWrite || !finish(false)) return; stop();
  const i = P.phases.findIndex(p => p.id === phase), j = i + dir; if(i < 0 || j < 0 || j >= P.phases.length) return;
  stash(); const arr = P.phases, idI = arr[i].id, idJ = arr[j].id; [arr[i], arr[j]] = [arr[j], arr[i]];
  const numbered = arr.every(p => /^\d+$/.test(p.id) && p.name === 'Hoofdfase ' + p.id);
  if(P.schema?.werkgangen) P.schema = clone(P.schema);
  if(numbered){
    const map = Object.fromEntries(arr.map((p, k) => [p.id, String(k + 1)]));
    arr.forEach(p => { p.id = map[p.id]; p.name = 'Hoofdfase ' + p.id; });
    for(const key of ['shapes','boundaries','routes','barriers']) for(const r of P[key] || []) if(map[r.phase]) r.phase = map[r.phase];
    phase = map[phase]; swapPhaseSchema(Object.fromEntries(Object.entries(map).filter(([a, b]) => a !== b)), {});
  } else swapPhaseSchema({}, {[idI]:idJ, [idJ]:idI});
  selected = ''; selBar = ''; changed(); edRefresh();
  // vaste startdatums midden in een verwisselde hoofdfase kunnen nu vóór de vorige werkgang vallen: melden, niet stilletjes aanpassen
  const sw = new Set([arr[i].id, arr[j].id]), rows = schedAny().rows || [], wgs = P.schema?.werkgangen || {};
  const prevOf = r => rows.find(x => x.phase === r.phase && x.step === r.step - 1);
  const bots = [...sw].filter(ph => rows.some(r => r.phase === ph && r.step > 1 && r.start && (q => q?.start && r.start < q.start)(prevOf(r)))).map(ph => ({ph, vast:rows.filter(r => r.phase === ph && r.step > 1 && wgs[r.key]?.vast)}));
  hint('Volgorde aangepast: de hoofdfases wisselen van plek in de tijd. De startdatum en koppeling van de eerste werkgang blijven bij de plek in de volgorde, de werkgangen zelf gaan mee met hun hoofdfase.' + (numbered ? ' De hoofdfases zijn opnieuw genummerd.' : '') + ' Ongedaan maken zet alles terug.');
  if(bots.length) toast('Let op: in ' + bots.map(b => 'hoofdfase ' + b.ph + (b.vast.length ? ' (vaste start bij ' + b.vast.map(r => r.key + ' op ' + fmtD(r.start)).join(', ') + ')' : '')).join(' en ') + ' staan werkgangen nu niet meer op volgorde in de tijd. Controleer de vaste datums in het Tijdschema.', 10000);
}
function drawPhaseBar(){
  const el = $('#phaseBar'); if(!el) return;
  el.innerHTML = P.phases.map(p => { const n = plannedSteps(p.id).length, pend = P.shapes.filter(s => s.phase === p.id && !s.step).length;
    const i = P.phases.indexOf(p), cur = p.id === phase && S.canWrite && P.phases.length > 1;
    return `${cur ? `<button type="button" class="mv" data-mv="-1" ${i === 0 ? 'disabled' : ''} title="Eerder uitvoeren" aria-label="Hoofdfase eerder uitvoeren">◀</button>` : ''}<button type="button" data-ph="${esc(p.id)}" aria-pressed="${p.id === phase}" title="${n} werkgangen${pend ? ', ' + pend + ' ongepland' : ''}"><b>${esc(p.name)}</b><small>${n} wg${pend ? ' · ' + pend + ' open' : ''}</small></button>${cur ? `<button type="button" class="mv" data-mv="1" ${i === P.phases.length - 1 ? 'disabled' : ''} title="Later uitvoeren" aria-label="Hoofdfase later uitvoeren">▶</button><button type="button" class="mv del" id="phDelBar" title="Hoofdfase verwijderen" aria-label="Hoofdfase verwijderen">✕</button>` : ''}`; }).join('') + (S.canWrite ? `<button type="button" class="add" id="addPhase">+ Hoofdfase</button>` : '');
  el.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => { stop(); if(!finish(false)) return; phase = b.dataset.ph; projectMode = false; selected = ''; selBar = ''; stepVal = 'all'; newStep = 0; focusMark = null; $('#frame').hidden = true; fit(false); edRefresh(); });
  el.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => movePhase(Number(b.dataset.mv)));
  $('#phDelBar') && ($('#phDelBar').onclick = () => { const btn = $('#phDelBar'), ph = P.phases.find(p => p.id === phase); if(!ph || P.phases.length < 2) return;
    const n = records().filter(r => r.phase === phase).length + P.barriers.filter(x => x.phase === phase).length;
    if(!btn.classList.contains('armed')){ btn.classList.add('armed'); btn.textContent = ph.name + (n ? ' + ' + n + ' onderdelen' : '') + ' verwijderen? Klik nogmaals'; setTimeout(() => { if(btn.isConnected){ btn.classList.remove('armed'); btn.textContent = '✕'; } }, 4000); return; }
    if(!finish(false)) return; stop(); stash();
    for(const k of ['shapes','boundaries','routes']) P[k] = P[k].filter(r => r.phase !== phase); P.barriers = P.barriers.filter(x => x.phase !== phase);
    const wg = P.schema?.werkgangen; if(wg) for(const k of Object.keys(wg)) if(k.startsWith(phase + '.')) delete wg[k];
    remapRefs(r => r.startsWith('W:' + phase + '.') || r === 'H:' + phase ? null : r);
    const gone = ph.name; P.phases = P.phases.filter(p => p.id !== phase); phase = P.phases[0].id; selected = ''; selBar = ''; stepVal = 'all'; changed(); fit(false); edRefresh(); toast(gone + ' verwijderd. Ongedaan (Ctrl+Z) zet hem terug.'); });
  $('#addPhase') && ($('#addPhase').onclick = () => { if(!finish(false)) return; stash(); const id = String(Math.max(0, ...P.phases.map(p => Number(p.id) || 0)) + 1); P.phases.push({id, name:'Hoofdfase ' + id, outline:null}); phase = id; selected = ''; stepVal = 'all'; changed(); edRefresh(); hint('Hoofdfase ' + id + ' toegevoegd. Teken eerst de fasegrens via “Fasegrens tekenen”. Een andere naam geef je via de fase-eigenschappen hieronder.'); });
}
function drawSteps(){
  const el = $('#stepStrip'); if(!el) return; const steps = plannedSteps(), cur = stepVal, sr = (P.schema?.start || Object.values(P.schema?.werkgangen || {}).some(w => w.vast)) ? scheduleRows().rows.filter(r => r.phase === phase) : [];
  const vals = ['all', ...steps.map(String), ...(steps.length ? ['done'] : [])];
  el.innerHTML = vals.map(v => { const n = Number(v), past = (cur === 'done' && v !== 'done' && v !== 'all') || (Number(cur) > n && n > 0);
    const sh = v === 'all' || v === 'done' ? [] : P.shapes.filter(s => s.phase === phase && s.step === n);
    const rel = n > 0 ? relatedRows(phase, n) : [], pc = rel.map(o => (o.rel === 'voor' ? 'na ' : '∥ ') + o.r.key);
    return `<button type="button" data-step="${v}" class="${past ? 'past' : ''}" aria-current="${v === cur}"${pc.length ? ` title="Gelijktijdig / direct ervoor: ${pc.join(', ')}"` : ''}><small>${pc.length ? `<em class="par">${pc.join(' ')}</em>` : ''}${(() => { const r = sr.find(x => String(x.step) === v); return r?.start ? `<em class="dt">${fmtD(r.start)}${r.eind !== r.start ? '–' + fmtD(r.eind) : ''}</em>` : ''; })()}${v === 'all' ? 'Overzicht' : v === 'done' ? 'Eindbeeld' : (past ? '✓ ' : '') + 'Werkgang ' + phase + '.' + n}</small><span class="cs">${v === 'all' ? '<span>Alle vakken</span>' : v === 'done' ? '<span>Gereed</span>' : sh.slice(0, 2).map(s => `<span class="vak" ${kst(s.kind)} title="${esc(s.code)}">${esc(shortTxt(s.code, 12))}</span>`).join('') + (sh.length > 2 ? `<span class="more">+${sh.length - 2}</span>` : '')}</span></button>`; }).join('');
  if(S.canWrite && steps.length && steps.some((n, i) => n !== i + 1)) el.insertAdjacentHTML('beforeend', `<button type="button" class="renum" id="renum" title="Nummer de werkgangen van deze hoofdfase door als ${phase}.1, ${phase}.2, … (vakken, routes, hekken en tijdschema gaan mee)"><small>Hernummeren</small><span class="cs"><span>vanaf ${phase}.1</span></span></button>`);
  $('#renum') && ($('#renum').onclick = () => { stash(); const map = renumberSteps(phase); changed(); if(Number(stepVal) > 0 && map[stepVal]) stepVal = String(map[stepVal]); edRefresh(); toast('Werkgangen hernummerd: ' + Object.entries(map).filter(([a, b]) => Number(a) !== b).map(([a, b]) => phase + '.' + a + ' → ' + phase + '.' + b).join(', ') + '.'); });
  // ✕ achter de gekozen werkgang: werkgang weggooien (twee keer klikken)
  if(S.canWrite && Number(cur) > 0 && steps.includes(Number(cur))){ const curBtn = el.querySelector(`[data-step="${cur}"]`); curBtn?.insertAdjacentHTML('afterend', `<button type="button" class="delwg" id="delStep" title="Werkgang ${phase}.${cur} weggooien">✕</button>`);
    $('#delStep').onclick = () => { const b = $('#delStep'), n = Number(cur), cnt = P.shapes.filter(x => x.phase === phase && x.step === n).length + P.routes.filter(x => x.phase === phase && x.step === n).length + (P.barriers || []).filter(x => x.phase === phase && n - 1 >= x.start && n - 1 < x.end).length;
      if(!b.classList.contains('armed')){ b.classList.add('armed'); b.textContent = `${phase}.${n}${cnt ? ' + ' + cnt + ' onderdelen' : ''} weggooien? Klik nogmaals`; setTimeout(() => { if(b.isConnected){ b.classList.remove('armed'); b.textContent = '✕'; } }, 4000); return; }
      deleteWerkgang(n); }; }
  // + Werkgang: na de laatste werkgang, vóór Einde
  if(S.canWrite){ const btn = `<button type="button" class="addwg" id="newStep" title="Nieuwe werkgang achteraan als kopie van de huidige (of laatste) werkgang: werkvakken, routes, hekken, schildjes en depots">+ Werkgang</button>`, end = el.querySelector('[data-step="done"]');
    if(end) end.insertAdjacentHTML('beforebegin', btn); else el.insertAdjacentHTML('beforeend', btn); $('#newStep').onclick = newWerkgang; }
  el.querySelectorAll('[data-step]').forEach(b => b.onclick = () => chooseStep(b.dataset.step));
  const i = vals.indexOf(cur); $('#prevStep').disabled = i <= 0; $('#nextStep').disabled = !steps.length || i === vals.length - 1;
  el.querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest', inline:'nearest'});
  drawParInfo();
}
// onder de werkgangstrook: wat loopt tegelijk en waarom, met een knop naar de Planning om het aan te passen
function drawParInfo(){ const row = $('#stepStrip')?.closest('.wgrow'); if(!row) return; let box = $('#parInfo'); if(!box){ row.insertAdjacentHTML('afterend', '<div id="parInfo" class="parinfo"></div>'); box = $('#parInfo'); }
  const n = Number(stepVal); if(!(n > 0)){ box.hidden = true; return; } const rel = relatedRows(phase, n); const R = planCompute(), me = R.by['W:' + phase + '.' + n];
  if(!me){ box.hidden = true; return; } box.hidden = false;
  const why = o => { const q = R.by['W:' + o.r.key]; return q ? plReason(q, R) : ''; };
  box.innerHTML = `<span><b>${phase}.${n}</b> start ${esc(plReason(me, R))}.</span>` + (rel.length ? `<span class="pq">Tegelijk: ${rel.map(o => `<button type="button" class="pqb" data-gp="W:${esc(o.r.key)}" title="${esc(o.r.key + ' start ' + why(o))}. Klik om aan te passen in de Planning.">${esc(o.r.key)} <small>(start ${esc(why(o))})</small></button>`).join(' ')}</span>` : '')
    + (S.canWrite ? ` <button type="button" class="btn sm ghost" data-gp="W:${phase}.${n}">Aanpassen in Planning</button>` : '');
  box.querySelectorAll('[data-gp]').forEach(b => b.onclick = () => gotoPlan(b.dataset.gp)); }
function chooseStep(v){ stop(); if(!finish(false)) return; multi.clear(); stepVal = String(v); if(Number(v) > 0) newStep = Number(v); selBar = ''; { const it = item(); if(it && it.step !== undefined && !editableHere(it)) selected = ''; } $('#frame').hidden = true; drawSteps(); drawCtx(); drawList(); drawToolState(); render2(); }
function drawToolState(){
  const t = $('#tools'); if(!t) return;
  t.querySelectorAll('[data-tool]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.tool === tool); b.disabled = ['barrier', 'sign'].includes(b.dataset.tool) && !(Number(stepVal) > 0); b.title = b.disabled ? (b.dataset.tool === 'sign' ? 'Verkeersborden' : 'Hekken') + ' plaats je per werkgang: kies eerst bovenin een werkgang' : ''; });
  const sc = $('#signCat'); if(sc){ sc.hidden = tool !== 'sign'; if(tool === 'sign'){ sc.innerHTML = signCatalog(); sc.querySelectorAll('[data-sign]').forEach(x => x.onclick = () => { curSign = x.dataset.sign; lsSet('lw-sign', curSign); drawToolState(); hint('Klik op de kaart om “' + signOf(curSign).n + '” te plaatsen. Je kunt meerdere borden achter elkaar zetten; V of Esc stopt.'); }); } }
  const ph = P.phases.find(p => p.id === phase);
  const bt = [
    ph?.outline ? ['editOutline','Fasegrens wijzigen'] : ['outline','Fasegrens tekenen'],
    ['editWork','Werkgrens aanpassen'],
    ...(M.bg ? [['autoExtent', ext().length ? 'Werkgrens opnieuw uit tekening' : 'Werkgrens uit tekening halen']] : []),
    ['extent', ext().length ? 'Los vlak bijtekenen' : 'Werkgrens tekenen'],
    ...(ext().length ? [['extList', 'Werkgrensvlakken (' + ext().length + ')']] : []),
  ];
  $('#btools').innerHTML = bt.map(([k, l]) => `<button type="button" data-b="${k}" aria-pressed="${tool === k || (k === 'editOutline' && selected === 'phase-outline-' + phase) || (k === 'editWork' && P.boundaries.some(b => b.id === selected)) || (k === 'autoExtent' && !!autoEx) || (k === 'extList' && selected.startsWith('ext-'))}">${l}</button>`).join('');
  $('#btools').querySelectorAll('[data-b]').forEach(b => b.onclick = () => boundaryAction(b.dataset.b));
  $('#undo').disabled = !history.length && !draft.length; $('#redo').disabled = !future.length;
  const db = $('#drawbar'); const min = ['polygon','boundary','outline','extent','depot'].includes(tool) ? 3 : 2;
  db.hidden = !draft.length; if(draft.length){ $('#drawInfo').textContent = draft.length + ' punt' + (draft.length === 1 ? '' : 'en'); $('#dFinish').disabled = draft.length < min; }
  svg.style.cursor = tool === 'select' ? 'grab' : 'crosshair';
}
function setTool(t){
  if(!S.canWrite) return;
  stop(); if(draft.length && !finish(true)) return;
  if(t === 'whole') return wholePhase();
  if(t === 'barrier' && !(Number(stepVal) > 0)) return hint('Hekken plaats je per werkgang. Kies eerst bovenin een werkgang.');
  if(t === 'sign' && !(Number(stepVal) > 0)) return hint('Verkeersborden plaats je per werkgang. Kies eerst bovenin een werkgang.');
  autoEx = null; tool = t; selected = ''; selBar = ''; draft = []; if(t === 'polygon'){ newCode = nextCode(newKind); newStep = Number(stepVal) > 0 ? Number(stepVal) : (plannedSteps().at(-1) || 0) + 1; }
  defaultHint(); drawToolState(); drawCtx(); drawList(); render2();
}
function boundaryAction(k){
  stop(); if(!finish(false)) return;
  if(['outline','boundary','extent'].includes(k)) return setTool(k);
  if(k === 'extList'){ tool = 'select'; selBar = ''; multi.clear(); selected = selected.startsWith('ext-') ? selected : 'ext-0'; stepVal = 'all'; drawSteps(); edRefresh(); return; }
  if(k === 'autoExtent'){ if(!M.bg) return hint('Er is nog geen tekening.'); tool = 'select'; selected = ''; selBar = ''; multi.clear(); exRun(); return; }
  if(k === 'editOutline'){ tool = 'select'; selected = 'phase-outline-' + phase; selBar = ''; showOutline = true; $('#showOutline').checked = true; stepVal = 'all'; hint('Sleep de rode fasegrens. De dikke rode lijn is de echte fasegrens: binnen de werkgrens volgt hij je lijn, daarbuiten loopt hij over de werkgrens. De dunne lichte lijn buiten de werkgrens is alleen een grove markering (kleine rode punten). Aansluitende vakken, hekken en buurfases bewegen mee.'); }
  if(k === 'editWork'){ const bounds = P.boundaries.filter(b => b.phase === phase);
    if(!bounds.length){ const rings = ringsFor(phase); if(!rings.length) return hint('Er is nog geen werkgrens. Haal hem uit de tekening of teken de projectwerkgrens.'); stash(); for(const ring of rings){ const c = {id:uid(), phase, kind:'boundary', code:'Werkgrens uit tekening' + (rings.length > 1 ? ' ' + (bounds.length + 1) : ''), step:0, points:clone(ring)}; P.boundaries.push(c); bounds.push(c); } changed(); }
    tool = 'select'; selected = bounds.some(b => b.id === selected) ? selected : bounds[0].id; selBar = ''; stepVal = 'all'; hint('Sleep de groene werkgrens van deze hoofdfase. Aansluitende onderdelen bewegen mee.' + (bounds.length > 1 ? ' Deze hoofdfase ligt in ' + bounds.length + ' viewports; klik de andere gestippelde werkgrens aan om die te wijzigen.' : '')); }
  edRefresh();
}
function wholePhase(){
  const rings = ringsFor(phase); if(!rings.length) return hint('Teken eerst de projectwerkgrens.');
  stash(); for(const ring of rings){ const s = {id:uid(), phase, kind:newKind, step:newStep, code:nextCode(newKind), points:clone(ring), wholePhase:true}; P.shapes.push(s); selected = s.id; }
  tool = 'select'; changed(); edRefresh(); hint('Werkvak gemaakt van het hele fasegebied. Het volgt automatisch de fasegrens binnen de werkgrens.');
}

/* ---------- werkgrens uit de tekening halen ----------
   Zoekt in de achtergrond naar gebieden die door lijnen in één kleur worden omsloten.
   Gesplitste viewports: de inkt wordt per viewport tot een 'eiland' gesloten; een werkgrens die
   bij de rand van een viewport is afgeknipt, sluit dan langs die rand. Elk gebied wordt een eigen uitsnede. */
let autoEx = null, exRaster = null;
const exTick = () => new Promise(r => setTimeout(r, 0));
function dilate(m, W, H, r){ if(r <= 0) return m.slice(); const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
  for(let y = 0; y < H; y++){ const b = y * W; let cnt = 0; for(let x = 0; x <= r && x < W; x++) cnt += m[b + x];
    for(let x = 0; x < W; x++){ t[b + x] = cnt > 0 ? 1 : 0; const a = x + r + 1, d = x - r; if(a < W) cnt += m[b + a]; if(d >= 0) cnt -= m[b + d]; } }
  for(let x = 0; x < W; x++){ let cnt = 0; for(let y = 0; y <= r && y < H; y++) cnt += t[y * W + x];
    for(let y = 0; y < H; y++){ o[y * W + x] = cnt > 0 ? 1 : 0; const a = y + r + 1, d = y - r; if(a < H) cnt += t[a * W + x]; if(d >= 0) cnt -= t[d * W + x]; } }
  return o; }
function erode(m, W, H, r){ return dilate(m.map(v => 1 - v), W, H, r).map(v => 1 - v); }
function fillHoles(m, W, H){ const N = W * H, out = new Uint8Array(N).fill(1), st = new Int32Array(N); let sp = 0;
  const push = i => { if(!m[i] && out[i]){ out[i] = 0; st[sp++] = i; } };
  for(let x = 0; x < W; x++){ push(x); push((H - 1) * W + x); } for(let y = 0; y < H; y++){ push(y * W); push(y * W + W - 1); }
  while(sp){ const i = st[--sp], x = i % W; if(x > 0) push(i - 1); if(x < W - 1) push(i + 1); if(i >= W) push(i - W); if(i < N - W) push(i + W); }
  return out; }
function hueOf(r, g, b){ const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if(!d) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; return h < 0 ? h + 360 : h; }
// achtergrond verkleinen zonder dunne lijnen te verliezen: per blok de meest gekleurde of donkerste pixel
async function exRasterLoad(){
  if(exRaster && exRaster.bg === M.bg) return exRaster;
  const img = new Image(); img.src = '/_blob/' + M.bg; await img.decode();
  const nw = img.naturalWidth, nh = img.naturalHeight, B = Math.max(1, Math.ceil(Math.max(nw, nh) / 2800)), W = Math.ceil(nw / B), H = Math.ceil(nh / B), N = W * H;
  const bc = new Uint8Array(N), cr = new Uint8Array(N), cg = new Uint8Array(N), cb = new Uint8Array(N), ml = new Uint8Array(N).fill(255), sum = new Uint32Array(N), cnt = new Uint16Array(N);
  const SH = B * 96, cv = document.createElement('canvas'); cv.width = nw; cv.height = SH; const c = cv.getContext('2d', {willReadFrequently:true});
  for(let y0 = 0; y0 < nh; y0 += SH){ const sh = Math.min(SH, nh - y0); c.fillStyle = '#fff'; c.fillRect(0, 0, nw, SH); c.drawImage(img, 0, y0, nw, sh, 0, 0, nw, sh); const d = c.getImageData(0, 0, nw, sh).data;
    for(let y = 0; y < sh; y++){ const row = ((y0 + y) / B | 0) * W; for(let x = 0, i = y * nw * 4; x < nw; x++, i += 4){ const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b), mn = r < g ? (r < b ? r : b) : (g < b ? g : b), o = row + (x / B | 0), ch = mx - mn, l = (r * 3 + g * 6 + b) / 10;
      if(ch > bc[o]){ bc[o] = ch; cr[o] = r; cg[o] = g; cb[o] = b; } if(l < ml[o]) ml[o] = l; sum[o] += l; cnt[o]++; } }
    await exTick(); }
  const rgb = new Uint8Array(N * 3), ink = new Uint8Array(N), avg = new Uint8Array(N);
  for(let o = 0; o < N; o++) avg[o] = cnt[o] ? sum[o] / cnt[o] : 255;
  for(let o = 0; o < N; o++){ if(bc[o] > 50){ rgb[o * 3] = cr[o]; rgb[o * 3 + 1] = cg[o]; rgb[o * 3 + 2] = cb[o]; } else rgb[o * 3] = rgb[o * 3 + 1] = rgb[o * 3 + 2] = ml[o]; ink[o] = bc[o] > 40 || ml[o] < 200 ? 1 : 0; }
  // viewports: inkt sluiten tot eilanden en gaten vullen; de rand van een eiland is de rand van de viewport
  const RI = 10, island = fillHoles(erode(dilate(ink, W, H, RI), W, H, RI), W, H);
  return exRaster = {bg:M.bg, W, H, B, nw, nh, rgb, avg, island};
}
function exCandidates(R){ const {rgb} = R, N = R.W * R.H, bins = Array.from({length:24}, () => ({n:0, r:0, g:0, b:0}));
  for(let o = 0, i = 0; o < N; o++, i += 3){ const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2]; if(Math.max(r, g, b) - Math.min(r, g, b) < 60) continue; const q = bins[(hueOf(r, g, b) / 15 | 0) % 24]; q.n++; q.r += r; q.g += g; q.b += b; }
  const order = bins.map((q, k) => ({...q, k})).filter(q => q.n >= 150).sort((a, b) => b.n - a.n), out = [];
  for(const q of order){ if(out.some(o => Math.min(Math.abs(o.k - q.k), 24 - Math.abs(o.k - q.k)) <= 1)) continue; out.push({rgb:[q.r / q.n, q.g / q.n, q.b / q.n].map(Math.round), k:q.k}); if(out.length >= 6) break; }
  return out; }
function colorMask(R, t){ const {rgb} = R, N = R.W * R.H, m = new Uint8Array(N), tc = Math.max(...t) - Math.min(...t), th = hueOf(...t), tv = Math.max(...t), tl = (t[0] * 3 + t[1] * 6 + t[2]) / 10;
  for(let o = 0, i = 0; o < N; o++, i += 3){ const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2], mx = Math.max(r, g, b), ch = mx - Math.min(r, g, b);
    if(tc >= 50){ if(ch < Math.max(35, tc * .35) || Math.abs(mx - tv) > 110) continue; const dh = Math.abs(hueOf(r, g, b) - th); if(Math.min(dh, 360 - dh) > 22) continue; m[o] = 1; }
    else if(ch < 50 && (r * 3 + g * 6 + b) / 10 <= tl + 50) m[o] = 1; }
  return m; }
// gebieden binnen een viewport die (vrijwel) helemaal door de lijnkleur worden omsloten
function exRegions(R, cm, r){
  const {W, H, island} = R, N = W * H, bar = dilate(cm, W, H, r), lab = new Int32Array(N), st = new Int32Array(N), out = [], minA = N * .0015, maxA = N * .6;
  let n = 0;
  for(let s = 0; s < N; s++){
    if(lab[s] || bar[s] || !island[s]) continue;
    n++; let sp = 0, area = 0, cc = 0, ec = 0, x0 = W, y0 = H, x1 = 0, y1 = 0; lab[s] = n; st[sp++] = s;
    const nb = j => { if(bar[j]) cc++; else if(!island[j]) ec++; else if(!lab[j]){ lab[j] = n; st[sp++] = j; } };
    while(sp){ const i = st[--sp], x = i % W, y = (i - x) / W; area++;
      if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y;
      if(x > 0) nb(i - 1); else ec++; if(x < W - 1) nb(i + 1); else ec++; if(y > 0) nb(i - W); else ec++; if(y < H - 1) nb(i + W); else ec++; }
    // cc = rand langs de lijnkleur, ec = rand langs de viewport; afgeknipte werkgrens: grotendeels lijnkleur
    if(area >= minA && area <= maxA && cc > 0 && cc / (cc + ec) >= .6) out.push({n, area, box:[x0, y0, x1, y1]});
  }
  return {lab, out, r};
}
// werkgrens als zwarte lijn met symbolen (sterretjes, bolletjes) ertussen
function exBlobs(m, W, H, maxBox){
  const N = W * H, lab = new Int32Array(N), st = new Int32Array(N), out = []; let n = 0;
  for(let s = 0; s < N; s++){ if(!m[s] || lab[s]) continue; n++; let sp = 0, a = 0, sx = 0, sy = 0, x0 = W, y0 = H, x1 = 0, y1 = 0; lab[s] = n; st[sp++] = s;
    while(sp){ const i = st[--sp], x = i % W, y = (i - x) / W; a++; sx += x; sy += y; if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y;
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const xx = x + dx, yy = y + dy; if((!dx && !dy) || xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if(m[j] && !lab[j]){ lab[j] = n; st[sp++] = j; } } }
    const w = x1 - x0 + 1, h = y1 - y0 + 1; if(w <= maxBox && h <= maxBox) out.push({x:sx / a, y:sy / a, w, h, a, s:Math.max(w, h)}); }
  return out; }
function exSymbols(R, seed){
  // R.avg = gemiddeld verkleinde grijswaarde: dunne lijnen worden licht, gevulde symbolen blijven donker en komen los te liggen
  const {W, H, rgb, avg} = R, N = W * H, dark = new Uint8Array(N), lineM = new Uint8Array(N);
  for(let o = 0, i = 0; o < N; o++, i += 3){ const ch = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]) - Math.min(rgb[i], rgb[i + 1], rgb[i + 2]); if(ch < 60){ if(avg[o] < 105) dark[o] = 1; if(avg[o] < 190) lineM[o] = 1; } }
  // losse, compacte vlekjes (het symbool raakt de streepjes niet)
  let C = exBlobs(dark, W, H, 16).filter(b => b.s >= 3 && b.s <= 1.6 * Math.min(b.w, b.h) && b.a / (b.w * b.h) >= .3 && b.a / (b.w * b.h) <= .88);
  if(seed) C = C.filter(b => Math.abs(b.s - seed) <= Math.max(1.5, seed * .4));
  const G = 32, gw = Math.ceil(W / G), grid = new Map();
  C.forEach((b, i) => { const k = (b.y / G | 0) * gw + (b.x / G | 0); if(!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  const darkAt = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < H && lineM[y * W + x]; };
  // tussen twee symbolen: eerst wit, dan een streep in het midden, dan weer wit
  const dashOk = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ra = a.s / 2, rb = b.s / 2, inner = L - ra - rb; if(inner < 6) return false;
    let mn = 0, md = 0, gn = 0, gw = 0;
    for(let t = ra; t <= L - rb; t += .5){ const x = a.x + ux * t, y = a.y + uy * t, dk = darkAt(x, y) || darkAt(x - uy, y + ux) || darkAt(x + uy, y - ux), f = (t - ra) / inner;
      if(f > .3 && f < .7){ mn++; if(dk) md++; } else if(f > .03 && f < .17 || f > .83 && f < .97){ gn++; if(!darkAt(x, y)) gw++; } }
    return mn > 0 && md / mn >= .8 && gn > 0 && gw / gn >= .5; };
  const pairs = C.map(() => []), dh = new Map();
  C.forEach((a, i) => { const maxD = 14 * a.s, minD = 2.2 * a.s, cx = a.x / G | 0, cy = a.y / G | 0, rr = Math.ceil(maxD / G);
    for(let gy = cy - rr; gy <= cy + rr; gy++) for(let gx = Math.max(0, cx - rr); gx <= Math.min(gw - 1, cx + rr); gx++) for(const j of grid.get(gy * gw + gx) || []){
      if(j <= i) continue; const b = C[j], d = Math.hypot(b.x - a.x, b.y - a.y); if(d < minD || d > maxD || Math.abs(b.s - a.s) > Math.max(1.5, a.s * .45) || !dashOk(a, b)) continue;
      pairs[i].push([d, j]); pairs[j].push([d, i]); const k = Math.round(d); dh.set(k, (dh.get(k) || 0) + 1); } });
  // het meest voorkomende patroon (afstand tussen symbolen) is de werkgrens
  let S = 0, best = 0; for(const [k] of dh){ let n = 0; for(let q = k - 2; q <= k + 2; q++) n += dh.get(q) || 0; if(n > best){ best = n; S = k; } }
  if(best < 10) return null;
  const nb = C.map(() => []);
  pairs.forEach((l, i) => { const a = C[i]; l.filter(([d]) => Math.abs(d - S) <= Math.max(2, S * .22)).sort((p, q) => p[0] - q[0]).forEach(([d, j]) => { if(nb[i].length >= 2) return; const b = C[j];
    if(nb[i].some(k => { const c = C[k]; return ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / (Math.hypot(c.x - a.x, c.y - a.y) * d) > .5; })) return; nb[i].push(j); }); });
  // ongerichte lijnen
  const adj = C.map(() => new Set()); nb.forEach((l, i) => l.forEach(j => { adj[i].add(j); adj[j].add(i); }));
  const compOf = () => { const comp = new Int32Array(C.length).fill(-1), sizes = []; let nc = 0;
    for(let i = 0; i < C.length; i++){ if(comp[i] >= 0 || !adj[i].size) continue; const q = [i]; comp[i] = nc; let k = 0; while(k < q.length){ for(const j of adj[q[k++]]) if(comp[j] < 0){ comp[j] = nc; q.push(j); } } sizes.push(q.length); nc++; }
    return i => comp[i] >= 0 && sizes[comp[i]] >= 6; };
  // de lijn volgen vanaf elk los eind: volgend symbool op ongeveer één patroonafstand verderop.
  // Zo worden ook symbolen gevonden die tegen andere lijnen aan liggen.
  const pool = exBlobs(dark, W, H, 10).filter(b => b.s >= 2 && b.s <= 1.8 * Math.min(b.w, b.h)), pg = new Map(), PG = 16, pgw = Math.ceil(W / PG);
  C.forEach((b, i) => b.idx = i);
  for(const b of pool.concat(C)){ const k = (b.y / PG | 0) * pgw + (b.x / PG | 0); if(!pg.has(k)) pg.set(k, []); pg.get(k).push(b); }
  const near = (x, y, r) => { const out = []; for(let gy = Math.floor((y - r) / PG); gy <= Math.floor((y + r) / PG); gy++) for(let gx = Math.floor((x - r) / PG); gx <= Math.floor((x + r) / PG); gx++) for(const b of pg.get(gy * pgw + gx) || []) if(Math.hypot(b.x - x, b.y - y) <= r) out.push(b); return out; };
  const nodeOf = b => { if(b.idx === undefined){ b.idx = C.length; C.push(b); adj.push(new Set()); } return b.idx; };
  let keep = compOf();
  const starts = []; adj.forEach((st, i) => { if(st.size === 1 && keep(i)) starts.push(i); });
  for(const e of starts){ let cur = e, prev = [...adj[e]][0];
    for(let step = 0; step < 4000 && adj[cur].size === 1; step++){ const a = C[cur], pv = C[prev], L = Math.hypot(a.x - pv.x, a.y - pv.y), ux = (a.x - pv.x) / L, uy = (a.y - pv.y) / L; let best = null;
      for(let k = 1; k <= 3 && !best; k++){ const px = a.x + ux * S * k, py = a.y + uy * S * k; let be = Math.max(2, S * .28);
        for(const b of near(px, py, be)){ if(b.idx === cur || b.idx === prev) continue; const vx = b.x - a.x, vy = b.y - a.y, d = Math.hypot(vx, vy); if(d < S * .6 || (vx * ux + vy * uy) / d < .87) continue; const er = Math.hypot(b.x - px, b.y - py); if(er < be){ be = er; best = b; } } }
      // hoek in de werkgrens: een symbool op één patroonafstand in een andere richting, met een streep ertussen
      if(!best){ let be = S * .3; for(const b of near(a.x, a.y, S * 1.35)){ if(b.idx === cur || b.idx === prev) continue; const vx = b.x - a.x, vy = b.y - a.y, d = Math.hypot(vx, vy); if(Math.abs(d - S) >= be || (vx * ux + vy * uy) / d < -.2 || !dashOk(a, b)) continue; be = Math.abs(d - S); best = b; } }
      if(!best) break; const j = nodeOf(best); if(adj[cur].has(j)) break; const joined = adj[j].size > 0; adj[cur].add(j); adj[j].add(cur); if(joined) break; prev = cur; cur = j; } }
  keep = compOf();
  const edges = []; adj.forEach((st, i) => { if(keep(i)) for(const j of st) if(j > i) edges.push([i, j]); });
  if(!edges.length) return null;
  const spacing = S;
  const cross = (p, q, r, t) => { const d = (q.x - p.x) * (t.y - r.y) - (q.y - p.y) * (t.x - r.x); if(!d) return false; const u = ((r.x - p.x) * (t.y - r.y) - (r.y - p.y) * (t.x - r.x)) / d, v = ((r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)) / d; return u > .02 && u < .98 && v > .02 && v < .98; };
  // losse einden: korte gaten in de lijn dichten, en een lijn die op een viewportkader stuit tot dat kader doortrekken
  // richting van een eind: een paar symbolen terug langs de lijn, dan tellen haakjes aan het eind niet mee
  const ends = []; adj.forEach((st, i) => { if(!keep(i) || st.size !== 1) return; let pr = i, c = [...st][0]; for(let k = 0; k < 3 && adj[c].size === 2; k++){ const nx = [...adj[c]].find(x => x !== pr); pr = c; c = nx; }
    const dx = C[i].x - C[c].x, dy = C[i].y - C[c].y, L = Math.hypot(dx, dy) || 1; ends.push({i, ox:dx / L, oy:dy / L}); });
  const pc = [];
  for(let a = 0; a < ends.length; a++) for(let b = a + 1; b < ends.length; b++){ const A = ends[a], B = ends[b], p = C[A.i], q = C[B.i], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if(!d || d > 6 * spacing) continue; const ux = dx / d, uy = dy / d;
    if(A.ox * ux + A.oy * uy > .4 && -(B.ox * ux + B.oy * uy) > .4 && !edges.some(([i, j]) => cross(p, q, C[i], C[j]))) pc.push([d, a, b]); }
  pc.sort((p, q) => p[0] - q[0]); const used = new Set(), cuts = [];
  for(const [, a, b] of pc){ if(used.has(a) || used.has(b)) continue; used.add(a); used.add(b); cuts.push([C[ends[a].i], C[ends[b].i]]); }
  // twee evenwijdige lijnen die naast elkaar ophouden: afgeknipt door de rand van de viewport (matchlijn). Verbinden langs die rand.
  const pv = [];
  for(let a = 0; a < ends.length; a++) for(let b = a + 1; b < ends.length; b++){ if(used.has(a) || used.has(b)) continue; const A = ends[a], B = ends[b], p = C[A.i], q = C[B.i], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if(!d) continue;
    if(d > .1 * Math.max(W, H) || A.ox * B.ox + A.oy * B.oy < .8 || Math.abs((dx * A.ox + dy * A.oy) / d) > .5 || Math.abs(dx * A.ox + dy * A.oy) > 1.2 * spacing) continue;
    if(!edges.some(([i, j]) => cross(p, q, C[i], C[j]))) pv.push([d, a, b]); }
  pv.sort((p, q) => p[0] - q[0]);
  for(const [, a, b] of pv){ if(used.has(a) || used.has(b)) continue; const p = C[ends[a].i], q = C[ends[b].i]; if(cuts.some(([r, t]) => cross(p, q, r, t))) continue; used.add(a); used.add(b);
    // doortrekken tot de rand: beide einden even ver naar buiten
    const A = ends[a], B = ends[b], ox = (A.ox + B.ox) / 2, oy = (A.oy + B.oy) / 2, ol = Math.hypot(ox, oy), ux = ox / ol, uy = oy / ol, ext = Math.max(p.x * ux + p.y * uy, q.x * ux + q.y * uy) + spacing * .4;
    const p2 = {x:p.x + ux * (ext - (p.x * ux + p.y * uy)), y:p.y + uy * (ext - (p.x * ux + p.y * uy))}, q2 = {x:q.x + ux * (ext - (q.x * ux + q.y * uy)), y:q.y + uy * (ext - (q.x * ux + q.y * uy))};
    cuts.push([p, p2], [p2, q2], [q2, q]); }
  // grenslijnen als masker
  const m = new Uint8Array(N), seg = (p, q) => { const L = Math.hypot(q.x - p.x, q.y - p.y); for(let t = 0; t <= L; t += .5){ const x = Math.round(p.x + (q.x - p.x) * t / L), y = Math.round(p.y + (q.y - p.y) * t / L); if(x >= 0 && y >= 0 && x < W - 1 && y < H - 1){ m[y * W + x] = 1; m[y * W + x + 1] = 1; } } };
  for(const [i, j] of edges) seg(C[i], C[j]); for(const [p, q] of cuts) seg(p, q);
  return {mask:m, edges:edges.map(([i, j]) => [C[i], C[j]]).concat(cuts), spacing};
}
function dpLine(pts, eps){ if(pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while(st.length){ const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for(let i = a + 1; i < b; i++){ const d = L ? Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay); if(d > md){ md = d; mi = i; } }
    if(md > eps){ keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return pts.filter((_, i) => keep[i]); }
function exTrace(R, res, reg){
  const {W, H} = R, r = res.r + 1, [x0, y0, x1, y1] = reg.box, X0 = Math.max(0, x0 - r - 1), Y0 = Math.max(0, y0 - r - 1), X1 = Math.min(W - 1, x1 + r + 1), Y1 = Math.min(H - 1, y1 + r + 1), w = X1 - X0 + 1, h = Y1 - Y0 + 1;
  let m = new Uint8Array(w * h); for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++) if(res.lab[y * W + x] === reg.n) m[(y - Y0) * w + x - X0] = 1;
  m = dilate(m, w, h, r); // terug tot het midden van de lijn, maar niet buiten de viewport
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) if(!R.island[(y + Y0) * W + x + X0]) m[y * w + x] = 0;
  m = dilate(erode(m, w, h, 4), w, h, 4); // uitsteeksels van losse lijnen bij de viewportrand weg
  let s = -1; for(let i = 0; i < w * h; i++) if(m[i]){ s = i; break; } if(s < 0) return null;
  const D = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]], at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
  const sx = s % w, sy = (s - sx) / w; let cx = sx, cy = sy, b = 0; const ring = [[cx, cy]];
  for(let guard = 0; guard < 4 * w * h; guard++){ let k = 1, d = 0; for(; k <= 8; k++){ d = (b + k) % 8; if(at(cx + D[d][0], cy + D[d][1])) break; } if(k > 8) break;
    const pd = (d + 7) % 8, bx = cx + D[pd][0], by = cy + D[pd][1]; cx += D[d][0]; cy += D[d][1];
    b = Math.max(0, D.findIndex(q => q[0] === bx - cx && q[1] === by - cy));
    if(cx === sx && cy === sy) break; ring.push([cx, cy]); }
  if(ring.length < 8) return null;
  let f = 0, fd = 0; ring.forEach((p, i) => { const dd = Math.hypot(p[0] - sx, p[1] - sy); if(dd > fd){ fd = dd; f = i; } });
  const simp = dpLine(ring.slice(0, f + 1), 1.2).concat(dpLine(ring.slice(f).concat([ring[0]]), 1.2).slice(1, -1));
  const kx = R.B * P.w / R.nw, ky = R.B * P.h / R.nh;
  const out = simp.map(([x, y]) => [Math.round(Math.max(0, Math.min(P.w, (x + X0 + .5) * kx)) * 10) / 10, Math.round(Math.max(0, Math.min(P.h, (y + Y0 + .5) * ky)) * 10) / 10]);
  return out.length >= 3 ? out : null;
}
// gebieden per kandidaat (lijnkleur of symboollijn) en de beste verdikking om onderbrekingen te dichten
async function exRings(R, mask, radii){ let best = null;
  for(const r of radii){ const res = exRegions(R, mask, r), a = res.out.reduce((s, x) => s + x.area, 0); if(!best || a > best.a * 1.02) best = {res, a}; await exTick(); if(autoEx?.status !== 'busy') return null; }
  const regs = best.res.out.sort((a, b) => b.area - a.area).slice(0, 12), rings = regs.map(g => exTrace(R, best.res, g)).filter(Boolean);
  return {rings, on:rings.map(() => true), score:regs.length ? regs[0].area + .5 * (best.a - regs[0].area) : 0}; }
async function exRun(color, picked){
  const prev = autoEx?.prev; autoEx = {status:'busy', prev, msg:color ? 'Gebieden met deze lijn zoeken…' : 'Tekening laden en verkleinen…'}; drawCtx(); drawToolState();
  hint('Leeghwater zoekt de werkgrens in de tekening. Bij gesplitste viewports wordt elke viewport apart bekeken.');
  try{
    const R = await exRasterLoad(); if(autoEx?.status !== 'busy') return;
    const dark = !!color && Math.max(...color) - Math.min(...color) < 50, cands = [];
    // 1. zwarte lijn met symbolen ertussen (— ★ — ★ —), zoals vaak bij een werkgrens
    if(!color || dark){ autoEx.msg = 'Werkgrens met symbolen (— ★ —) zoeken…'; drawCtx(); await exTick();
      const sy = exSymbols(R); if(autoEx?.status !== 'busy') return;
      if(sy){ const r = await exRings(R, sy.mask, [1, 3, 6]); if(!r) return; const kx = R.B * P.w / R.nw, ky = R.B * P.h / R.nh;
        cands.push({rgb:[40, 40, 40], sym:true, ...r, lines:sy.edges.map(([a, b]) => [[(a.x + .5) * kx, (a.y + .5) * ky], [(b.x + .5) * kx, (b.y + .5) * ky]])}); } }
    // 2. lijnen in één kleur
    const cols = color ? (dark && cands.some(c => c.rings.length) ? [] : [color]) : cands.some(c => c.rings.length) ? [] : exCandidates(R).map(c => c.rgb);
    for(const [ci, rgb] of cols.entries()){
      if(autoEx?.status !== 'busy') return; autoEx.msg = color ? autoEx.msg : `Lijnkleur ${ci + 1} van ${cols.length} bekijken…`; drawCtx(); await exTick();
      const r = await exRings(R, colorMask(R, rgb), [2, 4, 7]); if(!r) return; cands.push({rgb, ...r}); }
    const found = cands.filter(c => c.rings.length || c.lines?.length).sort((a, b) => b.score - a.score);
    autoEx = {status:'result', prev, cands:found, ci:0, picked:!!picked, dark:dark && !found[0]?.sym};
    const c0 = found[0]; if(c0) view = fitView(c0.rings.length ? c0.rings.flat() : c0.lines.flat(), 40);
    hint(c0?.rings.length ? 'Oranje vlak = gevonden werkgebied, oranje stippellijn = herkende werkgrens. Vink weg wat geen werkgebied is en kies Overnemen. Wat niet gesloten is, teken je daarna bij.' : 'Geen gesloten werkgrens gevonden. Wijs de werkgrenslijn aan in de tekening.');
  }catch(e){ autoEx = null; toast('Werkgrens zoeken mislukt: ' + (e.message || e)); defaultHint(); }
  if(svg){ drawCtx(); drawToolState(); render2(); }
}
async function exPick(p){
  try{ const R = await exRasterLoad(), cx = Math.round(p[0] / P.w * R.nw / R.B), cy = Math.round(p[1] / P.h * R.nh / R.B); let col = null;
    // dichtstbijzijnde lijn rond de klik; gekleurd gaat voor zwart op dezelfde afstand
    for(let rad = 0; rad <= 6 && !col; rad++){ let bc = 49, bl = 150, cc = null, dk = null;
      for(let dy = -rad; dy <= rad; dy++) for(let dx = -rad; dx <= rad; dx++){ if(Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue; const x = cx + dx, y = cy + dy; if(x < 0 || y < 0 || x >= R.W || y >= R.H) continue;
        const i = (y * R.W + x) * 3, r = R.rgb[i], g = R.rgb[i + 1], b = R.rgb[i + 2], ch = Math.max(r, g, b) - Math.min(r, g, b), l = (r * 3 + g * 6 + b) / 10;
        if(ch > bc){ bc = ch; cc = [r, g, b]; } if(l < bl){ bl = l; dk = [r, g, b]; } }
      col = cc || dk; }
    if(!col){ tool = 'pickColor'; return hint('Daar ligt geen lijn. Zoom in en klik precies op de werkgrens.'); }
    exRun(col, true);
  }catch(e){ toast('Kleur lezen mislukt: ' + (e.message || e)); }
}
function exAreaTxt(r){ const a = polyArea(r); return m2Factor() ? fmtArea(a) : '≈ ' + Math.max(1, Math.round(100 * a / (P.w * P.h))) + '% van het blad'; }
async function exAccept(){
  const a = autoEx, c = a?.cands?.[a.ci]; if(!c) return; const rings = c.rings.filter((_, i) => c.on[i]).map(r => r.map(p => [...p])); if(!rings.length) return;
  const prev = clone(ext());
  try{ await metaUpdate({workExtent:rings, updatedAt:new Date().toISOString(), updatedBy:S.meId}); }catch(e){ return toast('Werkgrens niet bewaard: ' + (e.message || e.code)); }
  M.workExtent = rings;
  // ongewijzigde kopieën van de oude werkgrens per hoofdfase opruimen
  const stale = P.boundaries.filter(b => prev.some(r => sameRing(r, b.points)) && !P.shapes.some(x => x.boundarySource === b.id));
  if(stale.length){ stash(); P.boundaries = P.boundaries.filter(b => !stale.includes(b)); changed(); }
  autoEx = {status:'done', prev, n:rings.length}; tool = 'select'; selected = ''; selBar = ''; fit(false); edRefresh();
  hint('Werkgrens bewaard. Ligt een hoofdfase in twee viewports, teken dan één fasegrens om beide stukken heen; buiten de werkgrens mag de lijn over het lege papier lopen.');
  toast('Werkgrens uit de tekening overgenomen: ' + rings.length + (rings.length === 1 ? ' uitsnede.' : ' uitsneden.'));
}
function drawAutoEx(el){
  const a = autoEx, c = a.cands?.[a.ci], sw = rgb => `<i class="sw" style="background:rgb(${rgb.join(',')})"></i>`, n1 = (n, e, m) => n + ' ' + (n === 1 ? e : m);
  let h = '';
  if(a.status === 'busy') h = `<p class="kv" style="margin:0">${esc(a.msg || 'Tekening doorzoeken…')}</p><div class="progress"><i class="indet" style="width:100%"></i></div><div class="row"><button class="btn sm" id="exCancel" type="button">Annuleren</button></div>`;
  else if(a.status === 'pick') h = `<p class="kv" style="margin:0">Klik in de tekening precies op de lijn van de werkgrens (zoom zo nodig in). Leeghwater zoekt dan alle gebieden die door lijnen in die kleur worden omsloten, per viewport.</p><div class="row"><button class="btn sm" id="exCancel" type="button">Annuleren</button></div>`;
  else if(a.status === 'done') h = `<p class="kv" style="margin:0">Werkgrens overgenomen: ${n1(a.n, 'uitsnede', 'uitsneden')}. Vakken, routes en fasegrenzen zijn niet veranderd.</p><div class="row">${a.prev?.length ? '<button class="btn sm" id="exUndo" type="button">Vorige werkgrens terugzetten</button>' : ''}<button class="btn sm" id="exClose" type="button">Sluiten</button></div>`;
  else h = `${a.cands.length > 1 ? `<p class="kv" style="margin:0">Lijnkleuren met omsloten gebieden:</p><div class="kfilter">${a.cands.map((x, i) => `<button type="button" data-exc="${i}" aria-pressed="${i === a.ci}">${x.sym ? '— ★ —' : sw(x.rgb)} ${n1(x.rings.length, 'gebied', 'gebieden')}</button>`).join('')}</div>` : c ? `<p class="kv" style="margin:0;display:flex;gap:6px;align-items:center">${c.sym ? 'Herkend: zwarte lijn met symbolen (— ★ —)' : sw(c.rgb) + ' Lijnkleur ' + (a.picked ? 'die je aanwees' : 'gevonden')}</p>` : ''}
    ${c?.rings.length ? `<div class="stack" style="gap:2px">${c.rings.map((r, i) => `<label class="ck"><input type="checkbox" data-exr="${i}" ${c.on[i] ? 'checked' : ''}> Uitsnede ${i + 1} <span class="faint">· ${esc(exAreaTxt(r))}</span></label>`).join('')}</div>
      <p class="kv" style="margin:0">Elke viewport of los omsloten gebied wordt een eigen uitsnede. ${c.rings.length > 1 ? 'Toont een viewport alleen een detail of legenda, vink die dan uit.' : ''}${a.dark ? ' Een zwarte lijn wordt ook door andere lijnen gevormd; controleer de gebieden goed.' : ''}</p>`
      : `<p class="kv" style="margin:0">${c?.lines?.length ? 'De werkgrenslijn is herkend (oranje stippellijn), maar sluit nergens een gebied af. Teken de werkgrens zelf met Uitsnede bijtekenen; de stippellijn helpt als leidraad.' : 'Geen gesloten werkgrens gevonden' + (a.picked ? ' met deze lijn' : '') + '. Wijs de werkgrenslijn aan in de tekening, of teken hem zelf.'}</p>`}
    ${c?.rings.length ? `<p class="kv" style="margin:0">Mist er een viewport? Neem over wat klopt en teken de rest met <b>Uitsnede bijtekenen</b>.</p>` : ''}
    ${c?.rings.length && ext().length ? `<p class="kv" style="margin:0;color:var(--warn)">Vervangt de huidige werkgrens (${n1(ext().length, 'uitsnede', 'uitsneden')}).</p>` : ''}
    <div class="row">${c?.rings.length ? `<button class="btn sm primary" id="exOk" type="button" ${c.on.some(Boolean) ? '' : 'disabled'}>Overnemen</button>` : ''}<button class="btn sm" id="exPick" type="button">${c ? 'Andere lijn aanwijzen' : 'Werkgrenslijn aanwijzen'}</button><button class="btn sm ghost" id="exCancel" type="button">Annuleren</button></div>`;
  el.innerHTML = `<div class="panel tight"><h3 class="sub">Werkgrens uit tekening</h3>${h}</div>`;
  const q = id => el.querySelector(id), close = () => { autoEx = null; if(tool === 'pickColor') tool = 'select'; defaultHint(); drawCtx(); drawToolState(); render2(); };
  q('#exCancel') && (q('#exCancel').onclick = close); q('#exClose') && (q('#exClose').onclick = close);
  q('#exUndo') && (q('#exUndo').onclick = async () => { const prev = a.prev; try{ await metaUpdate({workExtent:prev, updatedAt:new Date().toISOString(), updatedBy:S.meId}); M.workExtent = prev; toast('Vorige werkgrens teruggezet.'); }catch(e){ toast('Terugzetten mislukt: ' + (e.message || e.code)); } autoEx = null; fit(false); edRefresh(); });
  q('#exPick') && (q('#exPick').onclick = () => { autoEx = {status:'pick', prev:a.prev}; tool = 'pickColor'; selected = ''; selBar = ''; hint('Klik op de werkgrenslijn in de tekening.'); drawCtx(); drawToolState(); render2(); });
  q('#exOk') && (q('#exOk').onclick = exAccept);
  el.querySelectorAll('[data-exc]').forEach(b => b.onclick = () => { a.ci = Number(b.dataset.exc); const cc = a.cands[a.ci]; view = fitView(cc.rings.length ? cc.rings.flat() : cc.lines.flat(), 40); drawCtx(); render2(); });
  el.querySelectorAll('[data-exr]').forEach(f => f.onchange = () => { c.on[Number(f.dataset.exr)] = f.checked; if(q('#exOk')) q('#exOk').disabled = !c.on.some(Boolean); render2(); });
}

