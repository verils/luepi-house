<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { updateCatState, resolveIntents } from './lib/game';
  import type { GameRenderer, Camera, StateContext, GameState, Cat, CatIntent } from './lib/game';
  import { MAP_WIDTH, MAP_HEIGHT } from './lib/game';
  import { updateTime, cycleTimeSpeed } from './lib/game';
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
  let started = false;

  let fpsFrames = 0;
  let fpsLastTime = performance.now();
  let lastUiSync = 0;
  let lastFrameTime = 0;

  $effect(() => {
    const p = new URLSearchParams(location.search).get('debug');
    debugMode.set(p === 'true' || p === 'yes' || p === '1');
  });

  onMount(() => {
    initializeGame();
  });

  // gameRenderer 由子组件 GameCanvas 挂载后赋值；就绪后启动一次
  // （显式响应式依赖，替代"子组件 onMount 先执行"的隐式时序）
  $effect(() => {
    if (!gameRenderer || started) {
      return;
    }
    started = true;
    const state = getGameState();
    camera = gameRenderer.getCamera();
    centerCameraOnHouse();
    if (state) {
      gameRenderer.render(state);
    }
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
    const houseCenterX = MAP_WIDTH / 2;
    const houseCenterY = MAP_HEIGHT / 2;
    camera.x = viewportCenterX - houseCenterX * camera.zoom;
    camera.y = viewportCenterY - houseCenterY * camera.zoom;
  }

  function getGameState(): GameState | null {
    return get(gameState);
  }

  function gameLoop() {
    const state = getGameState();

    if (!state || !gameRenderer) {
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

    // 归一化帧时间（dt=1 等价 60fps 一帧，上限 3 防止后台恢复跳变）
    const dt = lastFrameTime === 0 ? 1 : Math.min((now - lastFrameTime) / (1000 / 60), 3);
    lastFrameTime = now;

    // 更新时间系统
    updateTime(state.time, dt);
    
    // 更新天气系统
    const weatherChanged = updateWeather(state.weather, dt);
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
      const intents = updateCatState(cat, stateCtx, dt);
      allIntents.push(...intents);
    }
    resolveIntents(allIntents, state.cats);

    gameRenderer.render(state);

    // 通知 UI 刷新（节流 200ms，避免每帧触发 Svelte 更新导致掉帧）
    if (now - lastUiSync >= 200) {
      lastUiSync = now;
      gameState.set(state);
      // 同步刷新选中猫（InfoPanel 依赖 $selectedCat，gameState 的通知不会触发它）
      const sel = get(selectedCat);
      if (sel) { selectedCat.set(sel); }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function resetCamera() {
    if (!camera || !gameRenderer) {
      return;
    }
    const state = getGameState();
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
    const state = getGameState();
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
    const state = getGameState();
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
    const state = getGameState();
    if (!state) {
      return;
    }

    state.time.speed = cycleTimeSpeed(state.time.speed);
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
        {($gameState?.time?.hour ?? 8).toString().padStart(2, '0')} 时
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
