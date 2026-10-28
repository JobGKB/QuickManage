/* ---------- capabilities ---------- */
async function use(n){ try{ return window.claude?.use ? await window.claude.use(n) : null; }catch{ return null; } }
async function boot(){
  const [db, user, dl] = await Promise.all(['db', 'user', 'downloads'].map(use));
  S.db = db; S.user = user; S.dl = dl;
  if(user){ try{ const me = await user.me(); S.meId = me.id; const w = await user.can('data.write'); S.canVb = w !== false; let ed = true; try{ ed = await user.canEdit(); }catch{} S.canWrite = ed !== false;
    $('#who').innerHTML = `${me.avatarUrl ? `<img alt="" src="${esc(me.avatarUrl)}">` : ''}<span>${esc(me.name || '')}</span>`; }catch{} }
  if(!db){ S.noDb = true; S.ready = {p:true, i:true}; render(); return; }
  const fail = e => { S.noDb = true; S.ready = {p:true, i:true}; toast('Gedeelde planning niet bereikbaar: ' + (e?.message || e?.code || 'onbekend')); render(); };
  db.collection('ploegen').onSnapshot(snap => { S.ploegen = snap.docs.map(d => ({id:d.id, ...d.data()})); S.ready.p = true; schedule(); }, fail);
  db.collection('afwezig').onSnapshot(snap => { S.afw = snap.docs.map(d => ({id:d.id, ...d.data()})); schedule(); }, () => {});
  db.collection('vb').onSnapshot(snap => { S.vbMap = Object.fromEntries(snap.docs.map(d => [d.id, d.data()])); schedule(); }, () => {});
  db.collection('items').onSnapshot(snap => { S.items = snap.docs.map(d => ({id:d.id, ...d.data()})).filter(x => !x.deleted); S.ready.i = true; schedule(); }, fail);
  db.doc('meta/instellingen').onSnapshot(d => { const x = d.data() || {}; S.vak = x.vakanties || []; S.checklist = x.checklist || null; S.adminList = x.admin || null; schedule(); }, () => {});
}
function schedule(){ if(drag){ renderPending = true; return; } if(renderPending) return; renderPending = true; requestAnimationFrame(() => { renderPending = false; if(!drag) render(); }); }
