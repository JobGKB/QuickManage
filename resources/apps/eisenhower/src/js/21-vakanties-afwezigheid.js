/* ---------- vakanties / afwezigheid ---------- */
const AFW_GROEP = [['kantoor', 'Kantoor'], ['buiten', 'Buitendienst'], ['inhuur', 'Inhuur']];
function vakRange(){
  let lo = addD(monday(TODAY), -8 * 7), hi = addD(monday(TODAY), 52 * 7);
  for(const a of S.afw || []) for(const d of Object.keys(a.dagen || {})){ const x = parse(d); if(x < lo) lo = x; if(x > hi) hi = x; }
  lo = monday(lo); hi = addD(monday(hi), 4 + 7);
  const days = [], idx = new Map(); let d = lo; while(d <= hi){ if(!isWE(d)){ idx.set(iso(d), days.length); days.push(iso(d)); } d = addD(d, 1); }
  return {days, idx};
}
const afwOp = (a, d) => (a && a.dagen && a.dagen[d]) || '';
function afwIn(days){ const out = []; for(const a of S.afw || []){ const ds = days.filter(d => afwOp(a, d)); if(ds.length) out.push({a, ds}); } return out.sort((x, y) => (x.a.volgorde ?? 99) - (y.a.volgorde ?? 99)); }
function afwTekst(list, days){ return list.map(({a, ds}) => { const hele = ds.length === days.length && ds.every(d => afwOp(a, d) === 'x');
  return `<span class="afwn" title="${esc(ds.map(d => fWD(d) + (afwOp(a, d) === '.' ? ' (dagdeel)' : '')).join(', '))}">${esc(a.naam.split(' ')[0])}<small>${hele ? 'hele week' : ds.map(d => WD[(parse(d).getDay() + 6) % 7] + (afwOp(a, d) === '.' ? '½' : '')).join(' ')}</small></span>`; }).join('') || '<span class="faint">niemand</span>'; }
