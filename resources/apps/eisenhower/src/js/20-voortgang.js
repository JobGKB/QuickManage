/* ---------- voortgang ---------- */
function renderVoortgang(occ, page = 'overzicht'){
  if(!S.projecten.length){
    return `<div class="empty"><b>Nog geen projectenlijst ingelezen.</b><span class="muted">Lees de weekexport uit IW in. Daarna zie je hier per fase waar elk project staat, en wat aandacht nodig heeft.</span>${S.canWrite ? '<button class="btn primary" type="button" id="vgImport">Projectenlijst inlezen</button>' : ''}</div>`;
  }
  const sig = signalen(occ);
  const wvbs = [...new Set(activeProjects().map(p => p.wvb).filter(Boolean))].sort();
  const flt = S.vgWvb || '';
  let h = `<div class="toolbar"><div class="seg" id="wvbSeg"><button type="button" data-wvb="" aria-pressed="${!flt}">Iedereen</button>${wvbs.map(w => `<button type="button" data-wvb="${esc(w)}" aria-pressed="${flt === w}">${esc(firstName(w))}</button>`).join('')}</div>
    <span class="spacer"></span><span class="hint">${S.lastImport?.datum ? 'Projectenlijst van ' + esc(fD(S.lastImport.datum.slice(0, 10), true)) : ''}</span></div>`;
  const P = activeProjects().filter(p => !flt || p.wvb === flt).map(p => ({p, i:projInfo(p)}));
  const sigCodes = new Map(); for(const g of sig) for(const r of g.rows) if(r.proj && !sigCodes.has(r.proj)) sigCodes.set(r.proj, g.lvl);
  if(page === 'overzicht') return h + renderRegie(occ, P, flt);
  if(page === 'voorb') return h + renderVoorbPage(P, sigCodes);
  if(page === 'offerte') return h + renderOffPage(P);
  if(page === 'archief') return h + renderArchief(flt);
  if(page === 'gereed') return h + renderGereedPage(P, sigCodes);
  // signalen
  const match = r => { if(!flt) return true; if(r.proj){ const p = S.projecten.find(x => x.code === r.proj); return p && p.wvb === flt; } return !r.item; };
  const rowHtml = r => `<div class="sigrow"><button type="button" class="sigopen" ${r.proj ? `data-proj="${esc(r.proj)}"` : r.item ? `data-open="${esc(r.item)}"` : `data-goday="${esc(r.day)}"`}><span>${esc(r.txt)}</span><small>${esc(r.sub)}</small></button>${r.plan && S.canWrite ? `<button class="btn sm" type="button" data-plannen="${esc(r.proj)}">Inplannen</button>` : ''}</div>`;
  const tiles = sig.map(g => ({g, rows:g.rows.filter(match)}));
  const selT = tiles.find(t => t.g.key === S.sigSel && t.rows.length);
  h += `<section class="sigt">${tiles.map(t => { const n = t.rows.length; const lvl = n ? t.g.lvl : 'ok';
    const peek = t.rows.slice(0, 2).map(r => r.txt.length > 34 ? r.txt.slice(0, 32) + '…' : r.txt).join(' · ');
    return `<button type="button" class="st ${lvl} ${selT && selT.g.key === t.g.key ? 'on' : ''}" data-sigtile="${t.g.key}" ${n ? '' : 'disabled'}><span class="stn">${n}</span><span class="stt">${t.g.titel}</span><span class="stp">${n ? esc(peek) + (n > 2 ? ` en ${n - 2} meer` : '') : 'Niets aan de hand'}</span></button>`; }).join('')}</section>
  ${selT ? `<section class="sig ${selT.g.lvl}"><div class="sighead"><b>${selT.g.titel}</b><span class="uitleg">${selT.g.uitleg}</span><button class="btn sm" type="button" id="sigClose">Sluiten</button></div><div class="sigrows">${selT.rows.map(rowHtml).join('')}</div></section>` : ''}`;
  // bezetting
  const bz = bezetting(occ);
  if(bz.rows.length) h += `<section class="bez"><h3 class="sub">Beschikbaarheid ploegen</h3><div class="bezwrap"><table class="bezt"><thead><tr><th></th>${bz.weeks.map(i0 => `<th>wk ${isoWeek(parse(R.days[i0]))}<small>${fD(R.days[i0])}</small></th>`).join('')}</tr></thead><tbody>
    ${bz.rows.map(r => `<tr><th><i class="dotp" style="--pc:${pColor(r.p)}"></i>${esc(r.p.naam)}</th>${r.cells.map(c => { const cls = !c.werk ? 'hol' : c.dub ? 'crit' : c.vrij >= 3 ? 'warn2' : c.vrij ? 'warn' : 'ok';
      const txt = !c.werk ? 'vrij' : c.dub ? `${c.dub}× dubbel` : c.vrij ? `${c.vrij} ${c.vrij === 1 ? 'dag' : 'dagen'} vrij` : 'vol';
      return `<td><button type="button" class="bc ${cls}" data-goday="${R.days[c.i0]}" title="${c.bezet} van ${c.werk} werkdagen bezet"><span class="bar5">${Array.from({length:5}, (_, k) => { const d = R.days[c.i0 + k]; const v = occ[r.p.id][c.i0 + k]; return `<i class="${vrijOn(d) ? 'h' : v >= 2 ? 'x' : v ? 'b' : ''}"></i>`; }).join('')}</span>${txt}</button></td>`; }).join('')}</tr>`).join('')}
    </tbody></table></div></section>`;
  // pijplijn
  const cnt = k => P.filter(x => x.i.fase === k).length;
  const vbOpen = P.filter(x => x.i.fase === 'voorb' && !x.p.geenPlanning && x.i.vb !== 'gereed').length;
  const admOpen = P.filter(x => x.i.fase === 'gereed' && adminInfo(x.p).done < adminInfo(x.p).total).length;
  const stages = [
    {k:'offerte', naam:'Offerte', n:cnt('offerte'), sub:'aanvraag of verzonden', go:'offerte'},
    {k:'voorb', naam:'Voorbereiding', n:cnt('voorb'), sub:vbOpen ? vbOpen + ' nog niet gereed' : 'alles gereed', warn:vbOpen > 0, go:'voorb'},
    {k:'uitv', naam:'Uitvoering', n:cnt('uitv'), sub:'gestart', go:'planning'},
    {k:'gereed', naam:'Technisch gereed', n:cnt('gereed'), sub:admOpen ? admOpen + ' administratief open' : 'alles afgerond', warn:admOpen > 0, go:'gereed'}];
  h = h.replace('<section class="sigt">', `<section class="pipe">${stages.map((st, k) => `<button type="button" class="ps ${st.warn ? 'warn' : ''}" data-gotab="${st.go}"><span class="psn">${st.n}</span><span class="pst">${st.naam}</span><span class="psu">${esc(st.sub)}</span></button>${k < stages.length - 1 ? '<span class="parr" aria-hidden="true">›</span>' : ''}`).join('')}</section><section class="sigt">`);
  return h;
}
const DEFAULT_ADMIN = ['Revisie / opleverdossier', 'Meer- en minderwerk', 'Eindfactuur', 'Afgesloten in IW'];
const adminList = () => (S.adminList && S.adminList.length) ? S.adminList : DEFAULT_ADMIN;
const ADM_ALTIJD = 'Afgesloten in IW';
function admState(pr, k){ const v = pr.admin && pr.admin[k]; if(v === true || v === 'gereed') return 'gereed'; if(v === 'open') return 'open'; if(v === 'nvt') return 'nvt'; return k === ADM_ALTIJD ? 'open' : 'nvt'; }
const ADM_NEXT = {nvt:'open', open:'gereed', gereed:'nvt'};
function adminInfo(pr){ const l = adminList(); const st = l.map(k => admState(pr, k)); const open = l.filter((k, j) => st[j] === 'open'); const done = st.filter(x => x === 'gereed').length; return {done, total:done + open.length, open}; }
function wvbIni(w){ return w ? w.split(/\s+/).filter(x => /^[A-Z]/.test(x)).slice(0, 2).map(x => x[0]).join('') : ''; }