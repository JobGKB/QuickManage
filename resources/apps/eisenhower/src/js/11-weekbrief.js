/* ---------- weekbrief ---------- */
function weekData(occ){
  const i0 = R.idx.get(S.week); const days = i0 == null ? workdaysBetween(S.week, iso(addD(parse(S.week), 4))) : R.days.slice(i0, i0 + 5);
  const groups = [];
  for(const p of ploegList()){
    const items = S.items.filter(it => it.ploeg === p.id && !it.klaar && (it.dagen || []).some(d => days.includes(d))).sort(sortItems);
    const o = occ[p.id];
    const free = o ? days.filter((d, k) => !o[R.idx.get(d)] && !holidayOn(d)) : [];
    const dub = o ? days.filter(d => o[R.idx.get(d)] >= 2) : [];
    groups.push({p, items, free, dub});
  }
  const loose = S.items.filter(it => !it.ploeg && !it.klaar && (it.dagen || []).some(d => days.includes(d)));
  return {days, groups, loose};
}
function dayList(days, set){ const ks = days.map((d, k) => set.includes(d) ? k : -1).filter(k => k >= 0);
  if(ks.length === 5) return 'ma t/m vr'; const rs = runs(ks); return rs.map(([a, b]) => a === b ? WD[a] : b === a + 1 ? WD[a] + ', ' + WD[b] : WD[a] + ' t/m ' + WD[b]).join(', '); }
