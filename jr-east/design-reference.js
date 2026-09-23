(() => {
  'use strict';

  const D = window.JR_KANTO_DATA;
  if (!D) return;

  const $ = (id) => document.getElementById(id);
  const stations = [...new Set(Object.values(D.services).flatMap((service) => service.paths.flat()))];
  const graph = new Map(stations.map((station) => [station, new Set()]));
  const serviceByStation = new Map(stations.map((station) => [station, new Set()]));

  for (const [serviceId, service] of Object.entries(D.services)) {
    for (const path of service.paths) {
      for (let i = 1; i < path.length; i += 1) {
        graph.get(path[i - 1])?.add(path[i]);
        graph.get(path[i])?.add(path[i - 1]);
      }
      for (const station of path) serviceByStation.get(station)?.add(serviceId);
    }
  }

  const state = { current: '横浜', goal: '川崎', dice: null, turn: 1 };
  let mapSvg = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function lineLabel(station) {
    return [...(serviceByStation.get(station) || [])].slice(0, 3).map((id) => id).join(' · ') || 'JR東日本';
  }

  function distancesFrom(start) {
    const distances = new Map([[start, 0]]);
    const queue = [start];
    for (let i = 0; i < queue.length; i += 1) {
      const station = queue[i];
      for (const next of graph.get(station) || []) {
        if (!distances.has(next)) {
          distances.set(next, distances.get(station) + 1);
          queue.push(next);
        }
      }
    }
    return distances;
  }

  function rollFace(value) {
    return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1] || '⚄';
  }

  function scrollToGame() {
    $('game')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('designRoll')?.focus({ preventScroll: true }), 420);
  }

  function highlightMap() {
    if (!mapSvg) return;
    mapSvg.querySelectorAll('[data-station]').forEach((node) => {
      node.classList.remove('map-highlight-current', 'map-highlight-goal', 'map-highlight-candidate');
      const station = node.getAttribute('data-station');
      if (station === state.current) node.classList.add('map-highlight-current');
      if (station === state.goal) node.classList.add('map-highlight-goal');
    });
    const candidates = new Set(candidateStations());
    mapSvg.querySelectorAll('[data-station]').forEach((node) => {
      if (candidates.has(node.getAttribute('data-station')) && node.getAttribute('data-station') !== state.current) node.classList.add('map-highlight-candidate');
    });
  }

  function candidateStations() {
    if (!state.dice) return [];
    const distances = distancesFrom(state.current);
    return [...distances.entries()]
      .filter(([station, distance]) => station !== state.current && distance > 0 && distance <= state.dice)
      .sort((a, b) => (a[1] - b[1]) || a[0].localeCompare(b[0], 'ja'))
      .slice(0, 6)
      .map(([station, distance]) => ({ station, distance }));
  }

  function renderCandidates() {
    const list = $('designCandidates');
    const candidates = candidateStations();
    $('candidateCount').textContent = `${candidates.length}駅 / 出目${state.dice}`;
    if (!candidates.length) {
      list.innerHTML = '<div class="candidate-empty">この出目で移動できる駅を準備中です。</div>';
      highlightMap();
      return;
    }
    list.innerHTML = candidates.map(({ station, distance }, index) => `
      <button class="design-candidate ${station === state.goal ? 'best' : ''}" data-station="${escapeHtml(station)}">
        <span><strong>${escapeHtml(station)}</strong><small>${escapeHtml(lineLabel(station))} / ${distance}駅先${station === state.goal ? ' · ゴール' : ''}</small></span><span class="candidate-arrow">→</span>
      </button>`).join('');
    list.querySelectorAll('[data-station]').forEach((button) => {
      button.addEventListener('click', () => chooseStation(button.dataset.station));
    });
    highlightMap();
  }

  function renderState() {
    $('gameCurrent').textContent = state.current;
    $('gameCurrentLines').textContent = lineLabel(state.current);
    $('gameGoal').textContent = state.goal;
    $('turnLabel').textContent = `TURN ${String(state.turn).padStart(2, '0')}`;
    $('stepStation').textContent = state.current;
    $('questTitle').textContent = `${state.current}のクエスト`;
    $('designDie').textContent = rollFace(state.dice);
    $('phoneDie').textContent = rollFace(state.dice);
    renderCandidates();
  }

  function chooseStation(station) {
    if (!graph.has(station)) return;
    state.current = station;
    state.turn += 1;
    const distanceToGoal = distancesFrom(state.current).get(state.goal);
    $('rollHint').textContent = distanceToGoal === 0 ? 'ゴール到着。次の旅も始められます。' : `ゴールまで最短${distanceToGoal ?? '—'}駅。もう一度サイコロをふこう`;
    renderState();
  }

  function rollDice() {
    const button = $('designRoll');
    const die = $('designDie');
    button.disabled = true;
    die.classList.add('rolling');
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      const value = Math.floor(Math.random() * 6) + 1;
      die.textContent = rollFace(value);
      if (tick >= 10) {
        clearInterval(timer);
        state.dice = Math.floor(Math.random() * 6) + 1;
        die.textContent = rollFace(state.dice);
        die.classList.remove('rolling');
        button.disabled = false;
        $('rollHint').textContent = `出目${state.dice}で進める駅を選んでください`;
        renderCandidates();
      }
    }, 75);
  }

  async function loadMap() {
    const mount = $('designMap');
    try {
      const response = await fetch('maps/yokohama-kawasaki.svg', { cache: 'no-cache' });
      if (!response.ok) throw new Error('map load failed');
      mount.innerHTML = await response.text();
      mapSvg = mount.querySelector('svg');
      if (!mapSvg) throw new Error('map svg missing');
      mapSvg.setAttribute('aria-label', '横浜・川崎のJR地域路線図');
      highlightMap();
    } catch (error) {
      mount.innerHTML = '<span class="map-loading">地域図を読み込めませんでした。全駅マップを開いて確認してください。</span>';
    }
  }

  $('networkPill').textContent = `${Object.keys(D.services).length}サービス / ${stations.length}駅`;
  $('stationFeature').textContent = `${Object.keys(D.services).length}サービス / ${stations.length}駅を収録`;
  $('heroStart')?.addEventListener('click', scrollToGame);
  $('phoneGoGame')?.addEventListener('click', scrollToGame);
  $('phoneRoll')?.addEventListener('click', () => {
    $('phoneRoll').disabled = true;
    $('phoneDie').animate([{ transform: 'translateX(-50%) rotate(-9deg)' }, { transform: 'translateX(-50%) rotate(12deg) scale(1.08)' }, { transform: 'translateX(-50%) rotate(-9deg)' }], { duration: 420, iterations: 2 });
    setTimeout(() => { state.dice = Math.floor(Math.random() * 6) + 1; $('phoneDie').textContent = rollFace(state.dice); $('phoneRoll').disabled = false; }, 700);
  });
  $('designRoll')?.addEventListener('click', rollDice);
  loadMap();
  renderState();
})();
