/* ---------- navigatie ---------- */
document.querySelectorAll('#nav [data-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; lsSet('eis.tab', S.tab); render(); window.scrollTo(0, 0); });
$('#btnSettings').onclick = () => { $('#meer').open = false; openSettings(); };
$('#btnXlsx').onclick = () => { $('#meer').open = false; exportXlsx(); };
document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)){ e.preventDefault(); undo(); }
  if(S.tab === 'planning' && S.pick && !S.editName && S.canWrite && $('#modal').hidden && !S.sel && !S.selProj && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && !e.ctrlKey && !e.metaKey && !e.altKey){
    if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); const it = S.items.find(x => x.id === S.pick); if(!it) return;
      const idx = idxOfItem(it); const rs = runsOf(it, idx); const run = S.pickRun || (rs.length === 1 ? `${rs[0][0]}-${rs[0][1]}` : null);
      if(!run) return toast('Klik eerst op de balk die weg moet.');
      const [a, b] = run.split('-').map(Number); S.pickRun = null; commitDays(it, idx.filter(i => i < a || i > b));
      toast(`Periode ${fD(R.days[a])}${a !== b ? ' – ' + fD(R.days[b]) : ''} verwijderd.`, {label:'Ongedaan maken', fn:() => undo()}); return; }
    if(e.key === 'F2' || e.key === 'Enter'){ e.preventDefault(); startEdit(S.pick); return; }
    if(e.key.length === 1 && e.key !== ' '){ e.preventDefault(); startEdit(S.pick, e.key); return; }
  }
  if(e.key === 'Escape'){ if(!$('#modal').hidden) closeModal(); else if(S.selProj) closeProj(); else if(S.sel) closeDrawer(); else if(S.pick){ S.pick = null; document.querySelectorAll('#gbody .grow.pick').forEach(r => r.classList.remove('pick')); document.querySelectorAll('#gbody .bar.pickrun').forEach(b => b.classList.remove('pickrun')); } }
});

function render(){
  R = range();
  document.querySelectorAll('#nav [data-tab]').forEach(b => b.setAttribute('aria-current', String(b.dataset.tab === S.tab || (b.dataset.tab === 'planning' && S.tab === 'week'))));
  if(!(S.ready.p && S.ready.i)){ $('#main').innerHTML = '<p class="muted">Eisenhower wordt geladen…</p>'; return; }
  const keep = $('#gwrap') ? {l:$('#gwrap').scrollLeft, t:$('#gwrap').scrollTop} : null;
  const ed = $('#nmIn'); if(ed && S.editName){ S.editVal = ed.value; S.editCaret = ed.selectionStart; }
  S.rendering = true;
  const occ = occupancy();
  let html = '';
  if(S.noDb) html += `<div class="banner"><p><b>De gedeelde planning is in deze weergave niet beschikbaar.</b> Wijzigingen blijven alleen op dit scherm staan en gaan verloren bij herladen.</p></div>`;
  else if(!S.canWrite) html += `<div class="banner info"><p>${S.canVb ? 'Je kunt de voorbereiding bijwerken: klik op het tekentje voor een project (! niet gestart, klokje bezig, ✓ gereed). De planning zelf past alleen Pieter aan.' : 'Je bekijkt Eisenhower. Alleen Pieter past de planning aan.'}</p></div>`;
  if(S.tab === 'voortgang') html += renderVoorpagina(occ);
  else if(S.tab === 'voorb') html += renderVoorbItems();
  else if(S.tab === 'vak') html += renderVak();
  else if(S.tab === 'gereed') html += renderVoortgang(occ, 'gereed');
  else if(S.tab === 'offerte') html += renderVoortgang(occ, 'offerte');
  else if(S.tab === 'archief') html += renderVoortgang(occ, 'archief');
  else { html += `<div class="subnav seg"><button type="button" data-sub="planning" aria-pressed="${S.tab === 'planning'}">Tijdlijn</button><button type="button" data-sub="week" aria-pressed="${S.tab === 'week'}">Weekoverzicht</button></div>`; html += S.tab === 'week' ? renderWeek(occ) : renderPlanning(occ); }
  $('#main').innerHTML = html;
  S.rendering = false;
  wire(occ);
  if(S.tab === 'vak') wireVak();
  if(S.tab === 'planning' && $('#gwrap')){
    if(keep && !S.firstScroll){ $('#gwrap').scrollLeft = keep.l; $('#gwrap').scrollTop = keep.t; }
    else if(S.ploegen.length || S.items.length){ scrollToDay(TODAYISO, 10); S.firstScroll = false; }
  }
  if(S.sel) renderDrawer(); else if(S.selProj) renderProj();
  names([...S.items.map(i => i.updatedBy)]);
}
async function names(ids){ ids = [...new Set(ids.filter(Boolean))].filter(id => !(id in S.names)); if(!S.user || !ids.length) return;
  try{ const ps = await S.user.profiles(ids); for(const id of ids) S.names[id] = ps[id]?.name || ''; if(S.sel) renderDrawer(); }catch{} }
