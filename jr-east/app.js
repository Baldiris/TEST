const $ = id => document.getElementById(id);

const DATA=window.JR_KANTO_DATA;
if(!DATA) throw new Error("JR_KANTO_DATA is not loaded");
const LINES=DATA.services;
const LINE_ORDER=DATA.serviceOrder;
const TRANSFER_GROUPS=DATA.transferGroups||[];
const REGIONS=DATA.regions||{};
const OVERVIEW=DATA.overview||{nodes:{},edges:[],viewBox:[0,0,1000,700]};

const GROUP_OF = {};
TRANSFER_GROUPS.forEach(group => group.forEach(name => GROUP_OF[name] = group));
function canonical(raw){
  const g = GROUP_OF[raw];
  return g ? g.join("／") : raw;
}
function displayStation(c){
  return c || "-";
}

const QUEST_POOL = [
  "駅名が入った看板を写真に残す",
  "駅周辺で気になる店を1軒見つける",
  "5分だけ知らない方向へ歩く",
  "その駅らしい風景を1つ見つける",
  "駅の出口をいつもと違う方向から使う",
  "街の音を1分だけ意識して聞く",
  "面白い建物や看板を1つ見つける",
  "次に来たい場所を1つメモする"
];

const GRAPH = {};
const LINES_AT = {};
const OCCURRENCES = {};
function addNode(s){
  if(!GRAPH[s]) GRAPH[s] = [];
  if(!LINES_AT[s]) LINES_AT[s] = new Set();
}
function addEdge(a,b,line){
  addNode(a); addNode(b);
  if(!GRAPH[a].some(e => e.to===b && e.line===line)) GRAPH[a].push({to:b,line});
  if(!GRAPH[b].some(e => e.to===a && e.line===line)) GRAPH[b].push({to:a,line});
  LINES_AT[a].add(line); LINES_AT[b].add(line);
}
for(const [lineId,line] of Object.entries(LINES)){
  line.paths.forEach((path,pathIndex)=>{
    path.forEach((raw,index)=>{
      const c = canonical(raw);
      addNode(c);
      LINES_AT[c].add(lineId);
      if(!OCCURRENCES[c]) OCCURRENCES[c]=[];
      OCCURRENCES[c].push({lineId,pathIndex,index,raw});
    });
    for(let i=0;i<path.length-1;i++){
      const a=canonical(path[i]), b=canonical(path[i+1]);
      if(a!==b) addEdge(a,b,lineId);
    }
    if(line.closed && path.length>2){
      const a=canonical(path[path.length-1]), b=canonical(path[0]);
      if(a!==b) addEdge(a,b,lineId);
    }
  });
}
const ALL_STATIONS = Object.keys(GRAPH);

function shortest(start,goal){
  if(start===goal) return {distance:0,nodes:[start],edges:[]};
  const q=[start], prev={}; prev[start]=null;
  for(let qi=0;qi<q.length;qi++){
    const u=q[qi];
    for(const e of GRAPH[u]||[]){
      if(Object.prototype.hasOwnProperty.call(prev,e.to)) continue;
      prev[e.to]={from:u,line:e.line};
      if(e.to===goal){
        const nodes=[goal],edges=[];
        let cur=goal;
        while(prev[cur]){
          const p=prev[cur];
          edges.unshift({from:p.from,to:cur,line:p.line});
          nodes.unshift(p.from);
          cur=p.from;
        }
        return {distance:edges.length,nodes,edges};
      }
      q.push(e.to);
    }
  }
  return {distance:null,nodes:[],edges:[]};
}

function reachableExactly(start,steps){
  // 候補爆発を防ぐため「現在地からの最短距離がサイコロ目と一致する駅」に限定する。
  // 同じ駅へ遠回りして帳尻を合わせるルートは候補にしない。
  const result = new Map();
  for(const station of ALL_STATIONS){
    if(station===start) continue;
    const route=shortest(start,station);
    if(route.distance===steps) result.set(station,route);
  }
  return result;
}

function lineChips(station){
  return [...(LINES_AT[station]||[])].sort((a,b)=>LINE_ORDER.indexOf(a)-LINE_ORDER.indexOf(b))
    .map(id=>'<span class="chip"><i class="line-dot" style="background:'+LINES[id].color+'"></i>'+id+' '+LINES[id].name+'</span>').join("");
}

const VERSION="0.3";
const KEY="kimagureJREastKantoV03";
const LEGACY_KEYS=["kimagureJREastKantoV02","kimagureJREastKantoV01"];
function fresh(){
  return {
    version:VERSION,phase:"home",start:null,goal:null,current:null,dice:null,
    reachable:{},target:null,targetPath:null,turn:1,quests:{},history:[],finished:false
  };
}
let state=load()||fresh();
let setupStart=null,setupGoal=null,rollTimer=null,boardMode="focus",lastBoardStation=null;
let mapMode="core",coreMapReady=false,coreMapStations=new Set(),activeRegionId="tokyo-core",loadingRegionId=null;
const overviewHubCache=new Map();
const stationRegionCache=new Map();
const views=["homeView","setupView","gameView","finishView"];

