// Keep the design preview on the V0.3 engine with a separate save namespace.
// Do not edit design-engine.js directly; change app.js, then run this generator.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'jr-east/app.js'), 'utf8');
const replacements = [
  ['const KEY="kimagureJREastKantoV03";', 'const KEY="kimagureJRDesignReferenceV03";'],
  ['const LEGACY_KEYS=["kimagureJREastKantoV02","kimagureJREastKantoV01"];', 'const LEGACY_KEYS=[];']
];
let output = original;
for (const [from, to] of replacements) {
  if (output.split(from).length !== 2) throw new Error('V0.3 save declaration changed; review preview isolation.');
  output = output.replace(from, to);
}
output = '// Generated from app.js. Only save keys differ. Run scripts/generate-jr-design-engine.js.\n' + output;
const target = path.join(root, 'jr-east/design-engine.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    throw new Error('Preview engine is out of date. Run node scripts/generate-jr-design-engine.js');
  }
  console.log('Design engine matches V0.3; preview saves are isolated.');
} else {
  fs.writeFileSync(target, output);
}
