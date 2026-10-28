/* ---------- bestekhoofdstukken koppelen aan werkzaamheden: namen gelijktrekken en voorzet voor de posten ---------- */
const sentence = t => { t = String(t || '').trim(); return /^[^a-z]*$/.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t; };
// hoofdstukken op tweecijferniveau (10, 13, 14, 21, 31, 41 …) met naam en aantal posten
function bgChapters(){ const bg = planOf().begroting; if(!bg) return []; const name = c => bg.hs.find(h => h.c === c)?.n, out = new Map();
  for(const p of bg.posts){ const c2 = p.c.slice(0, 2); if(!out.has(c2)){ const sub = bg.hs.filter(h => h.c.startsWith(c2)).sort((a, b) => a.c.length - b.c.length)[0]; out.set(c2, {c:c2, n:sentence(name(c2) || sub?.n || 'Hoofdstuk ' + c2), top:c2[0], topN:sentence(name(c2[0]) || ''), posts:[]}); } out.get(c2).posts.push(p); }
  return [...out.values()].sort((a, b) => a.c.localeCompare(b.c)); }
function hmapOf(){ return planOf().hmap || {}; }
function postKind(c){ const hm = hmapOf(); for(let l = c.length; l > 0; l--){ const v = hm[c.slice(0, l)]; if(v !== undefined) return v; } return ''; }
function guessChapterKind(ch){ const t = (ch.n + ' ' + ch.topN).toLowerCase(), W = WZ(), find = re => W.find(w => re.test(w.naam.toLowerCase()))?.code || '';
  if(/^(10|11)$/.test(ch.c) || /^[89]/.test(ch.c) || /verkeersmaatregel|tijdelijke voorziening|algemene|stelpost|winst|kosten|coördin|personeel|ter beschikking|onderzoek|administratie/.test(t)) return 'alg';
  if(/verwijder|opbre|sloop|frezen/.test(t) || ch.top === '1') return find(/opbr|sloop|verwijder/) || '';
  if(/grond/.test(t) || ch.top === '2') return find(/grond/) || '';
  if(/riol|leiding|bemaling|put/.test(t) || ch.top === '3') return find(/riol|leiding|pers/) || '';
  if(/fundering|voorbereidende/.test(t) && ch.top === '4') return find(/cunet|fundering/) || find(/verhard|asfalt|straat|bestrat/) || '';
  if(ch.top === '4' || /verharding|bestrating|asfalt|markering|kantopsluit/.test(t) || ch.top === '6') return find(/verhard|asfalt|straat|bestrat/) || '';
  return ''; }
// voorstel voor de naam van een werkzaamheid, zoals het in het bestek heet
function kindNameOptions(kind, map, chs){ const mine = chs.filter(ch => map[ch.c] === kind); if(!mine.length) return [];
  const opts = [], tops = [...new Set(mine.map(ch => ch.top))];
  const top = tops.sort((x, y) => mine.filter(ch => ch.top === y).length - mine.filter(ch => ch.top === x).length)[0], tn = mine.find(ch => ch.top === top)?.topN;
  if(tn && !/voorbereid/i.test(tn)){ const sib = chs.filter(ch => ch.top === top && map[ch.c] !== 'alg'); if(mine.filter(ch => ch.top === top).length / Math.max(1, sib.length) >= .5) opts.push(tn); }
  [...mine].sort((a, b) => b.posts.length - a.posts.length).forEach(ch => opts.push(ch.n));
  return [...new Set(opts)]; }
