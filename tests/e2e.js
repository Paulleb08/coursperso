// Mocked end-to-end test (no API key needed): node tests/e2e.js
const fs = require('fs'), path = require('path'), os = require('os'); const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
fs.writeFileSync(path.join(D,'c.pdf'), '%PDF-1.4 fake'); fs.writeFileSync(path.join(D,'copie.png'), Buffer.from([0x89,0x50,0x4e,0x47]));
const { chromium } = require('playwright'); const assert = require('assert');
const sse = (text) => [
 ['message_start',{type:'message_start',message:{id:'m',type:'message',role:'assistant',model:'claude-opus-5-5',content:[],stop_reason:null,usage:{input_tokens:1,output_tokens:0}}}],
 ['content_block_start',{type:'content_block_start',index:0,content_block:{type:'text',text:''}}],
 ['content_block_delta',{type:'content_block_delta',index:0,delta:{type:'text_delta',text}}],
 ['content_block_stop',{type:'content_block_stop',index:0}],
 ['message_delta',{type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:5}}],
 ['message_stop',{type:'message_stop'}]].map(([e,d])=>`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const reqs = []; const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('alert: '+d.message()); d.dismiss(); });
  await p.route('https://api.anthropic.com/**', async r => {
    const body = JSON.parse(r.request().postData()); reqs.push({ body, headers: r.request().headers() });
    const last = body.messages[0].content.at(-1).text;
    let out;
    if (last.startsWith('Restructure')) out = JSON.stringify({titre:'Dérivées', blocs:[{titre:'Définition', cours:'Cours initial', exercices:[{enonce:'Dériver $x^3$', solution:'$3x^2$'}]}]});
    else if (last.startsWith('Réécris')) out = 'Cours SIMPLIFIÉ';
    else out = 'Note : 8/10 — bonne copie';
    await r.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse(out) });
  });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.fill('#key', 'sk-ant-test'); await p.dispatchEvent('#key', 'change');
  await p.setInputFiles('#files', path.join(D,'c.pdf')); await p.fill('#paste', 'Notes NotebookLM');
  await p.click('#go'); await p.waitForSelector('details.bloc');
  await p.click('text=réexplique plus simplement'); await p.waitForSelector('text=Cours SIMPLIFIÉ');
  await p.setInputFiles('.ex input[type=file]', path.join(D,'copie.png')); await p.waitForSelector('.corr');
  const [r1, r2, r3] = reqs.map(x => x.body);
  assert.equal(reqs.length, 3); assert.equal(r1.model, 'claude-opus-5-5');
  assert.equal(r1.messages[0].content[0].type, 'document'); assert.equal(r1.output_config.format.type, 'json_schema');
  assert.ok(r1.messages[0].content.some(c => c.text?.includes('NotebookLM')));
  assert.ok(!r2.output_config.format); assert.equal(r3.messages[0].content[0].type, 'image');
  assert.ok(r3.messages[0].content[1].text.includes('$3x^2$'));
  assert.ok(reqs[0].headers['anthropic-beta'].includes('server-side-fallback'));
  assert.ok((await p.textContent('.corr')).includes('8/10'));
  assert.deepEqual(errs, []);
  console.log('E2E OK: restructure, simplify, photo correction; requests valid');
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