function renderVak(){
  const V = S.VR = vakRange(); const W = V.days.length * dw();
  const wk = d => { const i = V.idx.get(d); return i == null ? [] : V.days.slice(i, i + 5); };
  const w0 = wk(iso(monday(TODAY))), w1 = wk(iso(addD(monday(TODAY), 7)));
  let hm = '', hw = '', hd = '', cur = null, st = 0;
  V.days.forEach((d, i) => { const m = d.slice(0, 7); if(m !== cur){ if(cur) hm += monthSpan(cur, st, i); cur = m; st = i; } }); hm += monthSpan(cur, st, V.days.length);
  const thisMon = iso(monday(TODAY));
  V.days.forEach((d, i) => { const dt = parse(d); if(dt.getDay() === 1 || i === 0) hw += `<span class="${d === thisMon ? 'now' : ''}" style="left:${i * dw()}px;width:${5 * dw()}px">${dw() * 5 >= 44 ? 'wk ' : ''}${isoWeek(dt)}</span>`;
    if(S.zoom === 'dag') hd += `<span class="${d === TODAYISO ? 't' : ''} ${dt.getDay() === 1 ? 'mon' : ''}" style="left:${i * dw()}px;width:${dw()}px">${dt.getDate()}</span>`; });
  let ov = '';
  for(const v of S.vak){ let a = null, b = null; V.days.forEach((d, i) => { if(d >= v.start && d <= v.end){ if(a == null) a = i; b = i; } }); if(a == null) continue;
    ov += `<div class="hol ${isVrij(v) ? 'feest' : ''}" style="left:${a * dw()}px;width:${(b - a + 1) * dw()}px" title="${esc(v.label)}"></div>`; }
  V.days.forEach((d, i) => { if(i && parse(d).getDay() === 1) ov += `<div class="wkl" style="left:${i * dw()}px"></div>`; else if(i && S.zoom !== 'kwartaal') ov += `<div class="dgl" style="left:${i * dw()}px"></div>`; });
  const t = V.idx.get(TODAYISO); if(t != null) ov += `<div class="tod" style="left:${t * dw() + dw() / 2 - 1}px"></div>`;
  const lane = a => { let h = ''; let i = 0; const n = V.days.length;
    while(i < n){ const o = afwOp(a, V.days[i]); if(!o){ i++; continue; } let j = i; while(j + 1 < n && afwOp(a, V.days[j + 1]) === o) j++;
      h += `<div class="afb ${o === '.' ? 'half' : ''}" style="left:${i * dw() + 1}px;width:${(j - i + 1) * dw() - 2}px" title="${esc(a.naam)} · ${o === '.' ? 'dagdeel' : 'vrij'} · ${esc(fD(V.days[i]))}${j > i ? ' – ' + esc(fD(V.days[j])) : ''} (${j - i + 1} ${j > i ? 'dagen' : 'dag'})">${(j - i + 1) * dw() > 40 && o === 'x' ? 'vrij' : ''}</div>`; i = j + 1; }
    return h; };
  let rows = '';
  for(const [g, naam] of AFW_GROEP){
    const ps = (S.afw || []).filter(a => (a.groep || 'kantoor') === g).sort((x, y) => (x.volgorde ?? 99) - (y.volgorde ?? 99) || x.naam.localeCompare(y.naam));
    rows += `<div class="grow ghdr" style="--pc:var(--ink-3)"><div class="glab"><span class="nm"><span class="t">${naam}</span>${S.canWrite ? `<button class="gplus" type="button" data-afwadd="${g}" title="Persoon toevoegen aan ${naam}" aria-label="Persoon toevoegen aan ${naam}">+</button>` : ''}</span></div><div class="lane" style="width:${W}px"></div></div>`;
    for(const a of ps){ const tot = Object.values(a.dagen || {}).reduce((s, v) => s + (v === '.' ? .5 : 1), 0);
      rows += `<div class="grow"><div class="glab" data-afwedit="${esc(a.id)}" title="${esc(a.naam)} · ${tot} ${tot === 1 ? 'dag' : 'dagen'} vrij gepland"><span class="nm"><span class="t">${esc(a.naam)}</span><span class="afwt">${tot ? tot + ' d' : ''}</span></span></div><div class="lane" data-afwlane="${esc(a.id)}" style="width:${W}px">${lane(a)}</div></div>`; }
  }
  return `<section class="pagehead"><h2>Vakanties</h2><span class="muted">Wie er vrij is, op kantoor en buiten.</span></section>
    <div class="afwsum"><div><b>Deze week</b>${afwTekst(afwIn(w0), w0)}</div><div><b>Volgende week</b>${afwTekst(afwIn(w1), w1)}</div></div>
    <div class="toolbar"><div class="seg" id="zoomSeg">${Object.keys(ZOOM).map(z => `<button type="button" data-zoom="${z}" aria-pressed="${S.zoom === z}">${z[0].toUpperCase() + z.slice(1)}</button>`).join('')}</div>
      <button class="btn sm" type="button" id="vakToday">Vandaag</button><span class="spacer"></span>
      <span class="hint">${S.canWrite ? 'Sleep in een regel om vrije dagen te zetten. Klik op een dag: vrij → dagdeel → leeg.' : ''}</span></div>
    <div class="gwrap" id="vwrap"><div class="grid" style="width:calc(var(--lw) + ${W}px);--lw:240px">
      <div class="ghead"><div class="gcorner">Persoon</div><div class="gtl" style="width:${W}px"><div class="hm">${hm}</div><div class="hw">${hw}</div>${S.zoom === 'dag' ? `<div class="hd">${hd}</div>` : ''}</div></div>
      <div class="gbody" id="vbody"><div class="ovl" style="width:${W}px">${ov}</div>${rows || '<p class="muted" style="padding:12px">Nog geen vakanties.</p>'}</div></div></div>`;
}
async function saveAfw(id, patch){ const a = (S.afw || []).find(x => x.id === id); if(a) Object.assign(a, patch); render();
  if(S.noDb) return; try{ if(a) await S.db.doc('afwezig/' + id).set(stampPatch({naam:a.naam, groep:a.groep, volgorde:a.volgorde ?? 99, dagen:a.dagen || {}})); }catch(e){ toast('Opslaan mislukt: ' + (e.message || e.code)); } }