function plHmapDialog(R){
  const chs = bgChapters(); if(!chs.length) return toast('Lees eerst de begroting in.');
  const cur = hmapOf(), map = {}; for(const ch of chs) map[ch.c] = cur[ch.c] !== undefined ? cur[ch.c] : guessChapterKind(ch);
  const W = WZ(), kOpt = sel => `<option value="" ${!sel ? 'selected' : ''}>— (niet koppelen)</option><option value="alg" ${sel === 'alg' ? 'selected' : ''}>projectbreed, niet per werkgang</option>${W.map(w => `<option value="${w.code}" ${sel === w.code ? 'selected' : ''}>${esc(w.naam)}</option>`).join('')}`;
  const tops = [...new Set(chs.map(ch => ch.top))];
  const namesHtml = () => { const used = new Set(), rows = [...W].map(w => ({w, n:chs.filter(ch => map[ch.c] === w.code).reduce((a, ch) => a + ch.posts.length, 0)})).sort((a, b) => b.n - a.n).map(({w}) => { const opts = kindNameOptions(w.code, map, chs).filter(o => !used.has(o.toLowerCase())); const sug = opts[0] || ''; if(sug) used.add(sug.toLowerCase());
      return `<div class="row tplr"><span style="min-width:220px"><span class="sw" style="background:${w.kleur}"></span> ${esc(w.naam)}</span><span class="faint">→</span><input class="f" data-hn="${w.code}" list="hnl-${w.code}" value="${esc(sug && sug.toLowerCase() !== w.naam.toLowerCase() ? sug : w.naam)}" style="flex:1;min-width:200px"><datalist id="hnl-${w.code}">${opts.map(o => `<option value="${esc(o)}">`).join('')}</datalist></div>`; });
    return W.map(w => rows.find(r => r.includes(`data-hn="${w.code}"`))).join(''); };
  const html = `<p class="muted" style="margin:0">Geef per bestekhoofdstuk aan bij welke werkzaamheid het hoort. Leeghwater stelt daarmee de namen van de werkzaamheden gelijk aan het bestek en kan een voorzet doen: elke post gaat naar de werkgangen met die werkzaamheid, verdeeld naar de oppervlakte van de vakken. Hoofdstukken als verkeersmaatregelen en algemene kosten zijn projectbreed en hoeven niet aan een werkgang.</p>
    <div class="stack" style="gap:4px">${tops.map(t => { const g = chs.filter(ch => ch.top === t); return `<h3 class="sub" style="margin-top:6px">${esc(t)} ${esc(g[0].topN || '')}</h3>` + g.map(ch => `<div class="row tplr"><span style="flex:1;min-width:260px"><b>${esc(ch.c)}</b> ${esc(ch.n)} <span class="faint">(${ch.posts.length} posten)</span></span><select class="f" data-hm="${ch.c}" style="width:auto;max-width:300px">${kOpt(map[ch.c])}</select></div>`).join(''); }).join('')}</div>
    ${planOf().begroting.hs.some(h => h.c.length <= 2 && /^[1-9]/.test(h.c) && h.c.length === 1) ? '' : '<div class="banner info"><p>Deze begroting is ingelezen met een oudere versie; daardoor ontbreken de namen van de hoofdhoofdstukken (zoals GRONDWERK). Lees de begroting opnieuw in voor de beste namen; koppelingen en productie per dag blijven staan.</p></div>'}
    <h3 class="sub" style="margin-top:8px">Namen van de werkzaamheden</h3><p class="faint" style="margin:0">Voorstel uit het bestek; pas aan of kies een andere naam uit de lijst. De kleuren en werkgangen blijven hetzelfde.</p><div class="stack" style="gap:4px" id="hnBox">${namesHtml()}</div>
    <label class="ck"><input type="checkbox" id="hmVoorzet" checked> Daarna meteen een voorzet maken voor de posten die nog nergens hangen</label>`;
  const ov = modal('Bestek en werkzaamheden', html, {wide:true, ok:'Toepassen', onOk:ov2 => {
    const m = {}; ov2.querySelectorAll('[data-hm]').forEach(s => { if(s.value) m[s.dataset.hm] = s.value; });
    const names = {}; ov2.querySelectorAll('[data-hn]').forEach(i => { const v = i.value.trim(); if(v) names[i.dataset.hn] = v; });
    const doV = ov2.querySelector('#hmVoorzet').checked;
    stash(); P.werkzaamheden = clone(WZ()).map(w => names[w.code] ? {...w, naam:names[w.code]} : w);
    P.plan = P.plan ? clone(P.plan) : {}; P.plan.tasks = P.plan.tasks || []; P.plan.res = P.plan.res || []; P.plan.hmap = m; changed();
    const n = doV ? kpVoorzet(planCompute(), true) : 0; tijdRefresh();
    toast('Werkzaamheden hernoemd naar het bestek' + (doV ? `; voorzet: ${n} posten verdeeld over de werkgangen. Controleer ze en pas aan waar nodig (Ctrl+Z maakt alles ongedaan).` : '.')); }});
  // namen live bijwerken als je de koppeling wijzigt
  ov.querySelectorAll('[data-hm]').forEach(s => s.onchange = () => { map[s.dataset.hm] = s.value; ov.querySelector('#hnBox').innerHTML = namesHtml(); });
}
// voorzet: posten die nog nergens hangen naar de werkgangen met de bijbehorende werkzaamheid, naar oppervlakte
function kpVoorzet(R, noStash){ const bg = planOf().begroting; if(!bg) return 0; const where = kpWhere(R); let n = 0;
  const wgs = R.nodes.filter(x => x.type === 'wg'), area = (wn, k) => wn.vakken.filter(v => v.kind === k).reduce((a, v) => a + Math.abs(polyArea(v.points)), 0);
  const plan = {}; for(const p of bg.posts){ if(!kpHasQ(p) || isVolg(p.c)) continue; const k = postKind(p.c); if(!k || k === 'alg') continue; if((where[p.c] || []).some(o => o.f > 0)) continue;
    const ws = wgs.filter(wn => area(wn, k) > 0); if(!ws.length) continue; const tot = ws.reduce((a, wn) => a + area(wn, k), 0); let rest = 1;
    if(/^st/i.test(p.eh) && Number.isInteger(p.q)){ // stuks: hele aantallen (grootste rest)
      const raw = ws.map(wn => p.q * area(wn, k) / tot), cnt = raw.map(Math.floor); let left = p.q - cnt.reduce((a, b) => a + b, 0); raw.map((r, i) => [r - cnt[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if(left > 0){ cnt[i]++; left--; } });
      ws.forEach((wn, i) => { if(cnt[i] > 0) (plan[wn.key] = plan[wn.key] || []).push({c:p.c, f:Math.round(cnt[i] / p.q * 10000) / 10000}); }); n++; continue; }
    ws.forEach((wn, i) => { const f = i === ws.length - 1 ? Math.max(0, Math.round(rest * 1000) / 1000) : Math.round(area(wn, k) / tot * 1000) / 1000; rest -= f; (plan[wn.key] = plan[wn.key] || []).push({c:p.c, f}); }); n++; }
  if(!n) return 0;
  if(!noStash) stash(); P.schema = P.schema ? clone(P.schema) : {}; P.schema.werkgangen = P.schema.werkgangen || {};
  for(const [key, add] of Object.entries(plan)){ const w = P.schema.werkgangen[key] = {...(P.schema.werkgangen[key] || {})}; const keep = (w.posts || []).filter(p => !add.some(a => a.c === p.c)), ord = new Map(bg.posts.map((x, k) => [x.c, k])); w.posts = [...keep, ...add].sort((a, b) => (ord.get(a.c) ?? 1e9) - (ord.get(b.c) ?? 1e9)); }
  changed(); return n; }

