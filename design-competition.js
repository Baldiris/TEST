const ENTRIES = {
  a:"A案｜駅サイン式",
  b:"B案｜盤面主役式",
  c:"C案｜旅程手帳式"
};
const STORAGE_KEY="kimagureMetroDesignVoteV02";
const LEGACY_KEY="kimagureMetroDesignVoteV01";
const voteResult=document.getElementById("voteResult");
const voteResultText=document.getElementById("voteResultText");
let activeEntry="a";

function savedVote(){
  const current=localStorage.getItem(STORAGE_KEY);
  if(ENTRIES[current]) return current;
  const legacy=localStorage.getItem(LEGACY_KEY);
  return ENTRIES[legacy]?legacy:null;
}

function renderVote(){
  const vote=savedVote();
  voteResult.classList.toggle("hidden",!vote);
  voteResultText.textContent=vote?ENTRIES[vote]:"";
  document.querySelectorAll("[data-vote-entry]").forEach(button=>{
    const selected=button.dataset.voteEntry===vote;
    button.textContent=selected?ENTRIES[vote].split("｜")[0]+"を選択中 ✓":button.dataset.voteEntry.toUpperCase()+"案を選ぶ";
  });
}

function selectEntry(entry){
  if(!ENTRIES[entry]) return;
  activeEntry=entry;
  document.querySelectorAll("[data-entry-view]").forEach(view=>{
    view.classList.toggle("active",view.dataset.entryView===entry);
  });
  document.querySelectorAll("[data-entry-target]").forEach(button=>{
    const selected=button.dataset.entryTarget===entry;
    button.classList.toggle("active",selected);
    button.setAttribute("aria-pressed",String(selected));
  });
}

document.querySelectorAll("[data-entry-target]").forEach(button=>{
  button.addEventListener("click",()=>selectEntry(button.dataset.entryTarget));
});
document.querySelectorAll("[data-vote-entry]").forEach(button=>{
  button.addEventListener("click",()=>{
    const entry=button.dataset.voteEntry;
    localStorage.setItem(STORAGE_KEY,entry);
    localStorage.removeItem(LEGACY_KEY);
    renderVote();
    voteResult.scrollIntoView({behavior:"smooth",block:"nearest"});
  });
});
document.getElementById("clearVoteButton").addEventListener("click",()=>{
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
  renderVote();
});

selectEntry(activeEntry);
renderVote();
