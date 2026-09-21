/* Design study: isolated, unsaved session. Network core mirrors app.js. */
let position='大手町', goal='渋谷', rolled=null, selected=null, turn=1, arrived=false;
let busy=null,pendingRoll=null,reelValue=1,reelMotion=null,soundOn=false,audioContext=null;
const effectTimers=new Set();
function later(callback,delay){const id=setTimeout(()=>{effectTimers.delete(id);callback()},delay);effectTimers.add(id);return id}
function cancelEffects(){for(const id of effectTimers)clearTimeout(id);effectTimers.clear();reelMotion?.cancel();reelMotion=null;document.body.classList.remove('is-spinning','is-moving','just-rolled','has-arrived','is-goal')}
function reducedMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches}
function tone(frequency,duration=.05,delay=0){
 if(!soundOn||!audioContext||audioContext.state!=='running')return;
 try{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),time=audioContext.currentTime+delay;
 oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.035,time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
 oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(time);oscillator.stop(time+duration+.01);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};}catch{/* Sound never blocks play. */}
}
function tickReel(value,duration){
 const track=$('reel-track');track.innerHTML=`<span>${reelValue}</span><span>${value}</span><span>${value%6+1}</span>`;
 reelMotion?.cancel();
 if(!reducedMotion()&&track.animate)reelMotion=track.animate([{transform:'translateY(0)'},{transform:'translateY(-96px)'}],{duration,easing:'cubic-bezier(.16,.55,.35,1)',fill:'forwards'});
 reelValue=value;tone(310+value*35,.035);
}
function finishRoll(){
 if(busy!=='rolling')return;
 const result=pendingRoll;cancelEffects();busy=null;pendingRoll=null;rolled=result;selected=null;
 render();document.body.classList.add('just-rolled');
 const count=optionsFor(position,rolled).length;
 $('play-status').textContent=`${rolled}マスに決定。${count}駅から選べます。`;
 tone(660,.1);tone(880,.16,.09);
 $('candidates').querySelector('button')?.focus({preventScroll:true});
 later(()=>document.body.classList.remove('just-rolled'),900);
}
function spinDice(){
 if(rolled!==null||busy||arrived)return;
 cancelEffects();pendingRoll=1+Math.floor(Math.random()*6);busy='rolling';selected=null;
 audioContext?.resume().catch(()=>{});render();document.body.classList.add('is-spinning');
 $('play-status').textContent='サイコロが回っています。結果を見るボタンで演出をスキップできます。';
 if(reducedMotion()){finishRoll();return}
 $('skip-spin').focus({preventScroll:true});
 const delays=[65,65,65,70,75,85,100,125,160,200,245,290];
 let elapsed=0;
 delays.forEach((duration,index)=>{
  later(()=>{if(busy!=='rolling')return;tickReel(reelValue%6+1,duration);if(index===8){$('reel-caption').textContent='まもなく、決まる。';$('reel-message').textContent='次の寄り道まで、あと少し。'}},elapsed);
  elapsed+=duration;
 });
 later(()=>{if(busy==='rolling'){tickReel(pendingRoll,260);$('reel-caption').textContent='この一歩から。'}},elapsed);
 later(finishRoll,elapsed+340);
}
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
 if(busy==='moving'&&first.distance>0&&!reducedMotion()){
  const path=points.slice(0,first.distance+1).map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ');
  markup+=`<circle r="12" fill="#c59643" stroke="#fcfcf9" stroke-width="4"><animateMotion dur="0.85s" path="${path}" fill="freeze" calcMode="paced"/></circle>`;
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
 $('roll').hidden=rolled!==null||busy==='rolling';$('move').hidden=rolled===null;$('skip-spin').hidden=busy!=='rolling';
 $('roll-stage').hidden=rolled!==null;$('candidates').hidden=rolled===null;
 $('roll-result').hidden=rolled===null;
 $('reel-caption').textContent=busy==='rolling'?'次は、どこまで。':'ひと振りで、旅が動く。';
 $('reel-message').textContent=busy==='rolling'?'数字が止まる、その瞬間まで。':'次の一駅は、まだ知らない。';
 $('panel-title').textContent=busy==='rolling'?'運命のひと振り':busy==='moving'?'次の駅へ移動中':rolled===null?'次の寄り道へ':'行き先を選ぶ';
 $('hint').textContent=rolled===null?'サイコロを振ると、行ける駅が現れます。':'ゴールに近い順。気になる駅を選ぼう。';
 const candidates=rolled===null?[]:optionsFor(position,rolled);
 $('roll-result').textContent=rolled===null?'':`${rolled} マス。${candidates.length}駅の可能性。`;
 if(!selected&&candidates.length) selected=candidates[0][0];
 $('candidates').replaceChildren();
 candidates.forEach(([name],i)=>{
  const route=travelRoute(position,name);
  const button=document.createElement('button');button.className='candidate';button.setAttribute('aria-pressed',String(name===selected));
  button.disabled=busy!==null;button.style.setProperty('--reveal-delay',Math.min(i,6)*45+'ms');
  button.innerHTML=`<span class="index">${String(i+1).padStart(2,'0')}</span><span><strong>${name}</strong><small>${name===goal?'ゴールに到着':`ゴールまで ${shortest(name,goal).distance} マス`} · 乗換${transfers(route)}回</small></span><span class="arrow">${name===selected?'↗':'→'}</span>`;
  button.onclick=()=>{if(busy)return;selected=name;document.body.classList.remove('just-rolled');render()};$('candidates').append(button);
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
 $('move').disabled=!selected||busy!==null;
 $('move').innerHTML=busy==='moving'?'移動中… <span>→</span>':'この駅へ進む <span>↗</span>';
 drawMap();
}
function arriveAt(target){
 cancelEffects();busy=null;position=target;selected=null;arrived=true;
 const finished=position===goal;
 $('arrival-title').textContent=position===goal?'渋谷、到着。':shortName(position).split('／')[0]+'、到着。';
 $('arrival-kicker').textContent=finished?'DESTINATION REACHED':'NEW STOP, NEW STORY';
 $('arrival-symbol').textContent=finished?'✳':'↗';
 $('arrival-message').textContent=finished?`${turn}回のひと振りで、渋谷へ。最後の寄り道も楽しもう。`:'ここでしか出会えないものを、ふたつ。';
 $('celebration').innerHTML=finished?Array.from({length:16},(_,i)=>`<i style="--x:${(i%8)*13}%;--drift:${i%2?35:-35}px;--delay:${i*35}ms;--turn:${i*67}deg"></i>`).join(''):'';
 $('quests').replaceChildren();
 const quests=[...QUEST_POOL].sort(()=>0.5-Math.random()).slice(0,2);
 quests.forEach(q=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.onchange=()=>{if(input.checked)tone(740,.07)};label.append(input,document.createTextNode(q));$('quests').append(label)});
 $('continue').innerHTML=position===goal?'もう一度旅する <span>↗</span>':'旅を続ける <span>→</span>';
 render();$('arrival-title').tabIndex=-1;$('arrival-title').focus({preventScroll:true});
 document.body.classList.add('has-arrived');document.body.classList.toggle('is-goal',finished);
 $('play-status').textContent=finished?'ゴール！渋谷に到着しました。':position+'に到着しました。';
 tone(523,.12);tone(659,.13,.12);if(finished){tone(784,.15,.24);tone(1047,.3,.4)}
}
$('move').onclick=()=>{
 if(busy||rolled===null||!selected||!optionsFor(position,rolled).some(([name])=>name===selected))return;
 const target=selected;cancelEffects();busy='moving';render();document.body.classList.add('is-moving');
 $('play-status').textContent=target+'へ移動中。';
 if(reducedMotion())arriveAt(target);else later(()=>arriveAt(target),900);
};
function restart(){cancelEffects();busy=null;pendingRoll=null;position='大手町';rolled=null;selected=null;turn=1;arrived=false;$('reel-track').innerHTML='<span>6</span><span>?</span><span>1</span>';$('play-status').textContent='大手町から、新しい旅を始めます。';render()}
$('restart').onclick=restart;
$('continue').onclick=()=>{if(!arrived)return;if(position===goal){restart();$('roll').focus({preventScroll:true});return}cancelEffects();arrived=false;rolled=null;selected=null;turn++;$('reel-track').innerHTML='<span>6</span><span>?</span><span>1</span>';render();$('roll').focus({preventScroll:true})};
$('roll').onclick=spinDice;
$('skip-spin').onclick=finishRoll;
$('sound').onclick=()=>{
 soundOn=!soundOn;
 if(soundOn){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('unsupported');audioContext??=new Audio();audioContext.resume().then(()=>tone(660,.08)).catch(()=>{soundOn=false;$('sound').textContent='効果音 OFF';$('sound').setAttribute('aria-pressed','false')})}catch{soundOn=false}}
 $('sound').textContent=soundOn?'効果音 ON':'効果音 OFF';$('sound').setAttribute('aria-pressed',String(soundOn));
};
$('mobile-preview').onclick=()=>{const active=document.body.classList.toggle('preview');$('mobile-preview').setAttribute('aria-pressed',String(active));$('mobile-preview').textContent=active?'通常幅に戻す':'スマホ幅で試す';drawMap()};
window.addEventListener('resize',drawMap);
render();
