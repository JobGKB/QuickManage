/* ---------- datums ---------- */
const MND = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const MNDL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const WD = ['ma','di','wo','do','vr'];
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addD = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const monday = d => addD(d, -((d.getDay() + 6) % 7));
const isWE = d => d.getDay() === 0 || d.getDay() === 6;
function isoWeek(d){ const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); }
const TODAY = (() => { const t = new Date(); t.setHours(0,0,0,0); if(isWE(t)) return addD(monday(t), 7); return t; })();
const TODAYISO = iso(TODAY);
function fD(s, withYear){ const d = typeof s === 'string' ? parse(s) : s; return d.getDate() + ' ' + MND[d.getMonth()] + (withYear || d.getFullYear() !== TODAY.getFullYear() ? ' ' + d.getFullYear() : ''); }
function fWD(s){ const d = parse(s); return WD[(d.getDay() + 6) % 7] + ' ' + fD(d); }
function workdaysBetween(a, b){ const out = []; let d = parse(a); const e = parse(b); while(d <= e){ if(!isWE(d)) out.push(iso(d)); d = addD(d, 1); } return out; }
function nextWorkdays(fromIso, n){ const out = []; let d = parse(fromIso); while(out.length < n){ if(!isWE(d) && !vrijOn(iso(d))) out.push(iso(d)); d = addD(d, 1); } return out; }
function stamp(s){ if(!s) return ''; const d = new Date(s); if(isNaN(d)) return ''; return d.getDate() + ' ' + MND[d.getMonth()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