function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  updateResume();
}
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    if(x&&x.version===VERSION) return {...fresh(),...x,version:VERSION};
    for(const legacyKey of LEGACY_KEYS){
      const legacy=JSON.parse(localStorage.getItem(legacyKey));
      if(legacy&&["0.1","0.2"].includes(legacy.version)) return {...fresh(),...legacy,version:VERSION};
    }
    return null;
  }catch{return null}
}
function show(id){
  views.forEach(v=>$(v).classList.toggle("hidden",v!==id));
  window.scrollTo({top:0,behavior:"smooth"});
}
function updateResume(){
  $("resumeBtn").classList.toggle("hidden",!(state&&["game","arrival","quests"].includes(state.phase)&&!state.finished));
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove("show"),1700);
}
function log(msg){
  state.history.unshift(new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})+"  "+msg);
  state.history=state.history.slice(0,40);
}
function randomStation(except){
  const pool=ALL_STATIONS.filter(x=>x!==except);
  return pool[Math.floor(Math.random()*pool.length)];
}
function randomGoalFrom(start){
  const preferred=ALL_STATIONS.filter(st=>{
    if(st===start) return false;
    const d=shortest(start,st).distance;
    return d!==null && d>=5 && d<=15;
  });
  const fallback=ALL_STATIONS.filter(st=>st!==start);
  const pool=preferred.length?preferred:fallback;
  return pool[Math.floor(Math.random()*pool.length)];
}
function slotAnimate(el,final,cb){
  let n=0;
  const t=setInterval(()=>{
    el.textContent=ALL_STATIONS[Math.floor(Math.random()*ALL_STATIONS.length)];
    if(++n>13){clearInterval(t);el.textContent=final;cb&&cb();}
  },55);
}

function newGame(){
  setupStart=setupGoal=null;
  $("startSlot").textContent=$("goalSlot").textContent="？";
  $("startLines").innerHTML=$("goalLines").innerHTML="";
  $("drawGoalBtn").disabled=true;
  $("confirmSetupBtn").disabled=true;
  $("setupRoute").classList.add("hidden");
  show("setupView");
}
function updateSetupRoute(){
  if(!setupStart||!setupGoal) return;
  const r=shortest(setupStart,setupGoal);
  $("setupRoute").classList.remove("hidden");
  $("setupRoute").innerHTML="<strong>最短 "+r.distance+"駅</strong><br>"+escapeHtml(setupStart)+" → "+escapeHtml(setupGoal);
}
function confirmSetup(){
  state=fresh();
  state.start=setupStart; state.goal=setupGoal; state.current=setupStart; state.phase="game";
  boardMode="focus"; lastBoardStation=null;
  log("旅を開始："+state.start+" → "+state.goal);
  save(); renderGame(); show("gameView");
}

function renderHistory(){
  $("history").innerHTML=state.history.length
    ? state.history.map(x=>"<div>"+escapeHtml(x)+"</div>").join("")
    : "<div>まだ履歴はありません。</div>";
}

function recommendation(){
  const r=shortest(state.current,state.goal);
  if(r.distance===0) return "ゴール駅に到着しています。";
  const first=r.edges[0];
  return "最短 "+r.distance+"駅。まず "+LINES[first.line].name+" で「"+r.nodes[1]+"」方向へ進むルートです。";
}

function routeSegments(route){
  const segments=[];
  for(const edge of route.edges){
    const last=segments[segments.length-1];
    if(last&&last.line===edge.line){last.count++;last.to=edge.to}
    else segments.push({line:edge.line,count:1,from:edge.from,to:edge.to});
  }
  return segments;
}
function routePreviewNodes(route){
  if(route.nodes.length<=6) return route.nodes.map(name=>({name}));
  return [
    {name:route.nodes[0]},
    {name:route.nodes[1]},
    {name:route.nodes[2]},
    {name:"…",ellipsis:true},
    {name:route.nodes[route.nodes.length-1]}
  ];
}
function renderRouteCompass(route){
  const el=$("routeCompass");
  if(!route||route.distance===null){
    el.innerHTML='<div class="route-compass-head"><b>ルートを確認できません</b></div>';
    return;
  }
  if(route.distance===0){
    el.innerHTML='<div class="route-compass-head"><b>🏁 ゴール駅に到着</b><span>クエスト後に旅を完了</span></div>';
    return;
  }
  const preview=routePreviewNodes(route);
  const stops=preview.map((item,index)=>{
    if(item.ellipsis) return '<span class="route-arrow">…</span>';
    const isCurrent=index===0;
    const isGoal=item.name===state.goal;
    return '<span class="route-stop '+(isCurrent?'current ':'')+(isGoal?'goal':'')+'" title="'+escapeHtml(item.name)+'">'+escapeHtml(item.name)+'</span>'+
      (index<preview.length-1&&!(preview[index+1]&&preview[index+1].ellipsis)?'<span class="route-arrow">›</span>':'');
  }).join("");
  const detail=routeSegments(route).map((segment,index)=>
    (index?'乗換 → ':'')+LINES[segment.line].name+' '+segment.count+'駅'
  ).join(' / ');
  el.innerHTML='<div class="route-compass-head"><b>ゴールへの最短ルート</b><span>残り '+route.distance+'駅</span></div>'+
    '<div class="route-stops">'+stops+'</div><div class="route-detail">'+escapeHtml(detail)+'</div>';
}

