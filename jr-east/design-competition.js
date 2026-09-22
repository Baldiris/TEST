(function(){
  const labels = {
    a: "A · TRAVEL FIRST",
    b: "B · NETWORK FIRST",
    c: "C · JOURNEY EDITORIAL"
  };
  const buttons = Array.from(document.querySelectorAll("[data-design-choice]"));
  const badge = document.getElementById("designLabel");

  function applyDesign(next, updateUrl = true){
    if(!labels[next]) next = "a";
    document.body.dataset.design = next;
    buttons.forEach(btn => {
      btn.setAttribute("aria-pressed", btn.dataset.designChoice === next ? "true" : "false");
    });
    if(badge) badge.textContent = labels[next];
    try { localStorage.setItem("kimagureJRDesignCompetition", next); } catch (_) {}
    if(updateUrl){
      const url = new URL(location.href);
      url.searchParams.set("design", next);
      history.replaceState(null, "", url);
    }
  }

  buttons.forEach(btn => btn.addEventListener("click", () => applyDesign(btn.dataset.designChoice)));

  const fromUrl = new URL(location.href).searchParams.get("design");
  let initial = fromUrl;
  if(!labels[initial]){
    try { initial = localStorage.getItem("kimagureJRDesignCompetition"); } catch (_) {}
  }
  applyDesign(labels[initial] ? initial : "a", false);
})();