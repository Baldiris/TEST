const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const data=fs.readFileSync('jr-east/network-data.js','utf8'),source=fs.readFileSync('jr-east/app.js','utf8');
const boundary=source.indexOf('const VERSION=');assert(boundary>0);
const checks=`
assert.equal(ALL_STATIONS.length,539);
assert.equal(shortest('東京','新日本橋').distance,1);
assert.equal(shortest('横浜','川崎').distance,1);
assert.equal(shortest('大月','韮崎').distance,14);
assert.equal(shortest('安善','大川').distance,1);
assert.equal(shortest('千葉','本千葉').distance,1);
assert.equal(shortest('布佐','小林').distance,2);
for(const start of ['東京','横浜','武蔵小杉','新横浜','奥多摩','韮崎','黒磯','高萩','君津','大原','伊東','成田空港','海芝浦','羽田空港第2ターミナル']){
 const distances=Object.fromEntries(ALL_STATIONS.map(s=>[s,shortest(start,s).distance]));
 for(let dice=1;dice<=6;dice++){
  const actual=reachableExactly(start,dice);
  assert.deepEqual([...actual.keys()].sort(),Object.keys(distances).filter(s=>distances[s]===dice).sort(),start+' dice '+dice);
  for(const [station,r]of actual){
   assert.equal(r.nodes[0],start);assert.equal(r.nodes.at(-1),station);assert.equal(r.edges.length,dice);
   for(const edge of r.edges)assert(GRAPH[edge.from].some(e=>e.to===edge.to&&e.line===edge.line));
  }
 }
}
`;
vm.runInNewContext(data+source.slice(0,boundary)+checks,{window:{},assert,console});console.log('JR logic PASS: expanded endpoints and all six dice across 14 regions');