function candidateInfo(station,route,currentGoalDistance){
  const goalDistance=shortest(station,state.goal).distance;
  const progress=currentGoalDistance-goalDistance;
  const firstLine=route&&route.edges[0]?route.edges[0].line:null;
  return {station,route,goalDistance,progress,firstLine,isGoal:station===state.goal};
}
function renderCandidates(){
  const panel=$("candidatePanel");
  const shouldShow=state.phase==="game"&&state.dice&&Object.keys(state.reachable||{}).length;
  panel.classList.toggle("hidden",!shouldShow);
  if(!shouldShow){$("candidateList").innerHTML="";return}
  const currentGoalDistance=shortest(state.current,state.goal).distance;
  const candidates=Object.entries(state.reachable).map(([station,route])=>candidateInfo(station,route,currentGoalDistance))
    .sort((a,b)=>Number(b.isGoal)-Number(a.isGoal)||b.progress-a.progress||a.goalDistance-b.goalDistance||a.station.localeCompare(b.station,"ja"));
  $("candidateCount").textContent=candidates.length+"駅";
  $("candidateList").innerHTML=candidates.map((item,index)=>{
    const label=item.isGoal?'ゴールに到着':item.progress>0?'ゴールへ '+item.progress+'駅前進':item.progress===0?'ゴールと同距離':'寄り道 '+Math.abs(item.progress)+'駅';
    const sub=item.isGoal?'選択するとゴールへ':label+' · 残り'+item.goalDistance+'駅';
    const lineIds=[...(LINES_AT[item.station]||[])].sort((a,b)=>LINE_ORDER.indexOf(a)-LINE_ORDER.indexOf(b));
    const dots=lineIds.map(id=>'<i class="candidate-line-dot" style="background:'+LINES[id].color+'" title="'+LINES[id].name+'"></i>').join("");
    return '<button class="candidate-card '+(index===0?'best ':'')+(item.isGoal?'goal':'')+'" data-candidate-index="'+index+'" aria-label="'+escapeHtml(item.station)+'を移動先にする。'+escapeHtml(sub)+'">'+
      '<span class="candidate-rank">'+(item.isGoal?'GOAL':index+1)+'</span><span class="candidate-main"><span class="candidate-name">'+escapeHtml(item.station)+'</span><span class="candidate-meta">'+escapeHtml(sub)+'</span><span class="candidate-lines">'+dots+'</span></span><span class="candidate-go">›</span></button>';
  }).join("");
  document.querySelectorAll("[data-candidate-index]").forEach(btn=>{
    btn.onclick=()=>chooseTarget(candidates[Number(btn.dataset.candidateIndex)].station);
  });
}

