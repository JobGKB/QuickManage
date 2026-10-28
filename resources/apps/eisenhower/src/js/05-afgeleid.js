/* ---------- afgeleid ---------- */
const ploegOf = id => S.ploegen.find(p => p.id === id) || null;
const ploegList = () => [...S.ploegen].sort((a, b) => (a.volgorde ?? 99) - (b.volgorde ?? 99) || a.naam.localeCompare(b.naam));
const pColor = p => p?.kleur || '#5d6b78';
const quadOf = it => QUADS[it.quad] || null;
const isBacklog = it => !it.ploeg;
function range(){
  let lo = addD(monday(TODAY), -8 * 7), hi = addD(monday(TODAY), 40 * 7);
  for(const it of S.items) for(const d of it.dagen || []){ const x = parse(d); if(x < lo) lo = x; if(x > hi) hi = x; }
  lo = monday(lo); hi = addD(monday(hi), 4 + 14);
  const days = []; const idx = new Map(); let d = lo;
  while(d <= hi){ if(!isWE(d)){ idx.set(iso(d), days.length); days.push(iso(d)); } d = addD(d, 1); }
  return {days, idx};
}
let R = range();
const isVrij = v => v.vrij ?? (v.soort === 'feestdag');
const vrijOn = dayIso => S.vak.some(v => isVrij(v) && dayIso >= v.start && dayIso <= v.end);
function holidayOn(dayIso){ for(const v of S.vak) if(dayIso >= v.start && dayIso <= v.end) return v; return null; }
function occupancy(){
  const occ = {}; const N = R.days.length;
  for(const p of S.ploegen) if(p.type !== 'derden') occ[p.id] = new Uint8Array(N);
  const par = [];
  for(const it of S.items){ if(it.klaar || !occ[it.ploeg]) continue; if(it.parallel){ par.push(it); continue; } for(const d of it.dagen || []){ if(vrijOn(d)) continue; const i = R.idx.get(d); if(i != null && occ[it.ploeg][i] < 250) occ[it.ploeg][i]++; } }
  for(const it of par) for(const d of it.dagen || []){ if(vrijOn(d)) continue; const i = R.idx.get(d); if(i != null && !occ[it.ploeg][i]) occ[it.ploeg][i] = 1; }
  return occ;
}
function runs(sortedIdx){ const out = []; for(const i of sortedIdx){ const l = out[out.length - 1]; if(l && i === l[1] + 1) l[1] = i; else out.push([i, i]); } return out; }
const idxOfItem = it => [...new Set((it.dagen || []).filter(d => !vrijOn(d)).map(d => R.idx.get(d)).filter(i => i != null))].sort((a, b) => a - b);
function firstDay(it){ const d = [...(it.dagen || [])].sort(); return d[0] || null; }
function lastDay(it){ const d = [...(it.dagen || [])].sort(); return d[d.length - 1] || null; }
function conflictsList(occ, fromI, toI){
  const out = [];
  for(const p of ploegList()){ const o = occ[p.id]; if(!o) continue;
    for(let i = fromI; i <= toI && i < o.length; i++) if(o[i] >= 2){
      const day = R.days[i]; const names = S.items.filter(it => it.ploeg === p.id && !it.klaar && (it.dagen || []).includes(day)).map(it => it.naam);
      out.push({p, day, i, names}); } }
  return out;
}
function freeDays(occ, fromI, toI){ let n = 0; const per = {};
  for(const p of S.ploegen){ const o = occ[p.id]; if(!o) continue; per[p.id] = 0;
    for(let i = fromI; i <= toI && i < o.length; i++) if(!o[i] && !holidayOn(R.days[i])){ n++; per[p.id]++; } }
  return {n, per};
}
function matchQ(it){ if(!S.q) return true; const q = S.q.toLowerCase(); return [it.naam, it.wie, it.wvb, ploegOf(it.ploeg)?.naam].some(v => String(v || '').toLowerCase().includes(q)); }
