/* ---------- signalen ---------- */
function signalen(occ){
  const t = R.idx.get(TODAYISO) ?? 0;
  const horizon = R.days[Math.min(t + 10, R.days.length - 1)];
  const P = activeProjects().map(p => ({p, i:projInfo(p)})).filter(x => x.i.fase !== 'vervallen');
  const out = [];
  const onv = P.filter(x => (x.i.n === 5 || x.i.n === 6) && !x.p.geenPlanning && x.i.start && x.i.start >= TODAYISO && x.i.start <= horizon && (x.i.vb !== 'gereed' || x.p.wacht?.op))
    .sort((a, b) => a.i.start.localeCompare(b.i.start));
  out.push({key:'onv', lvl:'crit', titel:'Onvoorbereid werk', uitleg:'Start binnen 2 weken, voorbereiding nog niet rond',
    rows:onv.map(x => ({proj:x.p.code, txt:`${x.p.code} ${x.p.oms}`, sub:`start ${fWD(x.i.start)} · ${x.p.wacht?.op ? 'wacht op ' + x.p.wacht.op.toLowerCase() + (x.p.wacht.tot ? ' (' + fD(x.p.wacht.tot) + ')' : '') : 'voorbereiding ' + VB[x.i.vb].toLowerCase()}${x.p.wvb ? ' · ' + firstName(x.p.wvb) : ''}`}))});
  const gaten = [];
  for(const p of ploegList()){ const o = occ[p.id]; if(!o) continue; let i = t;
    while(i <= t + 19 && i < o.length){ if(!o[i] && !vrijOn(R.days[i])){ let j = i; while(j + 1 <= t + 19 && j + 1 < o.length && !o[j + 1] && !vrijOn(R.days[j + 1])) j++;
      gaten.push({ploeg:p.naam, day:R.days[i], txt:`${p.naam} vrij`, sub:`${fWD(R.days[i])}${j > i ? ' t/m ' + fWD(R.days[j]) : ''} · ${j - i + 1} ${j > i ? 'dagen' : 'dag'}`}); i = j + 1; } else i++; } }
  out.push({key:'gat', lvl:'warn', titel:'Gaten in de planning', uitleg:'Eigen ploegen zonder werk, komende 4 weken', rows:gaten});
  const zonder = P.filter(x => (x.i.n === 5 || x.i.n === 6) && !x.p.geenPlanning && !x.i.items.some(it => (it.dagen || []).length)).sort((a, b) => a.p.code.localeCompare(b.p.code));
  out.push({key:'zonder', lvl:'warn', titel:'Opdracht zonder planning', uitleg:'In opdracht of uitvoering, nog nergens ingepland',
    rows:zonder.map(x => ({proj:x.p.code, txt:`${x.p.code} ${x.p.oms}`, sub:`${statusKort(x.p.status)}${x.p.wvb ? ' · ' + firstName(x.p.wvb) : ''}`, plan:true}))});
  const hangen = [];
  for(const x of P){
    const d = daysSince(x.p.faseSinds);
    if(x.i.n === 3 && d > 30) hangen.push({proj:x.p.code, txt:`${x.p.code} ${x.p.oms}`, sub:`offerte al ${d} dagen verzonden`});
    else if(x.i.n >= 7 && d > 21 && adminInfo(x.p).done < adminInfo(x.p).total) hangen.push({proj:x.p.code, txt:`${x.p.code} ${x.p.oms}`, sub:`al ${d} dagen technisch gereed, administratief nog open`});
    else if(!x.i.manual && x.i.n > 0 && x.i.n <= 4 && x.i.items.some(it => (it.dagen || []).some(dd => dd >= TODAYISO))) hangen.push({proj:x.p.code, txt:`${x.p.code} ${x.p.oms}`, sub:`ingepland vanaf ${fD(x.i.start)}, maar nog ${statusKort(x.p.status).toLowerCase()}`});
    else if(x.i.n >= 7 && x.i.items.some(it => !it.klaar && (it.dagen || []).some(dd => dd > TODAYISO))) hangen.push({proj:x.p.code, txt:`${x.p.code} ${x.p.oms}`, sub:'technisch gereed, maar nog ingepland'});
  }
  const codes = new Set(S.projecten.filter(p => p.actief !== false).map(p => p.code)); const bases = new Set([...codes].map(baseOf));
  if(S.projecten.length) for(const it of S.items){ const c = codeOf(it.naam); if(!c || it.klaar) continue; if(!codes.has(c) && !(!c.includes('-') && bases.has(c))) hangen.push({item:it.id, txt:it.naam, sub:'staat niet (meer) in de projectenlijst'}); }
  out.push({key:'hang', lvl:'info', titel:'Blijft hangen', uitleg:'Lang in dezelfde fase, of planning en fase kloppen niet', rows:hangen});
  return out;
}