const SVG_NS="http://www.w3.org/2000/svg";
const BOARD = {left:118,top:70,dx:56,dy:82,width:2860,height:1420};
function svgEl(tag,attrs={}){
  const el=document.createElementNS(SVG_NS,tag);
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  return el;
}
function occurrencePoint(lineId,pathIndex,index){
  const row=LINE_ORDER.indexOf(lineId);
  const path=LINES[lineId].paths[pathIndex];
  let x=BOARD.left+index*BOARD.dx;
  return {x,y:BOARD.top+row*BOARD.dy};
}
function renderBoard(){
  const svg=$("networkSvg");
  svg.setAttribute("viewBox","0 0 "+BOARD.width+" "+BOARD.height);
  svg.setAttribute("width",BOARD.width);
  svg.setAttribute("height",BOARD.height);
  svg.innerHTML="";

  const shortestRoute=shortest(state.current,state.goal);
  const shortestKeys=new Set(shortestRoute.edges.map(e=>[e.from,e.to,e.line].join("|")));
  const shortestStations=new Set(shortestRoute.nodes);
  const routeTransferStations=new Set();
  for(let i=1;i<shortestRoute.edges.length;i++){
    if(shortestRoute.edges[i-1].line!==shortestRoute.edges[i].line) routeTransferStations.add(shortestRoute.nodes[i]);
  }
  const reachableSet=new Set(Object.keys(state.reachable||{}));

  // background
  svg.appendChild(svgEl("rect",{x:0,y:0,width:BOARD.width,height:BOARD.height,fill:"#fffdf8"}));

  // transfer connectors first
  for(const [station,occ] of Object.entries(OCCURRENCES)){
    if(occ.length<2) continue;
    const points=occ.map(o=>({...occurrencePoint(o.lineId,o.pathIndex,o.index),lineId:o.lineId}));
    for(let i=1;i<points.length;i++){
      const isRouteTransfer=routeTransferStations.has(station);
      svg.appendChild(svgEl("line",{
        x1:points[0].x,y1:points[0].y,x2:points[i].x,y2:points[i].y,
        stroke:"#fffdf8","stroke-width":isRouteTransfer?"8":"6","vector-effect":"non-scaling-stroke"
      }));
      svg.appendChild(svgEl("line",{
        x1:points[0].x,y1:points[0].y,x2:points[i].x,y2:points[i].y,
        stroke:isRouteTransfer?"#173a2a":"#aab3ad","stroke-width":isRouteTransfer?"3.5":"2","stroke-dasharray":"5 5","vector-effect":"non-scaling-stroke",
        opacity:isRouteTransfer?"0.95":"0.58"
      }));
    }
  }

  // line labels + route lines
  LINE_ORDER.forEach(lineId=>{
    const line=LINES[lineId],row=LINE_ORDER.indexOf(lineId),y=BOARD.top+row*BOARD.dy;
    const label=svgEl("g",{class:"line-label"});
    label.appendChild(svgEl("circle",{cx:42,cy:y,r:18,fill:line.color}));
    const t=svgEl("text",{x:42,y:y+5,"text-anchor":"middle",fill:"#fff","font-size":"13","font-weight":"900"});
    t.textContent=lineId; label.appendChild(t);
    const tn=svgEl("text",{x:68,y:y+5,fill:"#4e5852","font-size":"12","font-weight":"700"});
    tn.textContent=line.name; label.appendChild(tn);
    svg.appendChild(label);

    line.paths.forEach((path,pathIndex)=>{
      for(let i=0;i<path.length-1;i++){
        const a=canonical(path[i]),b=canonical(path[i+1]);
        const p1=occurrencePoint(lineId,pathIndex,i),p2=occurrencePoint(lineId,pathIndex,i+1);
        const isShortest=shortestKeys.has([a,b,lineId].join("|"))||shortestKeys.has([b,a,lineId].join("|"));
        svg.appendChild(svgEl("line",{
          x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,
          stroke:isShortest?"#253a31":line.color,
          "stroke-width":isShortest?"9":"5",
          "stroke-linecap":"round",opacity:isShortest?"0.96":"0.48"
        }));
      }
      if(line.closed && path.length>2){
        const a=canonical(path[path.length-1]),b=canonical(path[0]);
        const p1=occurrencePoint(lineId,pathIndex,path.length-1),p2=occurrencePoint(lineId,pathIndex,0);
        const isShortest=shortestKeys.has([a,b,lineId].join("|"))||shortestKeys.has([b,a,lineId].join("|"));
        const mid=(p1.x+p2.x)/2;
        svg.appendChild(svgEl("path",{
          d:"M "+p1.x+" "+p1.y+" Q "+mid+" "+(p1.y-48)+" "+p2.x+" "+p2.y,
          fill:"none",stroke:isShortest?"#253a31":line.color,
          "stroke-width":isShortest?"9":"5","stroke-linecap":"round",opacity:isShortest?"0.96":"0.48"
        }));
      }
    });
  });

  // nodes
  for(const [lineId,line] of Object.entries(LINES)){
    line.paths.forEach((path,pathIndex)=>{
      path.forEach((raw,index)=>{
        const station=canonical(raw),p=occurrencePoint(lineId,pathIndex,index);
        const isTransfer=(OCCURRENCES[station]||[]).length>1;
        const isCurrent=station===state.current,isGoal=station===state.goal,isReachable=reachableSet.has(station);
        const interactive=isReachable&&state.phase==="game"&&state.dice;
        const g=svgEl("g",{class:"station-node"+(isTransfer?" transfer-node":""),tabindex:interactive?"0":"-1","data-station":station,"aria-label":interactive?station+"へ移動":""});
        if(interactive) g.setAttribute("role","button");
        const radius=(isCurrent||isGoal||isReachable)?10:isTransfer?8:6.5;
        let fill="#fff",stroke=line.color,sw=3;
        if(isCurrent){fill="#173a2a";stroke="#173a2a";sw=4}
        if(isGoal){fill="#fff3cf";stroke="#f2a900";sw=4}
        if(isReachable){fill="#e9f8ef";stroke="#2a9d5b";sw=4}
        if(station===state.target){fill="#dff0ff";stroke="#1677c8";sw=5}
        g.appendChild(svgEl("circle",{cx:p.x,cy:p.y,r:20,fill:"transparent",class:"station-hit"}));
        if(isTransfer) g.appendChild(svgEl("circle",{cx:p.x,cy:p.y,r:radius+4,fill:"none",stroke:routeTransferStations.has(station)?"#173a2a":"#60736a","stroke-width":routeTransferStations.has(station)?"3":"1.8",opacity:"0.9",class:"transfer-ring"}));
        g.appendChild(svgEl("circle",{cx:p.x,cy:p.y,r:radius,fill,stroke,"stroke-width":sw}));

        const important=isCurrent||isGoal||isReachable||isTransfer||shortestStations.has(station);
        const labelY=p.y-(isTransfer?17:13);
        const label=svgEl("text",{
          x:important?p.x:p.x+3,
          y:labelY,
          "text-anchor":important?"middle":"start",
          fill:"#3e4943",
          "font-size":important?"10":"9",
          "font-weight":important?"800":"600",
          transform:important?"":"rotate(-34 "+p.x+" "+labelY+")",
          class:"station-label"
        });
        label.textContent=raw;
        g.appendChild(label);

        if(interactive){
          g.classList.add("reachable-node");
          g.style.cursor="pointer";
          g.addEventListener("click",()=>chooseTarget(station));
          g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();chooseTarget(station)}});
        }
        svg.appendChild(g);
      });
    });
  }
}


function regionForStation(station){
  if(!station) return null;
  if(stationRegionCache.has(station)) return stationRegionCache.get(station);
  let best=null;
  for(const [id,region] of Object.entries(REGIONS)){
    for(const hub of region.hubs||[]){
      const r=shortest(station,hub);
      if(r.distance===null) continue;
      if(!best||r.distance<best.distance) best={id,name:region.name,distance:r.distance,hub};
    }
  }
  stationRegionCache.set(station,best);
  return best;
}

