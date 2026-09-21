/* Design study: isolated, unsaved session. Network core mirrors app.js. */
let position='大手町', goal='渋谷', rolled=3, selected=null, turn=1, arrived=false;
const routeCache=new Map();
function travelRoute(start,end){
 const key=start+'|'+end;if(routeCache.has(key))return routeCache.get(key);
 const queue=[{station:start,line:null,nodes:[start],edges:[],changes:0}],visited=new Set();
 while(queue.length){
  queue.sort((a,b)=>a.edges.length-b.edges.length||a.changes-b.changes);
  const item=queue.shift(),stateKey=item.station+'|'+item.line;
  if(visited.has(stateKey))continue;visited.add(stateKey);
  if(item.station===end){const route={nodes:item.nodes,edges:item.edges,distance:item.edges.length};routeCache.set(key,route);return route}
  for(const edge of GRAPH[item.station])queue.push({station:edge.to,line:edge.line,nodes:[...item.nodes,edge.to],edges:[...item.edges,{from:item.station,to:edge.to,line:edge.line}],changes:item.changes+(item.line&&item.line!==edge.line?1:0)});
 }
 return shortest(start,end);
}
function optionsFor(start,steps){
 const choices=reachableExactly(start,steps);
 const finish=shortest(start,goal);
 if(finish.distance>0 && finish.distance<=steps) choices.set(goal,finish);
 return [...choices].sort((a,b)=>shortest(a[0],goal).distance-shortest(b[0],goal).distance || a[0].localeCompare(b[0],'ja'));
}
function transfers(route){return route.edges.reduce((n,e,i)=>n+(i>0&&e.line!==route.edges[i-1].line?1:0),0)}
function shortName(name){return name.replace('〈原宿〉','').replace('〈丸の内〉','').replace('〈スカイツリー前〉','')}
function drawMap(){
 const first=selected&&!arrived?travelRoute(position,selected):{nodes:[position],edges:[],distance:0};
 const onward=travelRoute(selected&&!arrived?selected:position,goal);
 const compact=document.querySelector('.atlas').clientWidth<701;
 const nodes=[...first.nodes,...(compact?(onward.distance>0?[goal]:[]):onward.nodes.slice(1))];
 const cols=compact?3:4,rows=Math.max(2,Math.ceil(nodes.length/cols)),height=rows*(compact?110:140)+80;
 const points=nodes.map((name,i)=>{const row=Math.floor(i/cols),col=i%cols;return {name,x:compact?(row%2?70+col*160:390-col*160):(row%2?110+col*190:680-col*190),y:height-80-row*(compact?110:140)}});
 const svg=$('journey-map');svg.setAttribute('viewBox',`0 0 ${compact?460:800} ${height+40}`);
 svg.setAttribute('aria-label',[...first.nodes,...onward.nodes.slice(1)].join('、')+'。選択駅まで'+first.distance+'マス、その先ゴールまで'+onward.distance+'マス'+(compact?'。ゴールまでの途中駅は図では省略。':''));
 let markup='<title>選択駅を経由したゴールへの最短経路</title>';
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],active=i<=first.distance;
  markup+=`<path d="M${a.x} ${a.y} L${b.x} ${b.y}" fill="none" stroke="${active?'#254e40':'#bbc5b5'}" stroke-width="7" stroke-linecap="round" ${active?'':'stroke-dasharray="2 13"'}/>`;
 }
 points.forEach((p,i)=>{
  const isCurrent=i===0,isChoice=i===first.distance&&first.distance>0,isGoal=i===points.length-1&&p.name===goal;
  const incoming=i<=first.distance?first.edges[i-1]:onward.edges[i-first.distance-1];
  const outgoing=i<first.distance?first.edges[i]:onward.edges[i-first.distance];
  const transfer=!(compact&&isGoal)&&incoming&&outgoing&&incoming.line!==outgoing.line;
  if(isCurrent||isChoice||isGoal) markup+=`<circle cx="${p.x}" cy="${p.y}" r="${isChoice?28:24}" fill="${isChoice?'#dae6c4':'#f1f2ea'}"/>`;
  markup+=`<circle cx="${p.x}" cy="${p.y}" r="${isCurrent||isGoal?12:8}" fill="${isCurrent?'#254e40':'#f1f2ea'}" stroke="${i<=first.distance?'#254e40':'#85977c'}" stroke-width="3"/>`;
  if(transfer) markup+=`<circle cx="${p.x}" cy="${p.y}" r="14" fill="none" stroke="#254e40" stroke-width="2"/>`;
  const parts=shortName(p.name).split('／');
  parts.forEach((part,j)=>markup+=`<text x="${p.x}" y="${p.y+36+j*20}" text-anchor="middle" fill="#29392d" font-size="${isCurrent||isChoice||isGoal?19:16}" font-weight="${isCurrent||isChoice?'600':'400'}">${part}</text>`);
  const label=isCurrent?'現在地':isGoal?(compact&&onward.distance?'GOAL · あと'+onward.distance+'マス':'GOAL'):isChoice?'選択中':transfer?'乗換 '+incoming.line+' → '+outgoing.line:'';
  if(label) markup+=`<text x="${p.x}" y="${p.y-28}" text-anchor="middle" fill="#607356" font-size="12" letter-spacing="1">${label}</text>`;
 });
 svg.innerHTML=markup;
}
function render(){
 $('current').textContent=position;$('turn').textContent=String(turn).padStart(2,'0')+' 回目';
 $('remaining').textContent='現在地から最短 '+shortest(position,goal).distance+' マス';
 $('selection-screen').hidden=arrived;$('arrival-screen').hidden=!arrived;
 $('die-number').textContent=rolled??'–';document.querySelector('.die').setAttribute('aria-label',rolled?'出目'+rolled:'出目未確定');
 $('roll').hidden=rolled!==null;$('move').hidden=rolled===null;
 $('panel-title').textContent=rolled===null?'次の寄り道へ':'行き先を選ぶ';
 $('hint').textContent=rolled===null?'サイコロを振ると、行ける駅が現れます。':'ゴールに近い順。気になる駅を選ぼう。';
 const candidates=rolled===null?[]:optionsFor(position,rolled);
 if(!selected&&candidates.length) selected=candidates[0][0];
 $('candidates').replaceChildren();
 candidates.forEach(([name],i)=>{
  const route=travelRoute(position,name);
  const button=document.createElement('button');button.className='candidate';button.setAttribute('aria-pressed',String(name===selected));
  button.innerHTML=`<span class="index">${String(i+1).padStart(2,'0')}</span><span><strong>${name}</strong><small>${name===goal?'ゴールに到着':`ゴールまで ${shortest(name,goal).distance} マス`} · 乗換${transfers(route)}回</small></span><span class="arrow">${name===selected?'↗':'→'}</span>`;
  button.onclick=()=>{selected=name;render()};$('candidates').append(button);
 });
 if(selected&&!arrived){
  const route=travelRoute(position,selected);
  $('route-detail').innerHTML=`<strong>${route.distance} マス / ${route.edges.filter((e,i)=>!i||e.line!==route.edges[i-1].line).map(e=>LINES[e.line].name).join(' → ')}</strong><br>${route.nodes.join(' → ')}`;
  $('heading').textContent=shortName(selected).split('／')[0]+'へ、寄り道。';
  $('map-caption').textContent='選んだ駅と、その先の渋谷まで。';
 }else{
  $('route-detail').textContent='';$('heading').textContent=arrived?(position===goal?'旅の終わり、次の始まり。':'到着。少し、歩こう。'):'今日は、どこへ。';
  $('map-caption').textContent=arrived?'駅の外にも、旅のつづきがある。':'行き先を選んで、いつもと違う東京へ。';
 }
 $('move').disabled=!selected;drawMap();
}
$('move').onclick=()=>{
 if(!selected||!optionsFor(position,rolled).some(([name])=>name===selected))return;
 position=selected;selected=null;arrived=true;
 $('arrival-title').textContent=position===goal?'渋谷、到着。':shortName(position).split('／')[0]+'、到着。';
 $('quests').replaceChildren();
 const quests=[...QUEST_POOL].sort(()=>0.5-Math.random()).slice(0,2);
 quests.forEach(q=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';label.append(input,document.createTextNode(q));$('quests').append(label)});
 $('continue').innerHTML=position===goal?'もう一度旅する <span>↗</span>':'旅を続ける <span>→</span>';
 render();$('arrival-title').tabIndex=-1;$('arrival-title').focus({preventScroll:true});
};
function restart(){position='大手町';rolled=3;selected=null;turn=1;arrived=false;render()}
$('restart').onclick=restart;
$('continue').onclick=()=>{if(position===goal){restart();return}arrived=false;rolled=null;selected=null;turn++;render();$('roll').focus({preventScroll:true})};
$('roll').onclick=()=>{if(rolled!==null)return;rolled=1+Math.floor(Math.random()*6);render();$('candidates').querySelector('button')?.focus({preventScroll:true})};
$('mobile-preview').onclick=()=>{const active=document.body.classList.toggle('preview');$('mobile-preview').setAttribute('aria-pressed',String(active));$('mobile-preview').textContent=active?'通常幅に戻す':'スマホ幅で試す';drawMap()};
window.addEventListener('resize',drawMap);
render();
