/* ================= tijdschema ================= */
// Het tijdschema hoort bij de planning (P.schema) en gaat mee in export, versies en ongedaan maken.
const DEF_DUUR = 5, DAY = 86400000;
const PHASE_COLORS = ['#3d6fa8', '#439034', '#b0741a', '#8a4fa8', '#b1402c', '#2f8a8a', '#6b6f2a', '#a8456f'];
const MND = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const iso = t => new Date(t).toISOString().slice(0, 10);
const tOf = s => Date.parse(s + 'T00:00:00Z');
function fmtD(s, withYear){ if(!s) return '—'; const d = new Date(tOf(s)); return d.getUTCDate() + ' ' + MND[d.getUTCMonth()] + (withYear ? ' ' + d.getUTCFullYear() : ''); }
function weekNr(s){ const d = new Date(tOf(s)); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const y = d.getUTCFullYear(), j = new Date(Date.UTC(y, 0, 4)); return 1 + Math.round(((d - j) / DAY - 3 + ((j.getUTCDay() + 6) % 7)) / 7); }
function easter(y){ const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return Date.UTC(y, mo - 1, da); }
const holCache = {};
// voorgestelde feestdagen per jaar: std = standaard vrij (aan te passen per datum in het tijdschema)
function holidays(y){
  if(holCache[y]) return holCache[y];
  const e = easter(y), out = new Map(), add = (t, naam, std = true) => out.set(iso(t), {naam, std});
  add(Date.UTC(y, 0, 1), 'Nieuwjaarsdag'); add(e - 2 * DAY, 'Goede Vrijdag', false); add(e + DAY, 'Tweede paasdag');
  const kd = Date.UTC(y, 3, 27); add(new Date(kd).getUTCDay() === 0 ? kd - DAY : kd, 'Koningsdag');
  add(Date.UTC(y, 4, 5), 'Bevrijdingsdag', y % 5 === 0);
  add(e + 39 * DAY, 'Hemelvaartsdag'); add(e + 50 * DAY, 'Tweede pinksterdag');
  add(Date.UTC(y, 11, 25), 'Eerste kerstdag'); add(Date.UTC(y, 11, 26), 'Tweede kerstdag');
  return holCache[y] = out;
}
function holOn(cfg, d, h){ return cfg.feest[d] ?? h.std; }
function schemaCfg(){ const s = P?.schema || {}; return {start:s.start || '', feestdagen:s.feestdagen !== false, feest:s.feest || {}, vrij:s.vrij || '', wg:s.werkgangen || {}}; }
function parseVrij(txt){ const set = new Map();
  for(const line of String(txt || '').split(/[\n;,]+/)){ const m = line.match(/(\d{4}-\d{2}-\d{2})(?:\s*(?:t\/m|tm|-|–|tot)\s*(\d{4}-\d{2}-\d{2}))?\s*(.*)/); if(!m) continue;
    const a = tOf(m[1]), b = m[2] ? tOf(m[2]) : a, lab = (m[3] || '').trim() || 'Vrij'; if(!(a <= b) || b - a > 400 * DAY) continue;
    for(let t = a; t <= b; t += DAY) set.set(iso(t), lab); }
  return set; }
function vrijList(txt){ const out = []; for(const line of String(txt || '').split(/[\n;,]+/)){ const m = line.match(/(\d{4}-\d{2}-\d{2})(?:\s*(?:t\/m|tm|-|–|tot)\s*(\d{4}-\d{2}-\d{2}))?\s*(.*)/); if(m) out.push({van:m[1], tm:m[2] || m[1], naam:(m[3] || '').trim()}); } return out; }
function vrijText(list){ return list.filter(v => v.van).map(v => v.van + (v.tm && v.tm !== v.van ? ' t/m ' + v.tm : '') + (v.naam ? ' ' + v.naam : '')).join('\n'); }
function makeCal(cfg){ const vrij = parseVrij(cfg.vrij);
  const off = t => { const d = new Date(t), wd = d.getUTCDay(), s = iso(t); if(wd === 0 || wd === 6) return 'weekend'; if(vrij.has(s)) return vrij.get(s); if(cfg.feestdagen){ const h = holidays(d.getUTCFullYear()).get(s); if(h && holOn(cfg, s, h)) return h.naam; } return null; };
  const next = t => { let n = 0; while(off(t) && n++ < 800) t += DAY; return t; };
  const addW = (t, n) => { t = next(t); for(let i = 1; i < n; i++) t = next(t + DAY); return t; };
  const prev = t => { let n = 0; while(off(t) && n++ < 800) t -= DAY; return t; };
  return {off, next, addW, prev, vrij}; }
