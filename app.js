const $ = id => document.getElementById(id);

const LINES = {
  G:{name:"銀座線",color:"#f39700",paths:[["渋谷","表参道","外苑前","青山一丁目","赤坂見附","溜池山王","虎ノ門","新橋","銀座","京橋","日本橋","三越前","神田","末広町","上野広小路","上野","稲荷町","田原町","浅草"]]},
  M:{name:"丸ノ内線",color:"#e60012",paths:[["荻窪","南阿佐ケ谷","新高円寺","東高円寺","新中野","中野坂上","西新宿","新宿","新宿三丁目","新宿御苑前","四谷三丁目","四ツ谷","赤坂見附","国会議事堂前","霞ケ関","銀座","東京","大手町","淡路町","御茶ノ水","本郷三丁目","後楽園","茗荷谷","新大塚","池袋"],["方南町","中野富士見町","中野新橋","中野坂上"]]},
  H:{name:"日比谷線",color:"#9caeb7",paths:[["北千住","南千住","三ノ輪","入谷","上野","仲御徒町","秋葉原","小伝馬町","人形町","茅場町","八丁堀","築地","東銀座","銀座","日比谷","霞ケ関","虎ノ門ヒルズ","神谷町","六本木","広尾","恵比寿","中目黒"]]},
  T:{name:"東西線",color:"#00a7db",paths:[["中野","落合","高田馬場","早稲田","神楽坂","飯田橋","九段下","竹橋","大手町","日本橋","茅場町","門前仲町","木場","東陽町","南砂町","西葛西","葛西","浦安","南行徳","行徳","妙典","原木中山","西船橋"]]},
  C:{name:"千代田線",color:"#00bb85",paths:[["代々木上原","代々木公園","明治神宮前〈原宿〉","表参道","乃木坂","赤坂","国会議事堂前","霞ケ関","日比谷","二重橋前〈丸の内〉","大手町","新御茶ノ水","湯島","根津","千駄木","西日暮里","町屋","北千住","綾瀬","北綾瀬"]]},
  Y:{name:"有楽町線",color:"#c1a470",paths:[["和光市","地下鉄成増","地下鉄赤塚","平和台","氷川台","小竹向原","千川","要町","池袋","東池袋","護国寺","江戸川橋","飯田橋","市ケ谷","麹町","永田町","桜田門","有楽町","銀座一丁目","新富町","月島","豊洲","辰巳","新木場"]]},
  Z:{name:"半蔵門線",color:"#8f76d6",paths:[["渋谷","表参道","青山一丁目","永田町","半蔵門","九段下","神保町","大手町","三越前","水天宮前","清澄白河","住吉","錦糸町","押上〈スカイツリー前〉"]]},
  N:{name:"南北線",color:"#00ada9",paths:[["目黒","白金台","白金高輪","麻布十番","六本木一丁目","溜池山王","永田町","四ツ谷","市ケ谷","飯田橋","後楽園","東大前","本駒込","駒込","西ケ原","王子","王子神谷","志茂","赤羽岩淵"]]},
  F:{name:"副都心線",color:"#9c5e31",paths:[["和光市","地下鉄成増","地下鉄赤塚","平和台","氷川台","小竹向原","千川","要町","池袋","雑司が谷","西早稲田","東新宿","新宿三丁目","北参道","明治神宮前〈原宿〉","渋谷"]]}
};

const LINE_ORDER = ["G","M","H","T","C","Y","Z","N","F"];
const TRANSFER_GROUPS = [
  ["赤坂見附","永田町"],
  ["国会議事堂前","溜池山王"],
  ["淡路町","新御茶ノ水"],
  ["上野広小路","仲御徒町"],
  ["銀座","銀座一丁目"],
  ["新富町","築地"]
];

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

const VERSION="0.5";
const KEY="kimagureMetroTripV05";
const LEGACY_KEYS=["kimagureMetroTripV04"];
function fresh(){
  return {
    version:VERSION,phase:"home",start:null,goal:null,current:null,dice:null,
    reachable:{},target:null,targetPath:null,turn:1,quests:{},history:[],finished:false
  };
}
let state=load()||fresh();
let setupStart=null,setupGoal=null,rollTimer=null,boardMode="focus",lastBoardStation=null;
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
      if(legacy&&legacy.version==="0.4") return {...fresh(),...legacy,version:VERSION};
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
const BOARD = {left:118,top:70,dx:68,dy:86,width:1840,height:860};
function svgEl(tag,attrs={}){
  const el=document.createElementNS(SVG_NS,tag);
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  return el;
}
function occurrencePoint(lineId,pathIndex,index){
  const row=LINE_ORDER.indexOf(lineId);
  const path=LINES[lineId].paths[pathIndex];
  let x=BOARD.left+index*BOARD.dx;
  if(lineId==="M"&&pathIndex===1) x=BOARD.left+2*BOARD.dx+index*BOARD.dx;
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
  $("boardHint").textContent=state.dice&&state.phase==="game"?"緑の駅はタップ可能":"二重丸は乗換駅 / 太線は最短ルート";
  renderCandidates();
  renderBoard();
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
  $("mapLink").href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("東京メトロ "+state.target+"駅");
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
  const el=$("networkScroll");
  boardMode="overview";
  el.classList.add("overview");
  el.scrollTo({left:0,top:0,behavior:"smooth"});
  $("fitBtn").textContent="全体表示中";
  $("fitBtn").setAttribute("aria-pressed","true");
  $("centerBtn").setAttribute("aria-pressed","false");
}
function centerCurrent(smooth=true){
  const occ=(OCCURRENCES[state.current]||[])[0];
  if(!occ) return;
  const el=$("networkScroll");
  boardMode="focus";
  el.classList.remove("overview");
  $("fitBtn").textContent="全体";
  $("fitBtn").setAttribute("aria-pressed","false");
  $("centerBtn").setAttribute("aria-pressed","true");
  requestAnimationFrame(()=>{
    const p=occurrencePoint(occ.lineId,occ.pathIndex,occ.index);
    el.scrollTo({left:Math.max(0,p.x-el.clientWidth/2),top:Math.max(0,p.y-el.clientHeight/2),behavior:smooth?"smooth":"auto"});
  });
}

$("networkStat").textContent="9路線 / "+ALL_STATIONS.length+"駅ネットワーク";
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
  setupGoal=randomStation(setupStart); $("drawGoalBtn").disabled=true;
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

updateResume();
show("homeView");
