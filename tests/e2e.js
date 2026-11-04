// Mocked end-to-end test of the artifact page (fake window.claude "sample"): node tests/e2e.js
const { chromium } = require('playwright'); const assert = require('assert');
const fs = require('fs'), path = require('path'), os = require('os');
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
fs.writeFileSync(path.join(D, 'cours.txt'), 'Dérivées : (xⁿ)′ = n·xⁿ⁻¹');
fs.writeFileSync(path.join(D, 'copie.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
const pages = [...Array(7)].map((_, i) => { const f = path.join(D, `page${i}.png`); fs.writeFileSync(f, Buffer.from([0x89, 0x50, 0x4e, 0x47])); return f; });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.exposeFunction('__log', () => {});
  await p.addInitScript(() => {
    window.__calls = [];
    const reply = (prompt, o) => {
      window.__calls.push({ prompt, o: { ...o, images: o?.images?.length || 0 } }); o = { images: o?.images || [] };
      if (prompt.includes('Retranscris')) return 'Texte retranscrit ' + o.images.length;
      if (prompt.includes('Question de l')) return 'Réponse tirée du cours';
      if (prompt.includes('Découpe')) return { titre: 'Dérivées', blocs: [{ titre: 'Puissances', notions: 'xⁿ' }] };
      if (prompt.includes('Écris le bloc')) return { cours: 'Cours initial', exercices: [{ enonce: 'Dériver x³', solution: '3x²' }] };
      if (prompt.includes('ne pas les répéter')) return { exercices: [{ enonce: 'Nouvel exo inédit', solution: 's' }] };
      if (prompt.includes('Réécris')) return 'Cours SIMPLIFIÉ';
      return 'Note : 8/10, bonne copie';
    };
    const sample = async (prompt, o) => ({ text: reply(prompt, o), truncated: false });
    sample.json = async (prompt, o) => reply(prompt, o);
    sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 5 } });
    window.claude = { use: async (n) => n === 'sample' ? sample : null };
  });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForSelector('text=Exemple');                       // example course at rest
  await p.waitForTimeout(300);
  await p.click('text=Ou colle du texte'); await p.fill('#paste', 'Notes NotebookLM');
  await p.setInputFiles('#files', [path.join(D, 'cours.txt'), ...pages]);     // picking a file starts on its own await p.waitForSelector('summary:has-text("Puissances")');
  await p.click('text=explique plus simplement'); await p.waitForSelector('text=Cours SIMPLIFIÉ');
  await p.click("text=D'autres exercices"); await p.waitForSelector('text=Nouvel exo inédit');
  await p.setInputFiles('.ex input[type=file]', path.join(D, 'copie.png')); await p.waitForSelector('.corr');
  const calls = await p.evaluate(() => window.__calls);
  assert.equal(calls.length, 7);
  assert.deepEqual([calls[0].o.images, calls[1].o.images], [5, 2]);   // 7 photos read in batches of 5
  const c = calls.slice(2);
  assert.ok(c[0].prompt.includes('(xⁿ)′') && c[0].prompt.includes('NotebookLM') && c[0].prompt.includes('Texte retranscrit 2'));   // plan
  assert.ok(c[1].prompt.includes('Texte retranscrit 5') && c[1].prompt.includes('« Puissances »') && c[1].o.images === 0); // block from text
  assert.ok(c[3].prompt.includes('Dériver x³'));             // existing exercises sent so they aren't repeated
  assert.equal(c[4].o.images, 1); assert.ok(c[4].prompt.includes('3x²'));
  await p.fill('#q', 'Résume'); await p.click('text=Demander au prof'); await p.waitForSelector('text=Réponse tirée du cours');
  assert.ok((await p.evaluate(() => window.__calls.at(-1).prompt)).includes('Texte retranscrit'));
  assert.ok((await p.textContent('.corr')).includes('8/10'));
  assert.equal(await p.isHidden('#status'), true);
  await p.click('text=Ajouter un autre cours'); await p.waitForSelector('text=ton cours apparaîtra ici');
  await p.click('#lib >> text=Dérivées'); await p.waitForSelector('text=Note : 8/10');   // saved course reopens
  await p.reload(); await p.waitForSelector('text=Note : 8/10');                         // survives reload
  await p.click('text=Supprimer ce cours'); await p.click('text=Toucher encore'); await p.waitForSelector('text=ton cours apparaîtra ici');
  assert.equal(await p.isHidden('#lib'), true);
  assert.deepEqual(errs, []);
  console.log('E2E OK: restructure, simplify, new exercises, photo correction via window.claude sample');
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
