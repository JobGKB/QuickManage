/* ---------- bestekposten aan werkgangen hangen (slepen en neerzetten) ---------- */
let kpExp = new Set(), kpSel = new Set(), kpQ = '', kpVrij = lsGet('lw-kpVrij') === '1', kpOpen = null;
const kpHasQ = p => p.q > 0 && !/^EUR$/i.test(p.eh);
const isVolg = c => /^\d{6}/.test(c) && c.split('-')[0].slice(-1) !== '0'; // volgpost (bijv. 130211 hoort bij 130210)
function kpWhere(R){ const w = {}; for(const n of R.nodes) if(n.type === 'wg') for(const p of n.it?.posts || []) (w[p.c] = w[p.c] || []).push({n, f:p.f ?? 1}); return w; }
function plKoppelPanel(R, ro){
  const bg = planOf().begroting;
  if(!bg?.posts?.length) return `<section class="panel" data-fold="kp"><h2>Bestekposten koppelen</h2><p class="muted" style="margin:0">Lees eerst de begroting in; daarna sleep je hier de bestekposten naar de werkgangen.</p>${ro ? '' : '<div class="row"><button class="btn sm" type="button" id="kpBegr">Begroting inlezen…</button></div>'}</section>`;
  const cov = postCoverage(R), where = kpWhere(R), q = kpQ.trim().toLowerCase();
  const hit = p => !q || (p.c + ' ' + p.o).toLowerCase().includes(q);
  const show = p => !isVolg(p.c) && hit(p) && (!kpVrij || (cov[p.c] || 0) < .995);
  const hsList = bg.hs.map(h => ({...h, posts:bg.posts.filter(p => p.h === h.c && show(p))})).filter(h => h.posts.length);
  const nVrij = bg.posts.filter(p => !isVolg(p.c) && (cov[p.c] || 0) < .995).length;
  const postRow = p => { const c = cov[p.c] || 0, vrij = Math.max(0, 1 - c), over = c > 1.005, wh = where[p.c] || [];
    return `<div class="kpp${kpSel.has(p.c) ? ' sel' : ''}${c >= .995 && !over ? ' vol' : ''}${over ? ' over' : ''}" draggable="${ro ? 'false' : 'true'}" data-kp="${esc(p.c)}" title="${esc(p.c + ' ' + p.o)}">
      <span class="kc">${esc(p.c)}</span><span class="ko">${esc(p.o)}</span>
      <span class="kq">${kpHasQ(p) ? (vrij > .005 ? `<b>${fmtQ(p.q * vrij)}</b> / ${fmtQ(p.q)} ${esc(p.eh)}` : `${fmtQ(p.q)} ${esc(p.eh)}`) : '<span class="faint">post</span>'}</span>
      ${postKind(p.c) === 'alg' ? '<span class="kw">projectbreed (niet per werkgang)</span>' : `<span class="kbar"><i style="width:${Math.min(100, c * 100)}%"></i></span>`}
      ${wh.length ? `<span class="kw">${wh.map(o => esc(o.n.key)).join(' · ')}${over ? ' <b class="krit">' + Math.round(c * 100) + '%</b>' : ''}</span>` : ''}</div>`; };
  const left = `<div class="kpl"><div class="row" style="gap:6px"><input class="f" id="kpQ" placeholder="Zoek post of omschrijving" value="${esc(kpQ)}" style="flex:1;min-width:140px"><label class="ck" style="font-size:13px"><input type="checkbox" id="kpVrij" ${kpVrij ? 'checked' : ''}> alleen nog te verdelen (${nVrij})</label></div>
    <div class="faint" style="font-size:12.5px">${ro ? '' : 'Sleep een post (of een hoofdstukkop) naar een werkgang. Ctrl/Shift-klik selecteert meerdere posten.'}${kpSel.size ? ` <b>${kpSel.size} geselecteerd</b> · <button class="btn sm ghost" type="button" id="kpClr">wissen</button>` : ''}</div>
    <div class="kplist">${hsList.map(h => `<div class="kph" draggable="${ro ? 'false' : 'true'}" data-kph="${esc(h.c)}" title="Sleep het hele hoofdstuk">${esc(h.c)} ${esc(h.n)} <span class="faint">(${h.posts.length})</span></div>${h.posts.map(postRow).join('')}`).join('') || '<p class="faint">Geen posten gevonden.</p>'}</div></div>`;
  const wgs = R.nodes.filter(n => n.type === 'wg'), norm = planOf().norm;
  const bgOrd = new Map(bg.posts.map((x, k) => [x.c, k])), card = n => { const ps = (n.it?.posts || []).map((p, k) => ({...p, _i:k})).sort((a, b) => (bgOrd.get(a.c) ?? 1e9) - (bgOrd.get(b.c) ?? 1e9)), v = duurVoorstel(n);
    return `<div class="kpw" data-kw="${n.key}"><div class="kpwh"><b>${n.key}</b> <span>${esc(wgLabel(n))}</span><span class="faint">${n.start ? fmtD(n.start) + '–' + fmtD(n.eind) + ' · ' : ''}${n.duur} wd</span>${!ro && kpSel.size ? `<button class="btn sm" type="button" data-kpadd="${n.key}" title="Geselecteerde posten hier neerzetten">+ ${kpSel.size}</button>` : ''}</div>
      ${ps.length ? ps.map((p, i) => i >= 8 && !kpExp.has(n.key) ? '' : (() => { const post = bg.posts.find(x => x.c === p.c), f = p.f ?? 1; return `<div class="kpa"><span class="kc">${esc(p.c)}</span><span class="ko" title="${esc(post?.o || '')}">${esc(post?.o || 'onbekende post')}</span>${post && kpHasQ(post) ? `<input class="f n" type="number" min="0" step="any" data-kpq="${n.key}|${p._i}" value="${Math.round(post.q * f * 100) / 100}" ${ro ? 'disabled' : ''}><span class="faint">${esc(post.eh)}</span>` : '<span class="faint">post</span>'}${!ro && (kpWhere(R)[p.c] || []).length > 1 ? `<button class="btn sm ghost" type="button" data-kpspl="${esc(p.c)}" title="Verdeel deze post over de werkgangen naar oppervlakte van de vakken">⇄</button>` : ''}${ro ? '' : `<button class="btn sm ghost" type="button" data-kpdel="${n.key}|${p._i}" aria-label="Loskoppelen">✕</button>`}</div>`; })()).join('') + (ps.length > 8 ? `<button class="btn sm ghost" type="button" data-kpexp="${n.key}">${kpExp.has(n.key) ? 'minder tonen' : 'nog ' + (ps.length - 8) + ' posten tonen'}</button>` : '') : '<div class="kpe">Sleep posten hierheen</div>'}
      ${v && v.d === null ? '<div class="kpv faint">Geen productie per dag ingevuld (Bronnen › Begroting)</div>' : ''}${v && v.d !== null ? `<div class="kpv">Duur volgens normen: <b>${v.d} wd</b>${v.miss.length ? ` <span class="faint">(${v.miss.length} zonder productie per dag)</span>` : ''}${!ro && !v.miss.length && v.d !== n.duur ? ` <button class="btn sm" type="button" data-kpuse="${n.key}">Overnemen (nu ${n.duur})</button>` : ''}</div>` : ''}</div>`; };
  const right = `<div class="kpr">${P.phases.map(ph => { const ws = wgs.filter(n => n.phase === ph.id); if(!ws.length) return ''; const open = kpOpen === null || kpOpen.has(ph.id);
      return `<details class="kpf" data-kpf="${ph.id}" ${open ? 'open' : ''}><summary><b>${esc(ph.name)}</b> <span class="faint">${ws.length} werkgangen · ${ws.reduce((a, n) => a + (n.it?.posts?.length || 0), 0)} posten</span></summary><div class="kpgrid">${ws.map(card).join('')}</div></details>`; }).join('')}</div>`;
  return `<section class="panel" data-fold="kp"><div class="row" style="justify-content:space-between"><h2>Bestekposten koppelen</h2><span class="row">${ro ? '' : `<button class="btn sm" type="button" id="kpHmap" title="Bestekhoofdstukken koppelen aan de werkzaamheden en de namen gelijktrekken">Bestek ↔ werkzaamheden…</button><button class="btn sm${planOf().hmap ? ' primary' : ''}" type="button" id="kpVz" ${planOf().hmap ? '' : 'disabled title="Koppel eerst de hoofdstukken aan de werkzaamheden"'}>Voorzet maken</button>`}${nVrij ? `<span class="pill stale">${nVrij} posten nog niet (helemaal) verdeeld</span>` : '<span class="pill done">Alle posten verdeeld</span>'}</span></div>
    <p class="muted" style="margin:0">Hang de posten uit <b>${esc(bg.naam)}</b> aan de werkgangen. Een post die je naar een werkgang sleept komt erin met hoeveelheid 0; vul daarna de hoeveelheid in, of klik ⇄ om een post die bij meerdere werkgangen hangt te verdelen naar de oppervlakte van de vakken. Doorlooptijden veranderen niet, tenzij je zelf op Overnemen klikt.</p>
    <div class="kp">${left}${right}</div></section>`;
}
// verdeling naar oppervlakte van de vakken (van de soort die bij de post lijkt te horen)
function kpSplit(c, R){ const bg = planOf().begroting, post = bg.posts.find(p => p.c === c), hs = bg.hs.find(h => h.c === post?.h), kind = guessKind((post?.o || '') + ' ' + (hs?.n || ''));
  const ws = (kpWhere(R)[c] || []).map(o => o.n); const area = n => { const vs = n.vakken.filter(v => !kind || v.kind === kind); return (vs.length ? vs : n.vakken).reduce((a, v) => a + Math.abs(polyArea(v.points)), 0); };
  const tot = ws.reduce((a, n) => a + area(n), 0); if(!tot) return toast('Geen vakken om naar te verdelen.');
  let rest = 1; setSchema(s => { ws.forEach((n, i) => { const w = s.werkgangen[n.key] = {...(s.werkgangen[n.key] || {})}; w.posts = (w.posts || []).map(p => { if(p.c !== c) return p; const f = i === ws.length - 1 ? Math.max(0, Math.round(rest * 1000) / 1000) : Math.round(area(n) / tot * 1000) / 1000; rest -= f; return {...p, f}; }); }); });
  tijdRefresh(); toast('Post ' + c + ' verdeeld over ' + ws.map(n => n.key).join(', ') + ' naar oppervlakte' + (kind ? ' van ' + kName(kind).toLowerCase() : '') + '.'); }
