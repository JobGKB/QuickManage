/* ---------- zijpaneel ---------- */
function startEdit(id, firstChar){ S.editName = id; S.pick = id; S.editVal = firstChar != null ? firstChar : null; S.editCaret = firstChar != null ? firstChar.length : null; render(); }
function commitEdit(keep){
  const id = S.editName; if(!id) return; const nm = $('#nmIn'); const v = (nm ? nm.value : '').trim();
  S.editName = null; S.editVal = null; const it = S.items.find(x => x.id === id); const isNew = S.newId === id; S.newId = null;
  if(!it){ render(); return; }
  if(keep && v && v !== it.naam){ saveItem(id, {naam:v}); return; }
  if(isNew && !(keep && v)){ S.items = S.items.filter(x => x.id !== id); render(); if(!S.noDb) S.db.doc('items/' + id).delete().catch(() => {}); return; }
  render();
}
function selectItem(id, run){ S.pick = id; S.pickRun = run || null; document.querySelectorAll('#gbody .grow.pick').forEach(r => r.classList.remove('pick')); document.querySelectorAll('#gbody .bar.pickrun').forEach(b => b.classList.remove('pickrun')); const row = document.querySelector(`#gbody [data-row="${CSS.escape(id)}"]`); if(!row) return; row.classList.add('pick'); row.querySelectorAll('.bar').forEach(b => { if(!run || b.dataset.run === run) b.classList.add('pickrun'); }); }
function openDrawer(id, focusName){ S.selProj = null; S.sel = id; renderDrawer(); document.querySelectorAll('.grow.sel').forEach(r => r.classList.remove('sel')); document.querySelector(`[data-row="${CSS.escape(id)}"]`)?.classList.add('sel');
  if(focusName) setTimeout(() => { const n = $('#dNaam'); n && (n.focus(), n.select()); }, 20); }