// Werkgangen in uitvoeringsvolgorde: hoofdfase na hoofdfase, werkgangen oplopend.
// Koppeling per werkgang (oud formaat): '' = na de vorige werkgang, 'S:1.3' = tegelijk met start van 1.3, 'E:1.3' = na einde van 1.3 (plus wachtdagen),
// 'V:2.1' = voorafgaand aan 2.1. Nieuw: werkgangen en taken hebben voorgangers zoals in MS Project (EB/BB/EE/BE met speling, plus VB = vóór begin van).
// Alles rekent in werkdag-indexen: een taak met start S en duur D loopt van werkdag S t/m S+D-1; E = S+D. Een mijlpaal ligt aan het eind van werkdag S (E = S+1).
const PRED_T = ['EB', 'BB', 'EE', 'BE', 'VB'];
const PRED_NAAM = {EB:'na einde van', BB:'tegelijk met start van', EE:'tegelijk klaar met', BE:'klaar na start van', VB:'klaar vóór start van'};
const calCache = new Map();
const _makeCalBase = makeCal;
makeCal = function(cfg){ const sig = JSON.stringify([cfg.feestdagen, cfg.feest, cfg.vrij]); const hit = calCache.get(sig); if(hit) return hit;
  const c = _makeCalBase(cfg), T0 = Date.UTC(2015, 0, 5), N = 365 * 36, days = [], idxOf = new Int32Array(N);
  for(let i = 0, k = 0; i < N; i++){ const t = T0 + i * DAY; idxOf[i] = k; if(!c.off(t)){ days.push(t); k++; } }
  c.idx = t => { const i = Math.round((t - T0) / DAY); return i < 0 ? 0 : i >= N ? days.length - 1 : idxOf[i]; };
  c.dt = i => days[Math.max(0, Math.min(days.length - 1, i))];
  c.ds = i => iso(c.dt(i));
  if(calCache.size > 12) calCache.clear(); calCache.set(sig, c); return c; };
