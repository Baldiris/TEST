const $=id=>document.getElementById(id);
const LINES={
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
const TRANSFER_GROUPS=[
 ["赤坂見附","永田町"],["国会議事堂前","溜池山王"],["淡路町","新御茶ノ水"],
 ["上野広小路","仲御徒町"],["銀座","銀座一丁目"],["新富町","築地"]
];
const QUEST_POOL=["駅名が入った看板を写真に残す","駅周辺で気になる店を1軒見つける","5分だけ知らない方向へ歩く","その駅らしい風景を1つ見つける","駅の出口をいつもと違う方向から使う","街の音を1分だけ意識して聞く","面白い建物や看板を1つ見つける","次に来たい場所を1つメモする"];
const KEY="kimagureMetroTripV03";
const allStations=[...new Set(Object.values(LINES).flatMap(l=>l.paths.flat()))];

function sameComplex(a,b){if(a===b)return true;return TRANSFER_GROUPS.some(g=>g.includes(a)&&g.includes(b))}
function complexMembers(a){const g=TRANSFER_GROUPS.find(g=>g.includes(a));return g?g:[a]}
function displayLines(st){
  const members=complexMembers(st),out=[];
  for(const [id,line] of Object.entries(LINES)){
    if(line.paths.some(p=>p.some(x=>members.some(m=>sameComplex(x,m)))))out.push(id)
  }
  return [...new Set(out)]
}
function lineCodeChip(id){const l=LINES[id];return '<span class="chip"><i class="line-dot" style="background:'+l.color+'"></i>'+id+' '+l.name+'</span>'}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fresh(){return{version:"0.3",phase:"home",start:null,goal:null,current:null,selected:null,dice:null,target:null,targetLine:null,turn:1,quests:{},history:[],finished:false}}
let state=load()||fresh(),setupStart=null,setupGoal=null,rolling=null;
const views=["homeView","setupView","gameView","finishView"];
function save(){localStorage.setItem(KEY,JSON.stringify(state));updateResume()}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&x.version==="0.3"?x:null}catch{return null}}
function show(id){views.forEach(v=>$(v).classList.toggle("hidden",v!==id));scrollTo({top:0,behavior:"smooth"})}
function toast(s){const t=$("toast");t.textContent=s;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),1600)}
function log(s){state.history.unshift(new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})+"  "+s);state.history=state.history.slice(0,40)}
function updateResume(){$("resumeBtn").classList.toggle("hidden",!(state&&["game","quests","arrival"].includes(state.phase)&&!state.finished))}
function randomStation(except){const p=allStations.filter(x=>!sameComplex(x,except));return p[Math.floor(Math.random()*p.length)]}
function slotAnimate(el,final,cb){let n=0;const t=setInterval(()=>{el.textContent=allStations[Math.floor(Math.random()*allStations.length)];if(++n>14){clearInterval(t);el.textContent=final;cb&&cb()}},55)}

