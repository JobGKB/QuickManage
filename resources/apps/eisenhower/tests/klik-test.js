// Klik-test van de pagina met de nepdatabase. Vereist Node en Playwright (npm i playwright).
// Gebruik: python build.py --test  en daarna  node tests/klik-test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1500, height:1000}});
  const fouten = []; p.on('pageerror', e => fouten.push(e.message));
  let ok = 0, nok = 0; const check = (naam, voorwaarde) => { console.log((voorwaarde ? 'OK   ' : 'FOUT ') + naam); voorwaarde ? ok++ : nok++; };
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'test.html')); await p.waitForTimeout(800);
  check('Overzicht opent met beschikbaarheid ploegen', await p.locator('.bezt').count() === 1);
  await p.click('#nav [data-tab="planning"]'); await p.waitForTimeout(300);
  const rij = naam => p.locator('.grow[data-row]', {has: p.locator('.glab', {hasText: naam})});
  const t1 = await rij('TEST001').locator('.bar').evaluateAll(bs => bs.map(x => x.title));
  check('Rekenlogica: vrije dag telt niet mee, één doorlopende balk (5 werkdagen)', t1.length === 1 && / \(5 d\)/.test(t1[0]));
  check('Twee losse periodes blijven twee balken', await rij('TEST002').locator('.bar').count() === 2);
  check('Nog in te plannen staat bovenaan', (await p.locator('.ghdr').first().innerText()).includes('Nog in te plannen'));
  const ico = rij('TEST001').locator('[data-vbico]'); await ico.click(); await p.waitForTimeout(150);
  check('Voorbereidingsteken: bezig -> gereed', (await rij('TEST001').locator('[data-vbico]').getAttribute('class')).includes('vbi-gereed'));
  await rij('TEST002').locator('.bar').nth(1).click(); await p.waitForTimeout(700); await p.keyboard.press('Delete'); await p.waitForTimeout(200);
  check('Delete wist alleen de geselecteerde periode', await rij('TEST002').locator('.bar').count() === 1);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  check('Ctrl+Z zet de periode terug', await rij('TEST002').locator('.bar').count() === 2);
  await p.click('[data-sub="week"]'); await p.waitForTimeout(200);
  check('Weekoverzicht toont balkenschema', await p.locator('.wbt').count() === 1);
  await p.click('#nav [data-tab="vak"]'); await p.waitForTimeout(300);
  check('Vakanties: personen en vrije dagen zichtbaar', await p.locator('[data-afwedit]').count() === 2 && await p.locator('.afb').count() >= 2);
  check('Geen JavaScript-fouten', fouten.length === 0); if(fouten.length) console.log(fouten);
  console.log(`\n${ok} geslaagd, ${nok} mislukt`); await b.close(); process.exit(nok ? 1 : 0);
})();
