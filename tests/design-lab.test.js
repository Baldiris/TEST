const fs=require('fs'),vm=require('vm'),assert=require('assert');
const main=fs.readFileSync('app.js','utf8').split('const KEY')[0].trim();
assert.equal(fs.readFileSync('design-lab-core.js','utf8').trim(),main,'network core must remain identical');
const js=fs.readFileSync('design-lab.js','utf8'),html=fs.readFileSync('design-lab.html','utf8');
for(const match of js.matchAll(/\$\('([^']+)'\)/g)) assert(html.includes(`id="${match[1]}"`),match[1]);
vm.runInNewContext(main+js.split('function drawMap')[0]+`
for(const start of ALL_STATIONS){for(let roll=1;roll<=6;roll++){
 const options=optionsFor(start,roll);
 for(const [name,route] of options) assert(route.distance===roll||(name===goal&&route.distance<=roll));
 const distance=shortest(start,goal).distance;
 if(distance>0&&distance<=roll)assert(options.some(([s])=>s===goal));
}}
assert.equal(shortest('大手町','半蔵門').distance,3);
assert.equal(travelRoute('半蔵門','渋谷').distance,4);
assert.equal(transfers(travelRoute('半蔵門','渋谷')),0,'equal-distance routes avoid unnecessary transfers');
`,{assert});
assert(!js.includes('localStorage'),'prototype must not change saves');
console.log('Design lab: shared network parity, IDs, all stations × six dice, isolated saves PASS');
