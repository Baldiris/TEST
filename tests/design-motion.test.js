const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element {
 constructor(){this.children=[];this.attributes={};this.hidden=false;this.textContent='';this.innerHTML='';this.disabled=false;this.clientWidth=980;this.style={setProperty(){}};const names=new Set();this.classList={add:(...xs)=>xs.forEach(x=>names.add(x)),remove:(...xs)=>xs.forEach(x=>names.delete(x)),contains:x=>names.has(x),toggle:(x,force)=>{const enabled=force??!names.has(x);enabled?names.add(x):names.delete(x);return enabled}}}
 setAttribute(k,v){this.attributes[k]=v}append(...xs){this.children.push(...xs)}replaceChildren(){this.children=[]}querySelector(){return this.children[0]}focus(){}animate(){return{cancel(){}}}
}
const html=fs.readFileSync('design-lab.html','utf8');
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const timers=new Map();let now=0,sequence=0,reduce=false,randomValue=.5,randomCalls=0;
const math=Object.create(Math);math.random=()=>{randomCalls++;return randomValue};
const doc={body:new Element(),getElementById:id=>elements[id],createElement:()=>new Element(),createTextNode:text=>text,querySelector:()=>new Element()};
const context=vm.createContext({console,document:doc,window:{matchMedia:()=>({matches:reduce}),addEventListener(){}},Math:math,setTimeout:(fn,delay)=>{timers.set(++sequence,{fn,time:now+delay});return sequence},clearTimeout:id=>timers.delete(id)});
vm.runInContext(fs.readFileSync('design-lab-core.js','utf8')+'\n'+fs.readFileSync('design-lab.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
function advance(ms){const end=now+ms;while(true){const next=[...timers].filter(([,t])=>t.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;timers.delete(next[0]);now=next[1].time;next[1].fn()}now=end}
assert.equal(run('rolled'),null,'first screen is ready to roll');
assert.equal(run('soundOn'),false,'sound opt-in');
elements.roll.onclick();elements.roll.onclick();assert.equal(randomCalls,1,'double click only samples once');
assert.equal(run('busy'),'rolling');assert.equal(run('rolled'),null);assert.equal(elements.candidates.hidden,true);
advance(1000);assert.equal(run('busy'),'rolling','reel is still spinning');
advance(1200);assert.equal(run('rolled'),4);assert.equal(run('busy'),null);assert(elements.candidates.children.length>0);
elements.roll.onclick();assert.equal(randomCalls,1,'no reroll after result');
elements.move.onclick();elements.move.onclick();assert.equal(run('busy'),'moving');assert.equal(elements.move.disabled,true);
advance(1000);assert.equal(run('arrived'),true);assert.equal(elements.quests.children.length,2);
elements.continue.onclick();elements.continue.onclick();assert.equal(run('turn'),2,'continue cannot run twice');
elements.roll.onclick();elements['skip-spin'].onclick();assert.equal(run('rolled'),4);advance(5000);assert.equal(run('rolled'),4,'skip preserves original outcome');
elements.restart.onclick();elements.roll.onclick();elements.restart.onclick();advance(5000);assert.equal(run('rolled'),null,'restart cancels delayed results');
for(let die=1;die<=6;die++){randomValue=(die-.5)/6;elements.restart.onclick();elements.roll.onclick();elements['skip-spin'].onclick();assert.equal(run('rolled'),die)}
reduce=true;elements.restart.onclick();elements.roll.onclick();assert.equal(run('busy'),null,'reduced motion resolves without waiting');
elements.move.onclick();assert.equal(run('arrived'),true,'reduced motion arrival is immediate');
elements.restart.onclick();run("position='表参道'");randomValue=.99;elements.roll.onclick();assert.equal(run('selected'),'渋谷','within-roll goal remains eligible');elements.move.onclick();assert.equal(run('position'),'渋谷');assert.equal(elements['arrival-kicker'].textContent,'DESTINATION REACHED');assert.equal(elements.quests.children.length,2);assert(doc.body.classList.contains('is-goal'));
elements.continue.onclick();assert.equal(run('position'),'大手町');assert.equal(run('rolled'),null);
reduce=false;elements.roll.onclick();elements['skip-spin'].onclick();elements.move.onclick();elements.restart.onclick();advance(5000);assert.equal(run('position'),'大手町','restart cancels movement');assert.equal(run('arrived'),false);
elements.sound.onclick();assert.equal(run('soundOn'),false,'unsupported audio degrades safely');
console.log('Motion PASS: roll lifecycle, all six results, duplicate input, skip, cancellation, movement, quests, goal, reduced motion, sound fallback');