function closeDrawer(){ if(!S.sel) return; S.sel = null; $('#drawerRoot').innerHTML = ''; document.querySelectorAll('.grow.sel').forEach(r => r.classList.remove('sel')); }
function renderDrawer(){
  const it = S.items.find(x => x.id === S.sel); if(!it){ closeDrawer(); return; }
  const active = document.activeElement?.id; const ro = !S.canWrite;
  const idx = idxOfItem(it); const rs = runsOf(it, idx);
  const wvbs = [...new Set(S.items.map(x => x.wvb).filter(Boolean))];
  const p = ploegOf(it.ploeg); const occ = occupancy(); const o = p ? occ[p.id] : null;
  const cfDays = o && !it.klaar ? idx.filter(i => o[i] >= 2).map(i => R.days[i]) : [];
  $('#drawerRoot').innerHTML = `<div class="dwback" id="dwBack"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dwTitle">
    <div class="dwhead"><div><h3 class="sub">${p ? esc(p.naam) : 'Nog in te plannen'}</h3><h2 id="dwTitle">${esc(it.naam || 'Naamloos project')}</h2></div><button class="btn sm" type="button" id="dwClose">Sluiten</button></div>
    <div class="dwbody">
      <label class="l">Projectnummer en naam<input class="f" id="dNaam" value="${esc(it.naam)}" ${ro ? 'readonly' : ''}></label>
      <label class="l">Ploeg<select class="f" id="dPloeg" ${ro ? 'disabled' : ''}><option value="">Nog in te plannen</option>${ploegList().map(q => `<option value="${esc(q.id)}" ${q.id === it.ploeg ? 'selected' : ''}>${esc(q.naam)}</option>`).join('')}</select></label>
      <div><h3 class="sub" style="margin-bottom:6px">Periodes</h3>
        <div class="pers">${rs.length ? `<div class="perh"><span>Start</span><span>Werkdagen</span><span>Eind</span><span></span></div>` + rs.map(([a, b], k) => ro
          ? `<div class="per"><span>${esc(fWD(R.days[a]))}</span><span>${werkIn(a, b)}</span><span>${esc(fWD(R.days[b]))}</span><span></span></div>`
          : `<div class="per" data-per="${a}-${b}"><input class="f" type="date" data-ps value="${R.days[a]}" aria-label="Start"><input class="f" type="number" min="1" max="400" data-pd value="${werkIn(a, b)}" aria-label="Werkdagen"><input class="f" type="date" data-pe value="${R.days[b]}" aria-label="Eind"><button class="ico" type="button" data-delrun="${a}-${b}" aria-label="Periode verwijderen">×</button></div>`).join('') : '<span class="hint">Nog geen dagen.</span>'}</div>
        ${ro ? '' : `${!rs.length || S.addRowFor === it.id ? `${rs.length ? '' : `<div class="perh"><span>Start</span><span>Werkdagen</span><span>Eind</span><span></span></div>`}<div class="per add"><input class="f" type="date" id="dVan" aria-label="Start"><input class="f" type="number" min="1" max="400" id="dDuurN" aria-label="Werkdagen" placeholder="aantal"><input class="f" type="date" id="dTotN" aria-label="Eind"><span></span></div>` : ''}
        <div class="row" style="margin-top:6px"><button class="btn sm primary" type="button" id="dAddRun">+ Periode</button></div>`}
      </div>
      <div><h3 class="sub" style="margin-bottom:6px">Voorbereiding</h3>
        <div class="seg" id="dVbSeg">${Object.entries(VB).map(([k, v]) => `<button type="button" data-dvb="${k}" aria-pressed="${itVb(it) === k}" ${ro && !S.canVb ? 'disabled' : ''}>${v}</button>`).join('')}</div></div>
      <label class="l">Werkvoorbereider<input class="f" id="dWvb" list="dWvbL" value="${esc(it.wvb || '')}" ${ro ? 'readonly' : ''}><datalist id="dWvbL">${wvbs.map(w => `<option value="${esc(w)}">`).join('')}</datalist></label>
      <div class="dwrow">
        <label class="l" style="flex:2;min-width:180px">Wacht op<input class="f" id="dWop" list="dWachtL" value="${esc(it.wacht?.op || '')}" placeholder="Niets" ${ro ? 'readonly' : ''}><datalist id="dWachtL">${WACHT.map(w => `<option value="${esc(w)}">`).join('')}</datalist></label>
        <label class="l" style="flex:1;min-width:130px">Verwacht<input class="f" type="date" id="dWtot" value="${esc(it.wacht?.tot || '')}" ${ro ? 'readonly' : ''}></label>
        <label class="l" style="flex:1;min-width:130px">Niet eerder dan<input class="f" type="date" id="dNv" value="${esc(it.nietVoor || '')}" ${ro ? 'readonly' : ''}></label>
      </div>
      ${(() => { const st = itemStat(it); return st && st.c === 'r' ? `<p class="kp" style="margin:-6px 0 0;font-size:13px">Let op: ${esc(st.why)}.</p>` : ''; })()}
      <label class="l">Notitie<textarea class="f" id="dNot" ${ro ? 'readonly' : ''}>${esc(it.notitie || '')}</textarea></label>
      <div class="dwchk">
      <label class="ck"><input type="checkbox" id="dPot" ${potAny(it) ? 'checked' : ''} ${ro ? 'disabled' : ''}> Voorlopig (nog niet definitief)${Array.isArray(it.potDagen) && it.potDagen.length ? ' <span class="faint" style="font-size:12.5px">· deels: alleen gemarkeerde periodes</span>' : ''}</label>
 <label class="ck"><input type="checkbox" id="dUit" ${it.uitleen ? 'checked' : ''} ${ro ? 'disabled' : ''}> Uitgeleend: de ploeg werkt deze periode voor een ander</label>
      <label class="ck"><input type="checkbox" id="dPar" ${it.parallel ? 'checked' : ''} ${ro ? 'disabled' : ''}> Loopt parallel aan ander werk van de ploeg (geen dubbelboeking)</label>
      </div>
    </div>
    <div class="dwfoot">${ro ? '<span></span>' : `<span class="row"><button class="btn" type="button" id="dArch">${it.klaar ? 'Terug naar de planning' : 'Archiveren (werk klaar)'}</button><button class="btn danger" type="button" id="dDel">Verwijderen</button></span>`}<button class="btn primary" type="button" id="dDone">Klaar</button></div>
  </aside>`;
  $('#dwBack').onclick = closeDrawer; $('#dwClose').onclick = closeDrawer; $('#dDone').onclick = closeDrawer;
  if(active && document.getElementById(active)) document.getElementById(active).focus();
  document.querySelectorAll('[data-dvb]').forEach(b => b.onclick = () => saveVb(it.id, b.dataset.dvb));
  if(ro) return;
  const txt = (sel, key, f = v => v) => { const el = $(sel); if(!el) return; el.onchange = () => { const v = f(el.value); if(v !== (it[key] ?? '')) saveItem(it.id, {[key]:v}); }; };
  txt('#dNaam', 'naam', v => v.trim() || 'Naamloos project'); txt('#dWie', 'wie', v => v.trim()); txt('#dWvb', 'wvb', v => v.trim()); txt('#dLetNote', 'letNote', v => v.trim()); txt('#dNot', 'notitie');

  $('#dDuur') && ($('#dDuur').onchange = e => saveItem(it.id, {duur:Math.max(1, Math.min(250, parseInt(e.target.value, 10) || 5))}));

  const setWacht = () => { const op = $('#dWop').value.trim(); const tot = $('#dWtot').value || null; saveItem(it.id, {wacht:op ? {op, tot} : null}); };
  $('#dWop').onchange = setWacht; $('#dWtot').onchange = () => { if(!$('#dWop').value.trim()){ $('#dWtot').value = ''; return toast('Vul eerst in waar je op wacht.'); } setWacht(); };
  $('#dNv').onchange = e => saveItem(it.id, {nietVoor:e.target.value || null});
  $('#dArch').onclick = () => { const naar = !it.klaar; saveItem(it.id, {klaar:naar}); closeDrawer(); toast(naar ? `${it.naam || 'Project'} gearchiveerd.` : `${it.naam || 'Project'} staat weer op de planning.`, {label:'Ongedaan maken', fn:() => undo()}); };
  $('#dUit').onchange = e => saveItem(it.id, {uitleen:e.target.checked});
  $('#dPar').onchange = e => saveItem(it.id, {parallel:e.target.checked});
  $('#dPot').onchange = e => saveItem(it.id, {potlood:e.target.checked, potDagen:null});
  $('#dPloeg').onchange = e => saveItem(it.id, {ploeg:e.target.value || null});
  $('#dLet') && ($('#dLet').onchange = e => saveItem(it.id, {let:e.target.checked}));
  $('#dKlaar') && ($('#dKlaar').onchange = e => saveItem(it.id, {klaar:e.target.checked}));
  document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => saveItem(it.id, {quad:it.quad === b.dataset.q ? null : b.dataset.q}));
  document.querySelectorAll('[data-delrun]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.delrun.split('-').map(Number); commitDays(it, idx.filter(i => i < a || i > c)); });
  document.querySelectorAll('[data-shift]').forEach(b => b.onclick = () => { const n = +b.dataset.shift; const next = idx.map(i => i + n).filter(i => i >= 0 && i < R.days.length); commitDays(it, next); });
  const setRun = (a, b, start, n) => { const keep = idx.filter(x => x < a || x > b); const nd = nextWorkdays(start, Math.max(1, n)); const ni = nd.map(d => R.idx.get(d)).filter(x => x != null);
    const all = [...new Set([...keep, ...ni])].sort((x, y) => x - y); const extra = ni.length ? [ni[0], ni[ni.length - 1] + 1] : [];
    saveItem(it.id, {dagen:toDagen({...it, dagen:(it.dagen || []).filter(d => { const x = R.idx.get(d); return x == null || x < a || x > b; })}, all), splits:toSplits(it, all, extra)}); };
  const countWD = (a, b) => workdaysBetween(a, b).filter(d => !vrijOn(d)).length;
  document.querySelectorAll('[data-per]').forEach(row => { const [a, b] = row.dataset.per.split('-').map(Number);
    const ps = row.querySelector('[data-ps]'), pd = row.querySelector('[data-pd]'), pe = row.querySelector('[data-pe]');
    ps.onchange = () => { if(ps.value) setRun(a, b, ps.value, parseInt(pd.value, 10) || werkIn(a, b)); };
    pd.onchange = () => { const n = parseInt(pd.value, 10); if(n > 0) setRun(a, b, ps.value || R.days[a], n); };
    pe.onchange = () => { if(!pe.value) return; const st = ps.value || R.days[a]; if(pe.value < st) return toast('De einddatum ligt voor de start.'); const n = countWD(st, pe.value); if(n) setRun(a, b, st, n); }; });
  const prevWorkdays = (endIso, n) => { const out = []; let d = parse(endIso); while(out.length < n){ if(!isWE(d) && !vrijOn(iso(d))) out.unshift(iso(d)); d = addD(d, -1); } return out; };
  const nS = $('#dVan'), nN = $('#dDuurN'), nE = $('#dTotN'); let last = [];
  const touch = k => { last = [k, ...last.filter(x => x !== k)].slice(0, 2); };
  const solve = () => { const st = nS.value, n = parseInt(nN.value, 10), en = nE.value; const has = {s:!!st, n:n > 0, e:!!en};
    const pair = last.length === 2 ? last : ['s', 'n', 'e'].filter(k => has[k]).slice(0, 2);
    if(pair.includes('s') && pair.includes('n') && has.s && has.n){ const d = nextWorkdays(st, n); nE.value = d[d.length - 1]; }
    else if(pair.includes('s') && pair.includes('e') && has.s && has.e){ if(en >= st) nN.value = countWD(st, en) || ''; }
    else if(pair.includes('n') && pair.includes('e') && has.n && has.e){ nS.value = prevWorkdays(en, n)[0]; } };
  if(nS){ nS.oninput = () => { touch('s'); solve(); }; nN.oninput = () => { touch('n'); solve(); }; nE.oninput = () => { touch('e'); solve(); }; }
  const addNow = () => { if(!nS) return false; const st = nS.value, n = parseInt(nN.value, 10), en = nE.value;
    const nd = st && n > 0 ? nextWorkdays(st, n) : st && en ? workdaysBetween(st, en).filter(d => !vrijOn(d)) : en && n > 0 ? prevWorkdays(en, n) : null;
    if(!nd || !nd.length) return false; S.addRowFor = null;
    const dagen = [...new Set([...(it.dagen || []), ...nd])].sort(); const nIdx = dagen.map(d => R.idx.get(d)).filter(x => x != null); const i0 = R.idx.get(nd[0]), i1 = R.idx.get(nd[nd.length - 1]);
    saveItem(it.id, {dagen, splits:toSplits(it, nIdx, [i0, i1 != null ? i1 + 1 : null].filter(x => x != null))}); return true; };
  if(nS){ const done = () => { if(nS.value && nE.value && parseInt(nN.value, 10) > 0) addNow(); }; nS.onchange = done; nN.onchange = done; nE.onchange = done; }
  $('#dAddRun').onclick = () => { if(nS && addNow()) return; if(nS){ toast('Vul twee van de drie velden in: start, werkdagen of eind.'); nS.focus(); return; } S.addRowFor = it.id; renderDrawer(); $('#dVan')?.focus(); };
  const del = $('#dDel'); del.onclick = () => { if(del.classList.contains('armed')) deleteItem(it.id); else { del.classList.add('armed'); del.textContent = 'Zeker weten? Klik nogmaals'; setTimeout(() => { if(del.isConnected){ del.classList.remove('armed'); del.textContent = 'Verwijderen'; } }, 3500); } };
}
function nextWD(s){ let d = addD(parse(s), 1); while(isWE(d)) d = addD(d, 1); return d; }