function kpAssign(key, codes, R){ const bg = planOf().begroting; let added = 0;
  // posten komen zonder aantal binnen (0); de hoeveelheid vul je daarna zelf in
  setSchema(s => { const w = s.werkgangen[key] = {...(s.werkgangen[key] || {})}; w.posts = [...(w.posts || [])];
    for(const c of codes){ if(w.posts.some(p => p.c === c)) continue; const post = bg.posts.find(p => p.c === c); if(!post) continue; w.posts.push({c, f:kpHasQ(post) ? 0 : 1}); added++; }
    const ord = new Map(bg.posts.map((x, k) => [x.c, k])); w.posts.sort((a, b) => (ord.get(a.c) ?? 1e9) - (ord.get(b.c) ?? 1e9)); });
  kpSel.clear(); tijdRefresh(); toast(added ? `${added} post${added > 1 ? 'en' : ''} gekoppeld aan werkgang ${key}. Vul de hoeveelheden in.` : 'Deze posten hangen al aan werkgang ' + key + '.'); }
function plKoppelWire(R, ro){ const sec = $('#tabBody').querySelector('[data-fold="kp"]'); if(!sec) return;
  $('#kpBegr') && ($('#kpBegr').onclick = () => plBegrotingImport(R)); const bg = planOf().begroting; if(!bg) return;
  $('#kpHmap') && ($('#kpHmap').onclick = () => plHmapDialog(R));
  $('#kpVz') && ($('#kpVz').onclick = () => { const n = kpVoorzet(R); tijdRefresh(); toast(n ? `Voorzet: ${n} posten verdeeld over de werkgangen met de bijbehorende werkzaamheid. Controleer en pas aan (Ctrl+Z maakt het ongedaan).` : 'Geen posten om te verdelen: alles hangt al ergens of de hoofdstukken zijn niet gekoppeld.'); });
  const q = $('#kpQ'); if(q){ q.oninput = () => { kpQ = q.value; clearTimeout(q._t); q._t = setTimeout(() => { tijdRefresh(); const q2 = $('#kpQ'); if(q2){ q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); } }, 250); }; }
  $('#kpVrij') && ($('#kpVrij').onchange = e => { kpVrij = e.target.checked; lsSet('lw-kpVrij', kpVrij ? '1' : ''); tijdRefresh(); });
  $('#kpClr') && ($('#kpClr').onclick = () => { kpSel.clear(); tijdRefresh(); });
  sec.querySelectorAll('[data-kpf]').forEach(d => d.addEventListener('toggle', () => { if(kpOpen === null) kpOpen = new Set(P.phases.map(p => p.id)); d.open ? kpOpen.add(d.dataset.kpf) : kpOpen.delete(d.dataset.kpf); }));
  if(ro) return;
  // selecteren
  sec.querySelectorAll('[data-kp]').forEach(el => el.addEventListener('click', e => { const c = el.dataset.kp; if(e.ctrlKey || e.metaKey) kpSel.has(c) ? kpSel.delete(c) : kpSel.add(c);
    else if(e.shiftKey && kpSel.size){ const all = [...sec.querySelectorAll('[data-kp]')].map(x => x.dataset.kp), last = [...kpSel].at(-1), a = all.indexOf(last), b = all.indexOf(c); all.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => kpSel.add(x)); }
    else { if(kpSel.size === 1 && kpSel.has(c)) kpSel.clear(); else { kpSel.clear(); kpSel.add(c); } } tijdRefresh(); }));
  // slepen
  const setData = (e, codes) => { e.dataTransfer.setData('text/plain', 'lwposts:' + codes.join(',')); e.dataTransfer.effectAllowed = 'copy'; document.body.classList.add('kpdrag'); };
  sec.querySelectorAll('[data-kp]').forEach(el => el.addEventListener('dragstart', e => { const c = el.dataset.kp; setData(e, kpSel.has(c) ? [...kpSel] : [c]); }));
  sec.querySelectorAll('[data-kph]').forEach(el => el.addEventListener('dragstart', e => { const cov = postCoverage(R); setData(e, bg.posts.filter(p => p.h === el.dataset.kph && !isVolg(p.c) && (cov[p.c] || 0) < .995).map(p => p.c)); }));
  document.addEventListener('dragend', () => document.body.classList.remove('kpdrag'), {once:true});
  sec.querySelectorAll('[data-kw]').forEach(el => { el.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; el.classList.add('drop'); }); el.addEventListener('dragleave', () => el.classList.remove('drop'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drop'); document.body.classList.remove('kpdrag'); const d = e.dataTransfer.getData('text/plain'); if(!d.startsWith('lwposts:')) return; const codes = d.slice(8).split(',').filter(Boolean); if(!codes.length) return toast('Alle posten in dit hoofdstuk zijn al verdeeld.'); kpAssign(el.dataset.kw, codes, R); }); });
  sec.querySelectorAll('[data-kpadd]').forEach(b => b.onclick = () => kpAssign(b.dataset.kpadd, [...kpSel], R));
  // hoeveelheden, loskoppelen, verdelen, duur overnemen
  sec.querySelectorAll('[data-kpq]').forEach(f => f.onchange = () => { const [key, i] = f.dataset.kpq.split('|'); setWg(key, w => { w.posts = [...(w.posts || [])]; const p = w.posts[Number(i)], post = bg.posts.find(x => x.c === p.c); if(!post) return; w.posts[Number(i)] = {...p, f:Math.max(0, Math.round(Number(String(f.value).replace(',', '.')) / post.q * 1000) / 1000)}; }); });
  sec.querySelectorAll('[data-kpdel]').forEach(b => b.onclick = () => { const [key, i] = b.dataset.kpdel.split('|'); setWg(key, w => { w.posts = (w.posts || []).filter((x, j) => j !== Number(i)); }); });
  sec.querySelectorAll('[data-kpexp]').forEach(b => b.onclick = () => { const k = b.dataset.kpexp; kpExp.has(k) ? kpExp.delete(k) : kpExp.add(k); tijdRefresh(); });
  sec.querySelectorAll('[data-kpspl]').forEach(b => b.onclick = () => kpSplit(b.dataset.kpspl, R));
  sec.querySelectorAll('[data-kpuse]').forEach(b => b.onclick = () => { const n = R.nodes.find(x => x.key === b.dataset.kpuse); if(n) plSet(n, 'duur', duurVoorstel(n).d, R); });
}

