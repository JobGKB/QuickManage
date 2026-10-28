/* ---------- schrijven ---------- */
function stampPatch(p){ return {...p, updatedAt:new Date().toISOString(), updatedBy:S.meId || null}; }
async function saveItem(id, patch, {undo = true} = {}){
  const it = S.items.find(x => x.id === id); if(!it) return;
  if(undo){ const {id:_, ...before} = it; S.undo.push({id, before:structuredClone(before)}); if(S.undo.length > 40) S.undo.shift(); }
  Object.assign(it, patch); render();
  if(S.noDb) return;
  try{ await S.db.doc('items/' + id).update(stampPatch(patch)); }catch(e){ toast('Opslaan mislukt: ' + (e.message || e.code)); }
}
async function createItem(data){
  const id = uid('it'); const doc = {naam:'', ploeg:null, wie:'', wvb:'', dagen:[], let:false, letNote:'', quad:null, duur:5, notitie:'', klaar:false, ...data};
  S.items.push({id, ...doc}); render();
  if(!S.noDb){ try{ await S.db.doc('items/' + id).set(stampPatch(doc)); }catch(e){ toast('Aanmaken mislukt: ' + (e.message || e.code)); } }
  return id;
}
async function deleteItem(id){
  const it = S.items.find(x => x.id === id); if(!it) return; const {id:_, ...before} = it;
  S.undo.push({id, before:structuredClone(before)}); S.items = S.items.filter(x => x.id !== id); closeDrawer(); render();
  toast('“' + (it.naam || 'Project') + '” verwijderd.', {label:'Terugzetten', fn:undo});
  if(!S.noDb){ try{ await S.db.doc('items/' + id).delete(); }catch(e){ toast('Verwijderen mislukt: ' + (e.message || e.code)); } }
}
async function undo(){
  const u = S.undo.pop(); if(!u){ toast('Niets om ongedaan te maken.'); return; }
  const it = S.items.find(x => x.id === u.id);
  if(it){ for(const k of Object.keys(it)) if(k !== 'id') delete it[k]; Object.assign(it, u.before); } else S.items.push({id:u.id, ...u.before});
  render(); toast('Ongedaan gemaakt.');
  if(!S.noDb){ try{ await S.db.doc('items/' + u.id).set(stampPatch(u.before)); }catch(e){ toast('Terugzetten mislukt: ' + (e.message || e.code)); } }
}
async function savePloeg(id, patch){ const p = S.ploegen.find(x => x.id === id); if(p) Object.assign(p, patch); if(!S.noDb){ try{ const {id:_, ...rest} = p; await S.db.doc('ploegen/' + id).set(stampPatch(rest)); }catch(e){ toast('Opslaan mislukt: ' + (e.message || e.code)); } } render(); }
async function saveVak(list){ S.vak = list; render(); if(!S.noDb){ try{ await S.db.doc('meta/instellingen').set(stampPatch({vakanties:list, checklist:checklist(), admin:adminList()})); }catch(e){ toast('Opslaan mislukt: ' + (e.message || e.code)); } } }