function planOf(){ const pl = P?.plan || {}; return {start:pl.start || '', tasks:pl.tasks || [], res:pl.res || [], base:pl.base || null, begroting:pl.begroting || null, norm:pl.norm || {}, bestek:pl.bestek || null, hmap:pl.hmap || null}; }
const isMile = n => (n.type === 'mijl' || n.type === 'stop') && !(n.duur > 0);
// boom: hoofdniveau = planningstaken zonder ouder (+ 'Uitvoering' met de hoofdfases en werkgangen)
function planTree(){
  const pl = planOf(), T = pl.tasks, out = [];
  const kids = parent => T.filter(t => t.parent === parent && t.type !== 'uitv');
  const root = T.filter(t => !t.parent);
  if(!root.some(t => t.type === 'uitv')){ const i = root.findIndex(t => t.type === 'groep' && /voorbereid/i.test(t.naam)); root.splice(i + 1, 0, {id:'UITV', type:'uitv', naam:'Uitvoering'}); }
  const walk = (list, depth, parent) => { for(const t of list){
    if(t.type === 'uitv'){ const ref = 'UITV'; out.push({ref, type:'uitv', naam:t.naam || 'Uitvoering', depth, parent, task:t});
      for(const ph of P.phases){ const st = plannedSteps(ph.id), extra = kids('H:' + ph.id); if(!st.length && !extra.length) continue;
        const href = 'H:' + ph.id; out.push({ref:href, type:'hf', naam:ph.name, depth:depth + 1, parent:ref, phase:ph.id});
        const anch = new Map(); for(const x of extra){ const a = x.na && st.some(n => 'W:' + ph.id + '.' + n === x.na) ? x.na : ''; if(!anch.has(a)) anch.set(a, []); anch.get(a).push(x); }
        for(const n of st){ const wref = 'W:' + ph.id + '.' + n; out.push({ref:wref, type:'wg', naam:'Werkgang ' + ph.id + '.' + n, depth:depth + 2, parent:href, phase:ph.id, step:n, key:ph.id + '.' + n});
          for(const x of anch.get(wref) || []) walk([x], depth + 2, href); }
        for(const x of anch.get('') || []) walk([x], depth + 2, href); }
      continue; }
    out.push({ref:'T:' + t.id, type:t.type, naam:t.naam || '', depth, parent, task:t});
    if(t.type === 'groep') walk(kids(t.id), depth + 1, 'T:' + t.id); } };
  walk(root, 0, '');
  out.forEach((n, i) => n.nr = i + 1);
  return out;
}
function predLabel(ref, byRef){ if(ref.startsWith('W:')) return ref.slice(2); if(ref.startsWith('H:')) return 'H' + ref.slice(2); const n = byRef[ref]; return n ? String(n.nr) : '?'; }
function predsText(preds, byRef){ return (preds || []).map(p => predLabel(p.r, byRef) + (p.t && p.t !== 'EB' ? p.t : '') + (p.l ? (p.l > 0 ? '+' : '') + p.l : '')).join('; '); }
function parsePredsText(txt, nodes){ const out = [], bad = [], byNr = {}; for(const n of nodes) byNr[n.nr] = n.ref;
  for(const tok of String(txt || '').split(/[;,\s]+/).filter(Boolean)){ const m = tok.toUpperCase().match(/^(H\d+|\d+\.\d+|\d+)(EB|BB|EE|BE|VB|ES|SS|FF|SF)?([+-]\d+)?$/);
    if(!m){ bad.push(tok); continue; } let r = null; const a = m[1];
    if(a[0] === 'H'){ r = 'H:' + a.slice(1); if(!nodes.some(n => n.ref === r)) r = null; } else if(a.includes('.')){ r = 'W:' + a; if(!nodes.some(n => n.ref === r)) r = null; } else r = byNr[Number(a)] || null;
    if(!r){ bad.push(tok); continue; } const t = ({ES:'EB', SS:'BB', FF:'EE', SF:'BE'})[m[2]] || m[2] || 'EB'; out.push({r, t, ...(m[3] && Number(m[3]) ? {l:Number(m[3])} : {})}); }
  return {preds:out, bad}; }
