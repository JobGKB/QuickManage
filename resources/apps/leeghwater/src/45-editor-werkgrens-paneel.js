/* ---------- werkgrens in losse vlakken ---------- */
function editable(id){ return id === 'phase-outline-' + phase || String(id).startsWith('ext-') ? item() : records().find(x => x.id === id); }
let extBase = null; // werkgrens zoals hij was vóór de laatste wijziging
function saveExt(msg){ if(!M) return; const prev = extBase && extBase.pid === S.pid ? extBase.json : null; extBase = {pid:S.pid, json:JSON.stringify(M.workExtent || [])};
  metaUpdate({workExtent:M.workExtent, ...(prev && prev !== extBase.json ? {workExtentVorige:JSON.parse(prev)} : {}), updatedAt:new Date().toISOString(), updatedBy:S.meId}).then(() => msg && toast(msg)).catch(e => toast('Werkgrens niet bewaard: ' + (e.message || e.code))); }
function removeExt(i){ const r = ext()[i]; if(!r) return; M.workExtent = ext().filter((_, k) => k !== i); saveExt('Vlak ' + (i + 1) + ' van de werkgrens verwijderd.'); selected = ext().length ? 'ext-' + Math.min(i, ext().length - 1) : ''; edRefresh(); }
function drawExtPanel(el){
  const E = ext(), cur = selected.startsWith('ext-') ? Number(selected.slice(4)) : -1, drawing = tool === 'extent';
  el.innerHTML = `<div class="panel tight"><h3 class="sub">Werkgrens · ${E.length} ${E.length === 1 ? 'vlak' : 'losse vlakken'}</h3>
    <p class="kv" style="margin:0">${drawing ? 'Klik de hoekpunten van een vlak en sluit af met Enter of Afronden. Daarna kun je meteen het volgende vlak tekenen, bijvoorbeeld per viewport.' : 'Elk vlak is een deel van het werkgebied, bijvoorbeeld één viewport. Sleep de punten om een vlak aan te passen; + op een rand voegt een punt toe.'}</p>
    ${E.length ? `<div class="list">${E.map((r, i) => `<button type="button" class="k-boundary" data-ext="${i}" aria-current="${i === cur}"><span>Vlak ${i + 1}</span><small>${esc(exAreaTxt(r))}</small></button>`).join('')}</div>` : ''}
    <div class="row">${drawing ? '<button class="btn sm primary" id="extDone" type="button">Klaar</button>' : '<button class="btn sm" id="extNew" type="button">+ Los vlak tekenen</button>'}${cur >= 0 && !drawing ? `<button class="btn sm danger" id="extDel" type="button">Vlak ${cur + 1} verwijderen</button>` : ''}${!drawing ? '<button class="btn sm ghost" id="extClose" type="button">Sluiten</button>' : ''}</div>
    ${M.workExtentVorige?.length && !drawing ? '<div class="row"><button class="btn sm" id="extPrev" type="button">↶ Vorige werkgrens terugzetten</button></div>' : ''}
    <p class="faint" style="margin:0;font-size:12px">Wijzigingen aan de werkgrens worden direct bewaard. Ctrl+Z werkt hier niet; met Vorige werkgrens terugzetten draai je de laatste wijziging terug. Een punt verwijder je met Alt+klik.</p></div>`;
  el.querySelectorAll('[data-ext]').forEach(b => b.onclick = () => { if(drawing && !finish(false)) return; tool = 'select'; selected = 'ext-' + b.dataset.ext; const r = ext()[Number(b.dataset.ext)]; if(r) view = fitView(r, 40); drawToolState(); drawCtx(); render2(); });
  const q = id => el.querySelector(id);
  q('#extDone') && (q('#extDone').onclick = () => { if(!finish(false)) return; setTool('select'); });
  q('#extNew') && (q('#extNew').onclick = () => setTool('extent'));
  q('#extPrev') && (q('#extPrev').onclick = () => { const v = M.workExtentVorige; if(!v?.length) return; M.workExtent = JSON.parse(JSON.stringify(v)); saveExt('Vorige werkgrens teruggezet.'); selected = ''; edRefresh(); });
  q('#extDel') && (q('#extDel').onclick = () => { const b = q('#extDel'); if(!b.classList.contains('armed')){ b.classList.add('armed'); b.textContent = 'Zeker? Klik nogmaals'; return; } removeExt(cur); });
  q('#extClose') && (q('#extClose').onclick = () => { selected = ''; defaultHint(); edRefresh(); });
}
/* ---------- contextpaneel ---------- */
function drawCtx(){
  dropUntouched();
  const el = $('#ctx'); if(!el) return; const ro = !S.canWrite;
  const s = item(), b = selBar ? P.barriers.find(x => x.id === selBar) : null;
  for(const id of [...multi]) if(!records().some(x => x.id === id && x.phase === phase) && !P.barriers.some(x => x.id === id && x.phase === phase)) multi.delete(id);
  if(autoEx && !ro) return drawAutoEx(el);
  if(!ro && (tool === 'extent' || selected.startsWith('ext-'))) return drawExtPanel(el);
  if(multi.size > 1) return drawMulti(el, ro);
  if(!ro && ['polygon', ...ROUTE_KINDS].includes(tool)){
    const isRoute = tool !== 'polygon';
    el.innerHTML = `<div class="panel tight"><h3 class="sub">${isRoute ? 'Nieuwe ' + KIND_NAME[tool].toLowerCase() : 'Nieuw werkvak'}</h3>
      ${isRoute ? '' : `<label class="l">Werkzaamheid<select class="f" id="nKind">${kinds().map(k => `<option value="${k}" ${k === newKind ? 'selected' : ''}>${k} · ${esc(kName(k))}</option>`).join('')}</select></label>
      <label class="l">Code<input class="f" id="nCode" maxlength="40" value="${esc(newCode)}"></label>`}
      <label class="l">Inplannen bij<select class="f" id="nStep">${stepOptions(newStep)}</select></label>
      <p class="kv" style="margin:0">Vakken in dezelfde werkgang worden tegelijk uitgevoerd.</p></div>`;
    $('#nKind') && ($('#nKind').onchange = e => { newKind = e.target.value; newCode = nextCode(newKind); $('#nCode').value = newCode; render2(); });
    $('#nCode') && ($('#nCode').oninput = e => newCode = e.target.value);
    $('#nStep').onchange = e => newStep = Number(e.target.value);
    return;
  }
  if(b){ const i = frameIndex(), {pos} = barPos(b, i), steps = plannedSteps(b.phase), single = b.end - b.start <= 1 && !(b.moves || []).length;
    const nextStep = steps.find(n => n > i + 1);
    el.innerHTML = `<div class="panel tight"><h3 class="sub">${esc(barLabel(b))}</h3>
      ${isBord(b) && !ro ? `<label class="l">Bord<select class="f" id="bSign">${SIGNS.map(x => `<option value="${x.c}" ${x.c === b.sign ? 'selected' : ''}>${esc((/^[A-J]\d/.test(x.c) ? x.c.replace(/-.*$/, '') + ' ' : '') + x.n)}</option>`).join('')}</select></label>` : ''}
      <p class="kv" style="margin:0">Sleep ${isBord(b) ? 'het bord' : isBaken(b) ? 'het schildje' : 'het hek'} om het te verplaatsen; draai met de oranje greep (Shift = vrij) of met Q/E per 15°.</p>
      <label class="l">Werkgang<select class="f" id="bStep" ${ro ? 'disabled' : ''}>${single ? '' : `<option value="" selected>${b.phase}.${b.start + 1} t/m ${b.phase}.${b.end} (meerdere werkgangen)</option>`}${steps.map(n => `<option value="${n}" ${single && n === b.start + 1 ? 'selected' : ''}>${b.phase}.${n}</option>`).join('')}</select></label>
      ${ro ? '' : `${sizeField('bScale', 'Grootte', b.scale || .645)}
      ${hekTrue(b) ? `<div class="row"><button class="btn sm ghost" id="bTrue" type="button">Ware grootte (${isBord(b) ? 'bord 70 cm' : isBaken(b) ? 'schildje' : 'hek 3,5 m'})</button></div>` : ''}`}
      ${ro ? '' : `<div class="row"><button class="btn sm" id="bCopy" type="button">Kopie</button><button class="btn sm" id="bSim" type="button" title="Selecteer alle ${barLabel(b, true)} in deze werkgang">Selecteer gelijke</button>${nextStep ? (hekIn(b.phase, nextStep, pos, b.type || 'hek') ? `<button class="btn sm" type="button" disabled>✓ Staat in ${b.phase}.${nextStep}</button>` : `<button class="btn sm" id="bCopyNext" type="button">Kopie naar ${b.phase}.${nextStep}</button>`) : ''}<button class="btn sm danger" id="bDel" type="button">Verwijderen</button></div>`}</div>`;
    if(!ro){
      const snapHek = () => ({x:pos.x, y:pos.y, angle:pos.angle});
      const copyTo = (n, dx) => { stash(); const c = {...snapHek(), id:'hek-' + Math.random().toString(36).slice(2, 7), ...(b.type ? {type:b.type} : {}), ...(b.sign ? {sign:b.sign} : {}), phase:b.phase, scale:b.scale || .6453125000000001, start:n - 1, end:n, moves:[]}; c.x += dx; c.y += dx; P.barriers.push(c); selBar = c.id; changed(); if(n !== i + 1){ selBar = b.id; edRefresh(); } else edRefresh(); toast(dx ? 'Kopie gemaakt; sleep hem naar zijn plek.' : 'Hek gekopieerd naar werkgang ' + b.phase + '.' + n + '.'); };
      $('#bStep').onchange = e => { const n = Number(e.target.value); if(!n) return; stash(); Object.assign(b, snapHek(), {start:n - 1, end:n, moves:[]}); changed(); chooseStep(n); selBar = b.id; drawCtx(); drawList(); render2(); };
      $('#bSign') && ($('#bSign').onchange = e => { stash(); const t = ensureSingle(b); t.sign = e.target.value; curSign = t.sign; changed(); drawCtx(); drawList(); render2(); });
      const setSc = (v, done) => { const t = ensureSingle(b); t.scale = Math.round(v * 1000) / 1000; if(isBord(t)) lastHekScale[S.pid + '|bord'] = t.scale; else if(!isBaken(t)) lastHekScale[S.pid + '|hek'] = P.hekScale = t.scale;  render2(); if(done) changed(); };
      let scStashed = false; $('#bScale').oninput = e => { if(!scStashed){ stash(); scStashed = true; } setSc(Number(e.target.value)); }; $('#bScale').onchange = e => { setSc(Number(e.target.value), true); scStashed = false; };
      $('#bTrue') && ($('#bTrue').onclick = () => { stash(); setSc(hekTrue(b), true); $('#bScale').value = b.scale; });
      $('#bCopy').onclick = () => copyTo(i + 1, 25);
      $('#bSim').onclick = () => selectSimilar(b);
      $('#bCopyNext') && ($('#bCopyNext').onclick = () => copyTo(nextStep, 0));
      $('#bDel').onclick = () => { stash(); ensureSingle(b); P.barriers = P.barriers.filter(x => x !== b); selBar = ''; changed(); edRefresh(); };
    }
    return;
  }
  if(s && s.kind === 'phaseBoundary'){ const ph = P.phases.find(p => p.id === phase);
    el.innerHTML = `<div class="panel tight"><h3 class="sub">Fasegrens ${esc(ph.name)}</h3>
      <label class="ck"><input type="checkbox" id="fb" ${followBoundary ? 'checked' : ''} ${ro ? 'disabled' : ''}> Aansluitende onderdelen meenemen</label>
      <label class="l">Naam hoofdfase<input class="f" id="phName" value="${esc(ph.name)}" ${ro ? 'disabled' : ''}></label>
      <p class="kv" style="margin:0">Sleep een hoekpunt of voeg met + een punt toe. Met Ongedaan herstel je de hele wijziging.</p>
      ${ro ? '' : `<div class="row"><button class="btn sm danger" id="phDel" type="button" ${P.phases.length < 2 ? 'disabled' : ''}>Hoofdfase verwijderen</button></div>`}</div>`;
    $('#fb').onchange = e => followBoundary = e.target.checked;
    if(!ro){ $('#phName').onchange = e => { const v = e.target.value.trim(); if(!v) return; stash(); ph.name = v; changed(); drawPhaseBar(); };
      $('#phDel').onclick = () => { const btn = $('#phDel'); const n = records().filter(r => r.phase === phase).length + P.barriers.filter(x => x.phase === phase).length;
        if(!btn.classList.contains('armed')){ btn.classList.add('armed'); btn.textContent = n ? 'Ook ' + n + ' onderdelen weg? Klik nogmaals' : 'Klik nogmaals'; return; }
        stash(); for(const k of ['shapes','boundaries','routes']) P[k] = P[k].filter(r => r.phase !== phase); P.barriers = P.barriers.filter(x => x.phase !== phase); P.phases = P.phases.filter(p => p.id !== phase); phase = P.phases[0].id; selected = ''; changed(); fit(false); edRefresh(); }; }
    return;
  }
  if(s){ const isShape = P.shapes.includes(s), isRoute = P.routes.includes(s), isB = P.boundaries.includes(s);
    el.innerHTML = `<div class="panel tight"><h3 class="sub">Geselecteerd: ${esc(isShape ? workCode(s) : s.code)}</h3>
      ${isShape || isRoute ? `<p class="kv" style="margin:0"><b>${s.step ? 'Werkgang ' + s.phase + '.' + s.step : 'Nog niet ingepland'}</b>${s.wholePhase ? ' · volgt de hele fase' : ''}${s.boundarySource ? ' · volgt de werkgrens' : ''}</p>
      <div class="row">${Number(stepVal) > 0 ? `<button class="btn sm primary" id="aCur" type="button" ${s.step === Number(stepVal) ? 'disabled' : ''}>In werkgang ${phase}.${stepVal}</button>` : ''}<button class="btn sm" id="aLast" type="button">Nieuwe werkgang achteraan</button>${s.step ? '<button class="btn sm" id="aNone" type="button">Uit planning</button>' : ''}</div><hr class="hr">` : ''}
      <label class="l">Naam / code<input class="f" id="pCode" maxlength="40" value="${esc(s.code)}" ${ro ? 'disabled' : ''}></label>
      ${isShape ? `<label class="l">Werkzaamheid<select class="f" id="pKind" ${ro ? 'disabled' : ''}>${kinds().map(k => `<option value="${k}" ${k === s.kind ? 'selected' : ''}>${k} · ${esc(kName(k))}</option>`).join('')}</select></label>` : `<p class="kv" style="margin:0">${KIND_NAME[s.kind]}</p>`}
      ${isB ? '' : `<label class="l">Hoofdfase<select class="f" id="pPhase" ${ro ? 'disabled' : ''}>${P.phases.map(p => `<option value="${esc(p.id)}" ${p.id === s.phase ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
      <label class="l">Inplannen bij<select class="f" id="pStep" ${ro ? 'disabled' : ''}>${stepOptions(s.step)}</select></label>`}
      ${s.kind === 'baken' ? `<label class="l">Tussenafstand schildjes<select class="f" id="pGap" ${ro ? 'disabled' : ''}>${[1, 1.5, 2, 2.5, 3, 5, 10].map(v => `<option value="${v}" ${(s.gap || 2.5) === v ? 'selected' : ''}>${String(v).replace('.', ',')} m</option>`).join('')}</select></label><p class="kv" style="margin:0">${bakenCount(s)} schildjes${routeLen(s) === null ? ' (vul de schaal in voor echte afstanden)' : ' over ' + fmtM(routeLen(s))}</p>${sizeField('pBSc', 'Grootte symbool', s.scale || .645, ro)}` : ''}
      ${s.kind === 'depot' ? `<p class="kv" style="margin:0">${depotM2(s) === null ? 'Vul de schaal in voor de oppervlakte.' : 'Oppervlakte ca. ' + Math.round(depotM2(s)).toLocaleString('nl-NL') + ' m²'}</p>` : ''}
      ${isRoute && !['fence','baken','depot'].includes(s.kind) ? `<label class="l">Lijndikte<select class="f" id="pWidth" ${ro ? 'disabled' : ''}>${[[8,'Smal'],[14,'Normaal'],[22,'Breed']].map(([v, l]) => `<option value="${v}" ${(s.width || 14) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
      ${isB ? `<label class="ck"><input type="checkbox" id="fb" ${followBoundary ? 'checked' : ''}> Aansluitende onderdelen meenemen</label>` : ''}
      ${['plate', 'walk'].includes(s.kind) ? `<label class="l">Beschikbaar<select class="f" id="pCond" ${ro ? 'disabled' : ''}>${[['', 'Altijd'], ['buiten', 'Alleen buiten werktijden'], ['tijdens', 'Alleen tijdens werktijden'], ['anders', 'Met andere voorwaarde…']].map(([v, l]) => `<option value="${v}" ${(s.cond || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${s.cond ? `<label class="l">${s.cond === 'anders' ? 'Voorwaarde' : 'Toelichting (optioneel)'}<input class="f" id="pCondTxt" maxlength="80" value="${esc(s.condTxt || '')}" placeholder="${s.cond === 'anders' ? 'bijv. alleen in het weekend' : 'bijv. na 17:00 rijplaten terugleggen'}" ${ro ? 'disabled' : ''}></label>` : ''}` : ''}
      <p class="kv" id="pStatus" style="margin:0"></p>
      ${ro ? '' : `<div class="row">${isShape && isOpenK(s.kind) && wzOpt().afwerk ? `<button class="btn sm" id="pStreet" type="button">${esc(kName(kLast()))} van dit vak</button>` : ''}${isShape && P.boundaries.some(b => b.phase === phase) ? '<button class="btn sm" id="pFollow" type="button">Volgt volledige werkgrens</button>' : ''}<button class="btn sm" id="pDup" type="button">Kopie</button>${isB ? '' : '<button class="btn sm" id="pSim" type="button" title="Selecteer alle onderdelen van dezelfde soort in deze werkgang (of hoofdfase)">Selecteer gelijke</button>'}${isRoute && s.step > 0 && plannedSteps(s.phase).find(n => n > s.step) ? (() => { const n = plannedSteps(s.phase).find(n => n > s.step); return routeIn(s, n) ? `<button class="btn sm" type="button" disabled>✓ Staat in ${s.phase}.${n}</button>` : `<button class="btn sm" id="pNext" type="button">Kopie naar ${s.phase}.${n}</button>`; })() : ''}<button class="btn sm danger" id="pDel" type="button">Verwijderen</button></div>`}</div>`;
    if(ro) return;
    const assign = n => { stop(); stash(); s.step = n; changed(); stepVal = n ? String(n) : 'all'; edRefresh(); };
    $('#aCur') && ($('#aCur').onclick = () => assign(Number(stepVal)));
    $('#aLast') && ($('#aLast').onclick = () => assign((plannedSteps().at(-1) || 0) + 1));
    $('#aNone') && ($('#aNone').onclick = () => assign(0));
    $('#fb') && ($('#fb').onchange = e => followBoundary = e.target.checked);
    const apply = () => { const code = $('#pCode').value.trim(), step = $('#pStep') ? Number($('#pStep').value) : s.step, np = $('#pPhase') ? $('#pPhase').value : s.phase, kind = $('#pKind') ? $('#pKind').value : s.kind, width = $('#pWidth') ? Number($('#pWidth').value) : s.width;
      const st = $('#pStatus'); if(!code){ st.textContent = 'Vul een naam in.'; return; }
      if(isShape && P.shapes.some(a => a.id !== s.id && a.phase === np && a.code === code)){ st.textContent = 'Code ' + code + ' bestaat al in deze hoofdfase.'; return; }
      if(s.code === code && s.step === step && s.phase === np && s.kind === kind && (s.width === width || !isRoute)) return;
      stop(); stash(); Object.assign(s, {code, step, phase:np, kind}); if(isRoute) s.width = width; phase = np; changed(); edRefresh(); $('#pStatus') && ($('#pStatus').textContent = 'Bewaard.'); };
    // Werkzaamheid wisselen: een automatische code (O1, S2…) gaat mee naar de nieuwe letter
    const autoCode = () => { const k = $('#pKind').value, m = $('#pCode').value.trim().match(/^([A-Z]{1,3})(\d+)$/); if(!m || m[1] === k || !kinds().includes(m[1])) return;
      const np = $('#pPhase') ? $('#pPhase').value : s.phase, cand = k + m[2];
      $('#pCode').value = P.shapes.some(a => a.id !== s.id && a.phase === np && a.code === cand) ? (() => { let i = 1; while(P.shapes.some(a => a.id !== s.id && a.phase === np && a.code === k + i)) i++; return k + i; })() : cand; };
    ['#pCode','#pKind','#pPhase','#pStep','#pWidth'].forEach(id => { const f = $(id); if(f){ f.onchange = id === '#pKind' ? () => { autoCode(); apply(); } : apply; f.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); apply(); } }; } });
    $('#pStreet') && ($('#pStreet').onclick = () => { const code = kLast() + (s.code.match(/\d+$/)?.[0] || '1'), ex = P.shapes.find(x => x.phase === s.phase && x.code === code); if(ex){ selected = ex.id; edRefresh(); return toast(code + ' bestaat al en is geselecteerd.'); }
      stash(); const c = {...clone(s), id:uid(), kind:kLast(), code, step:0, sourceShape:s.id}; P.shapes.push(c); selected = c.id; changed(); edRefresh(); toast(code + ' gemaakt met dezelfde begrenzing. Kies zelf de werkgang.'); });
    $('#pFollow') && ($('#pFollow').onclick = () => { const bounds = P.boundaries.filter(b => b.phase === phase); if(bounds.length !== 1) return toast('Deze hoofdfase heeft meerdere werkgrenzen. Pas de punten handmatig aan.'); stash(); s.boundarySource = bounds[0].id; delete s.sourceShape; s.points = clone(bounds[0].points); s.label = null; changed(); edRefresh(); toast('Dit vak volgt voortaan de volledige werkgrens.'); });
    $('#pDup').onclick = () => { stash(); const c = clone(s); c.id = uid(); c.code = isShape ? nextCode(s.kind) : s.code + ' kopie'; delete c.wholePhase; (isShape ? P.shapes : isB ? P.boundaries : P.routes).push(c); selected = c.id; changed(); edRefresh(); };
    $('#pNext') && ($('#pNext').onclick = () => { const n = plannedSteps(s.phase).find(x => x > s.step); if(!n) return; stash(); const c = clone(s); c.id = uid(); c.step = n; delete c.wholePhase; P.routes.push(c); changed(); edRefresh(); toast(KIND_NAME[s.kind] + ' gekopieerd naar werkgang ' + s.phase + '.' + n + '.'); });
    $('#pCond') && ($('#pCond').onchange = e => { stash(); const v = e.target.value; if(v) s.cond = v; else { delete s.cond; delete s.condTxt; } changed(); drawCtx(); render2(); });
    $('#pCondTxt') && ($('#pCondTxt').onchange = e => { stash(); const v = e.target.value.trim(); if(v) s.condTxt = v; else delete s.condTxt; changed(); render2(); });
    $('#pGap') && ($('#pGap').onchange = e => { stash(); s.gap = Number(e.target.value); changed(); drawCtx(); render2(); });
    let bs0 = false; $('#pBSc') && ($('#pBSc').oninput = e => { if(!bs0){ stash(); bs0 = true; } s.scale = Number(e.target.value); lastHekScale.baken = s.scale; render2(); }); $('#pBSc') && ($('#pBSc').onchange = () => { bs0 = false; changed(); });
    $('#pSim') && ($('#pSim').onclick = () => selectSimilar(s));
    $('#pDel').onclick = removeSelected;
    return;
  }
  el.innerHTML = '';
}
// paneel voor meerdere geselecteerde onderdelen (Shift+klik)
function drawMulti(el, ro){
  const ids = [...multi], shapes = P.shapes.filter(x => multi.has(x.id)), routes = P.routes.filter(x => multi.has(x.id)), bars = P.barriers.filter(x => multi.has(x.id)), i = frameIndex(), cur = i >= 0 ? i + 1 : 0;
  const nextOf = st => plannedSteps(phase).find(n => n > st);
  const todoR = routes.filter(r => r.step > 0 && nextOf(r.step) && !routeIn(r, nextOf(r.step))), todoB = cur ? bars.filter(b => nextOf(cur) && !hekIn(b.phase, nextOf(cur), barPos(b, i).pos, b.type || 'hek')) : [];
  const nCopy = todoR.length + todoB.length, nxt = cur ? nextOf(cur) : null;
  const parts = [[shapes.length, 'vak', 'vakken'], [routes.length, 'route', 'routes'], [bars.filter(b => !isBaken(b) && !isBord(b)).length, 'hek', 'hekken'], [bars.filter(isBaken).length, 'schildje', 'schildjes'], [bars.filter(isBord).length, 'verkeersbord', 'verkeersborden']].filter(x => x[0]).map(([n, a, b]) => n + ' ' + (n === 1 ? a : b)).join(', ');
  // één soort geselecteerd (bv. via Selecteer gelijke): dezelfde velden als bij één onderdeel, voor allemaal tegelijk
  const one = arr => arr.length && arr.every(x => x.kind === arr[0].kind);
  const onlyR = !shapes.length && !bars.length && one(routes), onlyS = !routes.length && !bars.length && one(shapes), onlyB = !shapes.length && !routes.length && bars.length && bars.every(b => (b.type || 'hek') === (bars[0].type || 'hek'));
  const same = (arr, f, d) => arr.every(x => (f(x) ?? d) === (f(arr[0]) ?? d)) ? (f(arr[0]) ?? d) : null;
  const title = onlyR ? KIND_NAME[routes[0].kind] : onlyS ? kName(shapes[0].kind) : onlyB ? (isBord(bars[0]) ? 'Verkeersborden' : isBaken(bars[0]) ? 'Schildjes' : 'Hekken') : '';
  let props = '';
  if(!ro && onlyR && ['plate', 'walk'].includes(routes[0].kind)){ const w = same(routes, x => x.width, 14); props += `<label class="l">Lijndikte (alle ${routes.length})<select class="f" id="mWidth">${w === null ? '<option value="" selected>Verschillend</option>' : ''}${[[8,'Smal'],[14,'Normaal'],[22,'Breed']].map(([v, l]) => `<option value="${v}" ${w === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`; }
  if(!ro && onlyR && routes[0].kind === 'baken'){ const g = same(routes, x => x.gap, 2.5), sc = same(routes, x => x.scale, .645);
    props += `<label class="l">Tussenafstand schildjes (alle ${routes.length})<select class="f" id="mGap">${g === null ? '<option value="" selected>Verschillend</option>' : ''}${[1, 1.5, 2, 2.5, 3, 5, 10].map(v => `<option value="${v}" ${g === v ? 'selected' : ''}>${String(v).replace('.', ',')} m</option>`).join('')}</select></label>${sizeField('mBSc', 'Grootte symbool (alle ' + routes.length + ')', sc ?? .645, false, sc === null)}`; }
  if(!ro && onlyS){ props += `<label class="l">Werkzaamheid (alle ${shapes.length})<select class="f" id="mKind">${kinds().map(k => `<option value="${k}" ${k === shapes[0].kind ? 'selected' : ''}>${k} · ${esc(kName(k))}</option>`).join('')}</select></label>`; }
  if(!ro && onlyB){ const sc = same(bars, x => x.scale, .645); props += `${sizeField('mScale', 'Grootte (alle ' + bars.length + ')', sc ?? .645, false, sc === null)}${hekTrue(bars[0]) ? `<div class="row"><button class="btn sm ghost" id="mTrue" type="button">Alle op ware grootte</button></div>` : ''}`; }
  el.innerHTML = `<div class="panel tight"><h3 class="sub">${title ? ids.length + ' × ' + esc(title) : ids.length + ' geselecteerd'}</h3>
    <p class="kv" style="margin:0">${parts}. Wijzigingen hieronder gelden voor alle geselecteerde. Shift+klik voegt toe of haalt eraf; klik ergens leeg om te stoppen.</p>
    ${ro ? '' : `${shapes.length || routes.length ? `<label class="l">Inplannen bij<select class="f" id="mStep"><option value="">Kies…</option>${stepOptions(-1)}</select></label>` : ''}${props}
    <div class="row">${routes.length || bars.length ? (nCopy ? `<button class="btn sm primary" id="mNext" type="button">Kopie naar volgende werkgang${nxt && !todoR.some(r => nextOf(r.step) !== nxt) ? ' (' + phase + '.' + nxt + ')' : ''} · ${nCopy}</button>` : '<button class="btn sm" type="button" disabled>✓ Staat al in volgende werkgang</button>') : ''}<button class="btn sm danger" id="mDel" type="button">Verwijderen (${ids.length})</button></div>`}</div>`;
  if(ro) return;
  $('#mStep') && ($('#mStep').onchange = e => { if(e.target.value === '') return; const n = Number(e.target.value); stash(); [...shapes, ...routes].forEach(x => x.step = n); changed(); edRefresh(); toast(`${shapes.length + routes.length} onderdelen ${n ? 'in werkgang ' + phase + '.' + n : 'uit de planning'}.`); });
  $('#mNext') && ($('#mNext').onclick = () => { stash();
    for(const r of todoR){ const c = clone(r); c.id = uid(); c.step = nextOf(r.step); delete c.wholePhase; P.routes.push(c); }
    for(const b of todoB){ const q = barPos(b, i).pos, n = nextOf(cur); P.barriers.push({id:'hek-' + Math.random().toString(36).slice(2, 7), ...(b.type ? {type:b.type} : {}), phase:b.phase, x:q.x, y:q.y, angle:q.angle ?? 0, scale:b.scale || .6453125000000001, start:n - 1, end:n, moves:[]}); }
    changed(); edRefresh(); toast(nCopy + ' onderdelen gekopieerd naar de volgende werkgang.'); });
  $('#mDel').onclick = removeMulti;
  $('#mWidth') && ($('#mWidth').onchange = e => { if(!e.target.value) return; stash(); routes.forEach(r => r.width = Number(e.target.value)); changed(); render2(); toast('Lijndikte aangepast voor ' + routes.length + ' routes.'); });
  $('#mGap') && ($('#mGap').onchange = e => { if(!e.target.value) return; stash(); routes.forEach(r => r.gap = Number(e.target.value)); changed(); drawCtx(); render2(); });
  let st0 = false; const live = (id, fn) => { const f = $(id); if(!f) return; f.oninput = e => { if(!st0){ stash(); st0 = true; } fn(Number(e.target.value)); render2(); }; f.onchange = () => { st0 = false; changed(); }; };
  live('#mBSc', v => routes.forEach(r => { r.scale = v; lastHekScale.baken = v; }));
  live('#mScale', v => { bars.forEach(b => { const t = ensureSingle(b); t.scale = Math.round(v * 1000) / 1000; }); lastHekScale[S.pid + '|hek'] = P.hekScale = v;  });
  $('#mTrue') && ($('#mTrue').onclick = () => { stash(); bars.forEach(b => { ensureSingle(b).scale = hekTrue(b); }); if(!isBaken(bars[0])) lastHekScale[S.pid + '|hek'] = P.hekScale = hekTrue(bars[0]); changed(); drawCtx(); render2(); });
  $('#mKind') && ($('#mKind').onchange = e => { const k = e.target.value; stash();
    for(const sh of shapes){ const m = sh.code.match(/^([A-Z]{1,3})(\d+)$/); sh.kind = k; if(m && m[1] !== k && kinds().includes(m[1])){ let n = Number(m[2]), c = k + n; while(P.shapes.some(a => a !== sh && a.phase === sh.phase && a.code === c)) c = k + (++n); sh.code = c; } }
    changed(); edRefresh(); toast(shapes.length + ' vakken nu ' + kName(k).toLowerCase() + '.'); });
}
function removeMulti(){ if(!S.canWrite || !multi.size) return; stash(); const n = multi.size;
  for(const b of P.barriers.filter(x => multi.has(x.id))) ensureSingle(b);
  P.barriers = P.barriers.filter(x => !multi.has(x.id)); for(const k of ['shapes','routes']) P[k] = P[k].filter(x => !multi.has(x.id));
  multi.clear(); selected = ''; selBar = ''; changed(); edRefresh(); toast(n + ' onderdelen verwijderd.'); }
function removeSelected(){ if(!S.canWrite) return; if(multi.size) return removeMulti(); if(selBar){ stash(); const sb = P.barriers.find(x => x.id === selBar); if(sb) ensureSingle(sb); P.barriers = P.barriers.filter(x => x.id !== selBar); selBar = ''; changed(); return edRefresh(); } if(selected.startsWith('ext-')) return removeExt(Number(selected.slice(4))); if(!selected || selected.startsWith('phase-outline-')) return; stash(); for(const k of ['shapes','boundaries','routes']) P[k] = P[k].filter(s => s.id !== selected); selected = ''; changed(); edRefresh(); }
const vzOpen = new Set();
function drawList(){
  const el = $('#itemList'); if(!el) return; let html = '';
  const KF = [['all','Alle'], ...WZ().map(w => [w.code, w.naam]), ['route','Routes']]; if(kindFilter !== 'all' && !KF.some(x => x[0] === kindFilter)) kindFilter = 'all';
  const kf = $('#kFilter'); if(kf){ kf.innerHTML = KF.map(([k, l]) => `<button type="button" ${k === 'all' || k === 'route' ? '' : kst(k)} data-kf="${k}" aria-pressed="${kindFilter === k}">${k === 'all' || k === 'route' ? '' : '<i class="sw"></i>'}${esc(l)}</button>`).join('');
    kf.querySelectorAll('[data-kf]').forEach(b => b.onclick = () => { kindFilter = b.dataset.kf; drawList(); render2(); }); }
  const match = s => kindFilter === 'all' || (kindFilter === 'route' ? ROUTE_KINDS.includes(s.kind) : s.kind === kindFilter);
  const all = records().filter(s => s.phase === phase && match(s));
  if(kindFilter !== 'all'){ const st = [...new Set(all.filter(s => s.step > 0).map(s => s.step))].sort((a, b) => a - b), name = KF.find(x => x[0] === kindFilter)[1];
    html += `<div class="kv wgos">${esc(name)} in ${st.length ? (st.length === 1 ? 'werkgang' : 'werkgangen') : 'nog geen werkgang'} ${st.map(n => `<button type="button" class="wgo" data-go="${n}" aria-current="${String(n) === stepVal}">${phase}.${n}</button>`).join('')}${all.some(s => !s.step) ? `<span>· ${all.filter(s => !s.step).length} nog niet ingepland</span>` : ''}</div>`; }
  // Per werkgang: eerst de werkvakken, daaronder ingeklapt de voorzieningen (depot, routes, hekken, schildjes, borden) die bij die werkgang horen.
  const steps = plannedSteps(), last = steps.at(-1) || 0;
  const wgSel = s => `<select class="wgsel" data-wg="${esc(s.id)}" aria-label="Werkgang voor ${esc(s.code)}" ${S.canWrite ? '' : 'disabled'}>${[0, ...steps, ...(last < 99 ? [last + 1] : [])].map(n => `<option value="${n}" ${n === s.step ? 'selected' : ''}>${n === 0 ? 'Werkgang…' : steps.includes(n) ? phase + '.' + n + ' · ' + esc(P.shapes.filter(x => x.phase === phase && x.step === n).map(x => x.code).join('+')) : '+ nieuw ' + phase + '.' + n}</option>`).join('')}</select>`;
  const row = s => `<div class="li"><button type="button" ${kinds().includes(s.kind) ? kst(s.kind) : `class="k-${s.kind}"`} data-sel="${esc(s.id)}" aria-current="${s.id === selected || multi.has(s.id)}"><span>${esc(P.shapes.includes(s) ? workCode(s) : s.code)}</span>${s.kind === 'boundary' ? '<small>grens</small>' : s.kind === 'depot' && depotM2(s) !== null ? `<small>${Math.round(depotM2(s)).toLocaleString('nl-NL')} m²</small>` : ROUTE_KINDS.includes(s.kind) && routeLen(s) !== null ? `<small>${fmtM(routeLen(s))}</small>` : ''}</button>${s.kind === 'boundary' ? '' : wgSel(s)}</div>`;
  const barRow = b => `<button type="button" class="k-bar" data-bar="${esc(b.id)}" aria-current="${b.id === selBar || multi.has(b.id)}"><span>${isBord(b) ? esc(signOf(b.sign).n) : (isBaken(b) ? 'Schildje' : 'Hek') + ' ' + esc(b.id.replace('hek-', ''))}</span><small>${b.phase}.${b.start + 1} t/m ${b.phase}.${b.end}</small></button>`;
  const vzSummary = (rs, bs) => { const c = {}; for(const r of rs) c[KIND_NAME[r.kind] || r.kind] = (c[KIND_NAME[r.kind] || r.kind] || 0) + 1; if(bs.length) c[bs.every(isBord) ? 'Borden' : 'Hekken en borden'] = bs.length; return Object.entries(c).map(([k, n]) => (n > 1 ? n + '× ' : '') + k.toLowerCase()).join(', '); };
  const isVz = s => ROUTE_KINDS.includes(s.kind);
  for(const g of ['Nu aan de beurt','Nog in te plannen','Nog te doen','Al geweest','Ingepland','Werkgrenzen']){
    const items = all.filter(s => planningState(s) === g).sort((a, b) => a.step - b.step || isVz(a) - isVz(b) || a.code.localeCompare(b.code));
    const nums = g === 'Nog in te plannen' || g === 'Werkgrenzen' ? [] : [...new Set(items.map(s => s.step))];
    const barsNow = g === 'Nu aan de beurt' ? P.barriers.filter(b => b.phase === phase && frameIndex() >= b.start && frameIndex() < b.end) : [];
    if(!items.length && !barsNow.length) continue;
    if(!nums.length){ html += `<h4>${g} (${items.length})</h4>` + items.map(row).join(''); continue; }
    html += `<h4>${g} (${nums.length} ${nums.length === 1 ? 'werkgang' : 'werkgangen'})</h4>`;
    for(const n of nums){ const its = items.filter(s => s.step === n), vak = its.filter(s => !isVz(s)), vz = its.filter(isVz), bs = String(n) === stepVal ? barsNow : [];
      const sc = schedFor(phase, n), key = phase + '.' + n, open = kindFilter === 'route' || vzOpen.has(key) || vz.some(x => x.id === selected || multi.has(x.id)) || bs.some(b => b.id === selBar || multi.has(b.id));
      html += `<div class="wgblk"><button type="button" class="wgh" data-go="${n}" aria-current="${String(n) === stepVal}"><b>${esc(key)}</b><span>${esc(vak.map(workCode).join(' + ') || 'geen werkvakken')}</span>${sc?.start ? `<small>${fmtD(sc.start)}${sc.eind !== sc.start ? '–' + fmtD(sc.eind) : ''}</small>` : ''}</button>`
        + vak.map(row).join('')
        + (vz.length || bs.length ? `<details class="vz" data-vz="${esc(key)}" ${open ? 'open' : ''}><summary>Voorzieningen <small>${esc(vzSummary(vz, bs))}</small></summary>${vz.map(row).join('')}${bs.map(barRow).join('')}</details>` : '') + '</div>'; }
  }
  el.innerHTML = html || '<p class="faint" style="margin:0;font-size:13px">Nog geen werkvakken in deze hoofdfase. Teken er een met W.</p>';
  $('#listTitle').textContent = 'Werkvakken · ' + (P.phases.find(p => p.id === phase)?.name || '');
  el.querySelectorAll('[data-sel]').forEach(b => b.onclick = e => { if(!finish(false)) return; tool = 'select'; { const it = records().find(x => x.id === b.dataset.sel); if(it && !editableHere(it)){ multi.clear(); stepVal = String(it.step); selBar = ''; selected = it.id; drawSteps(); drawCtx(); drawList(); drawToolState(); render2(); return; } } if(e.shiftKey && !P.boundaries.some(x => x.id === b.dataset.sel)) return toggleMulti(b.dataset.sel); multi.clear(); selected = b.dataset.sel; selBar = ''; drawToolState(); drawCtx(); drawList(); render2(); });
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => chooseStep(b.dataset.go));
  el.querySelectorAll('details[data-vz]').forEach(d => d.ontoggle = () => { if(kindFilter === 'route') return; d.open ? vzOpen.add(d.dataset.vz) : vzOpen.delete(d.dataset.vz); });
  el.querySelectorAll('[data-wg]').forEach(f => f.onchange = () => { const s = records().find(x => x.id === f.dataset.wg); if(!s) return; const n = Number(f.value); if(n === s.step) return;
    stop(); stash(); s.step = n; changed(); drawPhaseBar(); drawSteps(); drawCtx(); drawList(); render2(); toast(workCode(s) + (n ? ' staat nu in werkgang ' + s.phase + '.' + n : ' is uit de planning gehaald') + '.'); });
  el.querySelectorAll('[data-bar]').forEach(b => b.onclick = e => { tool = 'select'; if(e.shiftKey) return toggleMulti(b.dataset.bar); multi.clear(); selBar = b.dataset.bar; selected = ''; drawToolState(); drawCtx(); drawList(); render2(); });
}

