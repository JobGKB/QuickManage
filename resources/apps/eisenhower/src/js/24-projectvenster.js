/* ---------- projectvenster ---------- */
function openProj(code){ S.selProj = code; S.sel = null; renderProj(); }
function closeProj(){ S.selProj = null; $('#drawerRoot').innerHTML = ''; }
async function savePro(code, patch){ const p = S.projecten.find(x => x.code === code); if(!p) return; Object.assign(p, patch); if('wvbEigen' in patch) p.wvb = patch.wvbEigen || p.wvbLijst || ''; render(); if(S.selProj) renderProj();
  if(!S.noDb){ try{ await S.db.doc('projecten/' + code).update(stampPatch(patch)); }catch(e){ toast('Opslaan mislukt: ' + (e.message || e.code)); } } }
function renderProj(){
  const p = S.projecten.find(x => x.code === S.selProj); if(!p){ closeProj(); return; }
  const i = projInfo(p); const ro = !S.canWrite; const cl = checklistFor(p);
  const extra = Object.entries(p.extra || {}).filter(([, v]) => v !== '' && v != null);
  const kp = p.wacht?.op && p.wacht?.tot && i.start && p.wacht.tot >= i.start;
  const teVroeg = p.nietVoor && i.start && i.start < p.nietVoor;
  const feiten = [statusKort(p.status), p.opdrachtgever, p.wvb ? 'wvb ' + firstName(p.wvb) : ''].filter(Boolean).map(esc).join(' · ');
  const toonVb = (i.fase === 'voorb' || i.fase === 'uitv') && !p.geenPlanning;
  $('#drawerRoot').innerHTML = `<div class="dwback" id="dwBack"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dwTitle">
    <div class="dwhead"><div><h3 class="sub">${esc(p.code)} · ${esc(FASEN.find(f => f.key === i.fase).naam)}</h3><h2 id="dwTitle">${esc(p.oms || p.code)}</h2><p class="faint" style="margin:2px 0 0;font-size:13px">${feiten}</p></div><button class="btn sm" type="button" id="dwClose">Sluiten</button></div>
    <div class="dwbody">
      <div><h3 class="sub" style="margin-bottom:6px">Planning</h3>
        ${i.items.length ? `<div class="runs">${i.items.map(it => { const d = [...(it.dagen || [])].sort(); const pl = ploegOf(it.ploeg);
          return `<div><span>${pl ? esc(pl.naam) : 'Nog in te plannen'}<br><span class="faint">${d.length ? esc(fD(d[0])) + ' – ' + esc(fD(d[d.length - 1])) + ` (${d.length} d)` : 'geen dagen'}</span></span><button class="btn sm" type="button" data-goitem="${esc(it.id)}">Open</button></div>`; }).join('')}</div>`
          : (p.geenPlanning ? '<p class="hint" style="margin:0">Geen buitenwerk.</p>' : `<div class="row"><span class="hint">Nog niet ingepland.</span>${ro ? '' : '<button class="btn primary sm" type="button" id="pPlan">Inplannen</button>'}</div>`)}
      </div>
      ${toonVb ? `<div><h3 class="sub" style="margin-bottom:6px">Voorbereiding</h3><div class="seg" id="vbSeg">${Object.entries(VB).map(([k, v]) => `<button type="button" data-vbset="${k}" aria-pressed="${i.vb === k}" ${ro ? 'disabled' : ''}>${v}</button>`).join('')}</div></div>` : ''}
      <div class="dwrow">
        <label class="l" style="flex:2;min-width:180px">Wacht op<input class="f" id="wOp" list="wachtLijst" value="${esc(p.wacht?.op || '')}" placeholder="Niets" ${ro ? 'readonly' : ''}><datalist id="wachtLijst">${WACHT.map(w => `<option value="${esc(w)}">`).join('')}</datalist></label>
        <label class="l" style="flex:1;min-width:130px">Verwacht<input class="f" type="date" id="wTot" value="${esc(p.wacht?.tot || '')}" ${ro ? 'readonly' : ''}></label>
        <label class="l" style="flex:1;min-width:130px">Niet eerder dan<input class="f" type="date" id="pNietVoor" value="${esc(p.nietVoor || '')}" ${ro ? 'readonly' : ''}></label>
      </div>
      ${kp || teVroeg ? `<p class="kp" style="margin:-6px 0 0;font-size:13px">${kp ? `Verwacht na de start (${esc(fD(i.start))}).` : ''} ${teVroeg ? `Ingepland vóór ${esc(fD(p.nietVoor))}.` : ''}</p>` : ''}
      <label class="l">Notitie<textarea class="f" id="pNot" rows="2" ${ro ? 'readonly' : ''}>${esc(p.notitie || '')}</textarea></label>
      <details class="dwmeer" ${S.dwMeer ? 'open' : ''} id="dwMeer"><summary>Meer</summary>
        <div class="dwmeer-b">
          <label class="l">Fase<select class="f" id="pFase" ${ro ? 'disabled' : ''}><option value="">Automatisch (volgens IW)</option>${FASEN.map(f => `<option value="${f.key}" ${p.fase === f.key ? 'selected' : ''}>${f.naam}</option>`).join('')}</select></label>
          <label class="l">Werkvoorbereider${ro ? `<span>${esc(p.wvb || '–')}</span>` : `<input class="f" id="pWvb" list="wvbAll" value="${esc(p.wvb || '')}"><datalist id="wvbAll">${[...new Set(S.projecten.map(x => x.wvbLijst).filter(Boolean))].map(w => `<option value="${esc(w)}">`).join('')}</datalist>`}</label>
          ${p.wvbEigen && p.wvbEigen !== p.wvbLijst ? `<p class="faint" style="margin:-4px 0 0;font-size:12.5px">In IW: ${esc(p.wvbLijst || 'leeg')}. Komt in het rapport bij de volgende import.</p>` : ''}
          ${ro ? '' : `<label class="ck"><input type="checkbox" id="pGeen" ${p.geenPlanning ? 'checked' : ''}> Geen buitenwerk (niet plannen)</label>`}
          <dl class="facts"><dt>Status in IW</dt><dd>${esc(p.status || '–')}${p.faseSinds ? ` <span class="faint">sinds ${esc(fD(p.faseSinds.slice(0, 10)))}</span>` : ''}</dd>
            ${p.pl ? `<dt>Projectleider</dt><dd>${esc(p.pl)}</dd>` : ''}
            ${extra.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
            ${p.actief === false ? '<dt>Let op</dt><dd>Staat niet meer in de laatste IW-lijst.</dd>' : ''}</dl>
        </div></details>
    </div>
    <div class="dwfoot"><span class="faint" style="font-size:12.5px">${p.laatstGezien ? 'IW-lijst van ' + esc(fD(p.laatstGezien)) : ''}</span><button class="btn primary" type="button" id="dDone">Klaar</button></div>
  </aside>`;
  $('#dwMeer').ontoggle = e => { S.dwMeer = e.target.open; };
  $('#dwBack').onclick = closeProj; $('#dwClose').onclick = closeProj; $('#dDone').onclick = closeProj;
  document.querySelectorAll('[data-goitem]').forEach(b => b.onclick = () => { const id = b.dataset.goitem; closeProj(); S.tab = 'planning'; lsSet('eis.tab', 'planning'); render(); const it = S.items.find(x => x.id === id); const f = it && firstDay(it); if(f) scrollToDay(f, 6); openDrawer(id); });
  if(ro) return;
  document.querySelectorAll('[data-vbset]').forEach(b => b.onclick = () => savePro(p.code, {vb:b.dataset.vbset}));
  $('#clFold') && ($('#clFold').ontoggle = e => { S.clOpen = e.target.open; });
  const setW = w => savePro(p.code, {wacht:w && w.op ? {op:w.op, tot:w.tot || null} : null});
  document.querySelectorAll('[data-wq]').forEach(b => b.onclick = () => setW({op:b.dataset.wq, tot:$('#wTot')?.value || p.wacht?.tot || null}));
  $('#wOp') && ($('#wOp').onchange = e => setW({op:e.target.value.trim(), tot:$('#wTot').value || null}));
  $('#pNietVoor') && ($('#pNietVoor').onchange = e => savePro(p.code, {nietVoor:e.target.value || null}));
  $('#wTot') && ($('#wTot').onchange = e => { const op = $('#wOp').value.trim(); if(!op){ e.target.value = ''; return toast('Vul eerst in waar je op wacht.'); } setW({op, tot:e.target.value || null}); });
  $('#wClear') && ($('#wClear').onclick = () => setW(null));
  document.querySelectorAll('[data-chkdel]').forEach(b => b.onclick = () => { S.clOpen = true; savePro(p.code, {checkItems:cl.filter(k => k !== b.dataset.chkdel)}); });
  const addChk = () => { const v = $('#chkNew').value.trim(); if(!v) return; if(cl.includes(v)) return toast('Dit punt staat er al.'); S.clOpen = true; savePro(p.code, {checkItems:[...cl, v]}); };
  $('#chkAdd') && ($('#chkAdd').onclick = addChk); $('#chkNew') && ($('#chkNew').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); addChk(); } });
  $('#chkReset') && ($('#chkReset').onclick = () => { S.clOpen = true; savePro(p.code, {checkItems:null}); });
  document.querySelectorAll('[data-chk]').forEach(b => b.onclick = () => savePro(p.code, {check:{...(p.check || {}), [b.dataset.chk]:!(p.check && p.check[b.dataset.chk])}}));
  $('#pWvb') && ($('#pWvb').onchange = e => { const v = e.target.value.trim(); savePro(p.code, {wvbEigen:v && v !== p.wvbLijst ? v : null}); });
  $('#pFase').onchange = e => setFase(p.code, e.target.value || null);
  $('#pGeen') && ($('#pGeen').onchange = e => savePro(p.code, {geenPlanning:e.target.checked}));
  $('#pNot').onchange = e => savePro(p.code, {notitie:e.target.value});
  $('#pPlan') && ($('#pPlan').onclick = () => planProject(p.code));
}
function setFase(code, fase){
  const p = S.projecten.find(x => x.code === code); if(!p) return;
  const prev = p.fase || null; if(prev === fase) return;
  savePro(code, {fase:fase || null, faseOp:fase ? TODAYISO : null});
  const naam = fase ? FASEN.find(f => f.key === fase).naam : 'automatisch';
  const a = afwijking({...p, fase});
  const waar = {offerte:'Offertes', voorb:'Voorbereiding', uitv:'Uitvoering › Projecten gereed voor uitvoering', gereed:'Afronding'}[fase];
  if(fase === 'uitv') S.uitvOpen = true;
  toast(`${code} naar ${naam}.${waar ? ' Staat nu bij ' + waar + '.' : ''}`, {label:'Ongedaan maken', fn:() => savePro(code, {fase:prev})});
}
const rapKey = x => x.p.code + '|' + x.a.wat;
function rapportData(wvb){ return afwijkingen().filter(x => !wvb || x.p.wvb === wvb); }
function rapportSel(wvb){ S.rapSkip ||= new Set(); return rapportData(wvb).filter(x => !S.rapSkip.has(rapKey(x))); }
function rapLijstKlopt(x){ const p = x.p;
  if(x.a.wat === 'Fase'){ const prev = p.fase; savePro(p.code, {fase:null, faseOp:null}); toast(`${p.code}: fase volgt weer de projectenlijst.`, {label:'Ongedaan maken', fn:() => { savePro(p.code, {fase:prev}); openRapport(); }}); }
  else { const prev = p.wvbEigen; savePro(p.code, {wvbEigen:null}); toast(`${p.code}: werkvoorbereider volgt weer de projectenlijst.`, {label:'Ongedaan maken', fn:() => { savePro(p.code, {wvbEigen:prev}); openRapport(); }}); }
}
function rapportText(wvb){
  const rows = rapportSel(wvb); const by = new Map(); for(const x of rows){ const k = x.p.wvb || 'Zonder werkvoorbereider'; if(!by.has(k)) by.set(k, []); by.get(k).push(x); }
  let t = `Aanpassingen projectenlijst (${fD(TODAY, true)})\nGraag de status in IW aanpassen:\n`;
  for(const [k, list] of by){ t += `\n${k}\n`; for(const x of list) t += `- ${x.p.code} ${x.p.oms}: ${x.a.wat.toLowerCase()} staat op ${x.a.staat}, moet ${x.a.moet}\n`; }
  return t;
}
function openRapport(){
  const all = afwijkingen(); const wvbs = [...new Set(all.map(x => x.p.wvb || ''))];
  let cur = S.rapWvb && wvbs.includes(S.rapWvb) ? S.rapWvb : '';
  S.rapSkip ||= new Set();
  const draw = () => { const rows = rapportData(cur); const sel = rapportSel(cur);
    if(!afwijkingen().length){ closeModal(); return toast('Alles nagelopen. Geen afwijkingen meer.'); }
    openModal(`<div class="row" style="justify-content:space-between"><h2>Rapport afwijkingen</h2><button class="btn sm" type="button" id="mClose">Sluiten</button></div>
      <p class="muted" style="margin:0;font-size:14px">Loop de lijst door. Aangevinkt = laten aanpassen in IW (gaat mee in tekst en Excel). Klopt de projectenlijst toch? Klik <b>Lijst klopt</b>, dan past Eisenhower zich aan.</p>
      <div class="seg" id="rapSeg"><button type="button" data-rw="" aria-pressed="${!cur}">Iedereen (${all.length})</button>${wvbs.map(w => `<button type="button" data-rw="${esc(w)}" aria-pressed="${cur === w}">${esc(firstName(w) || 'Onbekend')} (${all.filter(x => (x.p.wvb || '') === w).length})</button>`).join('')}</div>
      <div class="bezwrap"><table class="rapt"><thead><tr><th style="width:1%" title="Laten aanpassen">Aanp.</th><th>Werkorder</th><th>Omschrijving</th><th>Werkvoorbereider</th><th>Wat</th><th>Staat op</th><th>Moet</th><th></th></tr></thead><tbody>
      ${rows.map((x, i) => `<tr class="${S.rapSkip.has(rapKey(x)) ? 'rapoff' : ''}"><td><input type="checkbox" data-rk="${i}" ${S.rapSkip.has(rapKey(x)) ? '' : 'checked'} aria-label="Laten aanpassen"></td><td class="mono">${esc(x.p.code)}</td><td>${esc(x.p.oms)}</td><td>${esc(x.p.wvb || '')}</td><td>${esc(x.a.wat)}</td><td>${esc(x.a.staat)}</td><td><b>${esc(x.a.moet)}</b></td><td>${!S.canWrite ? "" : `<button class="btn sm" type="button" data-lk="${i}" title="Projectenlijst klopt: Eisenhower aanpassen">Lijst klopt</button>`}</td></tr>`).join('')}</tbody></table></div>
      <p class="hint" style="margin:0">${sel.length} van ${rows.length} aangevinkt om te laten aanpassen.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" id="rapCopy" ${sel.length ? '' : 'disabled'}>Kopieer als tekst</button><button class="btn primary" type="button" id="rapXlsx" ${S.dl && window.XLSX && sel.length ? '' : 'disabled'}>Download Excel</button></div>`);
    $('#mClose').onclick = closeModal;
    document.querySelectorAll('[data-rw]').forEach(b => b.onclick = () => { cur = b.dataset.rw; S.rapWvb = cur; draw(); });
    document.querySelectorAll('[data-rk]').forEach(c => c.onchange = () => { const k = rapKey(rows[+c.dataset.rk]); c.checked ? S.rapSkip.delete(k) : S.rapSkip.add(k); draw(); });
    document.querySelectorAll('[data-lk]').forEach(b => b.onclick = () => { rapLijstKlopt(rows[+b.dataset.lk]); setTimeout(draw, 0); });
    $('#rapCopy').onclick = async () => { const t = rapportText(cur); try{ await navigator.clipboard.writeText(t); toast('Rapport gekopieerd. Plak het in een mail of Teams-bericht.'); }catch{ const ta = document.createElement('textarea'); ta.className = 'f'; ta.rows = 10; ta.value = t; $('#rapCopy').closest('.row').before(ta); ta.select(); toast('Selecteer de tekst en kopieer hem zelf.'); } };
    $('#rapXlsx').onclick = async () => { const aoa = [['Werkorder', 'Omschrijving', 'Werkvoorbereider', 'Wat', 'Staat op', 'Moet'], ...sel.map(x => [x.p.code, x.p.oms, x.p.wvb || '', x.a.wat, x.a.staat, x.a.moet])];
      const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [{wch:14}, {wch:44}, {wch:24}, {wch:16}, {wch:24}, {wch:26}]; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Afwijkingen');
      try{ await S.dl.save({filename:`Afwijkingen projectenlijst ${iso(TODAY).replace(/-/g, '')}${cur ? ' ' + firstName(cur) : ''}.xlsx`, data:XLSX.write(wb, {bookType:'xlsx', type:'array'})}); }catch(e){ if(e?.code !== 'cancelled') toast('Downloaden lukte niet: ' + (e.message || e.code)); } };
  };
  draw();
}
async function planProject(code){
  const p = S.projecten.find(x => x.code === code); if(!p) return;
  const id = await createItem({naam:p.code + ' ' + p.oms, ploeg:null, wvb:p.wvb || ''});
  closeProj(); S.tab = 'planning'; lsSet('eis.tab', 'planning'); S.sort = 'ploeg'; lsSet('eis.sort', 'ploeg'); render(); openDrawer(id);
  toast('Toegevoegd onder “Nog in te plannen”. Kies een ploeg en periode, of sleep hem in de tijdlijn.');
}
