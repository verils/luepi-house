<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { initGameState, updateCatAI, updateCatMovement } from './lib/game';
  import type { GameRenderer, Camera } from './lib/game';
  import { HOUSE_SIZE, WALL_THICKNESS } from './lib/game';
  import GameCanvas from './GameCanvas.svelte';
  import CatInfoPanel from './CatInfoPanel.svelte';

  let gameState = $state<any>(null);
  let gameRenderer = $state<GameRenderer | null>(null);
  let camera = $state<Camera | null>(null);

  let selectedCat = $state<any>(null);
  let showCatInfo = $state(false);

  let animationFrameId = 0;

  let debugMode = $state(
    (() => {
      const p = new URLSearchParams(location.search).get('debug');
      return p === 'true' || p === 'yes' || p === '1';
    })()
  );

  onMount(() => {
    gameState = initGameState();

    camera = gameRenderer!.getCamera();

    centerCameraOnHouse();

    gameRenderer!.render(gameState);

    animationFrameId = requestAnimationFrame(gameLoop);
  });

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId);
  });

  function centerCameraOnHouse() {
    if (!camera || !gameRenderer) return;
    const viewportCenterX = innerWidth / 2;
    const viewportCenterY = innerHeight / 2;
    const houseCenterX = (HOUSE_SIZE + WALL_THICKNESS * 2) / 2;
    const houseCenterY = (HOUSE_SIZE + WALL_THICKNESS * 2) / 2;
    camera.x = viewportCenterX - houseCenterX * camera.zoom;
    camera.y = viewportCenterY - houseCenterY * camera.zoom;
  }

  function gameLoop() {
    if (!gameState || !gameRenderer) {
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    for (const cat of gameState.cats) {
      updateCatAI(cat);
      updateCatMovement(cat);
    }

    gameRenderer.render(gameState);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function resetCamera() {
    if (!camera || !gameRenderer || !gameState) return;
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1;
    centerCameraOnHouse();
    gameRenderer.render(gameState);
  }

  function zoomIn() {
    if (!camera || !gameRenderer || !gameState) return;
    camera.zoomAt(1.2);
    gameRenderer.render(gameState);
  }

  function zoomOut() {
    if (!camera || !gameRenderer || !gameState) return;
    camera.zoomAt(0.8);
    gameRenderer.render(gameState);
  }

  function handleCatClick(cat: any) {
    selectedCat = cat;
    showCatInfo = true;
  }

  function handleCatDeselect() {
    showCatInfo = false;
    selectedCat = null;
  }
</script>

<div class="game-container">
  <GameCanvas
    {gameState}
    {debugMode}
    bind:renderer={gameRenderer}
    oncatclick={handleCatClick}
    oncatdeselect={handleCatDeselect}
  />

  <div class="ui-overlay">
    <h1 class="title">Cat House</h1>

    {#if showCatInfo && selectedCat}
      <CatInfoPanel cat={selectedCat} onclose={handleCatDeselect} />
    {/if}

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

  :global(.game-canvas) {
    display: block;
    width: 100%;
    height: 100%;
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

  .title {
    margin: 0;
    color: #333;
    font-size: 24px;
    text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
    pointer-events: auto;
    align-self: flex-start;
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
    .title { font-size: 18px; }
    .control-btn { padding: 8px 16px; min-width: 80px; font-size: 12px; }
    .instructions { font-size: 11px; padding: 6px 12px; }
  }
</style>
