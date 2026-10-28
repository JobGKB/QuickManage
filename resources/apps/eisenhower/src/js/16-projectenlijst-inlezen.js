/* ---------- projectenlijst inlezen ---------- */
const CODE_RX = /^([A-Z]{3,5}\d{4,6})(-\d{2,3})?/;
const codeOf = naam => { const m = CODE_RX.exec(String(naam || '').trim().toUpperCase()); return m ? m[0] : null; };
const baseOf = c => c ? c.split('-')[0] : null;
const stNum = st => parseInt(String(st || '').slice(0, 2), 10) || 0;
function updateImportLabel(){ const b = $('#btnImport'); if(!b) return; b.textContent = 'Projectenlijst inlezen' + (S.lastImport?.datum ? ' (laatst ' + fD(S.lastImport.datum.slice(0, 10)) + ')' : ''); }
const DEFAULT_CHECK = ['KLIC', 'Vergunning / VKM', 'Materiaal besteld', 'Onderaannemers', 'V&G-plan'];
const checklistFor = pr => (pr && Array.isArray(pr.checkItems)) ? pr.checkItems : checklist();
const checklist = () => (S.checklist && S.checklist.length) ? S.checklist : DEFAULT_CHECK;
const FASEN = [
  {key:'offerte', naam:'Offerte', sub:'01 t/m 04'},
  {key:'voorb', naam:'Voorbereiding', sub:'in opdracht, nog niet gestart'},
  {key:'uitv', naam:'Uitvoering', sub:'gestart'},
  {key:'gereed', naam:'Technisch gereed', sub:'07'},
  {key:'vervallen', naam:'Vervallen', sub:'niet gegund of vervallen'}
];
const statusKort = st => String(st || '').replace(/^\d+\.\s*/, '') || 'geen status';
const firstName = n => String(n || '').split(/\s+/)[0];
const daysSince = isoDate => isoDate ? Math.round((TODAY - parse(isoDate.slice(0, 10))) / 864e5) : 0;
function planItemsFor(pr){
  const base = baseOf(pr.code);
  return S.items.filter(it => { const c = codeOf(it.naam); return c && (c === pr.code || (!c.includes('-') && c === base)); });
}
function projFor(it){ const c = codeOf(it.naam); if(!c) return null; return S.projecten.find(p => p.code === c) || null; }
function projInfo(pr){
  const items = planItemsFor(pr);
  const dagen = items.flatMap(it => it.dagen || []).sort();
  const start = dagen[0] || null, eind = dagen[dagen.length - 1] || null;
  const n = stNum(pr.status);
  const cl = checklistFor(pr); const done = cl.filter(k => pr.check && pr.check[k]).length;
  let fase;
  const manual = !!(pr.fase && FASEN.some(f => f.key === pr.fase));
  if(manual) fase = pr.fase;
  else if(n >= 7) fase = 'gereed';
  else if(n > 0 && n <= 4) fase = 'offerte';
  else if(pr.geenPlanning) fase = 'uitv';
  else fase = start && start <= TODAYISO ? 'uitv' : 'voorb';
  const vb = pr.vb || (done >= cl.length && cl.length ? 'gereed' : done > 0 ? 'bezig' : 'niet');
  return {items, start, eind, n, fase, manual, vb, afw:afwijking(pr), done, total:cl.length, open:cl.filter(k => !(pr.check && pr.check[k]))};
}
const MOET = {offerte:'offertefase (01 t/m 04)', voorb:'05. In opdracht', uitv:'06. In uitvoering', gereed:'07. Technisch gereed', vervallen:'afsluiten: niet gegund / vervallen'};
function afwijking(pr){
  if(!pr.fase || !MOET[pr.fase] || pr.actief === false) return null; const n = stNum(pr.status);
  const ok = {offerte:n >= 1 && n <= 4, voorb:n === 5 || n === 6, uitv:n === 6, gereed:n >= 7, vervallen:false}[pr.fase];
  return ok ? null : {moet:MOET[pr.fase], staat:pr.status || 'geen status'};
}
const afwijkingen = () => activeProjects().flatMap(p => { const out = []; const a = afwijking(p); if(a) out.push({p, a:{...a, wat:'Fase'}});
    if(p.wvbEigen && p.wvbEigen !== (p.wvbLijst || '')) out.push({p, a:{wat:'Werkvoorbereider', staat:p.wvbLijst || 'leeg', moet:p.wvbEigen}}); return out; }).sort((a, b) => String(a.p.wvb).localeCompare(String(b.p.wvb)) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}));
const activeProjects = () => S.projecten.filter(p => p.actief !== false);
