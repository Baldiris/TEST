const fs=require("fs");
const path=require("path");
const vm=require("vm");

const root=path.resolve(__dirname,"..");
const dataPath=path.join(root,"jr-east","network-data.js");
const src=fs.readFileSync(dataPath,"utf8");

const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:"network-data.js"});
const data=sandbox.window.JR_KANTO_DATA;
if(!data) throw new Error("JR_KANTO_DATA was not defined");

const fail=(msg)=>{console.error("JR map contract:",msg);process.exit(1)};

const serviceIds=Object.keys(data.services||{});
const order=data.serviceOrder||[];
if(serviceIds.length!==order.length) fail("serviceOrder length does not match services");
for(const id of serviceIds) if(!order.includes(id)) fail("serviceOrder missing "+id);
for(const id of order) if(!data.services[id]) fail("serviceOrder references unknown service "+id);

const stations=new Set();
for(const [id,service] of Object.entries(data.services||{})){
  if(!Array.isArray(service.paths)||!service.paths.length) fail(id+" has no paths");
  for(const p of service.paths){
    if(!Array.isArray(p)||p.length<2) fail(id+" contains an invalid path");
    for(const station of p){
      if(typeof station!=="string"||!station.trim()) fail(id+" contains an invalid station name");
      stations.add(station);
    }
  }
}

const overview=data.overview||{};
const overviewNodes=overview.nodes||{};
for(const station of Object.keys(overviewNodes)){
  if(!stations.has(station)) fail("overview node is not in rail network: "+station);
  const point=overviewNodes[station];
  if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)) fail("invalid overview coordinate: "+station);
}
for(const edge of overview.edges||[]){
  if(!Array.isArray(edge)||edge.length!==2) fail("invalid overview edge");
  if(!overviewNodes[edge[0]]||!overviewNodes[edge[1]]) fail("overview edge references missing node: "+edge.join(" -> "));
}

const regionIds=Object.keys(data.regions||{});
if(!regionIds.length) fail("no regions defined");

for(const [regionId,region] of Object.entries(data.regions)){
  if(!region.name) fail(regionId+" has no display name");
  if(!Array.isArray(region.hubs)||!region.hubs.length) fail(regionId+" has no hubs");
  for(const hub of region.hubs){
    if(!stations.has(hub)) fail(regionId+" hub is not in rail network: "+hub);
  }

  if(!region.map) continue;
  const mapPath=path.join(root,"jr-east",region.map);
  if(!fs.existsSync(mapPath)) fail(regionId+" map file missing: "+region.map);
  const svg=fs.readFileSync(mapPath,"utf8");
  if(!/<svg\b/.test(svg)) fail(regionId+" map is not SVG");

  const mapStations=[...svg.matchAll(/data-station="([^"]+)"/g)].map(m=>m[1]);
  if(!mapStations.length) fail(regionId+" SVG contains no data-station nodes");

  const duplicates=[...new Set(mapStations.filter((s,i,a)=>a.indexOf(s)!==i))];
  if(duplicates.length) fail(regionId+" SVG has duplicate stations: "+duplicates.join(", "));

  for(const station of mapStations){
    if(!stations.has(station)) fail(regionId+" SVG references unknown station: "+station);
  }
  for(const hub of region.hubs){
    if(!mapStations.includes(hub)) fail(regionId+" SVG is missing region hub: "+hub);
  }
}

console.log("JR map contract OK:",serviceIds.length+" services,",stations.size+" stations,",regionIds.length+" regions");
