// Regressietest planning: data en doorlooptijden van alle werkgangen moeten gelijk blijven
// aan tests/verwacht-planning.json (afspraak Pieter: fase-1-doorlooptijden veranderen nooit door nieuwe functies).
// Gebruik: python3 ../build.py --test && node regressie-planning.mjs [--opnieuw]   (--opnieuw schrijft een nieuwe verwachting)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
const hier = path.dirname(fileURLToPath(import.meta.url));
const pagina = pathToFileURL(path.join(hier, '..', 'dist', 'test.html')).href;
const verwachtBestand = path.join(hier, 'verwacht-planning.json');
const PROJECTEN = ['heymansstraat', 'p-persleiding-en-verbreding-boezemweg-3gas'];
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const p = await b.newPage({viewport: {width: 1600, height: 950}}); const fouten = [];
p.on('pageerror', e => fouten.push(e.message));
await p.goto(pagina); await p.waitForSelector('[data-open]', {timeout: 15000});
const uit = {};
for (const pid of PROJECTEN) {
  await p.click(`[data-open="${pid}"]`); await p.waitForTimeout(1200);
  uit[pid] = await p.evaluate(() => __sr().rows.map(r => [r.key, r.start, r.eind, r.duur].join(' ')));
  await p.click('[data-crumb="home"]'); await p.waitForTimeout(400);
}
await b.close();
if (process.argv.includes('--opnieuw') || !existsSync(verwachtBestand)) { writeFileSync(verwachtBestand, JSON.stringify(uit, null, 1) + '\n'); console.log('verwachting geschreven'); }
const verwacht = JSON.parse(readFileSync(verwachtBestand, 'utf8')); let ok = fouten.length === 0;
for (const pid of PROJECTEN) {
  const a = verwacht[pid] || [], c = uit[pid]; const gelijk = JSON.stringify(a) === JSON.stringify(c);
  console.log(pid, c.length, 'werkgangen', gelijk ? 'IDENTIEK' : 'VERSCHIL'); if (!gelijk) { ok = false; a.forEach((x, i) => { if (x !== c[i]) console.log('   ', x, '=>', c[i]); }); }
}
if (fouten.length) console.log('paginafouten:', fouten);
console.log(ok ? 'GESLAAGD' : 'MISLUKT'); process.exit(ok ? 0 : 1);
