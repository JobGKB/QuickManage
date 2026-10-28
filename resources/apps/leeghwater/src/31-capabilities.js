/* ================= capabilities ================= */
async function use(name){ try{ return window.claude?.use ? await window.claude.use(name) : null; }catch{ return null; } }
async function boot(){
  const [db, assets, dl, user, sample] = await Promise.all(['db','assets','downloads','user','sample'].map(use));
  S.db = db; S.assets = assets; S.dl = dl; S.user = user; S.sample = sample;
  if(user){ try{ const me = await user.me(); S.meId = me.id; const w = await user.can('data.write'); S.canWrite = w !== false;
    $('#who').innerHTML = `<img alt="" src="${esc(me.avatarUrl)}"><span>${esc(me.name || '')}</span>`; }catch{} }
  if(!db){ S.noDb = true; S.ready = true; loadLocalProjects(); render(); return; }
  S.projUnsub = db.collection('projects').onSnapshot(snap => {
    S.projects = snap.docs.map(d => ({id:d.id, ...d.data()})).filter(p => !p.deleted);
    S.ready = true;
    if(S.view === 'home') render();
    else if(S.view === 'project'){ const m = S.projects.find(p => p.id === S.pid); if(m && M){ const keepExt = M.workExtent, keepAt = M.planAt; M = clone(m); if(!M.workExtent) M.workExtent = keepExt; M.planAt = keepAt; updateTiles(); if(svg?.isConnected && JSON.stringify(keepExt) !== JSON.stringify(M.workExtent)) render2(); } }
  }, e => { S.noDb = true; S.ready = true; toast('Gedeelde opslag niet bereikbaar: ' + (e.message || e.code)); render(); });
}
function loadLocalProjects(){ try{ S.projects = JSON.parse(lsGet('leeghwater-local-projects') || '[]'); }catch{ S.projects = []; } }
function saveLocalProjects(){ if(S.noDb) lsSet('leeghwater-local-projects', JSON.stringify(S.projects)); }
async function names(ids){ ids = [...new Set(ids.filter(Boolean))]; if(!S.user || !ids.length) return; try{ const ps = await S.user.profiles(ids); for(const id of ids) S.names[id] = ps[id]?.name || ''; }catch{} }
function nameOf(id){ return (id && S.names[id]) || ''; }