function nearestOverviewHub(station){
  if(!station) return null;
  if(OVERVIEW.nodes[station]) return {hub:station,distance:0};
  if(overviewHubCache.has(station)) return overviewHubCache.get(station);
  let best=null;
  for(const hub of Object.keys(OVERVIEW.nodes||{})){
    const r=shortest(station,hub);
    if(r.distance===null) continue;
    if(!best||r.distance<best.distance) best={hub,distance:r.distance};
  }
  overviewHubCache.set(station,best);
  return best;
}
function overviewHubRoute(startHub,goalHub){
  if(!startHub||!goalHub) return [];
  if(startHub===goalHub) return [startHub];
  const adj={};
  for(const [a,b] of OVERVIEW.edges||[]){
    (adj[a]??=[]).push(b); (adj[b]??=[]).push(a);
  }
  const q=[startHub],prev={[startHub]:null};
  for(let i=0;i<q.length;i++){
    const u=q[i];
    for(const v of adj[u]||[]){
      if(Object.prototype.hasOwnProperty.call(prev,v)) continue;
      prev[v]=u;
      if(v===goalHub){
        const path=[v]; let cur=v;
        while(prev[cur]){cur=prev[cur];path.unshift(cur)}
        return path;
      }
      q.push(v);
    }
  }
  return [];
}
function renderOverviewMap(){
  const svg=$("overviewSvg");
  if(!svg) return;
  const [vx,vy,vw,vh]=OVERVIEW.viewBox||[0,0,1000,700];
  svg.setAttribute("viewBox",[vx,vy,vw,vh].join(" "));
  svg.innerHTML="";
  svg.appendChild(svgEl("rect",{x:vx,y:vy,width:vw,height:vh,rx:24,fill:"#fffdf8"}));

  const currentHub=nearestOverviewHub(state.current);
  const goalHub=nearestOverviewHub(state.goal);
  const hubRoute=overviewHubRoute(currentHub?.hub,goalHub?.hub);
  const routeKeys=new Set();
  for(let i=0;i<hubRoute.length-1;i++){
    routeKeys.add([hubRoute[i],hubRoute[i+1]].sort().join("|"));
  }

  for(const [a,b] of OVERVIEW.edges||[]){
    const pa=OVERVIEW.nodes[a],pb=OVERVIEW.nodes[b];
    if(!pa||!pb) continue;
    const active=routeKeys.has([a,b].sort().join("|"));
    svg.appendChild(svgEl("line",{
      x1:pa[0],y1:pa[1],x2:pb[0],y2:pb[1],
      stroke:active?"#173a2a":"#b4b9b5",
      "stroke-width":active?"9":"5",
      "stroke-linecap":"round",
      opacity:active?"0.88":"0.55"
    }));
  }

  for(const [name,p] of Object.entries(OVERVIEW.nodes||{})){
    const isCurrent=currentHub?.hub===name;
    const isGoal=goalHub?.hub===name;
    const g=svgEl("g",{class:"overview-node","data-overview-station":name});
    let fill="#fff",stroke="#6d756f",sw=2,r=9;
    if(isCurrent){fill="#173a2a";stroke="#173a2a";sw=4;r=13}
    if(isGoal){fill="#fff3cf";stroke="#f2a900";sw=4;r=13}
    g.appendChild(svgEl("circle",{cx:p[0],cy:p[1],r,fill,stroke,"stroke-width":sw}));
    const label=svgEl("text",{
      x:p[0],y:p[1]-16,"text-anchor":"middle",
      fill:"#26322c","font-size":isCurrent||isGoal?"18":"15",
      "font-weight":isCurrent||isGoal?"900":"750",
      class:"overview-label"
    });
    label.textContent=name;
    g.appendChild(label);
    svg.appendChild(g);
  }

  const cap=$("overviewCaption");
  if(cap){
    const cText=currentHub
      ? (state.current===currentHub.hub?state.current:state.current+"（"+currentHub.hub+"方面）")
      : state.current||"-";
    const gText=goalHub
      ? (state.goal===goalHub.hub?state.goal:state.goal+"（"+goalHub.hub+"方面）")
      : state.goal||"-";
    const cr=regionForStation(state.current),gr=regionForStation(state.goal);
    const regionText=cr&&gr ? " / "+cr.name+(cr.id===gr.id?"":" → "+gr.name) : "";
    cap.textContent="現在地 "+cText+" → ゴール "+gText+regionText;
  }
}