function graph(){
  const g={};allStations.forEach(s=>g[s]=[]);
  for(const [lid,line] of Object.entries(LINES))for(const p of line.paths)for(let i=0;i<p.length-1;i++){
    g[p[i]].push({to:p[i+1],cost:1,line:lid});g[p[i+1]].push({to:p[i],cost:1,line:lid})
  }
  for(const grp of TRANSFER_GROUPS)for(const a of grp)for(const b of grp)if(a!==b){g[a]??=[];g[a].push({to:b,cost:0,line:"transfer"})}
  return g
}
const G=graph();
function shortest(from,to){
  const dist={},prev={},used=new Set();Object.keys(G).forEach(k=>dist[k]=Infinity);dist[from]=0;
  while(true){
    let u=null,b=Infinity;for(const k of Object.keys(dist))if(!used.has(k)&&dist[k]<b){b=dist[k];u=k}
    if(u==null||u===to)break;used.add(u);
    for(const e of G[u]||[]){const nd=dist[u]+e.cost;if(nd<dist[e.to]){dist[e.to]=nd;prev[e.to]={p:u,line:e.line};}}
  }
  if(!isFinite(dist[to]))return{distance:null,path:[]};
  const path=[];let cur=to;while(cur!==from){const x=prev[cur];if(!x)break;path.unshift({from:x.p,to:cur,line:x.line});cur=x.p}
  return{distance:dist[to],path}
}
function routeChoices(st){
  const members=complexMembers(st),out=[];
  for(const [lid,line] of Object.entries(LINES))line.paths.forEach((p,pi)=>{
    const idx=p.findIndex(x=>members.some(m=>sameComplex(x,m)));
    if(idx>=0)out.push({lid,pi,idx,at:p[idx],label:line.name+(line.paths.length>1&&pi===1?"（方南町支線）":"")})
  });
  return out
}
function recommendedText(){
  const r=shortest(state.current,state.goal);
  if(!r.path.length)return "ゴールは現在地です。";
  const first=r.path.find(x=>x.line!=="transfer"),transfers=r.path.filter(x=>x.line==="transfer").length;
  return "最短目安 "+r.distance+"駅。最初は "+(first?LINES[first.line].name:"乗換")+"。"+(transfers?"途中に構内乗換があります。":"")
}
function newGame(){setupStart=setupGoal=null;$("startSlot").textContent=$("goalSlot").textContent="？";$("startLines").innerHTML=$("goalLines").innerHTML="";$("drawGoalBtn").disabled=true;$("confirmSetupBtn").disabled=true;$("setupRoute").classList.add("hidden");show("setupView")}
function updateSetupRoute(){
  if(!setupStart||!setupGoal)return;
  const r=shortest(setupStart,setupGoal);
  $("setupRoute").classList.remove("hidden");
  $("setupRoute").innerHTML="<strong>最短目安 "+r.distance+"駅</strong><br>"+escapeHtml(setupStart)+" → "+escapeHtml(setupGoal);
}
function confirmSetup(){
  state=fresh();state.start=setupStart;state.goal=setupGoal;state.current=setupStart;state.phase="game";
  log("旅を開始："+state.start+" → "+state.goal);save();renderGame();show("gameView")
}
function renderHistory(){$("history").innerHTML=state.history.length?state.history.map(x=>"<div>"+escapeHtml(x)+"</div>").join(""):"<div>まだ履歴はありません。</div>"}
function renderGame(){
  const r=shortest(state.current,state.goal);
  $("currentStat").textContent=state.current;$("remainStat").textContent=r.distance??"-";$("goalStat").textContent=state.goal;$("turnText").textContent="TURN "+state.turn;
  $("currentLines").innerHTML=displayLines(state.current).map(lineCodeChip).join("");
  $("recommendation").textContent=recommendedText();
  const choices=routeChoices(state.current);
  $("routeChoices").innerHTML=choices.map((c,i)=>'<button class="choice '+(state.selected&&state.selected.lid===c.lid&&state.selected.pi===c.pi?"active":"")+'" data-route="'+i+'"><strong><i class="line-dot" style="background:'+LINES[c.lid].color+'"></i>'+escapeHtml(c.label)+'</strong><span>'+escapeHtml(c.at)+' から乗車</span></button>').join("");
  document.querySelectorAll("[data-route]").forEach(b=>b.onclick=()=>{state.selected=choices[Number(b.dataset.route)];state.dice=null;state.target=null;save();renderGame()});
  $("selectedRouteText").textContent=state.selected?state.selected.label:"路線を選択";
  $("rollBtn").disabled=!state.selected||state.phase!=="game";
  $("dice").textContent=state.dice?["⚀","⚁","⚂","⚃","⚄","⚅"][state.dice-1]:"⚄";
  $("movePanel").classList.toggle("hidden",!state.dice||state.phase!=="game");
  if(state.dice)renderMoveChoices();
  $("arrivalPanel").classList.toggle("hidden",state.phase!=="arrival");
  $("questPanel").classList.toggle("hidden",state.phase!=="quests");
  $("dicePanel").classList.toggle("hidden",state.phase!=="game");
  if(state.phase==="arrival")renderArrival();
  if(state.phase==="quests")renderQuests();
  renderHistory()
}
function renderMoveChoices(){
  const s=state.selected,p=LINES[s.lid].paths[s.pi],idx=p.findIndex(x=>sameComplex(x,state.current));
  const opts=[];
  for(const dir of [-1,1]){
    if(idx+dir<0||idx+dir>=p.length)continue;
    let targetIdx=Math.max(0,Math.min(p.length-1,idx+dir*state.dice));
    let target=p[targetIdx],goalHit=false;
    const step=dir>0?1:-1;
    for(let i=idx+step;dir>0?i<=targetIdx:i>=targetIdx;i+=step)if(sameComplex(p[i],state.goal)){target=p[i];goalHit=true;break}
    opts.push({dir,target,goalHit})
  }
  $("diceResultText").textContent=state.dice+" が出ました";
  $("moveChoices").innerHTML=opts.map((o,i)=>'<button class="choice" data-move="'+i+'"><strong>'+ (o.dir>0?"→":"←") +' '+escapeHtml(o.target)+'</strong><span>'+state.dice+'駅進む'+(o.goalHit?" / ゴール通過":"")+'</span></button>').join("");
  document.querySelectorAll("[data-move]").forEach(b=>b.onclick=()=>{const o=opts[Number(b.dataset.move)];state.target=o.target;state.targetLine=s.lid;state.phase="arrival";log(LINES[s.lid].name+"で "+state.target+" へ移動");save();renderGame()})
}
function rollDice(){
  const d=$("dice");d.classList.add("rolling");$("rollBtn").disabled=true;let n=0;clearInterval(rolling);
  rolling=setInterval(()=>{const v=1+Math.floor(Math.random()*6);d.textContent=["⚀","⚁","⚂","⚃","⚄","⚅"][v-1];if(++n>14){clearInterval(rolling);d.classList.remove("rolling");state.dice=1+Math.floor(Math.random()*6);save();renderGame()}},65)
}
function renderArrival(){
  $("arrivalStation").textContent=state.target;$("arrivalLineText").textContent=LINES[state.targetLine]?.name||"";
  $("arrivalCodes").innerHTML=displayLines(state.target).map(lineCodeChip).join("");
  $("mapLink").href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("東京メトロ "+state.target+"駅")
}
function buildQuests(name){const pool=[...QUEST_POOL].sort(()=>Math.random()-.5);return pool.slice(0,2).map(text=>({text,done:false}))}
function arrive(){
  state.current=state.target;state.target=null;state.selected=null;state.dice=null;
  const key=state.current;if(!state.quests[key])state.quests[key]=buildQuests(key);
  state.phase="quests";log(state.current+" に到着");save();renderGame()
}
function renderQuests(){
  const key=state.current,q=state.quests[key]||(state.quests[key]=buildQuests(key));
  $("questTitle").textContent=key+"のクエスト";
  $("questList").innerHTML=q.map((x,i)=>'<div class="quest"><div class="quest-num">'+(i+1)+'</div><div><h3>'+escapeHtml(x.text)+'</h3><p>達成は任意です。</p></div><button class="check '+(x.done?"done":"")+'" data-q="'+i+'">'+(x.done?"✓":"○")+'</button></div>').join("");
  document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{q[Number(b.dataset.q)].done=!q[Number(b.dataset.q)].done;save();renderQuests()});
  $("nextTurnBtn").textContent=sameComplex(state.current,state.goal)?"旅を完了する":"次のターンへ"
}
function nextTurn(){
  if(sameComplex(state.current,state.goal)){state.finished=true;state.phase="finished";log("ゴール "+state.goal+" に到着");save();renderFinish();show("finishView");return}
  state.phase="game";state.turn++;save();renderGame()
}
function renderFinish(){const done=Object.values(state.quests).flat().filter(q=>q.done).length;$("finishText").innerHTML="<strong>"+escapeHtml(state.start)+"</strong> から <strong>"+escapeHtml(state.goal)+"</strong> まで完走しました。<br>全 "+state.turn+" ターン / クエスト達成 "+done+" 件"}
function resume(){renderGame();show("gameView")}
function reset(){if(!confirm("保存中の旅を初期化します。よろしいですか？"))return;localStorage.removeItem(KEY);state=fresh();updateResume();show("homeView");toast("初期化しました")}

