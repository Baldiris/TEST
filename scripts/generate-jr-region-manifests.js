const fs=require("fs");
const path=require("path");
const vm=require("vm");

const root=path.resolve(__dirname,"..");
const dataFile=path.join(root,"jr-east","network-data.js");
const outDir=path.join(root,"jr-east","region-manifests");
const check=process.argv.includes("--check");

const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(dataFile,"utf8"),sandbox,{filename:"network-data.js"});
const D=sandbox.window.JR_KANTO_DATA;
if(!D) throw new Error("JR_KANTO_DATA missing");

const graph={};
const edgeServices=new Map();
const edgeKey=(a,b)=>[a,b].sort().join("\u0000");

for(const [serviceId,service] of Object.entries(D.services)){
  for(const p of service.paths){
    p.forEach(st=>graph[st]??=[]);
    const pairs=[];
    for(let i=0;i<p.length-1;i++) pairs.push([p[i],p[i+1]]);
    if(service.closed&&p.length>2) pairs.push([p[p.length-1],p[0]]);
    for(const [a,b] of pairs){
      if(!graph[a].includes(b)) graph[a].push(b);
      if(!graph[b].includes(a)) graph[b].push(a);
      const k=edgeKey(a,b);
      if(!edgeServices.has(k)) edgeServices.set(k,new Set());
      edgeServices.get(k).add(serviceId);
    }
  }
}

function bfs(hubs){
  const dist={},q=[];
  for(const h of hubs){dist[h]=0;q.push(h)}
  for(let i=0;i<q.length;i++){
    const u=q[i],d=dist[u];
    for(const v of graph[u]||[]){
      if(dist[v]!==undefined) continue;
      dist[v]=d+1;q.push(v);
    }
  }
  return dist;
}

const regionOrder=Object.keys(D.regions);
const distances=Object.fromEntries(regionOrder.map(id=>[id,bfs(D.regions[id].hubs)]));
const assignment={};
for(const station of Object.keys(graph)){
  let best=regionOrder[0],bestDistance=Infinity;
  for(const id of regionOrder){
    const d=distances[id][station]??Infinity;
    if(d<bestDistance){best=id;bestDistance=d}
  }
  assignment[station]=best;
}

function manifestFor(regionId){
  const region=D.regions[regionId];
  const stations=Object.keys(graph).filter(s=>assignment[s]===regionId).sort((a,b)=>a.localeCompare(b,"ja"));
  const set=new Set(stations),boundary=new Set(),edges=[],crossingEdges=[];

  for(const from of stations){
    for(const to of graph[from]||[]){
      const services=[...(edgeServices.get(edgeKey(from,to))||[])].sort();
      if(set.has(to)){
        if(from.localeCompare(to,"ja")<0) edges.push({from,to,services});
      }else{
        boundary.add(to);
        crossingEdges.push({from,to,toRegion:assignment[to],services});
      }
    }
  }

  return {
    schemaVersion:D.schemaVersion,
    regionId,
    name:region.name,
    description:region.description,
    hubs:region.hubs,
    map:region.map,
    stations,
    boundaryStations:[...boundary].sort((a,b)=>a.localeCompare(b,"ja")),
    edges,
    crossingEdges:crossingEdges.sort((a,b)=>a.from.localeCompare(b.from,"ja")||a.to.localeCompare(b.to,"ja"))
  };
}

fs.mkdirSync(outDir,{recursive:true});
let mismatch=false;
for(const regionId of regionOrder){
  const content=JSON.stringify(manifestFor(regionId),null,2)+"\n";
  const file=path.join(outDir,regionId+".json");
  if(check){
    if(!fs.existsSync(file)||fs.readFileSync(file,"utf8")!==content){
      console.error("Region manifest out of date:",regionId);
      mismatch=true;
    }
  }else{
    fs.writeFileSync(file,content);
    console.log("Wrote",path.relative(root,file));
  }
}
if(mismatch) process.exit(1);
if(check) console.log("JR region manifests are in sync.");
