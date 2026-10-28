/* ================= overzicht ================= */
function renderOverview(){
  const html = P.phases.map(p => {
    const sh = P.shapes.filter(s => s.phase === p.id), steps = [...new Set(sh.filter(s => s.step > 0).map(s => s.step))].sort((a,b) => a - b);
    const cell = (list) => list.map(s => `<span class="vak" ${kst(s.kind)}>${esc(p.id + '.' + s.code)}</span>`).join(' ') || '<span class="faint">–</span>';
    const bars = n => [barsIn(p.id, n), barsIn(p.id, n, 'baken')].map((v, i) => v ? v + (i ? ' sch.' : '') : '').filter(Boolean).join(' + ');
    const rows = steps.map(n => { const s = sh.filter(x => x.step === n); return `<tr><td class="code">${p.id}.${n}</td>${kinds().map(k => `<td>${cell(s.filter(x => x.kind === k))}</td>`).join('')}<td class="num">${bars(n) || ''}</td><td>${relatedRows(p.id, n).map(o => `<span class="par">${o.rel === 'voor' ? 'na ' : '∥ '}${o.r.key}</span>`).join(' ')}</td><td><button class="btn ghost sm" data-see="${esc(p.id)}|${n}" type="button">Bekijk</button></td></tr>`; }).join('');
    const pend = sh.filter(s => !s.step);
    return `<section class="panel"><div class="row" style="justify-content:space-between"><h2>${esc(p.name)}</h2><span class="row"><span class="chip">${steps.length} werkgangen</span><span class="chip">${sh.length} werkvakken</span>${routeTotals(P.routes.filter(r => r.phase === p.id)).map(t => `<span class="chip">${KIND_NAME[t.kind]} ${fmtM(t.m)}</span>`).join('')}${hbText(p.id) ? `<span class="chip">${hbText(p.id)}</span>` : ''}${pend.length ? `<span class="chip warn">${pend.length} ongepland</span>` : ''}</span></div>
      ${steps.length || pend.length ? `<div class="scroll"><table class="t"><thead><tr><th>Werkgang</th>${kinds().map(k => `<th>${esc(kName(k))}</th>`).join('')}<th>Hekken</th><th title="Werkgangen uit andere hoofdfases die tegelijk lopen (∥) of waar deze direct op volgt (na)">Gelijktijdig</th><th></th></tr></thead><tbody>${rows}
      ${pend.length ? `<tr class="pend"><td>Ongepland</td><td colspan="${kinds().length + 3}">${cell(pend)}</td></tr>` : ''}</tbody></table></div>` : '<p class="muted" style="margin:0">Nog geen werkvakken in deze hoofdfase.</p>'}
    </section>`;
  }).join('');
  const vz = voorzieningen(), vzSum = k => vz.reduce((a, r) => a + r[k], 0), hasSc = Number(M?.schaal) > 0; const fm = v => v ? fmtM(v) : '–';
  const vzHtml = `<section class="panel"><h2>Tijdelijke voorzieningen per hoofdfase</h2>${hasSc ? '' : '<p class="muted" style="margin:0">Vul de schaal in op het tabblad Project om meters te berekenen.</p>'}
    <div class="scroll"><table class="t"><thead><tr><th>Hoofdfase</th><th class="num">Rijroute</th><th class="num">Bouwhekken</th><th class="num">Looproute</th><th class="num">Losse hekken</th><th class="num">Schildjes</th></tr></thead><tbody>
    ${vz.map(r => `<tr><td>${esc(r.ph.name)}</td><td class="num">${hasSc ? fm(r.plate) : '–'}</td><td class="num">${hasSc ? fm(r.fence) : '–'}</td><td class="num">${hasSc ? fm(r.walk) : '–'}</td><td class="num">${r.hekken ? r.hekken + ' st. (≈ ' + fmtM(r.hekken * 3.5) + ')' : '–'}</td><td class="num">${r.bakens ? r.bakens + ' st.' : '–'}</td></tr>`).join('')}
    <tr class="tot"><td><b>Totaal</b></td><td class="num"><b>${hasSc ? fm(vzSum('plate')) : '–'}</b></td><td class="num"><b>${hasSc ? fm(vzSum('fence')) : '–'}</b></td><td class="num"><b>${hasSc ? fm(vzSum('walk')) : '–'}</b></td><td class="num"><b>${vzSum('hekken') ? vzSum('hekken') + ' st.' : '–'}</b></td><td class="num"><b>${vzSum('bakens') ? vzSum('bakens') + ' st.' : '–'}</b></td></tr></tbody></table></div></section>`;
  $('#tabBody').innerHTML = `<div class="stack">${vzHtml}<p class="muted" style="margin:0">Hoofdfases worden na elkaar uitgevoerd, tenzij je in het Tijdschema een werkgang aan een andere koppelt; dat zie je in de kolom Gelijktijdig. Werkgang 2.3 is de derde werkgang van hoofdfase 2; vakken in dezelfde werkgang lopen tegelijk. ${wzOpt().afwerk ? 'Tijdens de hoofdfase wordt ' + esc(kName(kLast()).toLowerCase()) + ' groen zodra de werkgang voorbij is; bij Einde is de hele hoofdfase groen (gereed).' : ''}</p>${html}</div>`;
  $('#tabBody').querySelectorAll('[data-see]').forEach(b => b.onclick = () => { const [ph, n] = b.dataset.see.split('|'); phase = ph; stepVal = n; projectMode = false; selected = ''; S.tab = 'planning'; renderProject(); });
}

