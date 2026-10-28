/* ---------- projectenlijst inlezen ---------- */
async function readProjectList(file){
  if(!window.XLSX){ toast('Excel lezen is in deze weergave niet beschikbaar.'); return; }
  if(!S.canWrite){ toast('Inlezen kan alleen met bewerkrechten.'); return; }
  let rows;
  try{
    const wb = XLSX.read(await file.arrayBuffer(), {type:'array', cellDates:true});
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''});
    const hi = aoa.findIndex(r => r.some(c => String(c).trim().toLowerCase() === 'wo-nummer'));
    if(hi < 0) throw new Error('Geen kolom “WO-nummer” gevonden.');
    const H = aoa[hi].map(c => String(c).trim());
    const find = n => H.findIndex(h => h.toLowerCase().startsWith(n));
    const c = {code:find('wo-nummer'), oms:find('omschrijving'), st:find('status'), og:find('opdrachtgever'), wvb:find('werkvoorbereider'), pl:find('projectleider')};
    const known = new Set(Object.values(c).filter(k => k >= 0).concat([find('debiteur')]));
    const val = v => v instanceof Date ? iso(v) : String(v ?? '').trim();
    rows = aoa.slice(hi + 1).map(r => { const extra = {}; H.forEach((h, k) => { if(h && !known.has(k) && val(r[k]) !== '') extra[h] = val(r[k]); });
      return {code:val(r[c.code]).toUpperCase(), oms:val(r[c.oms]), status:val(r[c.st]), opdrachtgever:c.og >= 0 ? val(r[c.og]) : '', wvb:c.wvb >= 0 ? val(r[c.wvb]) : '', pl:c.pl >= 0 ? val(r[c.pl]) : '', extra}; })
      .filter(r => /^[A-Z]{2,6}\d{3,6}(-\d{1,4})?$/.test(r.code));
    if(!rows.length) throw new Error('Geen werkorders gevonden.');
  }catch(e){ toast('Inlezen lukte niet: ' + (e.message || e)); return; }
  const now = TODAYISO; const prevMap = new Map(S.projecten.map(p => [p.code, p]));
  const nieuw = [], gewijzigd = [], weg = [];
  openModal(`<h2>Projectenlijst inlezen</h2><p class="muted" style="margin:0">${rows.length} werkorders verwerken…</p>`);
  for(const r of rows){
    const prev = prevMap.get(r.code);
    const base = {code:r.code, oms:r.oms, status:r.status, opdrachtgever:r.opdrachtgever, wvb:r.wvb, pl:r.pl, extra:r.extra, actief:true, laatstGezien:now};
    let doc;
    if(!prev){ doc = {...base, eerstGezien:now, faseSinds:now, check:{}, notitie:'', geenPlanning:false}; nieuw.push(r); }
    else { doc = {...base}; if(prev.status !== r.status){ doc.faseSinds = now; doc.vorigeStatus = prev.status || ''; gewijzigd.push({r, van:prev.status}); } }
    const same = prev && ['oms', 'status', 'opdrachtgever', 'pl', 'actief'].every(k => (prev[k] ?? '') === (doc[k] ?? '')) && (prev.wvbLijst ?? '') === (doc.wvb ?? '') && JSON.stringify(prev.extra || {}) === JSON.stringify(doc.extra || {});
    if(prev){ Object.assign(prev, doc); prev.wvbLijst = doc.wvb; prev.wvb = prev.wvbEigen || doc.wvb; } else S.projecten.push({...doc, wvbLijst:doc.wvb});
    if(S.noDb) continue;
    try{ if(!prev) await S.db.doc('projecten/' + r.code).set(stampPatch(doc)); else if(!same || prev.laatstGezien !== now) await S.db.doc('projecten/' + r.code).update(stampPatch(doc)); }catch(e){}
  }
  const seen = new Set(rows.map(r => r.code));
  for(const p of S.projecten) if(p.actief !== false && !seen.has(p.code)){ weg.push(p); p.actief = false; if(!S.noDb){ try{ await S.db.doc('projecten/' + p.code).update(stampPatch({actief:false, weg:now})); }catch{} } }
  if(!S.noDb){ try{ await S.db.doc('meta/import').set({datum:new Date().toISOString(), bestand:file.name, aantal:rows.length, door:S.meId || null}); }catch{} }
  const list = (arr, f) => arr.length ? `<div class="imp-list">${arr.slice(0, 40).map(f).join('')}</div>` : '';
  openModal(`<div class="row" style="justify-content:space-between"><h2>Projectenlijst ingelezen</h2><button class="btn sm" type="button" id="mClose">Sluiten</button></div>
    <p class="muted" style="margin:0">${rows.length} werkorders uit ${esc(file.name)}.</p>
    <section class="imp"><h3 class="sub">Nieuw · ${nieuw.length}</h3>${list(nieuw, r => `<div class="imp-row"><span><b class="mono">${esc(r.code)}</b> ${esc(r.oms)}<small>${esc(statusKort(r.status))}</small></span></div>`) || '<span class="hint">Geen nieuwe werkorders.</span>'}</section>
    <section class="imp"><h3 class="sub">Andere fase · ${gewijzigd.length}</h3>${list(gewijzigd, x => `<div class="imp-row"><span><b class="mono">${esc(x.r.code)}</b> ${esc(x.r.oms)}<small>${esc(statusKort(x.van))} → ${esc(statusKort(x.r.status))}</small></span></div>`) || '<span class="hint">Geen faseveranderingen.</span>'}</section>
    ${weg.length ? `<section class="imp"><h3 class="sub">Niet meer in de lijst · ${weg.length}</h3>${list(weg, p => `<div class="imp-row"><span><b class="mono">${esc(p.code)}</b> ${esc(p.oms)}<small>waarschijnlijk afgesloten</small></span></div>`)}</section>` : ''}
    ${afwijkingen().length ? `<section class="imp"><h3 class="sub">Afwijkend van Eisenhower · ${afwijkingen().length}</h3><p class="muted" style="margin:0;font-size:14px">Hier wijkt IW af van Eisenhower (fase of werkvoorbereider). Loop ze door in het rapport en vink aan wat aangepast moet worden.</p></section>` : ''}
    <div class="row" style="justify-content:flex-end">${afwijkingen().length ? '<button class="btn primary" type="button" id="mRap">Afwijkingen nalopen</button>' : ''}<button class="btn ${afwijkingen().length ? '' : 'primary'}" type="button" id="mGo">Naar voortgang</button></div>`);
  $('#mRap') && ($('#mRap').onclick = openRapport);
  $('#mClose').onclick = closeModal; $('#mGo').onclick = () => { closeModal(); S.tab = 'voortgang'; lsSet('eis.tab', 'voortgang'); render(); };
  render();
}

