/* ---------- bezetting ---------- */
function bezetting(occ, nw = 6){
  const wk0 = R.idx.get(iso(monday(TODAY))) ?? 0; const weeks = [];
  for(let w = 0; w < nw; w++){ const i0 = wk0 + w * 5; if(i0 + 4 >= R.days.length) break; weeks.push(i0); }
  const rows = ploegList().filter(p => occ[p.id]).map(p => ({p, cells:weeks.map(i0 => {
    let werk = 0, bezet = 0, dub = 0;
    for(let k = 0; k < 5; k++){ const d = R.days[i0 + k]; if(vrijOn(d)) continue; werk++; const v = occ[p.id][i0 + k]; if(v) bezet++; if(v >= 2) dub++; }
    return {i0, werk, bezet, dub, vrij:werk - bezet};
  })}));
  return {weeks, rows};
}
