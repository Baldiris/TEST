const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('jr-east/index.html');
const preview = read('jr-east/design-reference.html');
const classic = read('jr-east/classic.html');
const app = read('jr-east/app.js');
const adapter = read('jr-east/design-reference.js');
const css = read('jr-east/design-reference.css');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'production LP IDs must be unique');

for (const [, id] of app.matchAll(/\$\(["']([^"']+)["']\)/g)) {
  assert(ids.includes(id), 'Missing production V0.3 control: ' + id);
}

assert(html.includes('assets/hero-tokyo-tower.webp'), 'Tokyo Tower hero asset must preload');
assert(css.includes('assets/hero-tokyo-tower.webp'), 'Tokyo Tower hero must be visible');
assert(!html.includes('phone-frame'), 'hero must not contain a floating phone mockup');
assert(!css.includes('url("assets/kanto-riverside.webp") center 50%/cover'), 'old Skytree hero must be removed');
const homeHero = page => page.match(/<div class="reference-hero">[\s\S]*?<section class="benefit-strip"/)[0];
assert.equal(homeHero(html), homeHero(preview), 'production and isolated preview must share the new hero');
assert(css.includes('assets/setup-tokyo-tower.webp'), 'approved setup landscape must load');
assert(html.includes('class="setup-landscape"') && html.includes('class="setup-content"'), 'setup must keep the scenic and form areas side by side');
const setupSection = page => page.match(/<section id="setupView"[\s\S]*?<section id="gameView"/)[0];
assert.equal(setupSection(html), setupSection(preview), 'production and isolated preview must share the setup screen');
assert(html.includes('design-reference.css'), 'LP stylesheet must load');
assert(html.includes('design-reference.js'), 'presentation adapter must load');
assert(html.includes('classic.html'), 'classic V0.3 screen must remain reachable');
assert(!html.includes('design-engine.js'), 'production must never use isolated preview engine');
assert(html.indexOf('network-data.js') < html.indexOf('app.js'), 'network data must load before production engine');
assert(html.indexOf('app.js') < html.indexOf('design-reference.js'), 'production engine must load before LP adapter');
assert(app.includes('const KEY="kimagureJREastKantoV03";'), 'production save key must be unchanged');
assert(classic.includes('JR東日本 関東近郊ネットワーク V0.3'), 'classic screen must preserve prior production UI');
assert.doesNotThrow(() => new vm.Script(adapter));
for (const [, asset] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  assert(fs.existsSync(path.join(root, 'jr-east', asset)), 'Missing LP CSS asset: ' + asset);
}

console.log('JR production LP PASS: V0.3 engine/data/save contract preserved behind new LP shell.');