let planCache = {sig:'', val:null};
function planCompute(force){
  const sig = JSON.stringify([P?.schema, P?.plan?.tasks, P?.plan?.start, P?.plan?.base, force || '', P.phases.map(p => p.id), P.shapes.map(s => s.phase + '.' + s.step + s.kind + s.code).join(), iso(Date.now())]);
  if(planCache.sig === sig) return planCache.val;
  const cfg = schemaCfg(), cal = makeCal(cfg), pl = planOf(), nodes = planTree(), by = {}; nodes.forEach(n => by[n.ref] = n);
  const startI = cfg.start ? cal.idx(tOf(cfg.start)) : force ? cal.idx(tOf(force)) : null;
  const projI = pl.start ? cal.idx(tOf(pl.start)) : startI;
  // gegevens per knoop
  const wgList = nodes.filter(n => n.type === 'wg');
  wgList.forEach((n, i) => { const it = cfg.wg[n.key] || {}; n.it = it; n.duur = Math.max(1, Math.min(400, Math.round(Number(it.duur) || DEF_DUUR))); n.wacht = Math.max(-200, Math.min(200, Math.round(Number(it.wacht) || 0)));
    n.vast = it.vast || ''; n.pct = it.pct || 0; n.res = it.res || []; n.wie = it.wie || ''; n.partij = it.partij || ''; n.intern = !!it.intern; n.notitie = it.notitie || ''; n.vakken = P.shapes.filter(x => x.phase === n.phase && x.step === n.step);
    if(Array.isArray(it.preds)){ n.preds = it.preds; n.explicit = true; }
    else if(it.koppel && (it.koppel[0] === 'V' || wgList.slice(0, i).some(p => p.ref === 'W:' + it.koppel.slice(2)))){ const ref = 'W:' + it.koppel.slice(2); n.preds = by[ref] ? [{r:ref, t:({S:'BB', E:'EB', V:'VB'})[it.koppel[0]], ...(n.wacht ? {l:n.wacht} : {})}] : []; n.explicit = true; n.fromKoppel = true; }
    else { const prev = wgList[i - 1]; n.explicit = false;
      if(!prev) n.preds = [];
      else if(prev.phase === n.phase) n.preds = [{r:prev.ref, t:'EB', ...(n.wacht ? {l:n.wacht} : {})}];
      else n.preds = wgList.slice(0, i).map(p => ({r:p.ref, t:'EB', ...(n.wacht ? {l:n.wacht} : {})})); n.autoTxt = prev ? (prev.phase === n.phase ? prev.key : 'na H' + prev.phase) : 'start uitvoering'; } });
  for(const n of nodes) if(n.task){ const t = n.task; n.duur = n.type === 'groep' || n.type === 'uitv' ? 0 : n.type === 'mijl' ? 0 : n.type === 'stop' ? Math.max(0, Math.round(Number(t.stop?.beoord) || 0)) : Math.max(0, Math.min(2000, Math.round(Number(t.duur) || 0)));
    n.preds = t.preds || []; n.explicit = true; n.snet = t.snet || (t.deadline && !(t.preds || []).length ? t.deadline : ''); n.pct = t.pct || 0; n.res = t.res || []; n.wie = t.wie || ''; n.partij = t.partij || ''; n.intern = !!t.intern; n.notitie = t.notitie || ''; n.stop = t.stop || null; n.blok = t.blok || []; n.posts = t.posts || []; }
  // stoppunten die werk tegenhouden: extra voorganger bij de geblokkeerde taak
  const blokIn = {}; for(const n of nodes) if(n.type === 'stop') for(const r of n.blok || []) (blokIn[r] = blokIn[r] || []).push({r:n.ref, t:'EB', blok:true});
  const leaves = nodes.filter(n => ['wg', 'taak', 'mijl', 'stop'].includes(n.type));
  const kidsOf = {}; for(const n of nodes) if(n.parent) (kidsOf[n.parent] = kidsOf[n.parent] || []).push(n);
  const leafOf = ref => { const n = by[ref]; if(!n) return []; if(['wg', 'taak', 'mijl', 'stop'].includes(n.type)) return [n]; return (kidsOf[ref] || []).flatMap(k => leafOf(k.ref)); };
  for(const n of leaves) n.allPreds = [...(n.preds || []), ...(blokIn[n.ref] || [])].filter(p => by[p.r] && p.r !== n.ref);
  const val = {}; let kring = false;
  const groupVals = () => { for(let i = nodes.length - 1; i >= 0; i--){ const n = nodes[i]; if(['wg', 'taak', 'mijl', 'stop'].includes(n.type)) continue; const ks = (kidsOf[n.ref] || []).map(k => val[k.ref]).filter(Boolean); val[n.ref] = ks.length ? {S:Math.min(...ks.map(v => v.S)), E:Math.max(...ks.map(v => v.E))} : null; } };
  let sigV = '';
  for(let pass = 0; pass < 40; pass++){
    for(const n of leaves){ const mile = isMile(n), D = mile ? 0 : n.duur; let sLow = -Infinity, eLow = -Infinity, eV = Infinity, has = false;
      for(const p of n.allPreds){ const q = val[p.r]; if(!q) continue; has = true; const l = p.l || 0;
        if(p.t === 'BB') sLow = Math.max(sLow, q.S + l); else if(p.t === 'EE') eLow = Math.max(eLow, q.E + l); else if(p.t === 'BE') eLow = Math.max(eLow, q.S + l); else if(p.t === 'VB') eV = Math.min(eV, q.S - l); else sLow = Math.max(sLow, q.E + l); }
      let S = null;
      // vaste datum = 'niet eerder dan': koppelingen gaan voor, een voorganger die uitloopt duwt de werkgang op
      if(n.type === 'wg' && n.vast){ const cands = [cal.idx(tOf(n.vast))]; if(sLow > -Infinity) cands.push(sLow); if(eLow > -Infinity) cands.push(eLow - D); S = Math.max(...cands); }
      else if(eV < Infinity){ S = mile ? eV - 1 : eV - D; n.jit = true; }
      else { const cands = []; if(sLow > -Infinity) cands.push(sLow); if(eLow > -Infinity) cands.push(mile ? eLow - 1 : eLow - D); if(n.snet) cands.push(cal.idx(tOf(n.snet)));
        if(n.type === 'wg'){ if(startI !== null && (has || !n.allPreds.length)) cands.push(startI + (n.allPreds.length ? 0 : Math.max(0, n.wacht))); }
        else if(!has && !n.allPreds.length && projI !== null && n.type !== 'stop') cands.push(projI);
        if(mile && sLow > -Infinity && !n.allPreds.some(p => p.t === 'BB' || p.t === 'BE')){ cands[0] = sLow - 1; } // mijlpaal na einde: zelfde dag als het einde
        S = cands.length ? Math.max(...cands) : null; }
      val[n.ref] = S === null ? null : {S, E:mile ? S + 1 : S + D}; }
    groupVals();
    const s2 = leaves.map(n => val[n.ref] ? val[n.ref].S : '-').join();
    if(s2 === sigV) break; sigV = s2; if(pass === 39) kring = true; }
  // terugrekenen: speling en kritiek pad
  const dated = leaves.filter(n => val[n.ref]); const endI = dated.length ? Math.max(...dated.map(n => val[n.ref].E)) : null; const LF = {};
  if(endI !== null){ for(const n of dated) LF[n.ref] = endI;
    var edgesFrom = new Set(); const edges = []; for(const n of dated) for(const p of n.allPreds){ for(const q of leafOf(p.r)){ if(!val[q.ref]) continue; if(p.t !== 'VB') edgesFrom.add(q.ref); if(p.t !== 'VB') edges.push({a:q, b:n, t:p.t, l:p.l || 0}); } }
    for(let it = 0; it < 60; it++){ let ch = false;
      for(const e of edges){ const A = val[e.a.ref], B = val[e.b.ref], DA = A.E - A.S, DB = B.E - B.S, lfB = LF[e.b.ref]; let lim;
        if(e.t === 'BB') lim = lfB - DB - e.l + DA; else if(e.t === 'EE') lim = lfB - e.l; else if(e.t === 'BE') lim = lfB - e.l + DA; else lim = lfB - DB - e.l;
        if(isMile(e.a) && (e.t === 'EB')) lim = lfB - DB - e.l; if(lim < LF[e.a.ref]){ LF[e.a.ref] = lim; ch = true; } }
      for(const n of dated) if(n.type === 'wg' && n.vast && LF[n.ref] > val[n.ref].E){ LF[n.ref] = val[n.ref].E; ch = true; }
      if(!ch) break; } }
  const base = pl.base?.items || {};
  for(const n of nodes){ const v = val[n.ref]; n.S = v ? v.S : null; n.E = v ? v.E : null;
    if(v){ const mile = isMile(n); n.start = cal.ds(v.S); n.eind = mile ? cal.ds(v.S) : cal.ds(v.E - 1); n.wd = mile ? 0 : v.E - v.S; } else { n.start = null; n.eind = null; n.wd = 0; }
    if(LF[n.ref] !== undefined && v) n.float = LF[n.ref] - v.E;
    const b = base[n.ref]; if(b && n.eind){ n.base = b; n.dev = cal.idx(tOf(n.eind)) - cal.idx(tOf(b[1])); } }
  for(const n of nodes) if(n.float === undefined && kidsOf[n.ref]){ const fl = leafOf(n.ref).map(k => k.float).filter(f => f !== undefined); if(fl.length) n.float = Math.min(...fl); }
  for(const n of nodes){ n.crit = n.float !== undefined && n.float <= 0 && !(n.jit && !edgesFrom.has(n.ref)); }
  // voortgang groepen (gewogen naar duur)
  for(let i = nodes.length - 1; i >= 0; i--){ const n = nodes[i]; if(!kidsOf[n.ref]) continue; const ls = leafOf(n.ref).filter(k => k.S !== null); const w = ls.reduce((a, k) => a + Math.max(1, k.wd), 0); n.pct = w ? Math.round(ls.reduce((a, k) => a + Math.max(1, k.wd) * (k.pct || 0), 0) / w) : 0; n.wd = n.S !== null ? n.E - n.S : 0; }
  // werkgangrijen in het oude formaat (fasering, PDF, controle)
  const rows = wgList.map(n => ({key:n.key, phase:n.phase, step:n.step, ph:P.phases.find(p => p.id === n.phase), duur:n.duur, wacht:n.wacht, vast:n.vast,
    koppel:n.it.koppel || (n.explicit && n.preds.length === 1 && n.preds[0].r.startsWith('W:') ? ({EB:'E', BB:'S', VB:'V'})[n.preds[0].t] ? ({EB:'E', BB:'S', VB:'V'})[n.preds[0].t] + ':' + n.preds[0].r.slice(2) : '' : ''),
    notitie:n.notitie, start:n.start, eind:n.eind, vakken:n.vakken, crit:n.crit, pct:n.pct}));
  const res = {nodes, by, rows, cfg, cal, kring, endI, startI, projI};
  planCache = {sig, val:res}; return res;
}
function scheduleRows(force){ const r = planCompute(force); return {rows:r.rows, cfg:r.cfg, cal:r.cal, plan:r}; }

