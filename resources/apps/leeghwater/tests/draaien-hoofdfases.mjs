// Test hoofdfases draaien (Fasering › ◀/▶): elke hoofdfase één plek naar voren en weer terug.
// Eisen: geen werkgang zonder datum, geen overlap tussen werkgangen van dezelfde hoofdfase, en terugdraaien geeft exact de oude planning.
// Gebruik: python3 ../build.py --test && node draaien-hoofdfases.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
const hier = path.dirname(fileURLToPath(import.meta.url));
const pagina = pathToFileURL(path.join(hier, '..', 'dist', 'test.html')).href;
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const p = await b.newPage({viewport: {width: 1600, height: 950}}); const fouten = []; let ok = true;
p.on('pageerror', e => fouten.push(e.message));
await p.goto(pagina); await p.waitForSelector('[data-open]', {timeout: 15000});
const rijen = () => p.evaluate(() => __sr().rows.map(r => [r.key, r.start || '', r.eind || '', r.duur]));
for (const pid of ['heymansstraat', 'p-persleiding-en-verbreding-boezemweg-3gas']) {
  await p.click(`[data-open="${pid}"]`); await p.waitForTimeout(1200); await p.click('[data-tab="planning"]'); await p.waitForTimeout(800);
  const begin = JSON.stringify(await rijen()); const n = await p.$$eval('[data-ph]', x => x.length);
  for (let ph = 2; ph <= n; ph++) {
    await p.click(`[data-ph="${ph}"]`); await p.waitForTimeout(300); await p.click('[data-mv="-1"]'); await p.waitForTimeout(600);
    const R = await rijen(), zonder = R.filter(r => !r[1]).map(r => r[0]), ov = [];
    for (const a of R) for (const c of R) if (a[0] < c[0] && a[0].split('.')[0] === c[0].split('.')[0] && a[1] && c[1] && a[1] <= c[2] && c[1] <= a[2]) ov.push(a[0] + '~' + c[0]);
    await p.click(`[data-ph="${ph - 1}"]`); await p.waitForTimeout(300); await p.click('[data-mv="1"]'); await p.waitForTimeout(600);
    const terug = JSON.stringify(await rijen()) === begin;
    const goed = !zonder.length && !ov.length && terug; ok = ok && goed;
    console.log(pid, 'hoofdfase', ph, 'naar voren:', goed ? 'goed' : `zonder datum [${zonder}] overlap [${ov}] terug gelijk ${terug}`);
  }
  await p.click('[data-crumb="home"]'); await p.waitForTimeout(400);
}
await b.close(); if (fouten.length) { ok = false; console.log('paginafouten:', fouten); }
console.log(ok ? 'GESLAAGD' : 'MISLUKT'); process.exit(ok ? 0 : 1);
