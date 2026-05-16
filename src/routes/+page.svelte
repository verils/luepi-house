<script lang="ts">
  import {onMount} from 'svelte';
  import {initGameState, GameRenderer} from '$lib/game';
  import {HOUSE_SIZE, WALL_THICKNESS} from '$lib/game';

  let canvas: HTMLCanvasElement;
  let gameState = $state<any>(null);
  let renderer = $state<GameRenderer | null>(null);

  onMount(() => {
    // 初始化游戏状态
    gameState = initGameState();

    // 初始化渲染器
    renderer = new GameRenderer(canvas);

    // 首次渲染
    renderer.render(gameState);
  });
</script>

<div class="game-container">
  <h1>Cat House</h1>
  <canvas
    bind:this={canvas}
    width={HOUSE_SIZE + WALL_THICKNESS * 2}
    height={HOUSE_SIZE + WALL_THICKNESS * 2}
    class="game-canvas"
  ></canvas>
</div>

<style>
  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f0f0f0;
    padding: 20px;
  }

  h1 {
    margin-bottom: 20px;
    color: #333;
  }

  .game-canvas {
    border: 2px solid #333;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
</style>