// eerste start en laatste einde (werkgangen kunnen parallel lopen)
function spanOf(rows){ const d = rows.filter(r => r.start); if(!d.length) return null; return {start:d.reduce((a, r) => r.start < a ? r.start : a, d[0].start), eind:d.reduce((a, r) => r.eind > a ? r.eind : a, d[0].eind)}; }
function overlapT(a, b){ return a.start && b.start && a.start <= b.eind && b.start <= a.eind; }
// werkgangen die tegelijk lopen met deze werkgang
// tijdschema met echte data, of (zonder startdatum) met een fictieve start zodat overlap toch zichtbaar is
function schedAny(){ const a = scheduleRows(); if(a.rows.some(r => r.start)) return {...a, virt:false}; return {...scheduleRows('2030-01-07'), virt:true}; }
// werkgangen uit andere hoofdfases die tegelijk lopen ('par'), plus de werkgang waar deze direct op volgt ('voor')
// werkgangen van een hoofdfase doornummeren als 1, 2, 3… (geeft {oud: nieuw})
function renumberSteps(phId){ const st = plannedSteps(phId), map = {}; st.forEach((n, i) => map[n] = i + 1); if(st.every((n, i) => n === i + 1)) return map;
  const nf = f => st.filter(n => n < f + 1).length; // oud frame-index (stap-1) → nieuwe index
  for(const s of P.shapes) if(s.phase === phId && s.step > 0) s.step = map[s.step] ?? s.step;
  for(const r of P.routes) if(r.phase === phId && r.step > 0) r.step = map[r.step] ?? r.step;
  for(const b of P.barriers || []) if(b.phase === phId){ const ns = nf(b.start), ne = st.filter(n => n <= b.end).length; b.start = ns; b.end = Math.max(ns + 1, ne); (b.moves || []).forEach(m => m.step = nf(m.step)); }
  const w = P.schema?.werkgangen; if(w){ const out = {}; for(const [k, v] of Object.entries(w)){ const [ph, n] = k.split('.'); out[ph === phId && map[n] ? ph + '.' + map[n] : k] = v; }
    for(const v of Object.values(out)) if(v.koppel){ const [kph, kn] = v.koppel.slice(2).split('.'); if(kph === phId && map[kn]) v.koppel = v.koppel[0] + ':' + kph + '.' + map[kn]; }
    P.schema.werkgangen = out; }
  remapRefs(r => { const m = r.match(/^W:(.+)\.(\d+)$/); return m && m[1] === phId && map[m[2]] ? 'W:' + phId + '.' + map[m[2]] : r; });
  return map; }
