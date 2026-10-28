(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function lsGet(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch{} }
const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
