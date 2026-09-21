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

