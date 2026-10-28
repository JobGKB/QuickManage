/* ---------- excel ---------- */
async function exportXlsx(){
  if(!S.dl || !window.XLSX){ toast('Excel downloaden is in deze weergave niet beschikbaar.'); return; }
  const days = R.days; const r1 = ['Printdatum', TODAY]; const r2 = ['Werkplanning Eisenhower', '', '', '']; const r3 = ['Projecten', 'Startdatum', 'Team', '!'];
  days.forEach(d => { const dt = parse(d); r2.push(dt.getDay() === 1 ? 'Week ' + isoWeek(dt) : ''); r3.push(dt); });
  const aoa = [r1, r2, r3];
  const groups = ploegList().map(p => ({naam:p.naam + (p.leden ? ' (' + p.leden + ')' : ''), p, items:S.items.filter(it => it.ploeg === p.id)}));
  groups.push({naam:'Nog in te plannen', p:null, items:S.items.filter(isBacklog)});
  for(const g of groups){ if(!g.items.length) continue; aoa.push([g.naam]);
    for(const it of [...g.items].sort(sortItems)){ const f = firstDay(it); const set = new Set(it.dagen || []);
      aoa.push([it.naam + (it.klaar ? ' (afgerond)' : ''), f ? parse(f) : '', it.wie || g.p?.leden || g.p?.naam || '', it.let ? 'x' : '', ...days.map(d => set.has(d) ? 'x' : '')]); }
    aoa.push([]); }
  const ws = XLSX.utils.aoa_to_sheet(aoa, {cellDates:true, dateNF:'d-m-yyyy'});
  for(let c = 4; c < 4 + days.length; c++){ const a = XLSX.utils.encode_cell({r:2, c}); if(ws[a]) ws[a].z = 'd-m'; }
  ws['!cols'] = [{wch:40}, {wch:11}, {wch:14}, {wch:3}, ...days.map(() => ({wch:4}))];
  ws['!freeze'] = {xSplit:4, ySplit:3};
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, pad(TODAY.getDate()) + '-' + pad(TODAY.getMonth() + 1) + '-' + TODAY.getFullYear());
  const out = XLSX.write(wb, {bookType:'xlsx', type:'array', cellDates:true});
  try{ await S.dl.save({filename:`Projectenplanning ${iso(TODAY).replace(/-/g, '')}.xlsx`, data:out}); }catch(e){ if(e?.code !== 'cancelled') toast('Downloaden lukte niet: ' + (e.message || e.code)); }
}
