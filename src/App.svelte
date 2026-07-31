<script lang="ts">
  import {onDestroy, onMount} from 'svelte';
  import {get} from 'svelte/store';
  import {GameRenderer, cycleTimeSpeed, Camera, MAP_WIDTH, MAP_HEIGHT} from './lib/game';
  import {GameEngine} from './lib/game/game-engine';
  import {InputHandler} from './lib/game/input-handler';
  import {getPhysicalWindowScreenSize} from './lib/game/screen';
  import {
    currentFPS,
    debugMode,
    deselectCat,
    gameState,
    initializeGameState,
    selectCat,
    selectedCat,
    showCatInfo,
  } from './lib/stores/gameStore';
  import InfoPanel from './InfoPanel.svelte';

  // 画布
  let canvas: HTMLCanvasElement;

  // 游戏对象定义
  let camera: Camera;
  let renderer: GameRenderer | null = null;
  let engine: GameEngine | null = null;
  let input: InputHandler | null = null;

  $effect(() => {
    const p = new URLSearchParams(location.search).get('debug');
    debugMode.set(p === 'true' || p === 'yes' || p === '1');
  });

  onMount(() => {
    initializeGameState();

    resizeCanvas();

    camera = new Camera();
    renderer = new GameRenderer(canvas, camera, get(debugMode));

    input = new InputHandler({
      canvas,
      camera,
      getState: () => get(gameState),
      onSelectCat: selectCat,
      onDeselectCat: deselectCat,
      onRender: renderCurrentState,
      onResize: () => {
        resizeCanvas();
        renderCurrentState();
      },
    });
    input.attach();
    centerCameraOnHouse();

    engine = new GameEngine({
      getGameState: () => get(gameState),
      renderer,
      debugMode,
      onFPSUpdate: (fps) => currentFPS.set(fps),
      onFrameTick: (state) => {
        gameState.set(state);
        const sel = get(selectedCat);
        if (sel) {
          selectedCat.set(sel);
        }
      },
    });

    const state = get(gameState);
    if (state) {
      renderer.render(state);
    }
    engine.start();
  });

  onDestroy(() => {
    engine?.stop();
    input?.detach();
    renderer?.destroy();
  });

  function resizeCanvas() {
    const size = getPhysicalWindowScreenSize();
    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
  }

  function renderCurrentState() {
    const state = get(gameState);
    if (state && renderer) {
      renderer.render(state);
    }
  }

  function handleSpeedChange() {
    const state = get(gameState);
    if (!state) {
      return;
    }
    state.time.speed = cycleTimeSpeed(state.time.speed);
  }

  function centerCameraOnHouse() {
    camera.x = innerWidth / 2 - MAP_WIDTH / 2 * camera.zoom;
    camera.y = innerHeight / 2 - MAP_HEIGHT / 2 * camera.zoom;
  }

  function resetCamera() {
    camera.zoom = 1;
    centerCameraOnHouse();
    renderCurrentState();
  }

  function zoomIn() {
    camera.zoomAt(1.2);
    renderCurrentState();
  }

  function zoomOut() {
    camera.zoomAt(0.8);
    renderCurrentState();
  }
</script>

<div class="game-container">
  <canvas bind:this={canvas} class="game-canvas"></canvas>

  <div class="ui-overlay">
    {#if $showCatInfo && $selectedCat}
      <InfoPanel cat={$selectedCat} onclose={() => deselectCat()}/>
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
    .control-btn {
      padding: 8px 16px;
      min-width: 80px;
      font-size: 12px;
    }

    .instructions {
      font-size: 11px;
      padding: 6px 12px;
    }
  }
</style>
