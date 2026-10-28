// Nepdatabase voor tests (dist/test.html). Verzonnen voorbeeldgegevens, relatief aan vandaag.
(function(){
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const ma = (() => { const d = new Date(); d.setHours(0,0,0,0); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w + (w > 4 ? 7 : 0)); return d; })();
  const dag = (week, wd) => { const d = new Date(ma); d.setDate(d.getDate() + week * 7 + wd); return iso(d); };
  const reeks = (week, wd, n) => { const out = []; let w = week, k = wd; while(out.length < n){ out.push(dag(w, k)); k++; if(k > 4){ k = 0; w++; } } return out; };
  const VRIJ = dag(1, 4); // vrijdag volgende week = vrije dag
  window.__TEST = {VRIJ, ma: iso(ma)};
  const DOCS = {
    'ploegen/p1': {naam:'Ploeg A', leden:'Anton, Bart', type:'eigen', kleur:'#1f7d79', volgorde:0},
    'ploegen/p2': {naam:'Ploeg B', leden:'Cor', type:'eigen', kleur:'#3d6fa8', volgorde:1},
    'ploegen/p3': {naam:'Onderaanneming', leden:'', type:'derden', kleur:'#5d6b78', volgorde:2},
    'items/i1': {naam:'TEST001 Over de vrije dag', ploeg:'p1', dagen:reeks(1, 0, 5).concat([dag(2, 0)])},  // ma-vr volgende week + maandag erna; vr is vrij
    'items/i2': {naam:'TEST002 Twee periodes', ploeg:'p2', dagen:reeks(0, 0, 3).concat(reeks(2, 0, 2))},
    'items/i3': {naam:'TEST003 Nog in te plannen', ploeg:null, dagen:[]},
    'vb/i1': {vb:'bezig'},
    'afwezig/a1': {naam:'Anton Voorbeeld', groep:'buiten', volgorde:1, dagen:{[dag(0, 2)]:'x', [dag(0, 3)]:'.'}},
    'afwezig/a2': {naam:'Kees Kantoor', groep:'kantoor', volgorde:2, dagen:{}},
    'meta/instellingen': {vakanties:[{id:'v1', label:'Testvrij', start:VRIJ, end:VRIJ, soort:'vakantie', vrij:true}]}
  };
  const snap = col => ({docs:Object.entries(DOCS).filter(([p]) => p.startsWith(col + '/') && p.split('/').length === 2).map(([p, d]) => ({id:p.split('/')[1], data:() => d}))});
  window.__SAVED = [];
  window.claude = {use: async n => {
    if(n === 'db') return {collection: c => ({onSnapshot: f => { setTimeout(() => f(snap(c)), 10); return () => {}; }}),
      doc: p => ({onSnapshot: f => { setTimeout(() => f({data: () => DOCS[p]}), 10); return () => {}; },
        update: async x => { window.__SAVED.push([p, x]); }, set: async x => { window.__SAVED.push([p, x]); }, delete: async () => {}})};
    if(n === 'user') return {me: async () => ({id:'u1', name:'Test', avatarUrl:''}), can: async () => true, canEdit: async () => true, profiles: async () => ({})};
    if(n === 'downloads') return {save: async () => ({})};
    return null; }};
})();
