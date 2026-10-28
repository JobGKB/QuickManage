(() => {
'use strict';
/* ================= basis ================= */
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS = {O:'#df8b23', R:'#147bc1', S:'#9546b9', G:'#27915a', boundary:'#167b70', plate:'#5a6066', walk:'#007e88', fence:'#d1128a', fase:'#d74d46'};
const KIND_NAME = {O:'Opbreken', R:'Riolering', S:'Straatwerk', boundary:'Werkgrens', plate:'Rijroute', walk:'Looproute', fence:'Bouwhekken', baken:'Schildjes', depot:'Depot'};
const ROUTE_KINDS = ['plate','walk','fence','baken','depot'];
const DEPOT = '#1f2a30'; // depotruimte: gesloten vlak, maar verder een 'route' (per werkgang, kopie naar volgende werkgang)
const isClosedK = k => !ROUTE_KINDS.includes(k) || k === 'depot';
/* Werkzaamheden per project: volgorde = volgorde per plek. Eerste opent het terrein, laatste maakt af (gereed = groen). */
const DEFAULT_WZ = [{code:'O', naam:'Opbreken', kleur:'#df8b23'}, {code:'R', naam:'Riolering', kleur:'#147bc1'}, {code:'S', naam:'Straatwerk', kleur:'#9546b9'}];
const WZ_PRESETS = {
  riool:{naam:'Riolering met herbestrating', wz:DEFAULT_WZ},
  asfalt:{naam:'Asfalt / wegonderhoud', wz:[{code:'F', naam:'Frezen', kleur:'#ef7d00'}, {code:'H', naam:'Herstel onderlaag', kleur:'#8b4513'}, {code:'A', naam:'Asfalteren', kleur:'#1565c0'}, {code:'B', naam:'Belijning', kleur:'#c9a400'}]},
  kabels:{naam:'Kabels en leidingen', wz:[{code:'O', naam:'Sleuf openen', kleur:'#df8b23'}, {code:'K', naam:'Kabels en leidingen', kleur:'#2f8a8a'}, {code:'H', naam:'Herstel verharding', kleur:'#9546b9'}]},
  bouwrijp:{naam:'Bouw- en woonrijp maken', wz:[{code:'O', naam:'Ontgraven', kleur:'#df8b23'}, {code:'R', naam:'Riolering', kleur:'#147bc1'}, {code:'W', naam:'Wegfundering / bouwstraat', kleur:'#6b6f2a'}, {code:'S', naam:'Woonrijp bestraten', kleur:'#9546b9'}]},
  groen:{naam:'Groen en inrichting', wz:[{code:'R', naam:'Rooien / vrijmaken', kleur:'#b1402c'}, {code:'G', naam:'Grondwerk', kleur:'#8b4513'}, {code:'P', naam:'Planten / inzaaien', kleur:'#2f7d4f'}]},
  kunstwerk:{naam:'Kunstwerk / damwand', wz:[{code:'D', naam:'Damwand / bouwkuip', kleur:'#ef7d00'}, {code:'B', naam:'Bouwen kunstwerk', kleur:'#3d6fa8'}, {code:'A', naam:'Aanvullen en afwerken', kleur:'#9546b9'}]}};
function WZ(pr = P){ return pr && Array.isArray(pr.werkzaamheden) && pr.werkzaamheden.length ? pr.werkzaamheden : DEFAULT_WZ; }
function wzOpt(pr = P){ const o = pr?.wzOpties || {}; return {open:o.open !== false, afwerk:o.afwerk !== false}; }
const kinds = (pr = P) => WZ(pr).map(w => w.code);
const kIdx = k => kinds().indexOf(k);
const kName = k => WZ().find(w => w.code === k)?.naam || KIND_NAME[k] || k;
const kColor = k => WZ().find(w => w.code === k)?.kleur || COLORS[k] || '#888888';
const kFirst = () => kinds()[0], kLast = () => kinds().at(-1);
const isOpenK = k => wzOpt().open && kinds().length > 1 && k === kFirst();
const isFinalK = k => wzOpt().afwerk && kinds().length > 1 && k === kLast();
// overlappen twee polygonen? (hoekpunt binnen de ander of kruisende randen)
function polysOverlap(a, b){ const A = bboxOf(a), B = bboxOf(b); if(A[2] < B[0] || B[2] < A[0] || A[3] < B[1] || B[3] < A[1]) return false;
  if(a.some(q => inPoly(q, b)) || b.some(q => inPoly(q, a))) return true;
  const cr = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  for(let i = 0; i < a.length; i++){ const p1 = a[i], p2 = a[(i + 1) % a.length]; for(let j = 0; j < b.length; j++){ const q1 = b[j], q2 = b[(j + 1) % b.length];
    if(cr(p1, p2, q1) * cr(p1, p2, q2) < 0 && cr(q1, q2, p1) * cr(q1, q2, p2) < 0) return true; } }
  return false; }
// klaar = ingepland, uitgevoerd vóór werkgang 'st' (of hoofdfase helemaal klaar) en daarna gebeurt er op die plek niets meer in deze hoofdfase
// een werkgang zonder eigen werkvakken (alleen voorzieningen) zet het werk van de werkgang ervoor niet op 'klaar': dat loopt dan nog door
function effStep(st, ph){ const n = Number(st); if(!(n > 0) || P.shapes.some(x => x.phase === ph && x.step === n)) return st; const prev = P.shapes.filter(x => x.phase === ph && x.step > 0 && x.step < n).reduce((m, x) => Math.max(m, x.step), 0); return prev ? String(prev) : st; }
function isDone(s, st){ if(!wzOpt().afwerk || kinds().length < 2 || !(s.step > 0)) return false; if(st === 'done' || st === 'phase') return true;
  st = effStep(st, s.phase); if(st === 'all' || !(s.step < Number(st))) return false;
  // tijdens de hoofdfase is alleen de laatste werkzaamheid (bv. asfalt/straatwerk) 'gereed'; al het andere pas bij Einde
  if(!isFinalK(s.kind)) return false;
  return !P.shapes.some(o => o !== s && o.phase === s.phase && o.step > s.step && o.kind === s.kind && polysOverlap(s.points, o.points)); }
const sameFamily = (a, b) => a === b || ((isOpenK(a) || isFinalK(a)) && (isOpenK(b) || isFinalK(b)));
const kst = k => `style="--k:${kColor(k)}"`;
function rankAll(k){ return isOpenK(k) ? 0 : isFinalK(k) ? 1 : 2 + kIdx(k); }
const FORMATS = ['heymansstraat-project-v1', 'leeghwater-project-v1'];
const uid = () => 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
const clone = v => structuredClone(v);
const pts = p => p.map(x => x.join(',')).join(' ');
function toast(msg, ms){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, ms || 3400); }
function stamp(d){ if(!d) return '—'; const x = new Date(d); if(isNaN(x)) return '—'; return x.toLocaleDateString('nl-NL', {day:'numeric', month:'short'}) + ' ' + x.toLocaleTimeString('nl-NL', {hour:'2-digit', minute:'2-digit'}); }
function slug(s){ return String(s||'project').normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'project'; }
function lsGet(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch{} }

/* ================= toestand ================= */
const S = { db:null, assets:null, dl:null, user:null, meId:null, canWrite:true,
  projects:[], projUnsub:null, view:'home', pid:null, tab:'planning', ready:false, noDb:false, names:{} };
// editor
let multi = new Set(); // Shift-selectie: ids van vakken, routes en hekken
let P = null, M = null, phase = '1', selected = '', selBar = '', tool = 'select', draft = [], view = [0,0,100,100];
let drag = null, space = false, skipClick = false, timer = null, projectMode = false, history = [], future = [];
let stepVal = 'all', newKind = 'S', newCode = 'S1', newStep = 0, showOutline = true, showOthers = false, showPar = true, followBoundary = true, playScope = 'project';
let planUnsub = null, lastRev = null, myRevs = new Set(), dirty = false, changeSeq = 0, saveT = null, saving = false, saveAgain = false, saveState = {s:'ok'};
let remotePending = null, backups = [], lastBackupAt = 0, frameLabel = '';
let svg = null, bgLayer = null, ov = null, rafId = 0, focusMark = null, kindFilter = 'all', analysisDoc = null, analysisPid = null, analysisBusy = null;

