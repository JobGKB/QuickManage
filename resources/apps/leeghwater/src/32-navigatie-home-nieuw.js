/* ================= navigatie ================= */
function go(v, pid, tab){
  if(S.view === 'project' && (v !== 'project' || pid !== S.pid)) leaveProject();
  S.view = v; if(pid) S.pid = pid; if(tab) S.tab = tab;
  render(); window.scrollTo(0, 0);
}
$('#brand').onclick = () => go('home'); $('#topHome').onclick = () => go('home');
function render(){
  $('#wrap').classList.toggle('full', S.view === 'project' && ['planning', 'tijd'].includes(S.tab));
  if(!S.ready){ $('#main').innerHTML = '<p class="muted">Leeghwater wordt geladen…</p>'; return; }
  if(S.view === 'home') return renderHome();
  if(S.view === 'new') return renderNew();
  return renderProject();
}

/* ================= home ================= */
function counts(pr){
  const c = {phases:pr.phases.length, steps:0, shapes:pr.shapes.length, pending:pr.shapes.filter(s => !s.step).length, routes:pr.routes.length, barriers:(pr.barriers||[]).length, perPhase:[]};
  for(const p of pr.phases){ const n = new Set(pr.shapes.filter(s => s.phase === p.id && s.step > 0).map(s => s.step)).size; c.steps += n; c.perPhase.push(n); }
  return c;
}
async function renderHome(){
  const ps = [...S.projects].sort((a,b) => String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  await names(ps.map(p => p.updatedBy));
  const tiles = ps.map(p => { const c = p.counts || {}; return `<button class="tile" data-open="${esc(p.id)}" type="button">
    <span class="pn">${esc(p.nummer || 'Project')}${p.status === 'afgerond' ? ' · afgerond' : ''}</span>
    <span class="tn">${esc(p.name)}</span>
    <span class="st"><span class="chip">${c.phases ?? '–'} hoofdfases</span><span class="chip">${c.steps ?? '–'} werkgangen</span><span class="chip">${c.shapes ?? '–'} werkvakken</span>${c.pending ? `<span class="chip warn">${c.pending} ongepland</span>` : ''}</span>
    <span class="when">${p.plaats ? esc(p.plaats) + ' · ' : ''}bijgewerkt ${stamp(p.updatedAt)}${nameOf(p.updatedBy) ? ' door ' + esc(nameOf(p.updatedBy)) : ''}</span></button>`; }).join('');
  $('#main').innerHTML = `
  <div class="hero"><h1>Projecten</h1><p>Plan per project de hoofdfases en werkgangen op de tekening: opbreken, riolering en straatwerk, met hekken en routes. Alles wordt gedeeld opgeslagen.</p></div>
  ${S.noDb ? `<div class="banner"><p><b>Gedeelde opslag is in deze weergave niet beschikbaar.</b> Je kunt een projectbackup (JSON) openen en exporteren; wijzigingen blijven alleen in deze browser.</p></div>` : ''}
  <div class="tiles">${tiles}
    ${S.canWrite && !S.noDb ? `<button class="tile new" type="button" id="newProj">+ Nieuw project<small>Tekening uploaden (PDF, JPG of PNG) en daarna de werkgrens intekenen.</small></button>` : ''}
  </div>
  ${!ps.length ? `<div class="empty"><b>Nog geen projecten.</b><span class="muted">Start een nieuw project of zet een backup terug.</span></div>` : ''}
  <div class="row"><button class="btn" type="button" id="homeImport">Backup openen (JSON)</button><span class="faint" style="font-size:13px">Een volledige Leeghwater-backup wordt een nieuw project.</span></div>`;
  $('#main').querySelectorAll('[data-open]').forEach(b => b.onclick = () => go('project', b.dataset.open, 'project'));
  $('#newProj') && ($('#newProj').onclick = () => go('new'));
  $('#homeImport').onclick = () => pickJson(importAsNewProject);
}

/* ================= nieuw project ================= */
let newDraft = null;
function renderNew(){
  newDraft = newDraft || {name:'', nummer:'', plaats:'', opdrachtgever:'', file:null};
  $('#main').innerHTML = `
  ${crumbs([['Nieuw project']])}
  <div class="tkop"><h1>Nieuw project</h1><p class="muted" style="margin:0">De tekening bepaalt het coördinatenstelsel. Bij een PDF worden de PDF-punten gebruikt, net als bij Heymansstraat.</p></div>
  <div class="panel">
    <div class="form">
      <label class="l">Projectnaam<input class="f" id="npName" value="${esc(newDraft.name)}" placeholder="Bijv. Dorpsstraat fase 2"></label>
      <label class="l">Projectnummer<input class="f" id="npNr" value="${esc(newDraft.nummer)}" placeholder="Bijv. ROSW2502"></label>
      <label class="l">Plaats<input class="f" id="npPl" value="${esc(newDraft.plaats)}"></label>
      <label class="l">Opdrachtgever<input class="f" id="npOg" value="${esc(newDraft.opdrachtgever)}"></label>
      <label class="l">Soort werk (werkzaamheden, later aan te passen)<select class="f" id="npWz">${Object.entries(WZ_PRESETS).map(([k, p]) => `<option value="${k}" ${k === (newDraft.wz || 'riool') ? 'selected' : ''}>${esc(p.naam)}: ${p.wz.map(w => w.naam).join(' → ')}</option>`).join('')}</select></label>
    </div>
    <div class="drop" id="npDrop"><button class="btn" type="button" id="npPick">Tekening kiezen</button><span id="npFile" class="muted">${newDraft.file ? esc(newDraft.file.name) : 'PDF, JPG of PNG. Sleep het bestand hierheen of kies het.'}</span></div>
    <label class="ck"><input type="checkbox" id="npAnn" ${newDraft.annots ? 'checked' : ''}> Opmerkingen en markeringen uit de PDF meenemen in de achtergrond</label>
    <div id="npProg" hidden><div class="progress"><i style="width:10%"></i></div><p class="muted" id="npProgT" style="margin:4px 0 0"></p></div>
    ${S.assets ? '' : `<div class="banner"><p>Tekeningen uploaden kan alleen met bewerkrechten op Leeghwater. Vraag Pieter om toegang “Kan bewerken”.</p></div>`}
    <div class="row"><button class="btn primary" type="button" id="npGo" ${S.assets ? '' : 'disabled'}>Project aanmaken</button><button class="btn ghost" type="button" id="npCancel">Annuleren</button></div>
  </div>`;
  const sync = () => Object.assign(newDraft, {name:$('#npName').value.trim(), nummer:$('#npNr').value.trim(), plaats:$('#npPl').value.trim(), opdrachtgever:$('#npOg').value.trim()});
  ['#npName','#npNr','#npPl','#npOg'].forEach(id => $(id).oninput = sync); $('#npWz').onchange = e => newDraft.wz = e.target.value; $('#npAnn').onchange = e => newDraft.annots = e.target.checked;
  const setFile = f => { if(!f) return; newDraft.file = f; $('#npFile').textContent = f.name + ' · ' + Math.round(f.size/1024) + ' kB'; };
  $('#npPick').onclick = () => { const i = $('#pickDrawing'); i.value = ''; i.onchange = () => setFile(i.files[0]); i.click(); };
  const d = $('#npDrop'); d.ondragover = e => { e.preventDefault(); d.classList.add('over'); }; d.ondragleave = () => d.classList.remove('over');
  d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); setFile(e.dataTransfer.files[0]); };
  $('#npCancel').onclick = () => { newDraft = null; go('home'); };
  $('#npGo').onclick = async () => {
    sync(); if(!newDraft.name) return toast('Geef het project een naam.'); if(!newDraft.file) return toast('Kies eerst een tekening.');
    const btn = $('#npGo'); btn.disabled = true; $('#npProg').hidden = false;
    const prog = (p, t) => { $('#npProg i').style.width = p + '%'; $('#npProgT').textContent = t; };
    try{
      const img = await drawingFromFile(newDraft.file, prog);
      prog(75, 'Tekening opslaan…');
      const up = await S.assets.upload(img.blob, {type:'image/jpeg'});
      prog(82, 'Originele PDF opslaan voor scherp inzoomen…'); const pdfUp = await uploadPdf(img);
      const pid = 'p-' + slug(newDraft.name).toLowerCase() + '-' + Math.random().toString(36).slice(2, 6);
      const plan = {format:'leeghwater-project-v1', w:img.w, h:img.h, werkzaamheden:clone(WZ_PRESETS[newDraft.wz || 'riool'].wz), phases:[{id:'1', name:'Hoofdfase 1', outline:null}], shapes:[], routes:[], boundaries:[], barriers:[]};
      const now = new Date().toISOString();
      prog(90, 'Project aanmaken…');
      await S.db.doc('plans/' + pid).set({json:JSON.stringify(plan), rev:uid(), updatedAt:now, updatedBy:S.meId});
      await S.db.doc('projects/' + pid).set({name:newDraft.name, nummer:newDraft.nummer, plaats:newDraft.plaats, opdrachtgever:newDraft.opdrachtgever, status:'actief',
        w:img.w, h:img.h, bg:up.id, bgNaam:newDraft.file.name, bgPx:[img.pw, img.ph], ...pdfUp, workExtent:[], createdAt:now, createdBy:S.meId, updatedAt:now, updatedBy:S.meId, counts:counts(plan)});
      newDraft = null; toast('Project aangemaakt. Haal nu de werkgrens uit de tekening of teken hem.'); go('project', pid, 'planning');
    }catch(e){ btn.disabled = false; $('#npProg').hidden = true; toast('Aanmaken mislukt: ' + (e.message || e.code || e)); }
  };
}
async function pdfLib(){ if(!window.pdfjsLib) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'); const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; return lib; }
function loadScript(src){ return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Kon PDF-lezer niet laden')); document.head.append(s); }); }
async function drawingFromFile(file, prog){
  const MAXW = 6400, MAXPX = 22e6;
  let canvas, w, h;
  if(/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)){
    prog(15, 'PDF-lezer laden…');
    const lib = await pdfLib();
    prog(30, 'PDF openen…');
    const doc = await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()), isEvalSupported:false}).promise;
    const page = await doc.getPage(1); const vp1 = page.getViewport({scale:1});
    w = Math.round(vp1.width); h = Math.round(vp1.height);
    const sc = Math.min(MAXW / vp1.width, Math.sqrt(MAXPX / (vp1.width * vp1.height)), 4);
    const vp = page.getViewport({scale:sc}); canvas = document.createElement('canvas'); canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    prog(45, 'Tekening renderen (dit kan even duren)…');
    await page.render({canvasContext:ctx, viewport:vp, annotationMode:newDraft?.annots ? lib.AnnotationMode.ENABLE : lib.AnnotationMode.DISABLE}).promise;
  } else {
    prog(30, 'Afbeelding lezen…');
    const bmp = await createImageBitmap(file); const sc = Math.min(1, MAXW / bmp.width, Math.sqrt(MAXPX / (bmp.width * bmp.height)));
    canvas = document.createElement('canvas'); canvas.width = Math.round(bmp.width * sc); canvas.height = Math.round(bmp.height * sc);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    w = canvas.width; h = canvas.height;
  }
  prog(65, 'Comprimeren…');
  let q = .9, blob;
  do { blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q)); q -= .12; } while(blob.size > 19e6 && q > .3);
  return {blob, w, h, pw:canvas.width, ph:canvas.height, pdf:/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name) ? file : null};
}
// Originele PDF bewaren: daarmee rendert de editor bij inzoomen het zichtbare stuk vector-scherp.
async function uploadPdf(img){ if(!img.pdf) return {}; try{ const up = await S.assets.upload(img.pdf, {type:'application/pdf'}); return {pdf:up.id, pdfAnnots:!!newDraft?.annots}; }catch(e){ toast('Originele PDF niet bewaard (' + (e.message || e.code || 'te groot?') + '); inzoomen blijft dan minder scherp.'); return {}; } }

