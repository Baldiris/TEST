const $ = id => document.getElementById(id);

const LINES = {
  JY:{name:"山手線",color:"#9acd32",closed:true,paths:[["東京","神田","秋葉原","御徒町","上野","鶯谷","日暮里","西日暮里","田端","駒込","巣鴨","大塚","池袋","目白","高田馬場","新大久保","新宿","代々木","原宿","渋谷","恵比寿","目黒","五反田","大崎","品川","高輪ゲートウェイ","田町","浜松町","新橋","有楽町"]]},
  JK:{name:"京浜東北・根岸線",color:"#00a7c4",paths:[["大宮","さいたま新都心","与野","北浦和","浦和","南浦和","蕨","西川口","川口","赤羽","東十条","王子","上中里","田端","西日暮里","日暮里","鶯谷","上野","御徒町","秋葉原","神田","東京","有楽町","新橋","浜松町","田町","高輪ゲートウェイ","品川","大井町","大森","蒲田","川崎","鶴見","新子安","東神奈川","横浜","桜木町","関内","石川町","山手","根岸","磯子","新杉田","洋光台","港南台","本郷台","大船"]]},
  JC:{name:"中央線快速",color:"#f15a22",paths:[["東京","神田","御茶ノ水","四ツ谷","新宿","中野","高円寺","阿佐ケ谷","荻窪","西荻窪","吉祥寺","三鷹","武蔵境","東小金井","武蔵小金井","国分寺","西国分寺","国立","立川","日野","豊田","八王子","西八王子","高尾"]]},
  JB:{name:"中央・総武線各駅停車",color:"#ffd400",paths:[["三鷹","吉祥寺","西荻窪","荻窪","阿佐ケ谷","高円寺","中野","東中野","大久保","新宿","代々木","千駄ケ谷","信濃町","四ツ谷","市ケ谷","飯田橋","水道橋","御茶ノ水","秋葉原","浅草橋","両国","錦糸町","亀戸","平井","新小岩","小岩","市川","本八幡","下総中山","西船橋","船橋","東船橋","津田沼","幕張本郷","幕張","新検見川","稲毛","西千葉","千葉"]]},
  JA:{name:"埼京線",color:"#00a65a",paths:[["大崎","恵比寿","渋谷","新宿","池袋","板橋","十条","赤羽","北赤羽","浮間舟渡","戸田公園","戸田","北戸田","武蔵浦和","中浦和","南与野","与野本町","北与野","大宮"]]},
  JT:{name:"東海道線",color:"#f68b1e",paths:[["東京","新橋","品川","川崎","横浜","戸塚","大船","藤沢","辻堂","茅ケ崎","平塚","大磯","二宮","国府津","鴨宮","小田原","早川","根府川","真鶴","湯河原","熱海"]]},
  JO:{name:"横須賀線",color:"#0067c0",paths:[["東京","新橋","品川","西大井","武蔵小杉","新川崎","横浜","保土ケ谷","東戸塚","戸塚","大船","北鎌倉","鎌倉","逗子","東逗子","田浦","横須賀","衣笠","久里浜"]]},
  JE:{name:"京葉線",color:"#c9252d",paths:[["東京","八丁堀","越中島","潮見","新木場","葛西臨海公園","舞浜","新浦安","市川塩浜","二俣新町","南船橋","新習志野","幕張豊砂","海浜幕張","検見川浜","稲毛海岸","千葉みなと","蘇我"]]},
  JM:{name:"武蔵野線",color:"#f15a22",paths:[["府中本町","北府中","西国分寺","新小平","新秋津","東所沢","新座","北朝霞","西浦和","武蔵浦和","南浦和","東浦和","東川口","南越谷","越谷レイクタウン","吉川","吉川美南","新三郷","三郷","南流山","新松戸","新八柱","東松戸","市川大野","船橋法典","西船橋"]]},
  JN:{name:"南武線",color:"#ffd400",paths:[["川崎","尻手","矢向","鹿島田","平間","向河原","武蔵小杉","武蔵中原","武蔵新城","武蔵溝ノ口","津田山","久地","宿河原","登戸","中野島","稲田堤","矢野口","稲城長沼","南多摩","府中本町","分倍河原","西府","谷保","矢川","西国立","立川"]]},
  JH:{name:"横浜線",color:"#8fc31f",paths:[["東神奈川","大口","菊名","新横浜","小机","鴨居","中山","十日市場","長津田","成瀬","町田","古淵","淵野辺","矢部","相模原","橋本","相原","八王子みなみ野","片倉","八王子"]]},
  SG:{name:"相模線",color:"#009793",paths:[["茅ケ崎","北茅ケ崎","香川","寒川","宮山","倉見","門沢橋","社家","厚木","海老名","入谷","相武台下","下溝","原当麻","番田","上溝","南橋本","橋本"]]},
  JJ:{name:"常磐線快速",color:"#00a66a",paths:[["上野","日暮里","三河島","南千住","北千住","松戸","柏","我孫子","天王台","取手"]]},
  JU:{name:"宇都宮線",color:"#f68b1e",paths:[["上野","尾久","赤羽","浦和","さいたま新都心","大宮","土呂","東大宮","蓮田","白岡","新白岡","久喜","東鷲宮","栗橋","古河","野木","間々田","小山","小金井","自治医大","石橋","雀宮","宇都宮"]]},
  TAK:{name:"高崎線",color:"#c05a9d",paths:[["上野","尾久","赤羽","浦和","さいたま新都心","大宮","宮原","上尾","北上尾","桶川","北本","鴻巣","北鴻巣","吹上","行田","熊谷","籠原","深谷","岡部","本庄","神保原","新町","倉賀野","高崎"]]},
  KW:{name:"川越線",color:"#00a65a",paths:[["大宮","日進","西大宮","指扇","南古谷","川越","西川越","的場","笠幡","武蔵高萩","高麗川"]]}
};

const LINE_ORDER = ["JY","JK","JC","JB","JA","JT","JO","JE","JM","JN","JH","SG","JJ","JU","TAK","KW"];
const TRANSFER_GROUPS = [];

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

const VERSION="0.1";
const KEY="kimagureJREastKantoV01";
const LEGACY_KEYS=[];
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
      if(legacy&&legacy.version===VERSION) return {...fresh(),...legacy,version:VERSION};
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
