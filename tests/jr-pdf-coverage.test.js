const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'jr-east/network-data.js'),'utf8'),ctx);const D=ctx.window.JR_KANTO_DATA;
const inventory=JSON.parse(fs.readFileSync(path.join(root,'jr-east/data/pdf-station-inventory.json'),'utf8'));
const expected=new Set(inventory.corridors.flatMap(c=>c.stations)),stations=new Set(Object.values(D.services).flatMap(s=>s.paths.flat()));
assert.equal(expected.size,539);assert.deepEqual([...stations].sort(),[...expected].sort());
// Independently checked endpoints and tricky branches in the attached PDF.
for(const name of ['韮崎','奥多摩','武蔵五日市','黒磯','高萩','日光','渋川','大原','君津','成東','伊東','空港第2ビル','成田空港','海芝浦','大川','小田栄','羽沢横浜国大','新日本橋','馬喰町','偕楽園','羽田空港第2ターミナル'])assert(stations.has(name),name);
for(const name of ['銚子','安房鴨川','館山','烏山','水上','松本'])assert(!stations.has(name),'Do not invent out-of-PDF scope: '+name);
const adjacent=(id,a,b)=>D.services[id].paths.some(p=>p.some((s,i)=>(s===a&&p[i+1]===b)||(s===b&&p[i+1]===a)));
assert(adjacent('TS','安善','大川'));assert(adjacent('TS','浅野','新芝浦'));assert(adjacent('JN','小田栄','浜川崎'));assert(adjacent('NR','布佐','木下'));assert(adjacent('JM','西船橋','市川塩浜'));assert(adjacent('JM','西船橋','南船橋'));
const graph=new Map([...stations].map(s=>[s,new Set()]));for(const s of Object.values(D.services))for(const p of s.paths){const seq=s.closed?[...p,p[0]]:p;for(let i=1;i<seq.length;i++){graph.get(seq[i-1]).add(seq[i]);graph.get(seq[i]).add(seq[i-1]);}}
const seen=new Set(['東京']),queue=['東京'];for(let i=0;i<queue.length;i++)for(const n of graph.get(queue[i]))if(!seen.has(n)){seen.add(n);queue.push(n);}assert.equal(seen.size,539,'All stations must be connected');
const maps=new Set();const assigned=[];for(const [id,r]of Object.entries(D.regions)){const m=JSON.parse(fs.readFileSync(path.join(root,'jr-east/region-manifests',id+'.json')));assigned.push(...m.stations);for(const match of fs.readFileSync(path.join(root,'jr-east',r.map),'utf8').matchAll(/data-station="([^"]+)"/g))maps.add(match[1]);}
assert.equal(assigned.length,539);assert.equal(new Set(assigned).size,539);assert.deepEqual([...maps].sort(),[...stations].sort());
const report=JSON.parse(fs.readFileSync(path.join(root,'jr-east/maps/layout-report.json')));assert.equal(report.length,18);assert(report.every(r=>r.labelCollisions===0));
const refs=new Set(inventory.referenceStations.map(s=>s.name));assert.deepEqual([...refs].sort(),['代々木上原','本庄早稲田'].sort());for(const n of refs)assert(!stations.has(n));
console.log('PDF coverage PASS: 539 connected stations, 2 reference stations, 18 regional SVGs, boundary/branch checks');
