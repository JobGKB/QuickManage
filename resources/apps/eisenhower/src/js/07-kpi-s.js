/* ---------- kpi's ---------- */
function kpis(occ){
  const t = R.idx.get(TODAYISO) ?? 0; const wk0 = R.idx.get(S.tab === 'week' ? S.week : iso(monday(TODAY))) ?? t;
  const horizon = t + 19;
  const cf = conflictsList(occ, t, horizon); const fr = freeDays(occ, t, horizon);
  const weekDays = R.days.slice(wk0, wk0 + 5);
  const running = S.items.filter(it => !it.klaar && (it.dagen || []).some(d => weekDays.includes(d))).length;
  const back = S.items.filter(it => isBacklog(it) && !it.klaar); const nu = back.filter(it => it.quad === 'nu').length;
  const flags = S.items.filter(it => it.let && !it.klaar).length;
  const wn = isoWeek(parse(R.days[wk0] || TODAYISO));
  return `<div class="kpis">
    <div class="kpi ok"><span class="lb">Week ${wn}</span><span class="v">${running}</span><span class="s">projecten in uitvoering</span></div>
    <button class="kpi ${cf.length ? 'crit' : 'ok'}" type="button" data-kpi="cf"><span class="lb">Dubbelboekingen</span><span class="v">${cf.length}</span><span class="s">ploegdagen, komende 4 weken</span></button>
    <button class="kpi ${fr.n ? 'warn' : 'ok'}" type="button" data-kpi="free"><span class="lb">Vrije ploegdagen</span><span class="v">${fr.n}</span><span class="s">eigen ploegen zonder werk, 4 weken</span></button>
    <button class="kpi info" type="button" data-kpi="back"><span class="lb">Nog in te plannen</span><span class="v">${back.length}</span><span class="s">${nu ? nu + ' daarvan “Nu doen”' : 'geen met hoogste prioriteit'}</span></button>
    <div class="kpi ${flags ? 'warn' : 'ok'}"><span class="lb">Aandachtspunten</span><span class="v">${flags}</span><span class="s">projecten met een !</span></div>
  </div>`;
}
