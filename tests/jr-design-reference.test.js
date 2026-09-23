const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const jr = path.join(root, 'jr-east');
const html = fs.readFileSync(path.join(jr, 'design-reference.html'), 'utf8');
const css = fs.readFileSync(path.join(jr, 'design-reference.css'), 'utf8');
const js = fs.readFileSync(path.join(jr, 'design-reference.js'), 'utf8');

assert.match(html, /id="heroStart"/);
assert.match(html, /id="game"/);
assert.match(html, /id="designRoll"/);
assert.ok(html.indexOf('network-data.js') < html.indexOf('design-reference.js'), 'reference design must load JR data first');
assert.equal((html.match(/<img\b/gi) || []).length, 0, 'reference design should remain self-contained');
assert.match(css, /\.reference-hero/);
assert.match(css, /\.phone-frame/);
assert.match(css, /\.game-layout/);
assert.match(css, /@media\(max-width:720px\)/);
assert.match(js, /JR_KANTO_DATA/);
assert.match(js, /fetch\('maps\/yokohama-kawasaki\.svg'/);
assert.doesNotThrow(() => new vm.Script(js), 'reference design JavaScript must parse');

console.log('JR reference design contract OK: isolated landing/game preview, responsive styles, live network data');