/* ================= beheer ================= */
function renderBeheer(){
  const m = S.projects.find(p => p.id === S.pid) || M;
  const ro = !S.canWrite, mode = S.tab;
  $('#tabBody').innerHTML = mode === 'backup' ? `<div class="stack">
  <div class="row"><button class="btn ghost" id="backToProj" type="button">‹ Terug naar Project</button></div>
  <section class="panel"><h2>Backup</h2>
    <p class="muted" style="margin:0">Leeghwater slaat automatisch op. ${ro ? '' : `Met <b>Backup maken</b> bewaar je direct een versie in Leeghwater én krijg je het backupbestand om op te slaan in <span class="mono">Projecten\\${esc(m.name)}\\Backup</span>. Handmatige backups worden niet automatisch opgeruimd.`}</p>
    ${ro ? '' : `<div class="row"><input class="f" id="bkLabel" placeholder="Omschrijving (optioneel), bijv. Voor overleg gemeente" style="max-width:420px"><button class="btn primary" id="bkGo" type="button">Backup maken</button><button class="btn" id="bxImp" type="button">Importeren</button></div>`}
    <details class="more"><summary>Meer</summary><div class="row" style="margin-top:8px"><button class="btn sm" id="bxPlan" type="button">Alleen planning exporteren (JSON)</button><button class="btn sm" id="bxFull" type="button">Volledige backup exporteren (JSON)</button><button class="btn sm" id="bxCopy" type="button">Planning kopiëren als tekst</button></div>
    <textarea class="f mono" id="bxText" rows="4" readonly hidden aria-label="Planning als tekst"></textarea></details>
  </section>
  <section class="panel"><h2>Versies</h2><p class="muted" style="margin:0">Elk half uur dat er gewerkt wordt, en vóór elke import of terugzetting, bewaart Leeghwater een versie. De laatste 25 blijven bewaard.</p><div class="vers" id="vers"></div></section>
  </div>` : `<div class="stack">
  <section class="panel vb"><div class="vbg"><div class="stack" style="gap:10px">
    <h2>Project in het kort</h2>
    <dl class="facts">${[['Projectnummer', m.nummer], ['Plaats', m.plaats], ['Opdrachtgever', m.opdrachtgever], ['Status', m.status === 'afgerond' ? 'Afgerond' : 'Actief'],
      ['Werkzaamheden', WZ().map(w => w.naam).join(' → ')], ['Hoofdfases', P.phases.map(p => p.name + ' (' + plannedSteps(p.id).length + ' wg)').join(', ')],
      ['Uitvoering', (() => { const r = spanOf(scheduleRows().rows); return r ? fmtD(r.start, true) + ' t/m ' + fmtD(r.eind, true) : 'nog geen startdatum (tabblad Tijdschema)'; })()],
      ['Tekening', (m.bgNaam || '—') + (m.schaal ? ' · schaal 1:' + m.schaal : '')], ['Laatst gewijzigd', stamp(m.updatedAt) + (nameOf(m.updatedBy) ? ' door ' + nameOf(m.updatedBy) : '')]]
      .filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    </div><figure class="vbimg"><div id="vbImg" class="faint">Overzicht wordt gemaakt…</div><figcaption class="kv">Hoofdfases op de tekening</figcaption></figure></div></section>
  <section class="panel"><h2>Projectgegevens</h2>
    <div class="form">
      <label class="l">Projectnaam<input class="f" id="bmName" value="${esc(m.name)}" ${ro ? 'disabled' : ''}></label>
      <label class="l">Projectnummer<input class="f" id="bmNr" value="${esc(m.nummer || '')}" ${ro ? 'disabled' : ''}></label>
      <label class="l">Plaats<input class="f" id="bmPl" value="${esc(m.plaats || '')}" ${ro ? 'disabled' : ''}></label>
      <label class="l">Opdrachtgever<input class="f" id="bmOg" value="${esc(m.opdrachtgever || '')}" ${ro ? 'disabled' : ''}></label>
      <label class="l">Schaal tekening 1 : … (bij PDF, voor m²)<input class="f" id="bmSc" type="number" min="1" step="1" value="${esc(m.schaal || '')}" ${ro ? 'disabled' : ''}></label>
      <label class="l">Status<select class="f" id="bmSt" ${ro ? 'disabled' : ''}><option value="actief">Actief</option><option value="afgerond">Afgerond</option></select></label>
    </div>
    <p class="kv" style="margin:0">Tekening: ${esc(m.bgNaam || '—')} · coördinaten ${m.w} × ${m.h} · ${(m.workExtent || []).length} werkgrens-uitsnede(n) · ${m.pdf ? 'scherp inzoomen aan (originele PDF bewaard)' : 'scherp inzoomen uit: kies Tekening vervangen met dezelfde PDF'}</p>
    ${ro ? '' : '<div class="row"><button class="btn primary" id="bmSave" type="button">Gegevens bewaren</button><button class="btn" id="bmBg" type="button" ' + (S.assets ? '' : 'disabled') + '>Tekening vervangen</button></div>'}
  </section>
  <section class="panel" id="wzPanel"></section>
  <section class="panel"><div class="row" style="justify-content:space-between"><div><h2>Backups en versies</h2><p class="muted" style="margin:0">Leeghwater bewaart automatisch versies. Hier kun je een oude versie terugzetten of een backupbestand maken.</p></div><button class="btn" id="toBackup" type="button">Openen</button></div></section>
  ${ro ? '' : `<section class="panel" style="border-top-color:var(--crit)"><h2 style="color:var(--crit)">Project verwijderen</h2><p class="muted" style="margin:0">Het project verdwijnt uit het overzicht voor iedereen. Maak eerst een volledige backup.</p><div class="row"><button class="btn danger" id="bxDel" type="button">Project verwijderen</button></div></section>`}
  </div>`;
  $('#bmSt') && ($('#bmSt').value = m.status || 'actief');
  if(!ro){
    if($('#bmSave')) $('#bmSave').onclick = async () => { const upd = {name:$('#bmName').value.trim() || m.name, nummer:$('#bmNr').value.trim(), plaats:$('#bmPl').value.trim(), opdrachtgever:$('#bmOg').value.trim(), schaal:Number($('#bmSc').value) || null, status:$('#bmSt').value, updatedAt:new Date().toISOString(), updatedBy:S.meId};
      try{ await metaUpdate(upd); toast('Projectgegevens bewaard.'); renderProject(); }catch(e){ toast('Bewaren mislukt: ' + (e.message || e.code)); } };
    if($('#bmBg')) $('#bmBg').onclick = () => { const i = $('#pickDrawing'); i.value = ''; i.onchange = () => replaceDrawing(i.files[0]); i.click(); };
    if($('#bxImp')) $('#bxImp').onclick = () => pickJson(importIntoProject);
    const del = $('#bxDel'); if(del) del.onclick = async () => { if(!del.classList.contains('armed')){ del.classList.add('armed'); del.textContent = 'Klik nogmaals om te verwijderen'; setTimeout(() => { del.classList.remove('armed'); del.textContent = 'Project verwijderen'; }, 4000); return; }
      try{ await maybeBackup(S.pid, JSON.stringify(P), 'Voor verwijderen', true); await metaUpdate({deleted:true, updatedAt:new Date().toISOString(), updatedBy:S.meId}); toast('Project verwijderd.'); go('home'); }catch(e){ toast('Verwijderen mislukt: ' + (e.message || e.code)); } };
  }
  const base = slug(m.name) + '-' + new Date().toISOString().slice(0, 10);
  if($('#bxPlan')) $('#bxPlan').onclick = () => saveFile(base + '-planning.json', JSON.stringify(P, null, 2));
  $('#bkGo') && ($('#bkGo').onclick = async () => { const b = $('#bkGo'); b.disabled = true; try{ await manualBackup($('#bkLabel').value.trim()); $('#bkLabel').value = ''; }finally{ b.disabled = false; } });
  $('#toBackup') && ($('#toBackup').onclick = () => { S.tab = 'backup'; renderProject(); });
  $('#backToProj') && ($('#backToProj').onclick = () => { S.tab = 'project'; renderProject(); });
  if($('#bxFull')) $('#bxFull').onclick = () => { const mm = S.projects.find(p => p.id === S.pid) || M; saveFile(base + '-volledige-backup.json', JSON.stringify({format:'leeghwater-backup-v1', exportedAt:new Date().toISOString(),
    meta:{name:mm.name, nummer:mm.nummer, plaats:mm.plaats, opdrachtgever:mm.opdrachtgever, status:mm.status, w:mm.w, h:mm.h, bg:mm.bg, bgNaam:mm.bgNaam, workExtent:mm.workExtent || []}, project:P}, null, 2)); };
  if($('#bxCopy')) $('#bxCopy').onclick = async () => { const t = $('#bxText'); t.hidden = false; t.value = JSON.stringify(P, null, 2); try{ await navigator.clipboard.writeText(t.value); toast('Planning gekopieerd.'); }catch{ t.focus(); t.select(); toast('Tekst geselecteerd. Druk Ctrl+C om te kopiëren.'); } };
  if(mode === 'backup') renderVersions(); else { renderWz(); voorbladImage(); }
}
async function voorbladImage(){
  if(analysisPid !== S.pid && S.db){ const pid = S.pid; S.db.doc('analyses/' + pid).get().then(d => { if(S.pid !== pid) return; analysisPid = pid; analysisDoc = d.exists ? d.data() : null; const el = $('#vbAn'); if(el && analysisDoc?.samenvatting) el.innerHTML = '<b>Uit de analyse:</b> ' + esc(analysisDoc.samenvatting); }).catch(() => {}); }
  const el = $('#vbImg'); if(!el || !M.bg) { if(el) el.textContent = 'Nog geen tekening.'; return; }
  try{ const img = new Image(); img.src = '/_blob/' + M.bg; await img.decode(); const ob = ext().length ? bboxOf(ext().flat()) : [0, 0, P.w, P.h];
    const cv = await frameCanvas(img, [Math.max(0, ob[0] - 20), Math.max(0, ob[1] - 20), Math.min(P.w, ob[2] + 20), Math.min(P.h, ob[3] + 20)], 1400, null, 'all', {overview:true});
    if(!$('#vbImg')) return; cv.className = 'vbcv'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Overzicht van de hoofdfases op de tekening'); $('#vbImg').replaceWith(cv); }catch{ el.textContent = 'Overzicht niet beschikbaar.'; }
}
function renderWz(){
  const el = $('#wzPanel'); if(!el) return; const ro = !S.canWrite, W = WZ(), o = wzOpt(), used = k => P.shapes.filter(s => s.kind === k).length;
  el.innerHTML = `<h2>Werkzaamheden</h2>
    <p class="muted" style="margin:0">Leeghwater is niet alleen voor riolering. Stel per project in welke werkzaamheden er zijn en in welke volgorde ze op één plek gebeuren. De controle, kleuren, filters, het tijdschema en de PDF volgen deze indeling.</p>
    ${ro ? '' : `<div class="row"><select class="f" id="wzPreset" style="max-width:420px">${Object.entries(WZ_PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.naam)}: ${p.wz.map(w => w.naam).join(' → ')}</option>`).join('')}</select><button class="btn" id="wzApply" type="button">Indeling overnemen</button></div>`}
    <div class="scroll"><table class="t"><thead><tr><th>Volgorde</th><th>Code</th><th>Naam</th><th>Kleur</th><th class="num">Vakken</th><th></th></tr></thead><tbody>
    ${W.map((w, i) => `<tr><td class="num"><span class="row" style="gap:2px;justify-content:flex-end">${i + 1} ${ro ? '' : `<button class="btn sm" data-wzup="${i}" type="button" ${i ? '' : 'disabled'} aria-label="Eerder">▲</button><button class="btn sm" data-wzdn="${i}" type="button" ${i < W.length - 1 ? '' : 'disabled'} aria-label="Later">▼</button>`}</span></td>
      <td><input class="f mono" data-wzcode="${i}" value="${esc(w.code)}" maxlength="3" style="width:64px" ${ro ? 'disabled' : ''}></td>
      <td><input class="f" data-wznaam="${i}" value="${esc(w.naam)}" ${ro ? 'disabled' : ''}></td>
      <td><input type="color" data-wzkleur="${i}" value="${esc(w.kleur)}" ${ro ? 'disabled' : ''} style="width:48px;height:32px;border:1px solid var(--line);background:none"></td>
      <td class="num">${used(w.code)}</td>
      <td>${ro ? '' : `<button class="btn sm danger" data-wzdel="${i}" type="button" ${used(w.code) || W.length < 2 ? 'disabled title="Nog in gebruik"' : ''}>Verwijderen</button>`}</td></tr>`).join('')}
    </tbody></table></div>
    ${ro ? '' : `<div class="row"><button class="btn" id="wzAdd" type="button" ${W.length >= 12 ? 'disabled' : ''}>+ Werkzaamheid</button></div>`}
    <label class="ck"><input type="checkbox" id="wzOpen" ${o.open ? 'checked' : ''} ${ro ? 'disabled' : ''}> Eerste werkzaamheid (${esc(W[0].naam)}) opent het terrein: daarna moet het op die plek worden afgewerkt</label>
    <label class="ck"><input type="checkbox" id="wzAf" ${o.afwerk ? 'checked' : ''} ${ro ? 'disabled' : ''}> Laatste werkzaamheid (${esc(W.at(-1).naam)}) maakt af: na afloop groen als gereed</label>`;
  if(ro) return;
  const setW = fn => { stash(); P.werkzaamheden = clone(WZ()); fn(P.werkzaamheden); if(!kinds().includes(newKind)) newKind = kLast(); changed(); renderWz(); };
  el.querySelectorAll('[data-wzup]').forEach(b => b.onclick = () => setW(a => { const i = +b.dataset.wzup; [a[i - 1], a[i]] = [a[i], a[i - 1]]; }));
  el.querySelectorAll('[data-wzdn]').forEach(b => b.onclick = () => setW(a => { const i = +b.dataset.wzdn; [a[i + 1], a[i]] = [a[i], a[i + 1]]; }));
  el.querySelectorAll('[data-wznaam]').forEach(f => f.onchange = () => { const v = f.value.trim(); if(v) setW(a => { a[+f.dataset.wznaam].naam = v; }); });
  el.querySelectorAll('[data-wzkleur]').forEach(f => f.onchange = () => setW(a => { a[+f.dataset.wzkleur].kleur = f.value; }));
  el.querySelectorAll('[data-wzcode]').forEach(f => f.onchange = () => { const i = +f.dataset.wzcode, old = WZ()[i].code, v = f.value.trim().toUpperCase();
    if(!/^[A-Z]{1,3}$/.test(v)){ toast('Een code is 1 tot 3 hoofdletters.'); return renderWz(); } if(v === old) return; if(kinds().includes(v)){ toast('Code ' + v + ' bestaat al.'); return renderWz(); }
    setW(a => { a[i].code = v; for(const s of P.shapes) if(s.kind === old){ s.kind = v; const m = s.code.match(new RegExp('^' + old + '(\\d+)$')); if(m) s.code = v + m[1]; } });
    toast('Code ' + old + ' is ' + v + ' geworden, ook bij de bestaande vakken.'); });
  el.querySelectorAll('[data-wzdel]').forEach(b => b.onclick = () => setW(a => { a.splice(+b.dataset.wzdel, 1); }));
  $('#wzAdd').onclick = () => setW(a => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(x => !a.some(w => w.code === x)); const pal = ['#2f8a8a', '#c9a400', '#b1402c', '#3d6fa8', '#6b6f2a', '#4b5563', '#a8456f', '#8a6d3b', '#df8b23', '#147bc1', '#9546b9', '#2f7d4f']; a.push({code:c, naam:'Nieuwe werkzaamheid', kleur:pal.find(x => !a.some(w => w.kleur.toLowerCase() === x)) || pal[0]}); });
  $('#wzOpen').onchange = e => { stash(); P.wzOpties = {...(P.wzOpties || {}), open:e.target.checked}; changed(); renderWz(); };
  $('#wzAf').onchange = e => { stash(); P.wzOpties = {...(P.wzOpties || {}), afwerk:e.target.checked}; changed(); renderWz(); };
  $('#wzApply').onclick = () => { const pr = WZ_PRESETS[$('#wzPreset').value], codes = pr.wz.map(w => w.code), missing = [...new Set(P.shapes.map(s => s.kind))].filter(k => !codes.includes(k));
    if(missing.length) return toast('Kan niet overnemen: er zijn nog vakken met code ' + missing.join(', ') + '. Wijzig die code hierboven eerst, of voeg werkzaamheden los toe.');
    setW(a => { a.splice(0, a.length, ...clone(pr.wz)); }); toast('Indeling "' + pr.naam + '" overgenomen.'); };
}
async function metaUpdate(upd){
  if(S.noDb){ const mm = S.projects.find(p => p.id === S.pid); Object.assign(mm, upd); saveLocalProjects(); Object.assign(M, upd); return; }
  await S.db.doc('projects/' + S.pid).update(upd); Object.assign(M, upd);
}
async function renderVersions(){
  const el = $('#vers'); if(!el) return;
  if(!backups.length){ el.innerHTML = '<p class="faint" style="margin:0">Nog geen versies bewaard.</p>'; return; }
  await names(backups.map(b => b.by));
  el.innerHTML = backups.map(b => { let c = ''; try{ const pr = JSON.parse(b.json); c = pr.shapes.length + ' vakken · ' + pr.routes.length + ' routes'; }catch{}
    return `<div><span><b class="num">${stamp(b.at)}</b> ${b.kind === 'handmatig' ? '<span class="pill done">Handmatig</span> ' : ''}<span class="faint">· ${esc(b.label || '')}${nameOf(b.by) ? ' · ' + esc(nameOf(b.by)) : ''} · ${c}</span></span><span class="row"><button class="btn sm" data-dlv="${esc(b.id)}" type="button">Downloaden</button>${S.canWrite ? `<button class="btn sm" data-restore="${esc(b.id)}" type="button">Terugzetten</button>` : ''}</span></div>`; }).join('');
  el.querySelectorAll('[data-dlv]').forEach(btn => btn.onclick = () => { const b = backups.find(x => x.id === btn.dataset.dlv); try{ const bk = fullBackup(); bk.project = JSON.parse(b.json); bk.exportedAt = b.at; saveFile(slug(M.name) + '-backup-' + b.at.slice(0, 16).replace(/[:T]/g, '') + '.json', JSON.stringify(bk, null, 2)); }catch(e){ toast('Downloaden mislukt: ' + e.message); } });
  el.querySelectorAll('[data-restore]').forEach(btn => btn.onclick = () => {
    if(!btn.classList.contains('armed')){ btn.classList.add('armed', 'danger'); btn.textContent = 'Zeker? Klik nogmaals'; setTimeout(() => { btn.classList.remove('armed', 'danger'); btn.textContent = 'Terugzetten'; }, 4000); return; }
    const b = backups.find(x => x.id === btn.dataset.restore); try{ const pr = validate(JSON.parse(b.json), M); maybeBackup(S.pid, JSON.stringify(P), 'Voor terugzetten', true).then(() => {}); stash(); P = pr; selected = ''; changed(); toast('Versie van ' + stamp(b.at) + ' teruggezet.'); renderProject(); }catch(e){ toast('Terugzetten mislukt: ' + e.message); }
  });
}
async function replaceDrawing(file){
  if(!file) return; toast('Tekening verwerken…');
  try{ const img = await drawingFromFile(file, () => {});
    if(Math.abs(img.w / img.h - M.w / M.h) > .01) throw Error('De nieuwe tekening heeft een andere verhouding (' + img.w + '×' + img.h + '). Gebruik dezelfde bladindeling.');
    const up = await S.assets.upload(img.blob, {type:'image/jpeg'});
    const pdfUp = await uploadPdf(img);
    await metaUpdate({bg:up.id, bgNaam:file.name, bgPx:[img.pw, img.ph], ...(pdfUp.pdf ? pdfUp : {pdf:null}), updatedAt:new Date().toISOString(), updatedBy:S.meId});
    pdfFor = null; toast(pdfUp.pdf ? 'Tekening vervangen; inzoomen is nu scherp.' : 'Tekening vervangen.'); renderProject();
  }catch(e){ toast('Vervangen mislukt: ' + (e.message || e.code)); }
}

