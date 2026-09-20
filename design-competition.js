const THEMES = {
  signage: {
    letter:"A", name:"メトロ・サイン計画",
    description:"駅の案内サインのように、迷わず次の操作へ進めるデザイン。",
    tags:["視認性","実用性","現行から移行しやすい"]
  },
  boardgame: {
    letter:"B", name:"トラベルボードゲーム",
    description:"旅の高揚感とサイコロ遊びを前面に出した、明るいゲーム盤デザイン。",
    tags:["桃鉄感","楽しさ","演出を伸ばしやすい"]
  },
  night: {
    letter:"C", name:"TOKYO NIGHT LINE",
    description:"夜の東京を路線の光で駆け抜ける、没入感のあるダークデザイン。",
    tags:["世界観","路線カラー","夜の旅"]
  }
};

const STORAGE_KEY = "kimagureMetroDesignVoteV01";
const prototype = document.getElementById("prototype");
const conceptName = document.getElementById("conceptName");
const entryLetter = document.getElementById("entryLetter");
const conceptTitle = document.getElementById("conceptTitle");
const conceptDescription = document.getElementById("conceptDescription");
const conceptTags = document.getElementById("conceptTags");
const voteButton = document.getElementById("voteButton");
const voteResult = document.getElementById("voteResult");
const voteResultText = document.getElementById("voteResultText");
let activeTheme = "signage";

function renderVote(){
  const vote = localStorage.getItem(STORAGE_KEY);
  const choice = THEMES[vote];
  voteResult.classList.toggle("hidden",!choice);
  if(choice) voteResultText.textContent = choice.letter+"案｜"+choice.name;
  voteButton.textContent = vote===activeTheme ? "この案に投票済み ✓" : THEMES[activeTheme].letter+"案に投票する";
}

function selectTheme(theme){
  if(!THEMES[theme]) return;
  activeTheme = theme;
  const data = THEMES[theme];
  prototype.dataset.theme = theme;
  conceptName.textContent = data.letter+"案｜"+data.name;
  entryLetter.textContent = data.letter;
  conceptTitle.textContent = data.name;
  conceptDescription.textContent = data.description;
  conceptTags.innerHTML = "";
  data.tags.forEach(tag=>{
    const span=document.createElement("span");
    span.textContent=tag;
    conceptTags.appendChild(span);
  });
  document.querySelectorAll("[data-theme-target]").forEach(button=>{
    const selected=button.dataset.themeTarget===theme;
    button.classList.toggle("active",selected);
    button.setAttribute("aria-pressed",String(selected));
  });
  renderVote();
}

document.querySelectorAll("[data-theme-target]").forEach(button=>{
  button.addEventListener("click",()=>selectTheme(button.dataset.themeTarget));
});
voteButton.addEventListener("click",()=>{
  localStorage.setItem(STORAGE_KEY,activeTheme);
  renderVote();
  voteResult.scrollIntoView({behavior:"smooth",block:"nearest"});
});
document.getElementById("clearVoteButton").addEventListener("click",()=>{
  localStorage.removeItem(STORAGE_KEY);
  renderVote();
});

selectTheme("signage");
