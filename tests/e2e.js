// Mocked end-to-end test of the artifact page (fake window.claude "sample" + "mcp" Google Drive): node tests/e2e.js
const { chromium } = require('playwright'); const assert = require('assert');
const fs = require('fs'), path = require('path'), os = require('os');
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
const png = (n) => { const f = path.join(D, n); fs.writeFileSync(f, Buffer.from([0x89, 0x50, 0x4e, 0x47])); return f; };
fs.writeFileSync(path.join(D, 'cours.txt'), 'Dérivées : (xⁿ)′ = n·xⁿ⁻¹');
const pages = [...Array(7)].map((_, i) => png(`page${i}.png`)), copie = png('copie.png');
const PAGE = 'file://' + path.join(__dirname, '..', 'index.html');

const mock = () => {
  window.__calls = []; window.__mcp = [];
  const reply = (prompt, o) => {
    const n = o?.images?.length || 0; window.__calls.push({ prompt, images: n });
    if (prompt.includes('Retranscris')) return 'Texte retranscrit ' + n;
    if (prompt.includes('Question de l')) return 'Réponse tirée du cours';
    if (prompt.includes('fiche de révision')) return '# Fiche\nÀ retenir : (xⁿ)′';
    if (prompt.includes('Découpe')) return { titre: 'Dérivées', blocs: [{ titre: 'Puissances', notions: 'xⁿ' }] };
    if (prompt.includes('Écris le bloc')) return { cours: 'Cours initial', exercices: [{ enonce: 'Dériver x³', solution: 'SOLUTION 3x²' }] };
    if (prompt.includes('ne pas les répéter')) return { exercices: [{ enonce: 'Nouvel exo inédit', solution: 's' }] };
    if (prompt.includes('Réécris')) return 'Cours SIMPLIFIÉ';
    return 'Note : 8/10, bonne copie';
  };
  const sample = async (p, o) => ({ text: reply(p, o), truncated: false });
  sample.json = async (p, o) => reply(p, o);
  sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 5 } });
  const mcp = { callTool: async (server, tool, input) => { window.__mcp.push({ server, tool, input });
    return tool === 'search_files' ? { payload: { files: [{ id: 'd1', title: 'Guide NotebookLM' }] } } : { payload: { fileContent: 'CONTENU DRIVE' } }; } };
  window.claude = { use: async (n) => n === 'sample' ? sample : n === 'mcp' ? mcp : null };
};

(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(mock);
  await p.goto(PAGE); await p.waitForSelector('button:has-text("Préparer mon cours")');      // empty app opens on "add"

  // subjects
  await p.click('#newSubject'); await p.fill('#subjectName', 'Maths'); await p.click('text=Créer la matière');
  await p.waitForSelector('h2:has-text("Ajouter un cours en Maths")');

  // Google Drive import (NotebookLM sources)
  await p.click('text=Importer depuis Google Drive'); await p.fill('#driveQ', "l'algèbre"); await p.click('text=Chercher');
  await p.check('text=Guide NotebookLM'); await p.click('text=Importer la sélection'); await p.waitForSelector('.chips >> text=Guide NotebookLM');
  const m = await p.evaluate(() => window.__mcp);
  assert.equal(m[0].server, 'Google Drive'); assert.ok(m[0].input.query.includes("l\\'algèbre"));
  assert.deepEqual(m[1].input, { fileId: 'd1' });

  // files + 7 photos -> 2 transcription batches, plan, lesson
  await p.setInputFiles('#files', [path.join(D, 'cours.txt'), ...pages]);
  await p.click('button:has-text("Préparer mon cours")'); await p.waitForSelector('text=Cours initial');
  let c = await p.evaluate(() => window.__calls);
  assert.deepEqual([c[0].images, c[1].images], [5, 2]);
  assert.ok(c[2].prompt.includes('(xⁿ)′') && c[2].prompt.includes('CONTENU DRIVE') && c[2].prompt.includes('Texte retranscrit 2') && c[2].prompt.includes('Maths'));
  assert.ok(c[3].prompt.includes('« Puissances »') && c[3].images === 0);

  // answer hidden until two deliberate taps
  assert.equal(await p.isVisible('text=SOLUTION 3x²'), false);
  await p.click('text=Afficher la réponse'); assert.equal(await p.isVisible('text=SOLUTION 3x²'), false);
  await p.click('text=Toucher encore pour voir'); await p.waitForSelector('text=SOLUTION 3x²');

  await p.click('text=explique plus simplement'); await p.waitForSelector('text=Cours SIMPLIFIÉ');
  await p.click("text=D'autres exercices"); await p.waitForSelector('text=Nouvel exo inédit');
  assert.ok((await p.evaluate(() => window.__calls.at(-1).prompt)).includes('Dériver x³'));
  await p.setInputFiles('.ex input[type=file] >> nth=0', copie); await p.waitForSelector('.corr');
  assert.equal(await p.evaluate(() => window.__calls.at(-1).images), 1);
  await p.click('text=Poser une question'); await p.fill('#q', 'Résume'); await p.click('text=Demander au prof'); await p.waitForSelector('text=Réponse tirée du cours');

  // revision sheet over the whole subject
  await p.click('aside >> text=Fiches de révision'); await p.click('text=Créer la fiche de révision');
  await p.waitForSelector('text=Maths : toute la matière');
  assert.ok((await p.evaluate(() => window.__calls.at(-1).prompt)).includes('Cours SIMPLIFIÉ'));

  // switch subject and back, then reload
  await p.selectOption('#matiere', { label: 'Mes cours (0)' }); await p.waitForSelector('text=Ajouter un cours en Mes cours');
  await p.selectOption('#matiere', { label: 'Maths (1)' }); await p.waitForSelector('text=Cours SIMPLIFIÉ');
  await p.reload(); await p.waitForSelector('text=Note : 8/10');
  assert.equal(await p.isVisible('.tabs'), false);

  // phone layout: bottom tabs, one view at a time
  await p.setViewportSize({ width: 390, height: 844 });
  assert.equal(await p.isVisible('.tabs'), true);
  await p.click('.tabs >> text=Cours'); assert.equal(await p.isVisible('aside'), true); assert.equal(await p.isVisible('main'), false);
  await p.click('aside >> text=Dérivées'); await p.waitForSelector('text=Cours SIMPLIFIÉ'); assert.equal(await p.isVisible('aside'), false);
  await p.click('.tabs >> text=Fiches'); await p.waitForSelector('text=Maths : toute la matière');
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

  // delete course needs two taps
  await p.click('.tabs >> text=Cours'); await p.click('aside >> text=Dérivées');
  await p.click('text=Supprimer ce cours'); await p.click('text=Toucher encore pour confirmer la suppression');
  await p.waitForSelector('aside >> text=Aucun cours');
  assert.deepEqual(errs, []);
  console.log('E2E OK: subjects, Drive import, 20-image batching, hidden answers, lessons, Q&A, revision sheets, phone layout');
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
