/* ---------- koppelen ---------- */
function wire(occ){
  const m = $('#main');
  m.querySelectorAll('[data-kpi]').forEach(b => b.onclick = () => {
    const k = b.dataset.kpi;
    if(k === 'back'){ S.tab = 'matrix'; S.matrixScope = 'backlog'; render(); return; }
    if(S.tab !== 'planning'){ S.tab = 'planning'; render(); }
    if(k === 'cf'){ const t = R.idx.get(TODAYISO) ?? 0; const c = conflictsList(occupancy(), t, t + 19)[0]; if(c) jumpTo(c.p.id, c.day); else toast('Geen dubbelboekingen in de komende 4 weken.'); }
    if(k === 'free'){ scrollToDay(TODAYISO, 2); toast('Vrije dagen zie je als gestippelde lijn in de regel van de ploeg.'); }
  });
  m.querySelectorAll('[data-cf]').forEach(b => b.onclick = () => { const t = R.idx.get(TODAYISO) ?? 0; const c = conflictsList(occ, t, t + 19)[+b.dataset.cf]; if(c) jumpTo(c.p.id, c.day); });
  m.querySelectorAll('[data-zoom]').forEach(b => b.onclick = () => { S.vScroll = null; const g = $('#gwrap'); const mid = g ? Math.floor((g.scrollLeft + g.clientWidth / 3) / dw()) : null; S.zoom = b.dataset.zoom; lsSet('eis.zoom', S.zoom); render(); if(mid != null) $('#gwrap').scrollLeft = Math.max(0, mid * dw() - $('#gwrap').clientWidth / 3); });
  m.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => { S.sort = b.dataset.sort; lsSet('eis.sort', S.sort); render(); });
  m.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { S.tool = b.dataset.tool; render(); });
  $('#btnNew') && ($('#btnNew').onclick = async () => { S.newId = await createItem({naam:'', ploeg:null}); startEdit(S.newId); });
  const nm = $('#nmIn');
  if(nm){ nm.focus(); if(S.editCaret != null){ try{ nm.setSelectionRange(S.editCaret, S.editCaret); }catch{} } else nm.select(); S.editCaret = null;
    nm.closest('.grow')?.scrollIntoView({block:'nearest'});
    nm.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); commitEdit(true); } else if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); commitEdit(false); } };
    nm.onblur = () => { if(!S.rendering) commitEdit(true); }; }
  $('#btnToday') && ($('#btnToday').onclick = () => scrollToDay(TODAYISO, 10));
  $('#btnUndo') && ($('#btnUndo').onclick = undo);
  $('#emptyPloeg') && ($('#emptyPloeg').onclick = openSettings);
  const q = $('#q'); if(q){ q.oninput = () => { S.q = q.value; const pos = q.selectionStart; render(); const n = $('#q'); n.focus(); try{ n.setSelectionRange(pos, pos); }catch{} }; }
  $('#showKlaar') && ($('#showKlaar').onchange = e => { S.showKlaar = e.target.checked; lsSet('eis.klaar', S.showKlaar ? '1' : '0'); render(); });
  m.querySelectorAll('[data-open]').forEach(el => el.onclick = () => { if(Date.now() < (S.skipClick || 0)) return; if(el.closest('#gbody')) selectItem(el.dataset.open); else openDrawer(el.dataset.open); });
  m.querySelectorAll('[data-coll]').forEach(b => { b.onpointerdown = e => e.stopPropagation(); b.onclick = e => { e.stopPropagation(); const k = b.dataset.coll; S.coll[k] = !S.coll[k]; try{ localStorage.setItem('eis.coll', JSON.stringify(S.coll)); }catch{} render(); }; });
  m.querySelectorAll('[data-editploeg]').forEach(el => el.onclick = e => { if(e.target.closest('[data-addto]') || e.target.closest('[data-coll]')) return; openSettings(); });
  m.querySelectorAll('[data-addto]').forEach(b => b.onclick = async e => { e.stopPropagation(); S.newId = await createItem({naam:'', ploeg:b.dataset.addto || null}); startEdit(S.newId); });
  m.querySelectorAll('[data-add]').forEach(inp => inp.onkeydown = async e => { if(e.key !== 'Enter' || !inp.value.trim()) return;
    const ploeg = inp.dataset.add || null; const naam = inp.value.trim(); inp.value = ''; const id = await createItem({naam, ploeg}); toast('“' + naam + '” toegevoegd. Klik of sleep in de regel om dagen te plannen.');
    setTimeout(() => { const n = document.querySelector(`[data-add="${CSS.escape(ploeg || '')}"]`); n && n.focus(); }, 30); });
  const gb = $('#gbody');
  if(gb){
    gb.addEventListener('dblclick', e => { const lab = e.target.closest('.glab[data-open]'); const bar = e.target.closest('.bar'); const lane = e.target.closest('[data-lane]');
      const id = lab ? lab.dataset.open : (bar && lane ? lane.dataset.lane : null); if(id){ e.preventDefault(); openDrawer(id); } });
    gb.addEventListener('pointerdown', onLaneDown); gb.addEventListener('pointermove', onLaneMove);
    gb.addEventListener('pointerup', onLaneUp); gb.addEventListener('pointercancel', onLaneCancel);
    gb.querySelectorAll('[data-dropploeg]').forEach(l => {
      l.addEventListener('dragover', e => { if(!e.dataTransfer.types.includes('text/eis-item')) return; e.preventDefault(); l.classList.add('drop'); });
      l.addEventListener('dragleave', () => l.classList.remove('drop'));
      l.addEventListener('drop', e => { e.preventDefault(); l.classList.remove('drop'); const id = e.dataTransfer.getData('text/eis-item'); if(!id) return; planOnto(id, l.dataset.dropploeg || null, R.days[laneIdx(l, e)]); });
    });
  }
  m.querySelectorAll('[data-bchip]').forEach(c => { c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/eis-item', c.dataset.bchip); e.dataTransfer.effectAllowed = 'move'; }); c.onclick = () => openDrawer(c.dataset.bchip); });
  // matrix
  m.querySelectorAll('[data-scope]').forEach(b => b.onclick = () => { S.matrixScope = b.dataset.scope; lsSet('eis.scope', S.matrixScope); render(); });
  $('#mxNew') && ($('#mxNew').onclick = async () => { const id = await createItem({naam:'Nieuw werk', ploeg:null}); openDrawer(id, true); });
  m.querySelectorAll('[data-card]').forEach(c => { c.onclick = () => openDrawer(c.dataset.card); c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/eis-card', c.dataset.card); e.dataTransfer.effectAllowed = 'move'; }); });
  m.querySelectorAll('[data-quad]').forEach(z => {
    z.addEventListener('dragover', e => { if(!e.dataTransfer.types.includes('text/eis-card')) return; e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', e => { if(!z.contains(e.relatedTarget)) z.classList.remove('over'); });
    z.addEventListener('drop', e => { e.preventDefault(); z.classList.remove('over'); const id = e.dataTransfer.getData('text/eis-card'); if(id && S.canWrite) saveItem(id, {quad:z.dataset.quad || null}); });
  });
  // voortgang
  m.querySelectorAll('[data-proj]').forEach(b => b.onclick = e => { const dot = e.target.closest('[data-vbcycle]'); if(dot && S.canWrite){ e.stopPropagation(); const pr = S.projecten.find(x => x.code === dot.dataset.vbcycle); if(pr){ const cur = projInfo(pr).vb; savePro(pr.code, {vb:VB_NEXT[cur]}); } return; } openProj(b.dataset.proj); });
  m.querySelectorAll('.c2[draggable="true"]').forEach(c => c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/eis-proj', c.dataset.proj); e.dataTransfer.effectAllowed = 'move'; c.classList.add('lift'); }));
  m.querySelectorAll('.c2').forEach(c => c.addEventListener('dragend', () => c.classList.remove('lift')));
  m.querySelectorAll('[data-fasecol]').forEach(col => {
    col.addEventListener('dragover', e => { if(!e.dataTransfer.types.includes('text/eis-proj')) return; e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', e => { if(!col.contains(e.relatedTarget)) col.classList.remove('over'); });
    col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); const code = e.dataTransfer.getData('text/eis-proj'); if(code) setFase(code, col.dataset.fasecol); });
  });
  m.querySelectorAll('[data-colmore]').forEach(b => b.onclick = () => { S.colOpen = S.colOpen || {}; S.colOpen[b.dataset.colmore] = !S.colOpen[b.dataset.colmore]; render(); });
  m.querySelectorAll('details[data-grp]').forEach(d => d.ontoggle = () => { S.grpOpen = S.grpOpen || {}; S.grpOpen[d.dataset.grp] = d.open; });
  const vv = m.querySelector('details.verv'); if(vv) vv.ontoggle = () => { S.vervOpen = vv.open; };
  $('#btnRapport') && ($('#btnRapport').onclick = openRapport);
  m.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { S.tab = b.dataset.sub; lsSet('eis.tab', S.tab); render(); });
  m.querySelectorAll('[data-gotab]').forEach(b => b.onclick = () => { S.tab = b.dataset.gotab; lsSet('eis.tab', S.tab); render(); window.scrollTo(0, 0); });
  m.querySelectorAll('tr[data-proj]').forEach(tr => tr.onclick = e => { const tog = e.target.closest('[data-admtog]'); const vb = e.target.closest('[data-vbcycle]'); if(e.target.closest('[data-plannen]')) return;
    if(tog && S.canWrite){ const pr = S.projecten.find(x => x.code === tog.dataset.admtog); if(pr) savePro(pr.code, {admin:{...(pr.admin || {}), [tog.dataset.adm]:ADM_NEXT[admState(pr, tog.dataset.adm)]}}); return; }
    if(vb && S.canWrite){ const pr = S.projecten.find(x => x.code === vb.dataset.vbcycle); if(pr) savePro(pr.code, {vb:VB_NEXT[projInfo(pr).vb]}); return; }
    openProj(tr.dataset.proj); });
  wireTf(m);
  m.querySelectorAll('[data-vbico]').forEach(b => { b.onpointerdown = e => e.stopPropagation(); b.onclick = e => { e.stopPropagation(); if(!S.canVb && !S.canWrite) return; const it = S.items.find(x => x.id === b.dataset.vbico); if(it) saveVb(it.id, VB_NEXT[itVb(it)]); }; b.ondblclick = e => e.stopPropagation(); });
  m.querySelectorAll('[data-vbit]').forEach(el => el.onclick = e => { e.stopPropagation(); if(!S.canVb && !S.canWrite) return; const it = S.items.find(x => x.id === el.dataset.vbit); if(it) saveVb(it.id, VB_NEXT[itVb(it)]); });
  $('#uitvAll') && ($('#uitvAll').onclick = () => { S.uitvAll = !S.uitvAll; S.uitvOpen = true; render(); });
  $('#uitvFold') && ($('#uitvFold').ontoggle = e => { S.uitvOpen = e.target.open; });
  $('#klaarFold') && ($('#klaarFold').ontoggle = e => { S.klaarOpen = e.target.open; });
  m.querySelectorAll('[data-plannen]').forEach(b => b.onclick = e => { e.stopPropagation(); planProject(b.dataset.plannen); });
  $('#iwTog') && ($('#iwTog').onclick = () => { S.iwOpen = !S.iwOpen; render(); });
  m.querySelectorAll('[data-projopen]').forEach(el => el.onclick = e => { if(e.target.closest('[data-plannen]')) return; openProj(el.dataset.projopen); });
  m.querySelectorAll('[data-goday]').forEach(b => b.onclick = () => { S.tab = 'planning'; lsSet('eis.tab', 'planning'); S.sort = 'ploeg'; render(); scrollToDay(b.dataset.goday, 3); });
  m.querySelectorAll('[data-wvb]').forEach(b => b.onclick = () => { S.vgWvb = b.dataset.wvb; lsSet('eis.wvb', S.vgWvb); render(); });
  m.querySelectorAll('[data-lens]').forEach(b => b.onclick = () => { S.lens = S.lens === b.dataset.lens ? '' : b.dataset.lens; render(); });
  m.querySelectorAll('[data-sigtile]').forEach(b => b.onclick = () => { S.sigSel = S.sigSel === b.dataset.sigtile ? null : b.dataset.sigtile; render(); });
  $('#sigClose') && ($('#sigClose').onclick = () => { S.sigSel = null; render(); });
  $('#vgImport') && ($('#vgImport').onclick = () => { const i = $('#pickXlsx'); i.value = ''; i.click(); });
  // week
  m.querySelectorAll('[data-wkn]').forEach(b => b.onclick = () => { S.weekN = +b.dataset.wkn; render(); });
  $('#wkPrev') && ($('#wkPrev').onclick = () => { S.week = iso(addD(parse(S.week), -7)); render(); });
  $('#wkNext') && ($('#wkNext').onclick = () => { S.week = iso(addD(parse(S.week), 7)); render(); });
  $('#wkNow') && ($('#wkNow').onclick = () => { S.week = iso(monday(TODAY)); render(); });
  $('#wkCopy') && ($('#wkCopy').onclick = async () => { const t = weekText(); try{ await navigator.clipboard.writeText(t); toast('Weekplanning gekopieerd. Plak hem in Outlook of WhatsApp.'); }catch{ openModal(`<h2>Weekplanning als tekst</h2><p class="muted" style="margin:0">Kopiëren lukte niet automatisch. Selecteer de tekst en kopieer hem zelf.</p><textarea class="f" id="wkTxt" rows="16" readonly>${esc(t)}</textarea><div class="row" style="justify-content:flex-end"><button class="btn primary" type="button" id="mClose">Sluiten</button></div>`); $('#wkTxt').select(); $('#mClose').onclick = closeModal; } });
  $('#wkPdf') && ($('#wkPdf').onclick = weekPdf);
}
function jumpTo(ploegId, day){
  scrollToDay(day, 6);
  const rows = [...document.querySelectorAll('[data-row]')].filter(r => { const it = S.items.find(x => x.id === r.dataset.row); return it && it.ploeg === ploegId && (it.dagen || []).includes(day); });
  if(rows[0]){ const g = $('#gwrap'); g.scrollTop = Math.max(0, rows[0].offsetTop - 90); rows.forEach(r => { r.classList.remove('hit'); void r.offsetWidth; r.classList.add('hit'); }); }
}