function wireVak(){
  const g = $('#vwrap'); if(!g) return;
  if(S.vScroll != null) g.scrollLeft = S.vScroll; else { const i = S.VR.idx.get(iso(monday(TODAY))) ?? 0; g.scrollLeft = Math.max(0, (i - 10) * dw()); }
  g.onscroll = () => { S.vScroll = g.scrollLeft; };
  $('#vakToday').onclick = () => { const i = S.VR.idx.get(iso(monday(TODAY))) ?? 0; g.scrollLeft = Math.max(0, (i - 10) * dw()); };
  if(!S.canWrite) return;
  document.querySelectorAll('[data-afwadd]').forEach(b => b.onclick = () => afwModal(null, b.dataset.afwadd));
  document.querySelectorAll('[data-afwedit]').forEach(el => el.onclick = () => afwModal(el.dataset.afwedit));
  let vd = null;
  const idxAt = (lane, e) => { const r = lane.getBoundingClientRect(); return Math.max(0, Math.min(S.VR.days.length - 1, Math.floor((e.clientX - r.left) / dw()))); };
  document.querySelectorAll('[data-afwlane]').forEach(lane => {
    lane.onpointerdown = e => { if(e.button > 0) return; const a = S.afw.find(x => x.id === lane.dataset.afwlane); if(!a) return; const i = idxAt(lane, e);
      vd = {a, lane, start:i, cur:i, moved:false, wis:!!afwOp(a, S.VR.days[i])}; try{ lane.setPointerCapture(e.pointerId); }catch{} };
    lane.onpointermove = e => { if(!vd || vd.lane !== lane) return; const i = idxAt(lane, e); if(i === vd.cur) return; vd.cur = i; vd.moved = true;
      lane.querySelectorAll('.afb.pre').forEach(x => x.remove()); const lo = Math.min(vd.start, i), hi = Math.max(vd.start, i);
      lane.insertAdjacentHTML('beforeend', `<div class="afb pre ${vd.wis ? 'wis' : ''}" style="left:${lo * dw() + 1}px;width:${(hi - lo + 1) * dw() - 2}px"></div>`); };
    lane.onpointerup = () => { if(!vd || vd.lane !== lane) return; const {a, start, cur, moved, wis} = vd; vd = null; const dagen = {...(a.dagen || {})};
      if(!moved){ const d = S.VR.days[start]; const o = afwOp(a, d); const nx = o === '' ? 'x' : o === 'x' ? '.' : ''; if(nx) dagen[d] = nx; else delete dagen[d]; }
      else { const lo = Math.min(start, cur), hi = Math.max(start, cur); for(let k = lo; k <= hi; k++){ const d = S.VR.days[k]; if(wis) delete dagen[d]; else if(!vrijOn(d)) dagen[d] = 'x'; } }
      saveAfw(a.id, {dagen}); };
  });
}
function afwModal(id, groep){
  const a = id ? S.afw.find(x => x.id === id) : null;
  openModal(`<div class="row" style="justify-content:space-between"><h2>${a ? esc(a.naam) : 'Persoon toevoegen'}</h2><button class="btn sm" type="button" id="mClose">Sluiten</button></div>
    <label class="l">Naam<input class="f" id="afNaam" value="${esc(a?.naam || '')}" placeholder="Voor- en achternaam"></label>
    <label class="l">Groep<select class="f" id="afGroep">${AFW_GROEP.map(([k, n]) => `<option value="${k}" ${(a?.groep || groep) === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="row" style="justify-content:space-between">${a ? '<button class="btn danger" type="button" id="afDel">Verwijderen</button>' : '<span></span>'}<button class="btn primary" type="button" id="afSave">Opslaan</button></div>`);
  $('#mClose').onclick = closeModal; $('#afNaam').focus();
  $('#afSave').onclick = async () => { const naam = $('#afNaam').value.trim(); if(!naam) return toast('Vul een naam in.'); const g = $('#afGroep').value; closeModal();
    if(a){ saveAfw(a.id, {naam, groep:g}); return; }
    const nid = naam.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);
    const doc = {id:nid, naam, groep:g, volgorde:Math.max(0, ...(S.afw || []).map(x => x.volgorde || 0)) + 1, dagen:{}}; S.afw = [...(S.afw || []), doc]; saveAfw(nid, {}); };
  $('#afDel') && ($('#afDel').onclick = async () => { const b = $('#afDel'); if(!b.classList.contains('armed')){ b.classList.add('armed'); b.textContent = 'Zeker weten? Klik nogmaals'; return; }
    closeModal(); S.afw = S.afw.filter(x => x.id !== a.id); render(); if(!S.noDb){ try{ await S.db.doc('afwezig/' + a.id).delete(); }catch(e){ toast('Verwijderen mislukt.'); } } });
}