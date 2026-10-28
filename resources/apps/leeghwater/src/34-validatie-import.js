/* ================= validatie & import ================= */
function validate(v, meta){
  if(!v || !FORMATS.includes(v.format)) throw Error('Onbekend projectformaat');
  const W = v.w, H = v.h;
  if(!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) throw Error('Ontbrekende tekeningmaat');
  if(meta && (Math.abs(meta.w - W) > .5 || Math.abs(meta.h - H) > .5)) throw Error(`Tekeningmaat ${W}×${H} past niet bij dit project (${meta.w}×${meta.h})`);
  if(!Array.isArray(v.phases) || !v.phases.length || v.phases.length > 100) throw Error('Geen hoofdfases');
  if(v.werkzaamheden !== undefined && (!Array.isArray(v.werkzaamheden) || v.werkzaamheden.length > 12 || new Set(v.werkzaamheden.map(w => w.code)).size !== v.werkzaamheden.length || v.werkzaamheden.some(w => !/^[A-Z]{1,3}$/.test(w.code) || typeof w.naam !== 'string'))) throw Error('Ongeldige werkzaamheden');
  const ids = new Set(v.phases.map(p => p.id));
  if(ids.size !== v.phases.length || v.phases.some(p => typeof p.id !== 'string' || typeof p.name !== 'string')) throw Error('Ongeldige hoofdfases');
  const okPts = (p, min) => Array.isArray(p) && p.length >= min && p.length < 10000 && p.every(q => Array.isArray(q) && q.length === 2 && q.every(Number.isFinite) && q[0] >= 0 && q[0] <= W && q[1] >= 0 && q[1] <= H);
  for(const p of v.phases) if(p.outline && !okPts(p.outline, 3)) throw Error('Ongeldige fasegrens in ' + p.name);
  for(const key of ['shapes','boundaries','routes']){
    if(!Array.isArray(v[key]) || v[key].length > 3000) throw Error('Ongeldige lijst ' + key);
    const kinds = key === 'shapes' ? WZ(v).map(w => w.code) : key === 'routes' ? ROUTE_KINDS : ['boundary'];
    for(const s of v[key]) if(!ids.has(s.phase) || typeof s.id !== 'string' || typeof s.code !== 'string' || !Number.isInteger(s.step) || s.step < 0 || s.step > 99 || !okPts(s.points, key === 'routes' ? 2 : 3) || !kinds.includes(s.kind)) throw Error('Ongeldige geometrie bij ' + (s?.code || key));
  }
  if(new Set([...v.shapes, ...v.boundaries, ...v.routes].map(s => s.id)).size !== v.shapes.length + v.boundaries.length + v.routes.length) throw Error('Dubbele identificatie');
  if(!Array.isArray(v.barriers)) v.barriers = [];
  for(const r of v.routes) if(r.kind === 'plate' && /^Rijplatenbaan/.test(r.code)) r.code = r.code.replace(/^Rijplatenbaan/, 'Rijroute'); // hernoemd
  return v;
}
function pickJson(cb){ const i = $('#pickJson'); i.value = ''; i.onchange = async () => { const f = i.files[0]; if(!f) return; try{ cb(JSON.parse(await f.text()), f.name); }catch(e){ toast('Inlezen mislukt: ' + e.message); } }; i.click(); }
function legacyRoutes(v){
  const expected = [['O1'],['R1'],['R2','S1'],['R3','S2'],['O2','R4','S3'],['R5','S4'],['S5'],[]];
  if(JSON.stringify(v.steps) !== JSON.stringify(expected) || !Array.isArray(v.routes) || v.routes.length !== 8) throw Error('Onbekend routebestand');
  const out = [];
  v.routes.forEach((arr, i) => arr.forEach(r => {
    if(!['plate','walk'].includes(r.kind) || ![8,14,22].includes(r.width) || !Array.isArray(r.points) || r.points.length < 2 || !r.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 0 && p[0] <= 1600 && p[1] >= 0 && p[1] <= 1039)) throw Error('Ongeldige route');
    out.push({id:uid(), phase:'1', code:r.kind === 'plate' ? 'Rijroute' : 'Looproute', kind:r.kind, step:i + 1, width:r.width, points:r.points.map(p => [35 + p[0] * 2065/1600, 1000 + p[1] * 2065/1600])});
  }));
  return out;
}
function importIntoProject(v, fname){
  if(!S.canWrite) return toast('Je hebt alleen leesrechten.');
  try{
    if(v.format === 'heymansstraat-routes-v1'){
      if(P.w !== 4762 || P.h !== 2384) throw Error('Dit routebestand hoort bij Heymansstraat');
      const r = legacyRoutes(v);
      const dup = r.filter(n => P.routes.some(o => o.kind === n.kind && o.step === n.step && o.points.length === n.points.length && o.points.every((q, i) => Math.hypot(q[0] - n.points[i][0], q[1] - n.points[i][1]) < .5)));
      if(dup.length === r.length) return toast('Deze routes staan er al in; niets toegevoegd.');
      stash(); const add = r.filter(n => !dup.includes(n)); P.routes.push(...add); changed(); edRefresh?.();
      return toast(add.length + ' routes toegevoegd aan hoofdfase 1' + (dup.length ? ' (' + dup.length + ' dubbele overgeslagen)' : '') + '.');
    }
    if(v.format === 'leeghwater-backup-v1') v = v.project;
    const incoming = validate(clone(v), M);
    migrateHeymans(incoming);
    maybeBackup(S.pid, JSON.stringify(P), 'Voor import van ' + (fname || 'bestand'), true);
    stash(); P = incoming; selected = ''; selBar = ''; draft = []; phase = P.phases[0].id; stepVal = 'all'; changed();
    renderProject(); toast('Planning geïmporteerd: ' + summary(P));
  }catch(e){ toast('Import mislukt: ' + e.message); }
}
function summary(pr){ return pr.phases.map(p => p.name + ' ' + pr.shapes.filter(s => s.phase === p.id).length + ' vakken').join(' · '); }
async function importAsNewProject(v, fname){
  if(!S.canWrite) return toast('Je hebt alleen leesrechten.');
  try{
    let meta, plan;
    if(v.format === 'leeghwater-backup-v1'){ meta = v.meta || {}; plan = validate(clone(v.project)); }
    else throw Error('Kies een volledige Leeghwater-backup. Een losse planning importeer je binnen een project via het tabblad Backup.');
    const now = new Date().toISOString(); const pid = 'p-' + slug(meta.name).toLowerCase() + '-' + Math.random().toString(36).slice(2, 6);
    const m = {name:(meta.name || 'Project') + (S.projects.some(p => p.name === meta.name) ? ' (kopie)' : ''), nummer:meta.nummer || '', plaats:meta.plaats || '', opdrachtgever:meta.opdrachtgever || '', status:meta.status || 'actief',
      w:plan.w, h:plan.h, bg:meta.bg || null, bgNaam:meta.bgNaam || '', workExtent:meta.workExtent || [], createdAt:now, createdBy:S.meId, updatedAt:now, updatedBy:S.meId, counts:counts(plan)};
    if(S.noDb){ m.id = pid; S.projects.push(m); saveLocalProjects(); lsSet('leeghwater-local-plan-' + pid, JSON.stringify(plan)); render(); return toast('Backup geopend in deze browser.'); }
    await S.db.doc('plans/' + pid).set({json:JSON.stringify(plan), rev:uid(), updatedAt:now, updatedBy:S.meId});
    await S.db.doc('projects/' + pid).set(m);
    toast('Backup teruggezet als nieuw project.' + (m.bg ? '' : ' Upload nog de tekening via het tabblad Project.'));
  }catch(e){ toast('Terugzetten mislukt: ' + e.message); }
}
// Bestaande migraties uit de oorspronkelijke editor; alleen voor oudere Heymansstraat-bestanden zonder vlag.
function migrateHeymans(pr){
  if(pr.format !== 'heymansstraat-project-v1') return;
  if(!pr.phase2StreetworkAdded){ for(const n of [1,2,3]){ const o = pr.shapes.find(s => s.phase === '2' && s.kind === 'O' && s.code === 'O' + n); if(o && !pr.shapes.some(s => s.phase === '2' && s.code === 'S' + n)) pr.shapes.push({...clone(o), id:uid(), code:'S' + n, kind:'S', step:0, sourceShape:o.id}); } pr.phase2StreetworkAdded = true; }
  if(!pr.seams20260926){ const fixes = [[[1845.34,572.87],[1845.71,573.69]],[[1901.45,680.55],[1902.11,676.95]],[[1902.7,675.98],[1902.11,676.95]],[[2034.64,600.05],[2035.81,600.24]],[[1954.19,646.97],[1954.64,647.4]],[[1990.78,624.9],[1990.87,624.68]]];
    for(const s of pr.shapes.filter(s => s.phase === '2')) for(let i = 0; i < s.points.length; i++){ const f = fixes.find(([a]) => Math.hypot(s.points[i][0] - a[0], s.points[i][1] - a[1]) < .15); if(f) s.points[i] = [...f[1]]; }
    pr.seams20260926 = true; }
}
async function saveFile(name, data){
  if(S.dl){ try{ await S.dl.save({filename:name, data}); return true; }catch(e){ if(e.code === 'declined') return false; toast('Downloaden niet beschikbaar: ' + (e.message || e.code)); } }
  else toast('Downloaden is hier niet beschikbaar. Gebruik “Kopiëren”.');
  return false;
}

const TABS = [['project','Project'],['planning','Fasering'],['tijd','Tijdschema'],['analyse','Controleren en afdrukken']];