function coreStationElement(station){
  const root=$("coreMapMount");
  if(!root) return null;
  return [...root.querySelectorAll("[data-station]")].find(el=>el.getAttribute("data-station")===station)||null;
}
function corePoint(station){
  const el=coreStationElement(station);
  if(!el) return null;
  const x=Number(el.getAttribute("cx")||el.getAttribute("x")||0);
  const y=Number(el.getAttribute("cy")||el.getAttribute("y")||0);
  return {x,y};
}
function setMapMode(mode,auto=false){
  mapMode=mode;
  const overview=mode==="overview",core=mode==="core",full=mode==="full";
  $("overviewMapWrap").classList.toggle("hidden",!overview);
  $("coreMapScroll").classList.toggle("hidden",!core);
  $("networkScroll").classList.toggle("hidden",!full);
  $("overviewMapBtn").classList.toggle("active",overview);
  $("coreMapBtn").classList.toggle("active",core);
  $("fullMapBtn").classList.toggle("active",full);
  $("overviewMapBtn").setAttribute("aria-pressed",String(overview));
  $("coreMapBtn").setAttribute("aria-pressed",String(core));
  $("fullMapBtn").setAttribute("aria-pressed",String(full));
  if(overview) renderOverviewMap();
  if(!auto){
    boardMode="focus";
    requestAnimationFrame(()=>centerCurrent(false));
  }
}
function updateCoreMap(){
  if(!coreMapReady) return false;
  const mount=$("coreMapMount");
  const svg=mount.querySelector("svg");
  if(!svg) return false;

  const reachableSet=new Set(Object.keys(state.reachable||{}));
  const route=shortest(state.current,state.goal);
  mount.querySelectorAll("[data-station]").forEach(el=>{
    const station=el.getAttribute("data-station");
    el.classList.remove("game-current","game-goal","game-reachable","game-target");
    if(station===state.current) el.classList.add("game-current");
    if(station===state.goal) el.classList.add("game-goal");
    if(reachableSet.has(station)&&state.phase==="game"&&state.dice){
      el.classList.add("game-reachable");
      el.style.cursor="pointer";
      el.onclick=()=>chooseTarget(station);
      el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();chooseTarget(station)}};
      el.setAttribute("tabindex","0");
      el.setAttribute("role","button");
    }else{
      el.style.cursor="";
      el.onclick=null;
      el.onkeydown=null;
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
    }
    if(station===state.target) el.classList.add("game-target");
  });

  const old=svg.querySelector("#game-route-overlay");
  if(old) old.remove();
  const pts=(route.nodes||[]).map(corePoint).filter(Boolean);
  if(pts.length>=2 && pts.length===route.nodes.length){
    const path=svgEl("path",{
      id:"game-route-overlay",
      d:pts.map((p,i)=>(i?"L ":"M ")+p.x+" "+p.y).join(" "),
      fill:"none",stroke:"#173a2a","stroke-width":"5.8",
      "stroke-linecap":"round","stroke-linejoin":"round",opacity:"0.72",
      "pointer-events":"none"
    });
    svg.insertBefore(path,svg.querySelector("[data-station]"));
  }
  return true;
}
async function loadRegionMap(regionId,{autoMode=true}={}){
  if(typeof fetch!=="function") return false;
  const region=REGIONS[regionId];
  if(!region||!region.map) return false;
  try{
    $("coreMapMount").textContent=region.name+"の路線図を読み込んでいます...";
    const res=await fetch(region.map,{cache:"no-cache"});
    if(!res.ok) throw new Error("SVG load failed: "+region.map);
    const text=await res.text();
    $("coreMapMount").innerHTML=text;
    const svg=$("coreMapMount").querySelector("svg");
    if(!svg) throw new Error("SVG not found");
    svg.removeAttribute("width"); svg.removeAttribute("height");
    coreMapStations=new Set([...svg.querySelectorAll("[data-station]")].map(el=>el.getAttribute("data-station")));
    coreMapReady=true;
    activeRegionId=regionId;
    $("coreMapMount").setAttribute("aria-label",region.name+"ゲーム用路線図");
    $("coreMapBtn").textContent="地域: "+region.name;
    updateCoreMap();
    if(autoMode){
      if(state.current && (!coreMapStations.has(state.current)||!coreMapStations.has(state.goal))) setMapMode("full",true);
      else setMapMode("core",true);
    }
    return true;
  }catch(err){
    coreMapReady=false;
    $("coreMapMount").textContent=region.name+"の地域図を読み込めませんでした。全駅表示を利用してください。";
    if(autoMode) setMapMode("full",true);
    return false;
  }
}
async function initCoreMap(){
  return loadRegionMap("tokyo-core");
}
function syncRegionalMapForState(){
  if(!state.current) return;
  const resolved=regionForStation(state.current);
  if(!resolved) return;
  const region=REGIONS[resolved.id];
  const btn=$("coreMapBtn");
  if(!region?.map){
    btn.disabled=true;
    btn.textContent="地域: "+resolved.name+"（準備中）";
    if(mapMode==="core") setMapMode("full",true);
    return;
  }

  btn.disabled=false;
  if(activeRegionId===resolved.id&&coreMapReady){
    btn.textContent="地域: "+region.name;
    return;
  }
  if(loadingRegionId===resolved.id) return;

  loadingRegionId=resolved.id;
  btn.textContent="地域: "+region.name+"（読込中）";
  loadRegionMap(resolved.id,{autoMode:false}).then(ok=>{
    loadingRegionId=null;
    if(ok){
      btn.textContent="地域: "+region.name;
      updateCoreMap();
      updateMapCoverageHint();
    }else{
      btn.textContent="地域: "+region.name+"（読込失敗）";
      btn.disabled=true;
      if(mapMode==="core") setMapMode("full",true);
    }
  });
}

function ensureMapModeForState(){
  if(!state.current||!state.goal) return;
  const resolved=regionForStation(state.current);
  const region=resolved&&REGIONS[resolved.id];
  if(region?.map && resolved.id!==activeRegionId) return;
  if(!coreMapReady) return;
  const bothInside=coreMapStations.has(state.current)&&coreMapStations.has(state.goal);
  if(!bothInside&&mapMode==="core") setMapMode("full",true);
}
function updateMapCoverageHint(){
  const hint=$("mapCoverageHint");
  const activeRegion=REGIONS[activeRegionId];
  if(!coreMapReady){hint.classList.add("hidden");return}
  const missing=[state.current,state.goal].filter(Boolean).filter(st=>!coreMapStations.has(st));
  if(missing.length){
    hint.classList.remove("hidden");
    hint.textContent=(activeRegion?.name||"地域図")+"の範囲外：" + [...new Set(missing)].join("・") + "。全駅表示で確認できます。";
  }else{
    hint.classList.add("hidden");
    hint.textContent="";
  }
}