// staat er in werkgang n al een hek op (vrijwel) dezelfde plek / dezelfde route?
function hekIn(ph, n, pos, type){ return (P.barriers || []).some(x => x.phase === ph && (type === undefined || (x.type || 'hek') === type) && n - 1 >= x.start && n - 1 < x.end && (q => Math.hypot(q.x - pos.x, q.y - pos.y) < 1)(barPos(x, n - 1).pos)); }
function routeIn(s, n){ const k = JSON.stringify(s.points); return P.routes.some(x => x !== s && x.phase === s.phase && x.step === n && x.kind === s.kind && JSON.stringify(x.points) === k); }
function relatedRows(phId, n){ const {rows, virt} = schedAny(), me = rows.find(r => r.phase === phId && r.step === Number(n)); if(!me?.start) return [];
  const out = rows.filter(r => r !== me && r.phase !== phId && overlapT(r, me)).map(r => ({r, rel:'par', virt}));
  if(me.koppel?.[0] === 'E'){ const ref = rows.find(r => r.key === me.koppel.slice(2)); if(ref && ref.phase !== phId && !out.some(o => o.r === ref)) out.push({r:ref, rel:'voor', virt}); }
  return out; }
function relLabel(o){ return (o.rel === 'voor' ? 'net klaar: ' : '∥ ') + o.r.key + (o.virt ? '' : ' ' + fmtD(o.r.start) + '–' + fmtD(o.r.eind)); }
function schedFor(phId, n){ if(!P?.schema?.start && !Object.values(P?.schema?.werkgangen || {}).some(w => w.vast)) return null; return scheduleRows().rows.find(r => r.phase === phId && r.step === Number(n)) || null; }
function setSchema(fn){ if(!S.canWrite) return; stash(); P.schema = P.schema ? clone(P.schema) : {}; P.schema.werkgangen = P.schema.werkgangen || {}; fn(P.schema); changed(); }
// Hoofdfases draaien = ze wisselen van plek in de tijd. De werkgangen zelf (duur, vakken, posten, interne koppelingen) verhuizen mee met hun hoofdfase,
// maar de aansluiting op de rest van de planning blijft bij de plek in de volgorde: de startdatum en koppeling van de eerste werkgang en verwijzingen naar
// andere hoofdfases. contentMap: oude id -> nieuwe id van de inhoud; slotMap: oude id -> id die nu op die plek in de volgorde staat.
const ENTRY_KEYS = ['vast', 'koppel', 'wacht', 'preds'];
function swapPhaseSchema(contentMap, slotMap){
  const cm = id => contentMap[id] || id, sm = id => slotMap[id] || id;
  remapRefs(r => { const m = r.match(/^([WH]):([^.]+)(\..*)?$/); return m && contentMap[m[2]] ? m[1] + ':' + contentMap[m[2]] + (m[3] || '') : r; }, true);
  const w = P.schema?.werkgangen; if(!w) return;
  const refOf = (r, own) => { const m = String(r).match(/^([WH]):([^.]+)(\..*)?$/); if(!m) return r; return m[1] + ':' + (m[2] === own ? cm(m[2]) : sm(m[2])) + (m[3] || ''); };
  const fixLinks = (v, own) => { if(v.koppel && /^[SEV]:/.test(v.koppel)){ const [kph, kn] = v.koppel.slice(2).split('.'); v.koppel = v.koppel[0] + ':' + (kph === own ? cm(kph) : sm(kph)) + '.' + kn; }
    if(Array.isArray(v.preds)) v.preds = v.preds.map(p => typeof p === 'string' ? refOf(p, own) : {...p, r:refOf(p.r, own)}); };
  const out = {};
  for(const [k, v0] of Object.entries(w)){ const [ph, n] = k.split('.'), v = clone(v0);
    if(n === '1' && (contentMap[ph] || slotMap[ph])){ // eerste werkgang: aansluiting blijft op de plek, inhoud verhuist
      const entry = {}; for(const f of ENTRY_KEYS) if(v[f] !== undefined){ entry[f] = v[f]; delete v[f]; }
      fixLinks(entry, null); const ek = sm(ph) + '.1'; out[ek] = {...(out[ek] || {}), ...entry};
      const ck = cm(ph) + '.1'; out[ck] = {...v, ...(out[ck] || {})}; }
    else { fixLinks(v, ph); const ck = cm(ph) + '.' + n; out[ck] = {...(out[ck] || {}), ...v}; } }
  for(const k of Object.keys(out)) if(!Object.keys(out[k]).length) delete out[k];
  P.schema.werkgangen = out; }

