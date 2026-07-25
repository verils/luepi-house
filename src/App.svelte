<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { updateCatState, resolveIntents } from './lib/game';
  import type { StateContext, GameState, CatIntent } from './lib/game';
  import { GameRenderer } from './lib/game';
  import { MAP_WIDTH, MAP_HEIGHT } from './lib/game';
  import { updateTime, cycleTimeSpeed } from './lib/game';
  import { updateWeather, getWeatherName } from './lib/game';
  import { logSystemEvent } from './lib/game';
  import { getPhysicalScreenSize } from './lib/game/screen';
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
  import InfoPanel from './InfoPanel.svelte';

  let canvas: HTMLCanvasElement;
  let renderer: GameRenderer | null = null;
  let animationFrameId = 0;

  let fpsFrames = 0;
  let fpsLastTime = performance.now();
  let lastUiSync = 0;
  let lastFrameTime = 0;

  // 输入状态
  let isDragging = false;
  let pendingDrag = false;
  let downX = 0;
  let downY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;

  let currentState: GameState | null = null;
  const unsubGameState = gameState.subscribe((s) => (currentState = s));

  let isDebug = $state(false);
  const unsubDebug = debugMode.subscribe((d) => (isDebug = d));

  // debugMode 运行时切换：同步到渲染器并重绘
  $effect(() => {
    if (renderer) {
      renderer.setDebugMode(isDebug);
      if (currentState) renderer.render(currentState);
    }
  });

  $effect(() => {
    const p = new URLSearchParams(location.search).get('debug');
    debugMode.set(p === 'true' || p === 'yes' || p === '1');
  });

  function resizeCanvas() {
    const size = getPhysicalScreenSize();
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  onMount(() => {
    initializeGame();

    resizeCanvas();
    renderer = new GameRenderer(canvas, isDebug);

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    canvas.style.cursor = 'grab';
    window.addEventListener('resize', handleResize);

    const state = getGameState();
    centerCameraOnHouse();
    if (state) renderer.render(state);
    animationFrameId = requestAnimationFrame(gameLoop);
  });

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId);
    renderer?.destroy();
    unsubGameState();
    unsubDebug();
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.removeEventListener('wheel', handleWheel);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('keydown', handleKeyDown);
  });

  // ── 游戏循环 ──

  function getGameState(): GameState | null {
    return get(gameState);
  }

  function centerCameraOnHouse() {
    if (!renderer) return;
    const camera = renderer.getCamera();
    camera.x = innerWidth / 2 - MAP_WIDTH / 2 * camera.zoom;
    camera.y = innerHeight / 2 - MAP_HEIGHT / 2 * camera.zoom;
  }

  function gameLoop() {
    const state = getGameState();
    if (!state || !renderer) {
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

    const dt = lastFrameTime === 0 ? 1 : Math.min((now - lastFrameTime) / (1000 / 60), 3);
    lastFrameTime = now;

    updateTime(state.time, dt);

    const weatherChanged = updateWeather(state.weather, dt);
    if (weatherChanged && state.eventLog) {
      logSystemEvent(state.eventLog, 'weather_change', `天气变为${getWeatherName(state.weather.current)}`, {
        weather: state.weather.current,
      }, {
        hour: state.time.hour, minute: state.time.minute, day: state.time.day,
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
      gameTime: { hour: state.time.hour, minute: state.time.minute, day: state.time.day },
    };

    const allIntents: CatIntent[] = [];
    for (const cat of state.cats) {
      allIntents.push(...updateCatState(cat, stateCtx, dt));
    }
    resolveIntents(allIntents, state.cats);

    renderer.render(state);

    if (now - lastUiSync >= 200) {
      lastUiSync = now;
      gameState.set(state);
      const sel = get(selectedCat);
      if (sel) selectedCat.set(sel);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // ── 视图控制 ──

  function resetCamera() {
    if (!renderer) return;
    const state = getGameState();
    if (!state) return;
    const camera = renderer.getCamera();
    camera.x = 0; camera.y = 0; camera.zoom = 1;
    centerCameraOnHouse();
    renderer.render(state);
  }

  function zoomIn() {
    if (!renderer) return;
    const state = getGameState();
    if (!state) return;
    renderer.getCamera().zoomAt(1.2);
    renderer.render(state);
  }

  function zoomOut() {
    if (!renderer) return;
    const state = getGameState();
    if (!state) return;
    renderer.getCamera().zoomAt(0.8);
    renderer.render(state);
  }

  function handleSpeedChange() {
    const state = getGameState();
    if (!state) return;
    state.time.speed = cycleTimeSpeed(state.time.speed);
  }

  // ── 输入处理 ──

  function handleResize() {
    resizeCanvas();
    if (renderer && currentState) renderer.render(currentState);
  }

  function handleMouseDown(e: MouseEvent) {
    const camera = renderer?.getCamera();
    if (camera && currentState) {
      const worldPos = camera.screenToWorld(e.offsetX, e.offsetY);
      for (const cat of currentState.cats) {
        const dx = worldPos.x - (cat.x + cat.visualWidth / 2);
        const dy = worldPos.y - (cat.y + cat.visualHeight / 2);
        if (Math.sqrt(dx * dx + dy * dy) <= cat.interactionRadius) {
          selectCat(cat);
          return;
        }
      }
    }
    deselectCat();
    pendingDrag = true;
    downX = e.clientX;
    downY = e.clientY;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!renderer) return;
    if (!isDragging) {
      if (!pendingDrag) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) <= 4) return;
      isDragging = true;
      pendingDrag = false;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
      return;
    }
    const camera = renderer.getCamera();
    camera.pan(e.clientX - lastMouseX, e.clientY - lastMouseY);
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (currentState) renderer.render(currentState);
  }

  function handleMouseUp() {
    isDragging = false;
    pendingDrag = false;
    canvas.style.cursor = 'grab';
  }

  function handleMouseLeave() {
    isDragging = false;
    pendingDrag = false;
    canvas.style.cursor = 'grab';
  }

  function handleWheel(e: WheelEvent) {
    if (!renderer) return;
    e.preventDefault();
    renderer.getCamera().zoomAt(e.deltaY > 0 ? 0.9 : 1.1, e.offsetX, e.offsetY);
    if (currentState) renderer.render(currentState);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!renderer || !currentState) return;
    const camera = renderer.getCamera();
    const panSpeed = 20;
    switch (e.key) {
      case 'ArrowUp': camera.pan(0, panSpeed); break;
      case 'ArrowDown': camera.pan(0, -panSpeed); break;
      case 'ArrowLeft': camera.pan(panSpeed, 0); break;
      case 'ArrowRight': camera.pan(-panSpeed, 0); break;
      case '+': case '=': camera.zoomAt(1.1); break;
      case '-': case '_': camera.zoomAt(0.9); break;
      default: return;
    }
    e.preventDefault();
    renderer.render(currentState);
  }
</script>

<div class="game-container">
  <canvas bind:this={canvas} class="game-canvas"></canvas>

  <div class="ui-overlay">
    {#if $showCatInfo && $selectedCat}
      <InfoPanel cat={$selectedCat} onclose={() => deselectCat()} />
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

  .game-canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
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
