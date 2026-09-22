const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'jr-east'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'network-data.js'),'utf8'),ctx);const D=ctx.window.JR_KANTO_DATA;
const L=JSON.parse(fs.readFileSync(path.join(dir,'maps/layout-data.json'),'utf8'));
const check=process.argv.includes('--check');let changed=false;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const stationLines={};for(const [id,s]of Object.entries(D.services))for(const name of s.paths.flat())(stationLines[name]??=new Set()).add(id);
const key=(a,b,id)=>JSON.stringify([a,b,id]);
const overlap=(a,b,pad=4)=>a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;
const reports=[];
for(const [id,r]of Object.entries(D.regions)){
 const m=JSON.parse(fs.readFileSync(path.join(dir,'region-manifests',id+'.json'),'utf8'));
 const names=[...new Set([...m.stations,...m.boundaryStations,...r.hubs])];
 const refs=(D.referenceStations||[]).filter(s=>id===(s.name==='本庄早稲田'?'gunma':'tokyo-core'));
 const all=[...names,...refs.map(s=>s.name)],scale=.5;
 for(const n of all)if(!L.stations[n])throw Error('Missing layout: '+n);
 const minX=Math.min(...all.map(n=>L.stations[n][0])),minY=Math.min(...all.map(n=>L.stations[n][1]));
 const maxX=Math.max(...all.map(n=>L.stations[n][0])),maxY=Math.max(...all.map(n=>L.stations[n][1]));
 const margin=160,top=170,w=Math.max(900,Math.ceil((maxX-minX)*scale+margin*2)),h=Math.max(660,Math.ceil((maxY-minY)*scale+top+230));
 const pos=n=>[(L.stations[n][0]-minX)*scale+margin,(L.stations[n][1]-minY)*scale+top];
 const set=new Set(names),edges=[];
 for(const [service,s]of Object.entries(D.services))for(const seq of s.paths){
  const p=s.closed?[...seq,seq[0]]:seq;
  for(let i=1;i<p.length;i++)if(set.has(p[i-1])&&set.has(p[i]))edges.push({from:p[i-1],to:p[i],service});
 }
 const services=[...new Set(edges.map(e=>e.service))];
 const legendRows=Math.ceil(services.length/4),footer=70+legendRows*26;
 const height=h+footer;
 let out=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${height}" class="regional-map" data-region="${id}" role="img" aria-labelledby="map-title map-desc">`,
 `<title id="map-title">${esc(r.name)} 路線図</title><desc id="map-desc">${m.stations.length}地域駅と${m.boundaryStations.length}境界駅。破線の駅丸は隣接地域。駅丸のない交差では乗換できません。</desc>`,
 `<style>.regional-map{font-family:"Noto Sans CJK JP","Yu Gothic",system-ui,sans-serif}.regional-map .map-label{fill:#19362e;paint-order:stroke;stroke:#fbfaf5;stroke-width:5;stroke-linejoin:round;font-weight:600;font-size:14px}.regional-map .major-label{font-size:18px;font-weight:800}.regional-map .boundary-label{fill:#546c66}.regional-map .station{fill:#fbfaf5;stroke:#385d50;stroke-width:2}.regional-map .hub{stroke-width:3}.regional-map .boundary{stroke-dasharray:3 2}.regional-map.labels-major-only .minor-label{display:none}.regional-map .leader{stroke:#899a92;stroke-width:1;fill:none}.regional-map.labels-major-only .minor-leader{display:none}.regional-map .track{fill:none;stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round}.regional-map .small{font-size:12px;fill:#60796f}</style>`,
 `<rect width="${w}" height="${height}" fill="#fbfaf5"/><text x="45" y="52" fill="#19362e" font-size="28" font-weight="800">${esc(r.name)}</text><text x="46" y="79" class="small">${m.stations.length} STATIONS · ${m.boundaryStations.length} CONNECTIONS　／　PDF 2023.03</text><path d="M${w-65} 81 V40 l-5 10 m5-10 5 10" stroke="#60796f" fill="none"/><text x="${w-69}" y="30" class="small">N</text>`];
 const bounds=[];
 for(const e of edges){
  let stations=[e.from,e.to];const guide=L.corridorGuides[e.service];
  if(guide){const a=guide.indexOf(e.from),b=guide.indexOf(e.to);if(a>=0&&b>=0)stations=a<b?guide.slice(a,b+1):guide.slice(b,a+1).reverse();}
  let pts=stations.map(pos),off=(L.laneOffsets[e.service]||0)*scale;
  if(off){const [first,last]=[pts[0],pts.at(-1)],dx=last[0]-first[0],dy=last[1]-first[1],len=Math.hypot(dx,dy)||1;const ox=-dy/len*off,oy=dx/len*off;
   pts=[first,[first[0]+dx/len*12+ox,first[1]+dy/len*12+oy],...pts.slice(1,-1).map(([x,y])=>[x+ox,y+oy]),[last[0]-dx/len*12+ox,last[1]-dy/len*12+oy],last];
  }
  const d='M '+pts.map(p=>p.map(v=>Math.round(v*10)/10).join(' ')).join(' L ');
  out.push(`<path class="track" d="${d}" stroke="#fbfaf5" style="stroke-width:8"/><path class="track" data-edge="${esc(key(e.from,e.to,e.service))}" d="${d}" stroke="${D.services[e.service].color}"/>`);
 }
 // One direct child per interactive station, preserving the V0.3 renderer contract.
 for(const n of names){const [x,y]=pos(n);const hub=r.hubs.includes(n)||stationLines[n].size>=3,boundary=m.boundaryStations.includes(n);out.push(`<circle class="station${hub?' hub':''}${boundary?' boundary':''}" data-station="${esc(n)}" cx="${x}" cy="${y}" r="${hub?8:6}" aria-label="${esc(n)}"><title>${esc(n)}</title></circle>`);bounds.push({x:x-10,y:y-10,w:20,h:20});}
 for(const ref of refs){const [x,y]=pos(ref.name);out.push(`<circle data-reference-station="${esc(ref.name)}" cx="${x}" cy="${y}" r="5" fill="#a5aca8"/><text x="${x+12}" y="${y+4}" class="small">${esc(ref.name)}（参考）</text>`);bounds.push({x:x-6,y:y-10,w:ref.name.length*12+80,h:22});}
 const labels=[];let collisions=0;
 const sorted=[...names].sort((a,b)=>Number(r.hubs.includes(b))-Number(r.hubs.includes(a))||pos(a)[1]-pos(b)[1]);
 for(const n of sorted){const [x,y]=pos(n),major=r.hubs.includes(n),font=major?18:14,tw=n.length*font,th=font+5;let best=null;
  for(const distance of [15,26,40,58,80,105])for(const [dx,dy,anchor]of [[distance,5,'start'],[-distance,5,'end'],[0,-distance,'middle'],[0,distance+th/2,'middle'],[distance,-distance,'start'],[-distance,-distance,'end'],[distance,distance,'start'],[-distance,distance,'end']]){
   const tx=x+dx,ty=y+dy,rect={x:tx-(anchor==='end'?tw:anchor==='middle'?tw/2:0),y:ty-th+3,w:tw,h:th};
   if(rect.x<15||rect.x+tw>w-15||rect.y<100||rect.y+th>h-20)continue;
   const hits=bounds.filter(b=>overlap(rect,b)).length;
   const score=hits*10000+Math.hypot(dx,dy)+(anchor==='middle'?3:0);
   if(!best||score<best.score)best={tx,ty,anchor,rect,score,hits,distance};
  }
  if(!best)throw Error('Cannot label '+n);
  if(best.hits)collisions++;
  bounds.push(best.rect);
  if(best.distance>26){const ex=best.anchor==='start'?best.rect.x:best.anchor==='end'?best.rect.x+tw:best.tx,ey=best.ty-font/3;labels.push(`<path class="leader${major?'':' minor-leader'}" d="M${x} ${y} L${ex} ${ey}"/>`);}
  labels.push(`<text class="map-label ${major?'major-label':'minor-label'}${m.boundaryStations.includes(n)?' boundary-label':''}" data-label="${esc(n)}" x="${best.tx}" y="${best.ty}" text-anchor="${best.anchor}">${esc(n)}</text>`);
 }
 out.push(...labels);
 out.push(`<path d="M45 ${h} H${w-45}" stroke="#dbe1d8"/><text x="45" y="${h+25}" class="small">路線の交差は乗換ではありません。破線の駅丸＝隣接地域 ／ 地図は模式図</text>`);
 services.forEach((service,i)=>{const x=45+(i%4)*(w-90)/4,y=h+52+Math.floor(i/4)*26;out.push(`<path d="M${x} ${y-4} h24" stroke="${D.services[service].color}" stroke-width="5"/><text x="${x+33}" y="${y}" class="small">${service} ${esc(D.services[service].name)}</text>`)});
 out.push('</svg>');const content=out.join('\n')+'\n',file=path.join(dir,r.map);
 if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content){changed=true;console.error('Out of date map',id)}}else fs.writeFileSync(file,content);
 reports.push({region:id,stations:names.length,width:w,height,labelCollisions:collisions});
}
if(!check)fs.writeFileSync(path.join(dir,'maps/layout-report.json'),JSON.stringify(reports,null,2)+'\n');
if(changed)process.exit(1);console.log(reports);if(check)console.log('Regional maps are in sync.');