function renderGame(){
  const r=shortest(state.current,state.goal);
  $("currentStat").textContent=displayStation(state.current);
  $("remainStat").textContent=r.distance??"-";
  $("goalStat").textContent=displayStation(state.goal);
  $("turnText").textContent="TURN "+state.turn;
  $("currentLines").innerHTML=lineChips(state.current);
  $("recommendation").textContent=recommendation();
  renderRouteCompass(r);
  $("dice").textContent=state.dice?["⚀","⚁","⚂","⚃","⚄","⚅"][state.dice-1]:"⚄";
  $("rollBtn").disabled=state.phase!=="game"||Boolean(state.dice);
  $("rollBtn").textContent=state.dice?"出目確定：移動先を選んでください":"サイコロを振る";
  $("diceStateText").textContent=state.dice?"候補カードまたは盤面から選択":"振って移動可能駅を表示";
  $("reachableSummary").classList.toggle("hidden",!state.dice||state.phase!=="game");
  if(state.dice&&state.phase==="game"){
    const names=Object.keys(state.reachable||{});
    $("reachableSummary").innerHTML="<strong>🎲 "+state.dice+"駅移動：</strong> "+names.length+"駅が候補です。<br>カードはゴールに近づく候補から表示しています。";
  }
  $("dicePanel").classList.toggle("hidden",state.phase!=="game");
  $("arrivalPanel").classList.toggle("hidden",state.phase!=="arrival");
  $("questPanel").classList.toggle("hidden",state.phase!=="quests");
  $("boardHint").textContent=mapMode==="core"
    ? (state.dice&&state.phase==="game"?"候補駅をタップして移動先を選択":"地域図 / 現在地・ゴール・おすすめ経路")
    : (state.dice&&state.phase==="game"?"緑の駅はタップ可能":"二重丸は乗換駅 / 太線は最短ルート");
  syncRegionalMapForState();
  ensureMapModeForState();
  renderCandidates();
  renderBoard();
  updateCoreMap();
  updateMapCoverageHint();
  if(state.phase==="arrival") renderArrival();
  if(state.phase==="quests") renderQuests();
  renderHistory();
  if(boardMode==="focus"&&lastBoardStation!==state.current){
    lastBoardStation=state.current;
    requestAnimationFrame(()=>centerCurrent(false));
  }
}

function rollDice(){
  if(state.phase!=="game"||state.dice) return;
  const d=$("dice"); d.classList.add("rolling"); $("rollBtn").disabled=true;
  let ticks=0; clearInterval(rollTimer);
  rollTimer=setInterval(()=>{
    const n=1+Math.floor(Math.random()*6);
    d.textContent=["⚀","⚁","⚂","⚃","⚄","⚅"][n-1];
    if(++ticks>=15){
      clearInterval(rollTimer); d.classList.remove("rolling");
      state.dice=1+Math.floor(Math.random()*6);
      const map=reachableExactly(state.current,state.dice);
      state.reachable={};
      for(const [station,path] of map) state.reachable[station]=path;
      // if goal can be reached in fewer than the roll, allow it as an arrival rule
      const goalRoute=shortest(state.current,state.goal);
      if(goalRoute.distance!==null && goalRoute.distance<=state.dice) state.reachable[state.goal]=goalRoute;
      log("サイコロ "+state.dice+"：移動候補 "+Object.keys(state.reachable).length+"駅");
      save(); renderGame();
      requestAnimationFrame(()=>$("candidatePanel").scrollIntoView({behavior:"smooth",block:"nearest"}));
    }
  },65);
}

function chooseTarget(station){
  if(!state.reachable[station]) return;
  state.target=station;
  state.targetPath=state.reachable[station];
  state.phase="arrival";
  log("移動先に "+station+" を選択");
  save(); renderGame();
  $("arrivalPanel").scrollIntoView({behavior:"smooth",block:"center"});
}
function renderArrival(){
  $("arrivalStation").textContent=state.target;
  $("arrivalCodes").innerHTML=lineChips(state.target);
  const p=state.targetPath;
  $("arrivalLineText").textContent=p&&p.edges.length ? LINES[p.edges[0].line].name+"から移動" : "";
  $("arrivalRoute").textContent=p&&p.nodes ? p.nodes.join(" → ") : "";
  $("mapLink").href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("JR東日本 "+state.target+"駅");
}
function changeTarget(){
  state.phase="game"; state.target=null; state.targetPath=null;
  save(); renderGame();
  requestAnimationFrame(()=>$("candidatePanel").scrollIntoView({behavior:"smooth",block:"center"}));
}

function buildQuests(station){
  const special=[
    station+"駅の駅名標を1枚残す",
    station+"駅で気になる出口から地上へ出る",
    ...QUEST_POOL
  ].sort(()=>Math.random()-.5);
  return special.slice(0,2).map(text=>({text,done:false}));
}
function playArrivalAnimation(station,path){
  const overlay=$("travelOverlay");
  $("travelTitle").textContent=station+"に到着！";
  $("travelRoute").textContent=path&&path.nodes?path.nodes.join(" → "):"次のクエストへ";
  overlay.classList.remove("hidden");
  const duration=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?120:950;
  setTimeout(()=>{
    overlay.classList.add("hidden");
    $("questPanel").scrollIntoView({behavior:"smooth",block:"center"});
  },duration);
}
function arrive(){
  if(state.phase!=="arrival"||!state.target) return;
  const arrivedAt=state.target;
  const travelledPath=state.targetPath;
  state.current=state.target;
  state.target=null; state.targetPath=null; state.reachable={}; state.dice=null;
  if(!state.quests[state.current]) state.quests[state.current]=buildQuests(state.current);
  state.phase="quests";
  log(state.current+" に到着");
  save(); renderGame();
  playArrivalAnimation(arrivedAt,travelledPath);
}
function renderQuests(){
  const q=state.quests[state.current]||(state.quests[state.current]=buildQuests(state.current));
  $("questTitle").textContent=state.current+"のクエスト";
  $("questList").innerHTML=q.map((x,i)=>
    '<div class="quest"><div class="quest-num">'+(i+1)+'</div><div><h3>'+escapeHtml(x.text)+'</h3><p>達成は任意です。</p></div><button class="check '+(x.done?"done":"")+'" data-q="'+i+'">'+(x.done?"✓":"○")+'</button></div>'
  ).join("");
  document.querySelectorAll("[data-q]").forEach(btn=>btn.onclick=()=>{
    q[Number(btn.dataset.q)].done=!q[Number(btn.dataset.q)].done;
    save(); renderQuests();
  });
  $("nextTurnBtn").textContent=state.current===state.goal?"旅を完了する":"次のサイコロへ";
}
function nextTurn(){
  if(state.current===state.goal){
    state.finished=true; state.phase="finished";
    log("ゴール "+state.goal+" に到着");
    save(); renderFinish(); show("finishView"); return;
  }
  state.phase="game"; state.turn++;
  save(); renderGame();
  requestAnimationFrame(()=>$("dicePanel").scrollIntoView({behavior:"smooth",block:"start"}));
}
function renderFinish(){
  const done=Object.values(state.quests).flat().filter(q=>q.done).length;
  $("finishText").innerHTML="<strong>"+escapeHtml(state.start)+"</strong> から <strong>"+escapeHtml(state.goal)+"</strong> まで完走しました。<br>全 "+state.turn+" ターン / クエスト達成 "+done+" 件";
}
function resume(){
  renderGame(); show("gameView");
}
function hardReset(){
  if(!confirm("保存中の旅を初期化します。よろしいですか？")) return;
  localStorage.removeItem(KEY); LEGACY_KEYS.forEach(key=>localStorage.removeItem(key));
  state=fresh(); setupStart=setupGoal=null; boardMode="focus"; lastBoardStation=null;
  updateResume(); show("homeView"); toast("初期化しました");
}

