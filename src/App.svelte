<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { updateCatState, resolveIntents } from './lib/game';
  import type { GameRenderer, Camera, StateContext, GameState, Cat, CatIntent } from './lib/game';
  import { HOUSE_WIDTH, HOUSE_HEIGHT, WALL_THICKNESS } from './lib/game';
  import { updateTime, cycleTimeSpeed, formatGameTime } from './lib/game';
  import { updateWeather, getWeatherName } from './lib/game';
  import { logSystemEvent } from './lib/game';
  import {
    gameState,
    selectedCat,
    showCatInfo,
    debugMode,
    currentFPS,
    initializeGame,
    selectCat,
    deselectCat,
  } from './lib/stores/gameStore';
  import GameCanvas from './GameCanvas.svelte';
  import InfoPanel from './InfoPanel.svelte';

  let gameRenderer = $state<GameRenderer | null>(null);
  let camera = $state<Camera | null>(null);
  let animationFrameId = 0;

  let fpsFrames = 0;
  let fpsLastTime = performance.now();

  $effect(() => {
    const p = new URLSearchParams(location.search).get('debug');
    debugMode.set(p === 'true' || p === 'yes' || p === '1');
  });

  onMount(() => {
    const state = initializeGame();

    camera = gameRenderer!.getCamera();
    centerCameraOnHouse();
    gameRenderer!.render(state);

    animationFrameId = requestAnimationFrame(gameLoop);
  });

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId);
  });

  function centerCameraOnHouse() {
    if (!camera || !gameRenderer) {
      return;
    }
    const viewportCenterX = innerWidth / 2;
    const viewportCenterY = innerHeight / 2;
    const houseCenterX = (HOUSE_WIDTH + WALL_THICKNESS * 2) / 2;
    const houseCenterY = (HOUSE_HEIGHT + WALL_THICKNESS * 2) / 2;
    camera.x = viewportCenterX - houseCenterX * camera.zoom;
    camera.y = viewportCenterY - houseCenterY * camera.zoom;
  }

  function gameLoop() {
    let state = null as GameState | null;
    const unsub = gameState.subscribe((s) => (state = s));

    if (!state || !gameRenderer) {
      unsub();
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    fpsFrames++;
    const now = performance.now();
    if (now - fpsLastTime >= 1000) {
      currentFPS.set(fpsFrames);
      fpsFrames = 0;
      fpsLastTime = now;
    }

    // 更新时间系统
    updateTime(state.time);
    
    // 更新天气系统
    const weatherChanged = updateWeather(state.weather);
    if (weatherChanged && state.eventLog) {
      logSystemEvent(state.eventLog, 'weather_change', `天气变为${getWeatherName(state.weather.current)}`, {
        weather: state.weather.current,
      }, {
        hour: state.time.hour,
        minute: state.time.minute,
        day: state.time.day,
      });
    }

    const stateCtx: StateContext = {
      shelters: state.shelters,
      catBeds: state.catBeds,
      furnitures: state.furnitures,
      solidObjects: state.solidObjects,
      house: state.house,
      allCats: state.cats,
      eventLog: state.eventLog,
      gameTime: {
        hour: state.time.hour,
        minute: state.time.minute,
        day: state.time.day,
      },
    };

    const allIntents: CatIntent[] = [];
    for (const cat of state.cats) {
      const intents = updateCatState(cat, stateCtx);
      allIntents.push(...intents);
    }
    resolveIntents(allIntents, state.cats);

    gameRenderer.render(state);
    unsub();

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function resetCamera() {
    if (!camera || !gameRenderer) {
      return;
    }
    let state: GameState | null = null;
    const unsub = gameState.subscribe((s) => (state = s));
    unsub();
    if (!state) {
      return;
    }

    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1;
    centerCameraOnHouse();
    gameRenderer.render(state);
  }

  function zoomIn() {
    if (!camera || !gameRenderer) {
      return;
    }
    let state: GameState | null = null;
    const unsub = gameState.subscribe((s) => (state = s));
    unsub();
    if (!state) {
      return;
    }

    camera.zoomAt(1.2);
    gameRenderer.render(state);
  }

  function zoomOut() {
    if (!camera || !gameRenderer) {
      return;
    }
    let state: GameState | null = null;
    const unsub = gameState.subscribe((s) => (state = s));
    unsub();
    if (!state) {
      return;
    }

    camera.zoomAt(0.8);
    gameRenderer.render(state);
  }

  function handleCatClick(cat: Cat | null) {
    selectCat(cat);
  }

  function handleCatDeselect() {
    deselectCat();
  }

  function handleSpeedChange() {
    let state = null as GameState | null;
    const unsub = gameState.subscribe((s) => (state = s));
    unsub();
    if (!state) {
      return;
    }

    state.time.speed = cycleTimeSpeed(state.time.speed);
    gameState.set(state);
  }
</script>

<div class="game-container">
  <GameCanvas
    bind:renderer={gameRenderer}
    oncatclick={handleCatClick}
    oncatdeselect={handleCatDeselect}
  />

  <div class="ui-overlay">
    {#if $showCatInfo && $selectedCat}
      <InfoPanel cat={$selectedCat} onclose={handleCatDeselect} />
    {/if}

    <div class="time-panel">
      <div class="time-display">
        {formatGameTime($gameState?.time?.hour ?? 8, $gameState?.time?.minute ?? 0)}
      </div>
      <button class="speed-btn" onclick={handleSpeedChange}>
        {$gameState?.time?.speed ?? 1}x
      </button>
    </div>

    <div class="fps-counter">
      FPS: {$currentFPS}
    </div>

    <div class="controls">
      <button class="control-btn" onclick={resetCamera}>重置视图</button>
      <button class="control-btn" onclick={zoomIn}>放大</button>
      <button class="control-btn" onclick={zoomOut}>缩小</button>
    </div>

    <div class="instructions">
      <p>鼠标拖动：平移视图 | 滚轮：缩放视图 | 方向键：移动视图 | +/-：缩放视图 | 点击猫咪：查看信息</p>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #f0f0f0;
  }

  .ui-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
    box-sizing: border-box;
  }

  .fps-counter {
    position: absolute;
    top: 20px;
    right: 20px;
    color: #666;
    font-size: 12px;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.7);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .time-panel {
    position: absolute;
    top: 20px;
    right: 120px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .time-display {
    font-family: monospace;
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

  .speed-btn {
    padding: 4px 8px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
  }

  .speed-btn:hover {
    background: #45a049;
  }

  .controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    pointer-events: auto;
    align-self: center;
    margin-top: auto;
    margin-bottom: 10px;
  }

  .control-btn {
    padding: 10px 20px;
    background-color: rgba(76, 175, 80, 0.9);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    cursor: pointer;
    min-width: 100px;
    font-size: 14px;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .control-btn:hover {
    background-color: rgba(69, 160, 73, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .control-btn:active {
    transform: translateY(0);
  }

  .instructions {
    text-align: center;
    color: #333;
    font-size: 13px;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 8px 16px;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    pointer-events: auto;
    align-self: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .instructions p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .control-btn { padding: 8px 16px; min-width: 80px; font-size: 12px; }
    .instructions { font-size: 11px; padding: 6px 12px; }
  }
</style>
