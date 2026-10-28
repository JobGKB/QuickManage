// Test planning met de muis (Tijdschema › Planning), project Heymansstraat:
// rechtsklik-koppeling, balk slepen, rand slepen, koppeling trekken en Ctrl+Z. Eis: koppelingen blijven gelden, opvolgers schuiven mee, ongedaan maken geeft exact het begin terug.
// Gebruik: python3 ../build.py --test && node slepen-planning.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
const hier = path.dirname(fileURLToPath(import.meta.url));
const pagina = pathToFileURL(path.join(hier, '..', 'dist', 'test.html')).href;
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const p = await b.newPage({viewport: {width: 1700, height: 1000}}); const fouten = []; p.on('pageerror', e => fouten.push(e.message));
await p.goto(pagina); await p.waitForSelector('[data-open]', {timeout: 15000});
await p.click('[data-open="heymansstraat"]'); await p.waitForTimeout(1200); await p.click('[data-tab="tijd"]'); await p.waitForTimeout(900);
const rij = () => p.evaluate(() => Object.fromEntries(__sr().rows.map(r => [r.key, [r.start, r.eind]])));
const werkdagNa = d => p.evaluate(d => { const c = __pc().cal; return c.ds(c.idx(Date.parse(d) + 864e5)); }, d);
// balk zichtbaar maken rechts van de vaste tabel (anders ligt hij eronder)
const toon = sel => p.evaluate(sel => { const r = document.querySelector(sel), g = document.querySelector('.plg'); g.scrollLeft = Math.max(0, Number(r.getAttribute('x')) - 150); r.closest('.gbar').querySelector('.ghit').scrollIntoView({block:'center', inline:'nearest'}); g.scrollLeft = Math.max(0, Number(r.getAttribute('x')) - 150); }, sel);
const bar = async ref => { const sel = `.plgb .gbar[data-ref="${ref}"] .ghit`; await toon(sel); return (await p.$(sel)).boundingBox(); };
const sleep = async (sel, dx) => { await p.evaluate(() => document.activeElement?.blur()); await p.keyboard.press('Escape'); await p.waitForTimeout(300); await toon(sel); const e = await p.$(sel); const bb = await e.boundingBox(); const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2;
  await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x + Math.sign(dx) * 8, y, {steps: 2}); await p.mouse.move(x + dx, y, {steps: 5}); await p.mouse.up(); await p.waitForTimeout(700); };
let ok = true; const eis = (v, t) => { console.log((v ? 'goed  ' : 'FOUT  ') + t); ok = ok && v; };
const begin = await rij(), px = 7;
let bb = await bar('W:3.1'); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2, {button: 'right'}); await p.waitForTimeout(300);
await p.click('#plCtx button:has-text("Start na einde van")'); await p.waitForTimeout(300); await p.selectOption('#lkR', 'W:1.7'); await p.click('.mdl button:has-text("Toepassen")'); await p.waitForTimeout(700);
let r = await rij(); eis(r['3.1'][0] === await werkdagNa(r['1.7'][1]), '3.1 start na einde van 1.7 (rechtsklik)');
await sleep('.plgb .gbar[data-ref="W:1.3"] .ghit', 5 * px); const r2 = await rij();
eis(r2['1.3'][0] > r['1.3'][0] && r2['1.7'][0] > r['1.7'][0] && r2['3.1'][0] === await werkdagNa(r2['1.7'][1]), '1.3 later geschoven: 1.7 en 3.1 schuiven mee');
await sleep('.plgb .gbar[data-ref="W:1.4"] .gh-r', 3 * px); const r3 = await rij();
eis(r3['1.4'][1] > r2['1.4'][1] && r3['1.5'][0] === await werkdagNa(r3['1.4'][1]), '1.4 langer: 1.5 start direct na het nieuwe einde');
bb = await bar('W:2.7'); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(150); const dot = await (await p.$('.plgb .gbar[data-ref="W:2.7"] .gdot')).boundingBox(); bb = await (await p.$('.plgb .gbar[data-ref="W:4.1"] .ghit')).boundingBox();
await p.mouse.move(dot.x + 4, dot.y + 4); await p.mouse.down(); await p.mouse.move(bb.x + 10, bb.y + bb.height / 2, {steps: 8}); await p.mouse.up(); await p.waitForTimeout(400);
await p.click('#plCtx button:has-text("In plaats van")'); await p.waitForTimeout(700); const r4 = await rij();
eis(r4['4.1'][0] === await werkdagNa(r4['2.7'][1]), 'koppeling getrokken: 4.1 start na einde van 2.7');
for (let i = 0; i < 4; i++) { await p.mouse.click(5, 5); await p.keyboard.press('Control+z'); await p.waitForTimeout(400); }
eis(JSON.stringify(await rij()) === JSON.stringify(begin), '4× Ctrl+Z geeft exact de beginplanning');
await b.close(); if (fouten.length) { ok = false; console.log('paginafouten:', fouten); }
console.log(ok ? 'GESLAAGD' : 'MISLUKT'); process.exit(ok ? 0 : 1);
