/* ---------- toestand ---------- */
const COLORS = ['#439034','#3d6fa8','#9a5d0c','#8a4fa8','#1f7d79','#b1402c','#5d6b78','#7d6414'];
const QUADS = {
  nu:{key:'nu', u:true, b:true, naam:'Nu doen', uitleg:'Urgent en belangrijk: zelf oppakken en deze week inplannen.', cls:'q-nu', css:'var(--crit)'},
  plan:{key:'plan', u:false, b:true, naam:'Inplannen', uitleg:'Belangrijk, niet urgent: een vaste plek in de planning geven.', cls:'q-plan', css:'var(--info)'},
  del:{key:'del', u:true, b:false, naam:'Delegeren', uitleg:'Urgent, minder belangrijk: laat een werkvoorbereider het regelen.', cls:'q-del', css:'var(--warn)'},
  park:{key:'park', u:false, b:false, naam:'Parkeren', uitleg:'Niet urgent en niet belangrijk: later bekijken of laten vallen.', cls:'q-park', css:'var(--ink-3)'}
};
const S = { db:null, user:null, dl:null, meId:null, canWrite:true, ready:{p:false, i:false}, noDb:false,
  ploegen:[], items:[], vak:[], names:{},
  tab:'voortgang', coll:(() => { try{ return JSON.parse(localStorage.getItem('eis.coll') || '{}'); }catch{ return {}; } })(), projecten:[], checklist:null, vgWvb:(lsGet('eis.wvb') || ''), sigOpen:{}, zoom:(lsGet('eis.zoom') || 'week'), tool:'draw', sort:(lsGet('eis.sort') === 'project' ? 'project' : 'ploeg'), q:'', showKlaar:lsGet('eis.klaar') === '1',
  matrixScope:(lsGet('eis.scope') || 'backlog'), week:iso(monday(TODAY)), sel:null, undo:[], firstScroll:true };
let drag = null, renderPending = false;
const ZOOM = {dag:30, week:15, kwartaal:6};
const dw = () => ZOOM[S.zoom] || 15;

function toast(msg, action){ const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : ''); t.hidden = false;
  if(action) t.querySelector('button').onclick = () => { t.hidden = true; action.fn(); };
  clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, action ? 6000 : 3400); }
