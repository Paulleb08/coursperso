// Real test against Claude (costs a few cents): ANTHROPIC_API_KEY=sk-ant-... node tests/live.js
const { chromium } = require('playwright'); const path = require('path');
const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error('ANTHROPIC_API_KEY manquante'); process.exit(1); }
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('dialog', d => { errs.push(d.message()); d.dismiss(); });
  // Photo of a (wrong) student answer, rendered as an image.
  const shot = await b.newPage(); await shot.setContent('<p style="font:28px cursive;padding:20px">Exercice 1 : f(x)=x³ donc f\'(x)=3x</p>');
  const photo = path.join(require('os').tmpdir(), 'copie.png'); await shot.screenshot({ path: photo });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.fill('#key', key); await p.dispatchEvent('#key', 'change');
  await p.fill('#paste', 'Dérivées : la dérivée de x^n est n·x^(n-1). Exercice : dériver x^2.');
  const T = { timeout: 600000 };
  await p.click('#go'); await p.waitForSelector('details.bloc', T);
  console.log('Blocs :', await p.locator('details.bloc summary').allTextContents());
  const n = await p.locator('.ex').count();
  await p.locator('text=réexplique plus simplement').first().click(); await p.waitForSelector('#status', { state: 'hidden', ...T });
  await p.locator('text=Nouveaux exercices').first().click(); await p.waitForSelector('#status', { state: 'hidden', ...T });
  console.log('Exercices :', n, '->', await p.locator('.ex').count());
  await p.locator('.ex input[type=file]').first().setInputFiles(photo); await p.waitForSelector('.corr', T);
  console.log('Correction :\n', (await p.textContent('.corr')).slice(0, 600));
  await b.close();
  if (errs.length) { console.error('ERREURS', errs); process.exit(1); }
  console.log('LIVE OK');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