function renderWeek(occ){
  const n = S.weekN || 2; const i0 = R.idx.get(S.week) ?? 0; const days = R.days.slice(i0, i0 + 5 * n);
  const wns = [...new Set(days.map(d => isoWeek(parse(d))))];
  const vr = days.map(d => vrijOn(d)); const hol = days.map(d => holidayOn(d));
  const head1 = `<tr><th class="wbn" rowspan="2"></th>${Array.from({length:n}, (_, w) => `<th colspan="5" class="wbw">Week ${isoWeek(parse(days[w * 5] || days[0]))} <span class="faint">${fD(days[w * 5])} – ${fD(days[Math.min(w * 5 + 4, days.length - 1)])}</span></th>`).join('')}</tr>`;
  const head2 = `<tr>${days.map((d, k) => `<th class="wbd ${k % 5 === 0 ? 'wk0' : ''} ${vr[k] ? 'vr' : hol[k] ? 'hl' : ''}" title="${hol[k] ? esc(hol[k].label) : ''}">${WD[k % 5]} ${parse(d).getDate()}</th>`).join('')}</tr>`;
  const barRow = (it, col) => { let cells = ''; let k = 0;
    const on = days.map(d => (it.dagen || []).includes(d) && !vrijOn(d));
    while(k < days.length){ if(on[k]){ let j = k; while(j + 1 < days.length && (on[j + 1] || (vr[j + 1] && on.slice(j + 1).some(Boolean) && (() => { let q = j + 1; while(q < days.length && vr[q]) q++; return q < days.length && on[q]; })()))) j++;
        const span = j - k + 1; let vd = ''; for(let q = k; q <= j; q++) if(vr[q]) vd += `<span class="vdag" style="left:${(q - k) / span * 100}%;width:${100 / span}%"></span>`;
        cells += `<td colspan="${span}" class="wbc ${k % 5 === 0 ? 'wk0' : ''}"><div class="wbar ${potDays(it, days.slice(k, j + 1)) ? 'potlood' : ''} ${it.uitleen ? 'uitleen' : ''}" style="--c:${col}" data-open="${esc(it.id)}" title="${esc(it.naam)}">${vd}<span class="wbl">${esc(it.naam)}</span></div></td>`; k = j + 1; }
      else { cells += `<td class="wbc ${k % 5 === 0 ? 'wk0' : ''} ${vr[k] ? 'vr' : ''}"></td>`; k++; } }
    const st = itemStat(it); const v = itVb(it);
    return `<tr><td class="wbn" data-open="${esc(it.id)}"><span class="vbi vbi-${v} ${st && st.c === 'r' ? 'hot' : ''}" title="Voorbereiding: ${VB[v].toLowerCase()}${st ? ' · ' + esc(st.why) : ''}">${VB_ICO[v]}</span> ${esc(it.naam)}</td>${cells}</tr>`; };
  let body = '';
  for(const p of ploegList()){
    const its = S.items.filter(it => it.ploeg === p.id && !it.klaar && (it.dagen || []).some(d => days.includes(d) && !vrijOn(d))).sort(sortItems);
    const o = occ[p.id];
    const cells = days.map((d, k) => { const v = o ? o[R.idx.get(d)] : null; const cls = vr[k] ? 'vr' : !o ? '' : v >= 2 ? 'dub' : !v ? 'free' : '';
      return `<td class="wbh ${k % 5 === 0 ? 'wk0' : ''} ${cls}">${cls === 'free' ? 'vrij' : cls === 'dub' ? 'dubbel' : ''}</td>`; }).join('');
    body += `<tr class="wbg" style="--pc:${pColor(p)}"><td class="wbn"><b>${esc(p.naam)}</b></td>${cells}</tr>`;
    body += its.length ? its.map(it => barRow(it, pColor(p))).join('') : `<tr><td class="wbn faint">Geen werk ingepland</td>${days.map((d, k) => `<td class="wbc ${k % 5 === 0 ? 'wk0' : ''} ${vr[k] ? 'vr' : ''}"></td>`).join('')}</tr>`;
  }
  const loose = S.items.filter(it => !it.ploeg && !it.klaar && (it.dagen || []).some(d => days.includes(d)));
  if(loose.length){ body += `<tr class="wbg" style="--pc:var(--ink-3)"><td class="wbn"><b>Nog in te plannen</b></td>${days.map((d, k) => `<td class="wbh ${k % 5 === 0 ? 'wk0' : ''}"></td>`).join('')}</tr>` + loose.map(it => barRow(it, '#5d6b78')).join(''); }
  return `<div class="toolbar">
    <div class="seg"><button type="button" id="wkPrev" aria-label="Vorige week">‹</button><button type="button" id="wkNow">Deze week</button><button type="button" id="wkNext" aria-label="Volgende week">›</button></div>
    <div class="seg"><button type="button" data-wkn="1" aria-pressed="${n === 1}">1 week</button><button type="button" data-wkn="2" aria-pressed="${n === 2}">2 weken</button></div>
    <b style="font-size:17px">Week ${wns.join(' en ')}</b>
    <span class="spacer"></span>
    <button class="btn sm primary" type="button" id="wkPdf" ${S.dl ? '' : 'disabled title="Downloaden is in deze weergave niet beschikbaar"'}>Download PDF</button>
  </div>
  <div class="tblwrap"><table class="wbt">${head1}${head2}${body}</table></div>
  <p class="hint" style="margin:0">Klik op een project om het te openen. Gearceerd = vrije dag.</p>`;
}
function weekText(){
  const W = weekData(occupancy()); const wn = isoWeek(parse(S.week));
  let t = `Weekplanning week ${wn} (${fD(W.days[0])} – ${fD(W.days[4], true)})\n`;
  const hol = [...new Set(W.days.map(holidayOn).filter(Boolean).map(v => v.label))]; if(hol.length) t += `Let op: ${hol.join(', ')}\n`;
  for(const g of W.groups){ if(!g.items.length && !g.free.length) continue;
    t += `\n${g.p.naam}${g.p.leden ? ' (' + g.p.leden + ')' : ''}\n`;
    for(const it of g.items) t += `- ${it.naam}${isPotlood(it) ? ' (voorlopig)' : ''}${it.uitleen ? ' (uitgeleend)' : ''}: ${dayList(W.days, it.dagen)}${it.let && it.letNote ? ' — let op: ' + it.letNote : ''}\n`;
    if(g.free.length && g.p.type !== 'derden') t += `- Vrij: ${dayList(W.days, g.free)}\n`; }
  if(W.loose.length){ t += `\nNog zonder ploeg\n`; for(const it of W.loose) t += `- ${it.naam}: ${dayList(W.days, it.dagen)}\n`; }
  return t;
}
async function weekPdf(){
  if(!S.dl || !window.jspdf){ toast('PDF maken is in deze weergave niet beschikbaar.'); return; }
  const W = weekData(occupancy()); const wn = isoWeek(parse(S.week));
  const doc = new window.jspdf.jsPDF({orientation:'landscape', unit:'mm', format:'a4'});
  const M = 14, PW = 297, colW = 16, nameW = PW - 2 * M - 5 * colW - 70;
  let y = M;
  doc.setFillColor(67, 144, 52); doc.rect(0, 0, PW, 4, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(29, 33, 29); doc.text(`Weekplanning week ${wn}`, M, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(86, 92, 86);
  doc.text(`${fD(W.days[0])} – ${fD(W.days[4], true)} · GKB Realisatie · afgedrukt ${fD(TODAY, true)}`, M, y + 14);
  y += 22;
  const hol = W.days.map(holidayOn);
  const header = () => { doc.setFontSize(8.5); doc.setTextColor(111, 117, 111); doc.setFont('helvetica', 'bold');
    doc.text('PROJECT', M + 2, y + 4); W.days.forEach((d, k) => doc.text(`${WD[k].toUpperCase()} ${parse(d).getDate()}`, M + nameW + k * colW + colW / 2, y + 4, {align:'center'}));
    doc.text('OPMERKING', M + nameW + 5 * colW + 3, y + 4); y += 6; };
  const block = (title, sub, rgb, items, foot) => {
    const need = 9 + 6 + Math.max(1, items.length) * 7 + (foot ? 6 : 0);
    if(y + need > 200){ doc.addPage(); y = M; }
    doc.setFillColor(...rgb); doc.rect(M, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(29, 33, 29); doc.text(title, M + 5, y + 5.2);
    if(sub){ doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(111, 117, 111); doc.text(sub, M + 5 + doc.getTextWidth(title) * 12 / 9.5 + 4, y + 5.2); }
    y += 9; header();
    if(!items.length){ doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(111, 117, 111); doc.text('Geen werk ingepland.', M + 2, y + 4.5); y += 7; }
    for(const it of items){
      doc.setDrawColor(223, 226, 220); doc.line(M, y, PW - M, y);
      W.days.forEach((d, k) => { if(hol[k]){ doc.setFillColor(227, 235, 246); doc.rect(M + nameW + k * colW, y, colW, 7, 'F'); } });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(29, 33, 29);
      doc.text(doc.splitTextToSize((it.let ? '! ' : '') + it.naam + (isPotlood(it) ? ' (voorlopig)' : '') + (it.wie ? ' (' + it.wie + ')' : ''), nameW - 4)[0], M + 2, y + 4.8);
      W.days.forEach((d, k) => { if((it.dagen || []).includes(d)){ doc.setFillColor(...rgb); doc.rect(M + nameW + k * colW + colW / 2 - 2.5, y + 1.5, 5, 4, 'F'); } });
      doc.setFontSize(9); doc.setTextColor(86, 92, 86);
      doc.text(doc.splitTextToSize(it.let && it.letNote ? it.letNote : (it.notitie || ''), 66)[0] || '', M + nameW + 5 * colW + 3, y + 4.8);
      y += 7;
    }
    if(foot){ doc.setFontSize(9); doc.setTextColor(138, 90, 15); doc.text(foot, M + 2, y + 4); y += 6; }
    y += 5;
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  for(const g of W.groups){ const foot = [g.dub.length ? 'Dubbel geboekt: ' + dayList(W.days, g.dub) : '', g.free.length && g.p.type !== 'derden' ? 'Vrij: ' + dayList(W.days, g.free) : ''].filter(Boolean).join(' · ');
    block(g.p.naam, g.p.leden || '', hex(pColor(g.p)), g.items, foot); }
  if(W.loose.length) block('Nog zonder ploeg', '', [93, 107, 120], W.loose, '');
  try{ await S.dl.save({filename:`Weekplanning week ${wn}.pdf`, data:doc.output('arraybuffer')}); }catch(e){ if(e?.code !== 'cancelled') toast('Downloaden lukte niet: ' + (e.message || e.code)); }
}
