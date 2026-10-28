// Kliktest: open elk project, loop alle tabbladen en de subtabbladen van het Tijdschema langs, open het verkeersbordencatalogus.
// Slaagt als er geen JavaScript-fouten optreden. Gebruik: python3 ../build.py --test && node kliktest.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
const hier = path.dirname(fileURLToPath(import.meta.url));
const pagina = pathToFileURL(path.join(hier, '..', 'dist', 'test.html')).href;
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const p = await b.newPage({viewport: {width: 1600, height: 1000}}); const fouten = [];
p.on('pageerror', e => fouten.push(e.message));
await p.goto(pagina); await p.waitForSelector('[data-open]', {timeout: 15000});
const stappen = [];
for (const pid of ['heymansstraat', 'p-persleiding-en-verbreding-boezemweg-3gas']) {
  await p.click(`[data-open="${pid}"]`); await p.waitForTimeout(1200); stappen.push(pid);
  const tabs = await p.$$eval('[data-tab]', xs => [...new Set(xs.map(x => x.dataset.tab))]);
  for (const t of tabs) {
    await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(700); stappen.push(' tab ' + t);
    if (t === 'tijd') for (const s of await p.$$eval('.subtabs button', xs => xs.map((x, i) => i))) {
      await p.click(`.subtabs button >> nth=${s}`); await p.waitForTimeout(600); stappen.push('  subtab ' + s); }
  }
  await p.click('[data-tab="planning"]'); await p.waitForTimeout(700);
  await p.click('#nextStep').catch(() => {}); await p.waitForTimeout(400);
  const bord = await p.$('[data-tool="sign"]:not([disabled])'); if (!bord) stappen.push(' verkeersborden-knop niet actief (geen werkgang gekozen)'); else { await bord.click(); await p.waitForTimeout(300); stappen.push(' verkeersborden: ' + await p.$$eval('.sgb', x => x.length) + ' borden'); }
  await p.click('[data-crumb="home"]'); await p.waitForTimeout(400);
}
await b.close();
console.log(stappen.join('\n'));
if (fouten.length) console.log('paginafouten:', fouten);
console.log(fouten.length ? 'MISLUKT' : 'GESLAAGD'); process.exit(fouten.length ? 1 : 0);