$("networkStat").textContent="9路線 / "+allStations.length+"駅名";
$("newGameBtn").onclick=newGame;$("resumeBtn").onclick=resume;$("cancelSetupBtn").onclick=()=>show("homeView");
$("drawStartBtn").onclick=()=>{setupStart=randomStation();setupGoal=null;$("drawStartBtn").disabled=true;slotAnimate($("startSlot"),setupStart,()=>{$("drawStartBtn").disabled=false;$("drawGoalBtn").disabled=false;$("startLines").innerHTML=displayLines(setupStart).map(lineCodeChip).join("")})};
$("drawGoalBtn").onclick=()=>{setupGoal=randomStation(setupStart);$("drawGoalBtn").disabled=true;slotAnimate($("goalSlot"),setupGoal,()=>{$("drawGoalBtn").disabled=false;$("confirmSetupBtn").disabled=false;$("goalLines").innerHTML=displayLines(setupGoal).map(lineCodeChip).join("");updateSetupRoute()})};
$("confirmSetupBtn").onclick=confirmSetup;$("rollBtn").onclick=rollDice;$("arrivedBtn").onclick=arrive;$("nextTurnBtn").onclick=nextTurn;$("restartBtn").onclick=newGame;$("backHomeBtn").onclick=()=>show("homeView");$("resetBtn").onclick=reset;
updateResume();show("homeView");