function openModal(html){ $('#modalbody').innerHTML = html; $('#modal').hidden = false; }
function closeModal(){ $('#modal').hidden = true; $('#modalbody').innerHTML = ''; }
$('#modal').addEventListener('click', e => { if(e.target.id === 'modal') closeModal(); });
function openSettings(){
  const ro = !S.canWrite; const pl = ploegList();
  openModal(`<div class="row" style="justify-content:space-between"><h2>Ploegen en instellingen</h2><button class="btn sm" type="button" id="mClose">Sluiten</button></div>
    <p class="muted" style="margin:0;font-size:14px">Bij eigen ploegen controleert Eisenhower op dubbelboekingen en vrije dagen. Onderaanneming of een ander team telt daar niet in mee.</p>
    <div class="plist">${pl.map((p, k) => `<div class="pl" data-pid="${esc(p.id)}">
      <input class="f" data-pf="naam" value="${esc(p.naam)}" aria-label="Naam ploeg" ${ro ? 'readonly' : ''}>
      <input class="f" data-pf="leden" value="${esc(p.leden || '')}" placeholder="Leden, bijv. Dean, Floris" aria-label="Leden" ${ro ? 'readonly' : ''}>
      <select class="f" data-pf="type" aria-label="Soort" ${ro ? 'disabled' : ''}><option value="eigen" ${p.type !== 'derden' ? 'selected' : ''}>Eigen ploeg</option><option value="derden" ${p.type === 'derden' ? 'selected' : ''}>Onderaanneming</option></select>
      <span class="cols">${COLORS.map(c => `<button type="button" data-col="${c}" style="background:${c}" aria-label="Kleur" aria-pressed="${p.kleur === c}" ${ro ? 'disabled' : ''}></button>`).join('')}</span>
      <span class="row" style="gap:2px;flex-wrap:nowrap"><button class="ico" type="button" data-mv="-1" ${k === 0 || ro ? 'disabled' : ''} aria-label="Omhoog">↑</button><button class="ico" type="button" data-mv="1" ${k === pl.length - 1 || ro ? 'disabled' : ''} aria-label="Omlaag">↓</button><button class="ico" type="button" data-pdel ${ro ? 'disabled' : ''} aria-label="Ploeg verwijderen" title="${S.items.some(i => i.ploeg === p.id) ? 'Eerst de projecten van deze ploeg verplaatsen' : 'Verwijderen'}">×</button></span>
    </div>`).join('')}</div>
    ${ro ? '' : '<div class="row"><input class="f" id="npNaam" placeholder="Nieuwe ploeg, bijv. Thomas & Levi" style="max-width:320px"><button class="btn" type="button" id="npAdd">Ploeg toevoegen</button></div>'}
    <h2 style="margin-top:6px">Vakanties en feestdagen</h2>
    <p class="muted" style="margin:0;font-size:14px">Vink “Vrije dagen” aan als er niet gewerkt wordt (bouwvak, feestdag). Die dagen worden gearceerd en overgeslagen als je een periode toevoegt. Zonder vinkje blijven het werkdagen, alleen gemarkeerd.</p>
    <div class="plist">${[...S.vak].sort((a, b) => a.start.localeCompare(b.start)).map(v => `<div class="vl" data-vid="${esc(v.id)}">
      <input class="f" data-vf="label" value="${esc(v.label)}" aria-label="Omschrijving" ${ro ? 'readonly' : ''}>
      <input class="f" type="date" data-vf="start" value="${esc(v.start)}" aria-label="Van" ${ro ? 'readonly' : ''}>
      <input class="f" type="date" data-vf="end" value="${esc(v.end)}" aria-label="Tot en met" ${ro ? 'readonly' : ''}>
      <select class="f" data-vf="soort" aria-label="Soort" ${ro ? 'disabled' : ''}><option value="vakantie" ${v.soort !== 'feestdag' ? 'selected' : ''}>Vakantie</option><option value="feestdag" ${v.soort === 'feestdag' ? 'selected' : ''}>Feestdag</option></select>
      <label class="ck" style="font-size:13px;white-space:nowrap" title="Aangevinkt: er wordt niet gewerkt. Uit: gewone werkdagen, alleen gemarkeerd."><input type="checkbox" data-vvrij ${isVrij(v) ? 'checked' : ''} ${ro ? 'disabled' : ''}> Vrije dagen</label>
      <button class="ico" type="button" data-vdel ${ro ? 'disabled' : ''} aria-label="Verwijderen">×</button></div>`).join('')}</div>
    ${ro ? '' : '<div class="row"><button class="btn" type="button" id="nvAdd">+ Periode toevoegen</button></div>'}
    <h2 style="margin-top:6px">Administratief afronden</h2>
    <p class="muted" style="margin:0;font-size:14px">De stappen die na technisch gereed nog moeten gebeuren. Eén per regel.</p>
    <textarea class="f" id="admTxt" rows="5" ${ro ? 'readonly' : ''}>${esc(adminList().join('\n'))}</textarea>`);
  $('#mClose').onclick = closeModal;
  if(ro) return;
  document.querySelectorAll('.pl').forEach(row => { const id = row.dataset.pid;
    row.querySelectorAll('[data-pf]').forEach(inp => inp.onchange = () => savePloeg(id, {[inp.dataset.pf]:inp.value.trim()}));
    row.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { savePloeg(id, {kleur:b.dataset.col}); row.querySelectorAll('[data-col]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    row.querySelectorAll('[data-mv]').forEach(b => b.onclick = async () => { const list = ploegList(); const i = list.findIndex(p => p.id === id); const j = i + (+b.dataset.mv); if(j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]]; for(let k = 0; k < list.length; k++) if(list[k].volgorde !== k) await savePloeg(list[k].id, {volgorde:k}); openSettings(); });
    row.querySelector('[data-pdel]').onclick = async () => { if(S.items.some(i => i.ploeg === id)) return toast('Verplaats eerst de projecten van deze ploeg.');
      S.ploegen = S.ploegen.filter(p => p.id !== id); if(!S.noDb){ try{ await S.db.doc('ploegen/' + id).delete(); }catch(e){ toast('Verwijderen mislukt: ' + (e.message || e.code)); } } render(); openSettings(); };
  });
  $('#npAdd').onclick = async () => { const naam = $('#npNaam').value.trim(); if(!naam) return toast('Geef de ploeg een naam.');
    const id = uid('pl'); const doc = {naam, leden:'', type:'eigen', kleur:COLORS[S.ploegen.length % COLORS.length], volgorde:S.ploegen.length};
    S.ploegen.push({id, ...doc}); if(!S.noDb){ try{ await S.db.doc('ploegen/' + id).set(stampPatch(doc)); }catch(e){ toast('Opslaan mislukt: ' + (e.message || e.code)); } } render(); openSettings(); };
  document.querySelectorAll('.vl').forEach(row => { const id = row.dataset.vid;
    row.querySelectorAll('[data-vf]').forEach(inp => inp.onchange = () => saveVak(S.vak.map(v => v.id === id ? {...v, [inp.dataset.vf]:inp.value} : v)));
    row.querySelector('[data-vvrij]').onchange = e => saveVak(S.vak.map(v => v.id === id ? {...v, vrij:e.target.checked} : v));
    row.querySelector('[data-vdel]').onclick = () => { saveVak(S.vak.filter(v => v.id !== id)); openSettings(); }; });
  $('#clTxt') && ($('#clTxt').onchange = async e => { const list = e.target.value.split('\n').map(x => x.trim()).filter(Boolean); S.checklist = list.length ? list : null; render(); if(!S.noDb){ try{ await S.db.doc('meta/instellingen').set(stampPatch({vakanties:S.vak, checklist:checklist(), admin:adminList()})); }catch(err){ toast('Opslaan mislukt: ' + (err.message || err.code)); } } });
  $('#admTxt').onchange = async e => { const list = e.target.value.split('\n').map(x => x.trim()).filter(Boolean); S.adminList = list.length ? list : null; render(); if(!S.noDb){ try{ await S.db.doc('meta/instellingen').set(stampPatch({vakanties:S.vak, checklist:checklist(), admin:adminList()})); }catch(err){ toast('Opslaan mislukt: ' + (err.message || err.code)); } } };
  $('#nvAdd').onclick = () => { saveVak([...S.vak, {id:uid('v'), label:'Nieuwe periode', start:TODAYISO, end:TODAYISO, soort:'vakantie'}]); openSettings(); };
}

boot();
/* rechtermuisknop-menu op de tijdlijn */
function closeCtx(){ const m = document.getElementById('ctxMenu'); if(m) m.remove(); }
document.addEventListener('contextmenu', e => {
  const host = e.target.closest('#gbody [data-row]'); if(!host || !S.canWrite){ closeCtx(); return; }
  const it = S.items.find(x => x.id === host.dataset.row); if(!it) return;
  e.preventDefault(); closeCtx();
  const bar = e.target.closest('.bar'); const run = bar ? bar.dataset.run : null;
  selectItem(it.id, run);
  const items = [
    ['open', 'Openen'],
    ['naam', 'Naam wijzigen'],
    run ? ['per', 'Deze periode verwijderen'] : null,
    run && R.days[+run.split('-')[1]] >= TODAYISO ? ['potrun', (() => { const [a, c] = run.split('-').map(Number); return potRun(it, a, c) ? 'Deze periode definitief' : 'Deze periode voorlopig'; })()] : run ? null : ['pot', potAny(it) ? 'Project definitief' : 'Project voorlopig'],
    ['arch', it.klaar ? 'Terug naar de planning' : 'Archiveren (werk klaar)'],
    ['del', 'Project verwijderen', 'danger']].filter(Boolean);
  const m = document.createElement('div'); m.id = 'ctxMenu'; m.className = 'ctx'; m.setAttribute('role', 'menu');
  m.innerHTML = `<div class="ctx-h">${esc(it.naam || 'Naamloos project')}</div>` + items.map(([k, t, c]) => `<button type="button" role="menuitem" data-ctx="${k}" class="${c || ''}">${esc(t)}</button>`).join('');
  document.body.appendChild(m);
  const r = m.getBoundingClientRect(); const x = Math.min(e.clientX, innerWidth - r.width - 8), y = Math.min(e.clientY, innerHeight - r.height - 8);
  m.style.left = Math.max(8, x) + 'px'; m.style.top = Math.max(8, y) + 'px';
  m.querySelector('button').focus();
  m.onclick = ev => { const b = ev.target.closest('[data-ctx]'); if(!b) return; const k = b.dataset.ctx;
    if(k === 'del' && !b.classList.contains('armed')){ b.classList.add('armed'); b.textContent = 'Zeker weten? Klik nogmaals'; return; }
    closeCtx();
    if(k === 'open') openDrawer(it.id);
    else if(k === 'naam') startEdit(it.id);
    else if(k === 'per'){ const [a, c] = run.split('-').map(Number); S.pickRun = null; commitDays(it, idxOfItem(it).filter(i => i < a || i > c)); toast(`Periode ${fD(R.days[a])}${a !== c ? ' – ' + fD(R.days[c]) : ''} verwijderd.`, {label:'Ongedaan maken', fn:() => undo()}); }
    else if(k === 'pot') saveItem(it.id, {potlood:!potAny(it), potDagen:null});
    else if(k === 'potrun'){ const [a, c] = run.split('-').map(Number); const rd = R.days.slice(a, c + 1).filter(d => d >= TODAYISO);
      let pd = Array.isArray(it.potDagen) ? [...it.potDagen] : (isPotlood(it) ? (it.dagen || []).filter(d => d >= TODAYISO) : []);
      if(potRun(it, a, c)) pd = pd.filter(d => !rd.includes(d)); else pd = [...new Set([...pd, ...rd])];
      saveItem(it.id, {potDagen:pd.sort(), potlood:pd.length > 0}); }
    else if(k === 'arch'){ const naar = !it.klaar; saveItem(it.id, {klaar:naar}); toast(naar ? `${it.naam || 'Project'} gearchiveerd.` : `${it.naam || 'Project'} staat weer op de planning.`, {label:'Ongedaan maken', fn:() => undo()}); }
    else if(k === 'del') deleteItem(it.id);
  };
  m.onkeydown = ev => { const bs = [...m.querySelectorAll('button')]; const i = bs.indexOf(document.activeElement);
    if(ev.key === 'ArrowDown'){ ev.preventDefault(); bs[(i + 1) % bs.length].focus(); } else if(ev.key === 'ArrowUp'){ ev.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); } else if(ev.key === 'Escape'){ ev.stopPropagation(); closeCtx(); } };
});
document.addEventListener('pointerdown', e => { if(!e.target.closest('#ctxMenu')) closeCtx(); }, true);
window.addEventListener('scroll', closeCtx, true);
})();