function fitBoard(){
  boardMode="overview";
  if(mapMode==="overview"){
    renderOverviewMap();
  }else if(mapMode==="core"){
    const el=$("coreMapScroll"),svg=$("coreMapMount").querySelector("svg");
    el.classList.add("overview");
    if(svg) svg.classList.add("labels-major-only");
    el.scrollTo({left:0,top:0,behavior:"smooth"});
  }else{
    const el=$("networkScroll");
    el.classList.add("overview");
    el.scrollTo({left:0,top:0,behavior:"smooth"});
  }
  $("fitBtn").textContent="全体表示中";
  $("fitBtn").setAttribute("aria-pressed","true");
  $("centerBtn").setAttribute("aria-pressed","false");
}
function centerCurrent(smooth=true){
  boardMode="focus";
  $("fitBtn").textContent="全体";
  $("fitBtn").setAttribute("aria-pressed","false");
  $("centerBtn").setAttribute("aria-pressed","true");

  if(mapMode==="overview"){
    renderOverviewMap();
    return;
  }
  if(mapMode==="core"){
    const el=$("coreMapScroll"),svg=$("coreMapMount").querySelector("svg");
    el.classList.remove("overview");
    if(svg) svg.classList.remove("labels-major-only");
    const node=coreStationElement(state.current);
    if(!node) return;
    requestAnimationFrame(()=>{
      const box=node.getBBox(),vb=svg.viewBox.baseVal;
      const scale=svg.getBoundingClientRect().width/vb.width;
      const x=(box.x+box.width/2)*scale;
      const y=(box.y+box.height/2)*scale;
      el.scrollTo({left:Math.max(0,x-el.clientWidth/2),top:Math.max(0,y-el.clientHeight/2),behavior:smooth?"smooth":"auto"});
    });
    return;
  }
  const occ=(OCCURRENCES[state.current]||[])[0];
  if(!occ) return;
  const el=$("networkScroll");
  el.classList.remove("overview");
  requestAnimationFrame(()=>{
    const p=occurrencePoint(occ.lineId,occ.pathIndex,occ.index);
    el.scrollTo({left:Math.max(0,p.x-el.clientWidth/2),top:Math.max(0,p.y-el.clientHeight/2),behavior:smooth?"smooth":"auto"});
  });
}

$("networkStat").textContent=LINE_ORDER.length+"路線 / "+ALL_STATIONS.length+"駅ネットワーク";
$("newGameBtn").onclick=newGame;
$("resumeBtn").onclick=resume;
$("cancelSetupBtn").onclick=()=>show("homeView");
$("drawStartBtn").onclick=()=>{
  setupStart=randomStation(); setupGoal=null;
  $("goalSlot").textContent="？"; $("goalLines").innerHTML="";
  $("confirmSetupBtn").disabled=true; $("drawStartBtn").disabled=true;
  slotAnimate($("startSlot"),setupStart,()=>{
    $("drawStartBtn").disabled=false; $("drawGoalBtn").disabled=false;
    $("startLines").innerHTML=lineChips(setupStart);
  });
};
$("drawGoalBtn").onclick=()=>{
  setupGoal=randomGoalFrom(setupStart); $("drawGoalBtn").disabled=true;
  slotAnimate($("goalSlot"),setupGoal,()=>{
    $("drawGoalBtn").disabled=false; $("confirmSetupBtn").disabled=false;
    $("goalLines").innerHTML=lineChips(setupGoal); updateSetupRoute();
  });
};
$("confirmSetupBtn").onclick=confirmSetup;
$("rollBtn").onclick=rollDice;
$("arrivedBtn").onclick=arrive;
$("changeTargetBtn").onclick=changeTarget;
$("nextTurnBtn").onclick=nextTurn;
$("restartBtn").onclick=newGame;
$("backHomeBtn").onclick=()=>show("homeView");
$("resetBtn").onclick=hardReset;
$("fitBtn").onclick=fitBoard;
$("centerBtn").onclick=centerCurrent;
$("overviewMapBtn").onclick=()=>setMapMode("overview");
$("coreMapBtn").onclick=()=>{
  if(!$("coreMapBtn").disabled) setMapMode("core");
};
$("fullMapBtn").onclick=()=>setMapMode("full");

updateResume();
show("homeView");
initCoreMap();
