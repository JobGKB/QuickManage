/* ---------- voorbereiding aan de planning ---------- */
const WACHT = ['Gunning / opdracht', 'Vergunning', 'KLIC / kabels en leidingen', 'Materiaal', 'Onderaannemer', 'Opdrachtgever', 'Ontwerp / tekening'];
const itVb = it => (S.vbMap && S.vbMap[it.id]?.vb) || it.vb || 'niet';
async function saveVb(id, vb){ if(!S.canVb && !S.canWrite) return; S.vbMap = {...(S.vbMap || {}), [id]:{...(S.vbMap?.[id] || {}), vb}}; render(); if(S.sel) renderDrawer();
  if(S.noDb) return; try{ await S.db.doc('vb/' + id).set({vb, door:S.meId || null, op:new Date().toISOString()}); }catch(e){ toast('Opslaan lukte niet' + (e?.code === 'invalid_argument' ? ': je hebt geen schrijfrechten (vraag Pieter om je als Contributor toe te voegen).' : '.')); } }
const VB_ICO = {niet:'!', bezig:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 3.3V6l1.9 1.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>', gereed:'✓'};
function itemStat(it){
  if(it.klaar || it.uitleen) return null; const start = firstDay(it); if(!start) return null;
  const t = R.idx.get(TODAYISO) ?? 0; const soon = R.days[Math.min(t + 10, R.days.length - 1)];
  const loopt = start <= TODAYISO;
  if(it.nietVoor && start < it.nietVoor) return {c:'r', why:`ingepland vóór ${fD(it.nietVoor)}`};
  if(it.wacht?.op && it.wacht.tot && !loopt && it.wacht.tot >= start) return {c:'r', why:`wacht op ${it.wacht.op.toLowerCase()} (${fD(it.wacht.tot)}), dat is na de start`};
  if(!loopt && start <= soon && itVb(it) !== 'gereed') return {c:'r', why:`start ${fWD(start)}, voorbereiding ${VB[itVb(it)].toLowerCase()}`};
  if(it.wacht?.op) return {c:'a', why:`wacht op ${it.wacht.op.toLowerCase()}`};
  return null;
}
function renderVoorbItems(){
  const all = S.items.filter(it => !it.klaar && !it.uitleen && (!lastDay(it) || lastDay(it) >= TODAYISO) && !(firstDay(it) && firstDay(it) <= TODAYISO))
    .map(it => ({it, p:{code:String(it.naam || '')}, pl:ploegOf(it.ploeg), start:firstDay(it)}));
  const t = tblCtl('vbi', all, {zoek:x => (x.it.naam || '') + ' ' + (x.it.wvb || '') + ' ' + (x.it.wacht?.op || ''),
    sort:(a, b) => (a.start && b.start ? a.start.localeCompare(b.start) : a.start ? -1 : b.start ? 1 : 0) || a.p.code.localeCompare(b.p.code, 'nl', {numeric:true}),
    filters:[{k:'pl', leeg:'Alle ploegen', v:x => x.pl ? x.pl.naam : 'Nog in te plannen'}, {k:'wvb', leeg:'Alle werkvoorbereiders', v:x => x.it.wvb || ''}, {k:'vb', leeg:'Alle voorbereiding', v:x => VB[itVb(x.it)]}],
    cols:[['start', 'Start', x => x.start || ''], ['naam', 'Project', x => x.it.naam || ''], ['pl', 'Ploeg', x => x.pl ? x.pl.naam : ''], ['wvb', 'Wvb', x => x.it.wvb || ''], ['w', 'Wacht op', x => x.it.wacht?.op || ''], ['vb', 'Voorbereiding', x => ({niet:1, bezig:2, gereed:3})[itVb(x.it)]]]});
  const c = {niet:0, bezig:0, gereed:0}; all.forEach(x => c[itVb(x.it)]++);
  return `<section class="pagehead"><h2>Voorbereiding</h2><span class="muted">Alles wat op de planning staat en nog moet starten. Bovenaan wat het eerst begint.</span>
      <span class="spacer"></span><span class="vbsum"><span class="vbi vbi-niet">${VB_ICO.niet}</span> ${c.niet} niet gestart <span class="vbi vbi-bezig">${VB_ICO.bezig}</span> ${c.bezig} bezig <span class="vbi vbi-gereed">${VB_ICO.gereed}</span> ${c.gereed} gereed</span></section>${t.tools}
    <div class="tblwrap"><table class="tbl" data-tfbody="vbi">${t.thead}<tbody>
    ${t.rows.map(x => { const st = itemStat(x.it);
      return t.tr(x, `<tr data-open="${esc(x.it.id)}" class="${st && st.c === 'r' ? 'urg' : ''}"><td>${x.start ? `<b>${esc(fWD(x.start))}</b>` : '<span class="faint">geen datum</span>'}${x.it.nietVoor ? `<br><span class="${x.start && x.start < x.it.nietVoor ? 'kp' : 'faint'}" style="font-size:12.5px">niet vóór ${esc(fD(x.it.nietVoor))}</span>` : ''}</td>
      <td class="om">${esc(x.it.naam || 'Naamloos project')}${st && st.c === 'r' ? ` <span class="kp" style="font-size:12.5px">· ${esc(st.why)}</span>` : ''}</td><td>${x.pl ? esc(x.pl.naam) : '<span class="faint">nog in te plannen</span>'}</td><td>${esc(x.it.wvb || '–')}</td>
      <td>${x.it.wacht?.op ? `<span class="${x.it.wacht.tot && x.start && x.it.wacht.tot >= x.start ? 'kp' : 'wt'}">${esc(x.it.wacht.op)}${x.it.wacht.tot ? ' · ' + esc(fD(x.it.wacht.tot)) : ''}</span>` : '<span class="faint">–</span>'}</td>
      <td><button type="button" class="vbst" data-vbit="${esc(x.it.id)}" title="${S.canWrite || S.canVb ? 'Klik om te wijzigen' : ''}"><span class="vbi vbi-${itVb(x.it)}">${VB_ICO[itVb(x.it)]}</span> ${VB[itVb(x.it)]}</button></td></tr>`); }).join('') || `<tr><td colspan="6" class="faint">${all.length ? 'Niets met deze filters.' : 'Niets gepland dat nog moet starten.'}</td></tr>`}</tbody></table></div>`;
}