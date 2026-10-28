/* ---------- slepen op de tijdlijn ---------- */
function laneIdx(lane, e){ const r = lane.getBoundingClientRect(); return Math.max(0, Math.min(R.days.length - 1, Math.floor((e.clientX - r.left) / dw()))); }
function fillWerk(s, from, n, d){ let i = from; while(i < R.days.length && vrijOn(R.days[i])) i++; const f = i; let l = i; while(n > 0 && i < R.days.length){ if(!vrijOn(R.days[i])){ s.add(i); l = i; n--; } i++; } if(d) d.fill = [f, l]; }
const werkIn = (a, b) => { let n = 0; for(let i = a; i <= b; i++) if(!vrijOn(R.days[i])) n++; return n; };
function computeSet(d = drag){
  const s = new Set(d.base), lo = Math.min(d.start, d.cur), hi = Math.max(d.start, d.cur);
  if(d.type === 'mv'){ const dl = d.cur - d.start; for(let i = d.a; i <= d.b; i++) s.delete(i); fillWerk(s, Math.max(0, d.a + dl), Math.max(1, werkIn(d.a, d.b)), d); }
  else if(d.type === 'rs'){ const n = Math.min(d.cur, d.b); for(let i = d.a; i <= d.b; i++) s.delete(i); for(let i = n; i <= d.b; i++) if(!vrijOn(R.days[i]) || (i >= d.a && d.base.has(i))) s.add(i); }
  else if(d.type === 're'){ const n = Math.max(d.cur, d.a); for(let i = d.a; i <= d.b; i++) s.delete(i); fillWerk(s, d.a, Math.max(1, werkIn(d.a, n)), d); }
  else if(d.type === 'paint'){ fillWerk(s, lo, Math.max(1, werkIn(lo, hi)), d); }
  else if(d.type === 'erase'){ for(let i = lo; i <= hi; i++) s.delete(i); }
  return [...s].sort((a, b) => a - b);
}
function dropTargetAt(x, y){
  const el = document.elementFromPoint(x, y); if(!el) return null;
  const row = el.closest('.grow'); if(!row || !row.closest('#gbody')) return null;
  const lane = row.querySelector('[data-dropploeg]'); if(!lane) return null;
  return {lane, ploeg:lane.dataset.dropploeg || null};
}
function markTarget(e){
  const it = S.items.find(x => x.id === drag.id);
  document.querySelectorAll('#gbody .lane.drop').forEach(l => l.classList.remove('drop'));
  const t = dropTargetAt(e.clientX, e.clientY);
  drag.target = t && (t.ploeg || null) !== (it.ploeg || null) ? t : null;
  if(drag.target){ drag.target.lane.classList.add('drop'); drag.moved = true; }
}
function onLaneDown(e){
  if(e.button > 0) return;
  const lab = e.target.closest('.glab[data-open]');
  if(lab){ if(S.canWrite && S.sort === 'ploeg'){ drag = {type:'row', id:lab.dataset.open, x0:e.clientX, y0:e.clientY, moved:false, target:null}; try{ lab.setPointerCapture(e.pointerId); }catch{} } return; }
  const lane = e.target.closest('[data-lane]'); if(!lane) return;
  const id = lane.dataset.lane; const it = S.items.find(x => x.id === id); if(!it) return;
  const bar = e.target.closest('.bar');
  if(!S.canWrite){ if(bar) selectItem(id, bar.dataset.run); return; }
  if(e.pointerType === 'touch' && !bar) { drag = {type:'tap', id, lane, start:laneIdx(lane, e), cur:laneIdx(lane, e), base:new Set(idxOfItem(it)), x0:e.clientX, y0:e.clientY}; return; }
  const idx = laneIdx(lane, e);
  const base = new Set(idxOfItem(it));
  if(bar && S.tool !== 'erase'){
    const [a, b] = bar.dataset.run.split('-').map(Number); const r = bar.getBoundingClientRect();
    const edge = e.clientX - r.left < 7 ? 'rs' : r.right - e.clientX < 7 ? 're' : 'mv';
    drag = {type:edge, id, lane, a, b, start:idx, cur:idx, base, moved:false, target:null};
  } else drag = {type:S.tool === 'erase' ? 'erase' : 'paint', id, lane, start:idx, cur:idx, base, moved:false};
  e.preventDefault();
  try{ lane.setPointerCapture(e.pointerId); }catch{}
  document.body.classList.add('dragging');
}
function onLaneMove(e){
  if(!drag) return;
  if(drag.type === 'tap'){ if(Math.abs(e.clientX - drag.x0) > 8 || Math.abs(e.clientY - drag.y0) > 8) drag = null; return; }
  if(drag.type === 'row'){
    if(!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    if(!drag.moved){ drag.moved = true; document.body.classList.add('dragging'); document.querySelector(`[data-row="${CSS.escape(drag.id)}"]`)?.classList.add('lift'); }
    markTarget(e); return;
  }
  if(drag.type === 'mv' && S.sort === 'ploeg') markTarget(e);
  let i = laneIdx(drag.lane, e);
  if(S.zoom !== 'dag' && !e.altKey){ const wd = k => (parse(R.days[Math.max(0, Math.min(R.days.length - 1, k))]).getDay() + 6) % 7;
    if(drag.type === 'mv') i = drag.start + Math.round((i - drag.start) / 5) * 5;
    else if(drag.type === 'rs') i = i - wd(i);
    else if(drag.type === 're') i = i + (4 - wd(i));
    else if(drag.type === 'paint' || drag.type === 'erase'){ i = i >= drag.start ? i + (4 - wd(i)) : i - wd(i); if(!drag.snapped){ drag.snapped = true; drag.start = drag.start - wd(drag.start); } }
    i = Math.max(0, Math.min(R.days.length - 1, i)); }
  if(i === drag.cur) return; drag.cur = i; drag.moved = true; preview();
}
function preview(){ const it = S.items.find(x => x.id === drag.id); const p = ploegOf(it.ploeg); const occ = occupancy();
  drag.lane.innerHTML = barsHtml(it, computeSet(), p ? pColor(p) : '#5d6b78', p ? occ[p.id] : null, dragSplits(drag)); }
function onLaneUp(e){
  if(!drag) return; const d = drag; drag = null; document.body.classList.remove('dragging');
  document.querySelectorAll('#gbody .lane.drop').forEach(l => l.classList.remove('drop'));
  document.querySelectorAll('#gbody .lift').forEach(l => l.classList.remove('lift'));
  const it = S.items.find(x => x.id === d.id);
  if(d.type === 'row'){ if(d.moved){ S.skipClick = Date.now() + 400; if(d.target) moveToPloeg(it, d.target.ploeg, {}); } return; }
  if(d.type === 'tap'){ selectItem(d.id); return; }
  if(!d.moved && (d.type === 'paint' || d.type === 'erase')){ selectItem(d.id); return; }
  if(!d.moved && d.type === 'mv'){ const now = Date.now(); if(S.lastTap && S.lastTap.id === d.id && now - S.lastTap.t < 450){ S.lastTap = null; openDrawer(d.id); } else { S.lastTap = {id:d.id, t:now}; selectItem(d.id, `${d.a}-${d.b}`); } return; }
  const next = computeSet(d);
  const same = next.length === d.base.size && next.every(i => d.base.has(i));
  if(d.target){ moveToPloeg(it, d.target.ploeg, same ? {} : {dagen:toDagen(it, next), splits:toSplits(it, next, dragSplits(d))}); return; }
  if(same){ if(renderPending){ renderPending = false; } render(); return; }
  if(Array.isArray(it.potDagen) && it.potDagen.length && (d.type === 'mv' || d.type === 'rs' || d.type === 're')){
    const oud = R.days.slice(d.a, d.b + 1); const was = oud.some(x => it.potDagen.includes(x));
    if(was){ const sp = dragSplits(d); const nieuw = next.filter(i => i >= sp[0] && i < sp[1]).map(i => R.days[i]);
      const pd = [...new Set([...it.potDagen.filter(x => !oud.includes(x)), ...nieuw])].sort();
      saveItem(it.id, {dagen:toDagen(it, next), splits:toSplits(it, next, dragSplits(d)), potDagen:pd}); return; } }
  commitDays(it, next, dragSplits(d));
}
function moveToPloeg(it, ploeg, extra){
  const p = ploegOf(ploeg);
  saveItem(it.id, {ploeg:ploeg || null, ...extra});
  toast(`${it.naam} verplaatst naar ${p ? p.naam : 'Nog in te plannen'}.`, {label:'Ongedaan maken', fn:undo});
}
function toDagen(it, idxArr){
  const inRange = new Set(R.days); const outside = (it.dagen || []).filter(x => !inRange.has(x));
  return [...new Set([...outside, ...idxArr.sort((a, b) => a - b).map(i => R.days[i])])].sort();
}
function toSplits(it, idxArr, extra){
  const have = new Set(idxArr); const cand = new Set([...splitIdx(it), ...(extra || [])]);
  return [...cand].filter(i => have.has(i) && have.has(i - 1)).map(i => R.days[i]).sort();
}
function commitDays(it, idxArr, extra){ saveItem(it.id, {dagen:toDagen(it, idxArr), splits:toSplits(it, idxArr, extra)}); }
function onLaneCancel(){ if(drag){ drag = null; document.body.classList.remove('dragging'); render(); } }

/* backlog-chip naar ploeg slepen */
function planOnto(itemId, ploegId, dayIso){
  const it = S.items.find(x => x.id === itemId); if(!it) return;
  const p = ploegOf(ploegId);
  let dagen;
  if((it.dagen || []).length){ const s = [...it.dagen].sort(); const i0 = R.idx.get(s[0]), iT = R.idx.get(dayIso);
    dagen = (i0 != null && iT != null) ? s.map(d => R.days[(R.idx.get(d) ?? i0) - i0 + iT]).filter(Boolean) : nextWorkdays(dayIso, it.duur || 5); }
  else dagen = nextWorkdays(dayIso, Math.max(1, it.duur || 5));
  saveItem(itemId, {ploeg:ploegId || null, dagen:[...new Set(dagen)].sort()});
  toast(`${it.naam} ingepland${p ? ' bij ' + p.naam : ''} vanaf ${fWD(dagen[0])}.`, {label:'Ongedaan maken', fn:undo});
}
