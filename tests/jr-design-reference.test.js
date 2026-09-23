const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('jr-east/design-reference.html');
const engine = read('jr-east/design-engine.js');
const adapter = read('jr-east/design-reference.js');
const original = read('jr-east/app.js');
execFileSync(process.execPath, [path.join(root, 'scripts/generate-jr-design-engine.js'), '--check'], { stdio:'inherit' });
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique');
for (const [, id] of engine.matchAll(/\$\(["']([^"']+)["']\)/g)) {
  assert(ids.includes(id), 'Missing V0.3 control: ' + id);
}
for (const [, asset] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(https?:|mailto:)/.test(asset)) assert(fs.existsSync(path.join(root, 'jr-east', asset)), 'Missing asset: ' + asset);
}
for (const [, asset] of read('jr-east/design-reference.css').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  assert(fs.existsSync(path.join(root, 'jr-east', asset)), 'Missing CSS asset: ' + asset);
}
assert(html.indexOf('network-data.js') < html.indexOf('design-engine.js'));
assert(html.indexOf('design-engine.js') < html.indexOf('design-reference.js'));
assert.doesNotThrow(() => new vm.Script(adapter));
assert.doesNotThrow(() => new vm.Script(engine));
// Execute storage functions and prove that production saves are never touched.
const memory = new Map([['kimagureJREastKantoV03', 'production-sentinel']]);
const storage = {
  getItem(key) { assert(!/^kimagureJREastKantoV0[123]$/.test(key), 'Production save read'); return memory.get(key) || null; },
  setItem(key, value) { assert.equal(key, 'kimagureJRDesignReferenceV03'); memory.set(key, value); },
  removeItem(key) { assert.equal(key, 'kimagureJRDesignReferenceV03'); memory.delete(key); }
};
const storageSource = engine.slice(engine.indexOf('const VERSION='), engine.indexOf('function show('));
vm.runInNewContext(storageSource + `
function updateResume() {}
assert.equal(load(), null);
state = {...fresh(), phase:'quests', start:'横浜', current:'川崎', goal:'東京', quests:{'川崎':[{text:'駅名標',done:true}]}};
save();
const restored = load();
assert.equal(restored.current,'川崎');
assert.equal(restored.quests['川崎'][0].done,true);
assert.equal(LEGACY_KEYS.length,0);
`, { localStorage:storage, assert });
assert.equal(memory.get('kimagureJREastKantoV03'), 'production-sentinel');
assert(original.includes('const KEY="kimagureJREastKantoV03";'));
// Rule identity is checked byte-for-byte by the generator.
console.log('JR design PASS: full V0.3 control contract, assets, script order and isolated save round-trip.');
