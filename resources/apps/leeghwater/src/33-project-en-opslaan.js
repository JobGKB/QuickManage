/* ================= project ================= */
function crumbs(items){ return `<nav class="crumbs" aria-label="Waar ben je"><button type="button" data-crumb="home">Projecten</button>${items.map(([l, act]) => `<span aria-hidden="true">›</span>${act ? `<button type="button" data-crumb="${act}">${esc(l)}</button>` : `<b>${esc(l)}</b>`}`).join('')}</nav>`; }
function bindCrumbs(){ $('#main').querySelectorAll('[data-crumb]').forEach(b => b.onclick = () => b.dataset.crumb === 'home' ? go('home') : go('project', S.pid, b.dataset.crumb)); }
function renderProject(){
  if(S.tab === 'overzicht') S.tab = 'project';
  const meta = S.projects.find(p => p.id === S.pid);
  if(!meta){ $('#main').innerHTML = `${crumbs([['Onbekend project']])}<div class="banner"><p>Dit project bestaat niet (meer).</p></div>`; bindCrumbs(); return; }
  if(!M || M.id !== meta.id) M = clone(meta);
  const tabs = TABS;
  if(S.tab === 'planning'){
    $('#main').innerHTML = `<div class="ptop"><div class="pt"><button type="button" class="btn ghost" data-crumb="home">‹ Projecten</button><span class="pnum">${esc(meta.nummer || '')}</span><b>${esc(meta.name)}</b><span class="faint" id="tilesMini" style="font-size:13px"></span></div>
      <nav class="ptabs" role="tablist">${tabs.map(([k,l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab===k}">${l}</button>`).join('')}</nav></div><div id="tabBody"></div>`;
  } else $('#main').innerHTML = `
  ${crumbs([[meta.name]])}
  <div class="tkop"><div class="tt"><div class="eyebrow"><span class="pnum">${esc(meta.nummer || '')}</span>${meta.plaats ? `<span class="faint">${esc(meta.plaats)}</span>` : ''}${meta.opdrachtgever ? `<span class="faint">· ${esc(meta.opdrachtgever)}</span>` : ''}</div>
    <h1>${esc(meta.name)}</h1></div><div class="dtiles" id="tiles"></div></div>
  <nav class="bigtabs" role="tablist">${TABS.map(([k,l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab===k}">${l}</button>`).join('')}</nav>
  <div id="tabBody"></div>`;
  bindCrumbs();
  $('#main').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if(!finish(false)) return; stop(); S.tab = b.dataset.tab; renderProject(); });
  if(!P){ $('#tabBody').innerHTML = '<p class="muted">Planning wordt geladen…</p>'; openPlan(); return; }
  updateTiles();
  if(S.tab === 'planning') edInit(); else if(S.tab === 'analyse') renderAnalyse(); else if(S.tab === 'tijd') renderTijd(); else renderBeheer();
  $('#wrap').classList.toggle('full', ['planning', 'tijd'].includes(S.tab));
}
function updateTiles(){
  const mini = $('#tilesMini'); if(mini && P){ const c = counts(P); mini.textContent = `${c.phases} hoofdfases · ${c.steps} werkgangen · ${c.shapes} werkvakken${c.pending ? ' · ' + c.pending + ' ongepland' : ''}`; }
  const el = $('#tiles'); if(!el || !P) return; const c = counts(P);
  el.innerHTML = [['Hoofdfases', c.phases], ['Werkgangen', c.steps], ['Werkvakken', c.shapes], ['Ongepland', c.pending, c.pending ? 'warn' : 'ok'], ['Routes', c.routes]]
    .map(([l, v, cl]) => `<div class="dtile ${cl||''}"><span class="lb">${l}</span><span class="dv">${v}</span></div>`).join('');
}
function openPlan(){
  const pid = S.pid; view = [0,0,100,100]; lastRev = null; myRevs = new Set(); dirty = false; history = []; future = []; remotePending = null; backups = []; lastBackupAt = 0;
  if(S.noDb){ const raw = lsGet('leeghwater-local-plan-' + pid); try{ if(raw){ loadPlan(validate(JSON.parse(raw), M), true); renderProject(); return; } }catch(e){ toast(e.message); } $('#tabBody').innerHTML = '<div class="banner"><p>Deze planning staat niet in deze browser.</p></div>'; return; }
  planUnsub = S.db.doc('plans/' + pid).onSnapshot(snap => {
    if(S.pid !== pid) return;
    if(!snap.exists){ $('#tabBody').innerHTML = '<div class="banner"><p>Voor dit project is nog geen planning opgeslagen.</p></div>'; return; }
    const d = snap.data();
    if(myRevs.has(d.rev) || d.rev === lastRev) return;
    let incoming; try{ incoming = validate(JSON.parse(d.json), M); }catch(e){ toast('Planning onleesbaar: ' + e.message); return; }
    if(!P){ lastRev = d.rev; loadPlan(incoming, true); M.planBy = d.updatedBy; M.planAt = d.updatedAt; renderProject(); loadBackups(); return; }
    if(dirty || drag){ remotePending = {plan:incoming, rev:d.rev, by:d.updatedBy, at:d.updatedAt}; names([d.updatedBy]).then(showRemoteBanner); return; }
    lastRev = d.rev; P = incoming; history = []; future = []; selected = ''; selBar = ''; if(!P.phases.some(p => p.id === phase)) phase = P.phases[0].id;
    names([d.updatedBy]).then(() => toast('Bijgewerkt door ' + (nameOf(d.updatedBy) || 'een collega') + '.'));
    afterExternalChange();
  }, e => toast('Planning niet bereikbaar: ' + (e.message || e.code)));
}
function afterExternalChange(){ updateTiles(); if(S.tab === 'planning' && svg) edRefresh(); else if(S.tab !== 'planning') renderProject(); }
function loadPlan(pl, fresh){ P = pl; if(!kinds().includes(newKind)){ newKind = kLast(); newCode = newKind + '1'; } if(fresh){ phase = P.phases[0].id; stepVal = 'all'; selected = ''; selBar = ''; tool = 'select'; draft = []; projectMode = false; } }
function leaveProject(){
  if(dirty) flush();
  stop(); if(planUnsub){ planUnsub(); planUnsub = null; }
  P = null; M = null; svg = null; drag = null; autoEx = null; draft = []; history = []; future = [];
}
function showRemoteBanner(){
  const b = $('#remoteBanner'); if(!b || !remotePending) return;
  b.hidden = false;
  b.innerHTML = `<p><b>${esc(nameOf(remotePending.by) || 'Een collega')}</b> heeft deze planning ook gewijzigd (${stamp(remotePending.at)}). Jouw wijzigingen zijn nog niet opgeslagen.</p>
    <div class="row"><button class="btn primary sm" id="rbMine" type="button">Mijn versie bewaren</button><button class="btn sm" id="rbTheirs" type="button">Hun versie laden</button></div>`;
  $('#rbMine').onclick = () => { lastRev = remotePending.rev; remotePending = null; b.hidden = true; flush(); };
  $('#rbTheirs').onclick = () => { lastRev = remotePending.rev; P = remotePending.plan; remotePending = null; dirty = false; history = []; future = []; selected = ''; b.hidden = true; afterExternalChange(); };
}

/* ---------- opslaan ---------- */
function setSave(s, msg){ saveState = {s, msg}; const c = $('#saveChip'); if(!c) return;
  c.classList.toggle('err', s === 'fout');
  c.textContent = s === 'wacht' ? 'Wijziging…' : s === 'bezig' ? 'Opslaan…' : s === 'fout' ? 'Niet opgeslagen · ' + (msg || '') : s === 'lokaal' ? 'Alleen in deze browser bewaard' : s === 'lezen' ? 'Alleen bekijken' : 'Opgeslagen' + (M?.planAt ? ' · ' + stamp(M.planAt) : ''); }
function changed(){
  if(!S.canWrite) return;
  dirty = true; changeSeq++; setSave('wacht');
  clearTimeout(saveT); saveT = setTimeout(flush, 1100);
  updateTiles();
}
async function flush(){
  clearTimeout(saveT); if(!P || !dirty) return;
  const pid = S.pid, plan = P, seq = changeSeq, json = JSON.stringify(plan), now = new Date().toISOString();
  if(S.noDb){ lsSet('leeghwater-local-plan-' + pid, json); dirty = false; setSave('lokaal'); const m = S.projects.find(p => p.id === pid); if(m){ m.updatedAt = now; m.counts = counts(plan); saveLocalProjects(); } return; }
  if(saving){ saveAgain = true; return; }
  saving = true; setSave('bezig');
  const rev = uid(); myRevs.add(rev);
  try{
    await S.db.doc('plans/' + pid).set({json, rev, updatedAt:now, updatedBy:S.meId});
    lastRev = rev; if(changeSeq === seq) dirty = false;
    if(M && M.id === pid){ M.planAt = now; }
    await S.db.doc('projects/' + pid).update({updatedAt:now, updatedBy:S.meId, counts:counts(plan)});
    setSave(dirty ? 'wacht' : 'ok');
    maybeBackup(pid, json, 'Automatisch');
  }catch(e){
    setSave('fout', e.code === 'invalid_argument' ? 'geen schrijfrechten of te groot' : (e.message || e.code));
    if(e.code === 'invalid_argument' && JSON.stringify(plan).length < 250000){ S.canWrite = false; toast('Je hebt alleen leesrechten op Leeghwater.'); }
  }finally{ saving = false; }
  if(saveAgain || (dirty && changeSeq !== seq)){ saveAgain = false; flush(); }
}
window.addEventListener('beforeunload', () => { if(dirty) flush(); });
async function loadBackups(){
  if(!S.db) return;
  try{ const q = await S.db.collection('backups').where('pid', '==', S.pid).get(); backups = q.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => String(b.at).localeCompare(String(a.at)));
    lastBackupAt = backups[0] ? Date.parse(backups[0].at) : 0; if(S.tab === 'backup') renderVersions(); }catch{}
}
async function maybeBackup(pid, json, label, force, kind = 'auto'){
  if(!S.db || (!force && Date.now() - lastBackupAt < 30 * 60e3)) return;
  const at = new Date().toISOString(), id = pid + '~' + at.replace(/[^0-9]/g, '').slice(0, 14);
  lastBackupAt = Date.now();
  try{ await S.db.doc('backups/' + id).set({pid, at, by:S.meId, label, kind, json}); backups.unshift({id, pid, at, by:S.meId, label, kind, json});
    const autos = backups.filter(b => b.kind !== 'handmatig'); for(const old of autos.slice(25)){ S.db.doc('backups/' + old.id).delete().catch(() => {}); backups.splice(backups.indexOf(old), 1); }
    if(S.tab === 'backup') renderVersions(); }catch{}
}

