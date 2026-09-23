/* Presentation adapter. Rules, maps and persistence come from design-engine.js. */
(() => {
  const engineShow = show;
  show = function (id) {
    engineShow(id);
    document.body.dataset.view = id;
    document.querySelectorAll('[data-home-link]').forEach(link => {
      if (id === 'homeView') link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };
  document.body.dataset.view = 'homeView';
  document.querySelectorAll('[data-start]').forEach(button => button.onclick = newGame);
  document.querySelectorAll('[data-home-link]').forEach(link => link.onclick = event => {
    event.preventDefault();
    updateResume();
    show('homeView');
  });
  document.querySelectorAll('[data-howto-link]').forEach(link => link.onclick = event => {
    event.preventDefault();
    show('homeView');
    document.getElementById('howto').scrollIntoView({ behavior: 'smooth' });
  });
  // A real trip for trying the screen, using normal setup and V0.3 rules.
  document.getElementById('tryTripBtn').onclick = () => {
    setupStart = '横浜';
    setupGoal = '東京';
    confirmSetup();
  };
  const engineRenderQuests = renderQuests;
  renderQuests = function () {
    engineRenderQuests();
    document.querySelectorAll('[data-q]').forEach(button => {
      const quest = state.quests[state.current][Number(button.dataset.q)];
      button.setAttribute('aria-label', quest.text);
      button.setAttribute('aria-pressed', String(quest.done));
    });
  };
})();
