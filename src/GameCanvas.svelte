<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GameRenderer } from './lib/game';
  import type { Cat } from './lib/game';
  import { gameState, debugMode } from './lib/stores/gameStore';

  interface Props {
    oncatclick: (cat: Cat) => void;
    oncatdeselect: () => void;
    renderer: GameRenderer | null;
  }

  let {
    oncatclick = () => {},
    oncatdeselect = () => {},
    renderer = $bindable<GameRenderer | null>(null),
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  let currentState: any = null;
  const unsubGameState = gameState.subscribe((s) => (currentState = s));
  let isDebug = false;
  const unsubDebug = debugMode.subscribe((d) => (isDebug = d));

  onDestroy(() => {
    unsubGameState();
    unsubDebug();
  });

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = devicePixelRatio;
    const width = innerWidth;
    const height = innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  onMount(() => {
    if (!canvas) return;

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
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('keydown', handleKeyDown);
  });

  function handleResize() {
    resizeCanvas();
    if (renderer && currentState) renderer.render(currentState);
  }

  function handleMouseDown(e: MouseEvent) {
    const camera = renderer?.getCamera();
    const clickedCat = checkCatClick(e.offsetX, e.offsetY, camera);
    if (clickedCat) {
      oncatclick(clickedCat);
      return;
    }
    oncatdeselect();
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !renderer) return;
    const camera = renderer.getCamera();
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    camera.pan(deltaX, deltaY);
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (currentState) renderer.render(currentState);
  }

  function handleMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  function handleMouseLeave() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  function handleWheel(e: WheelEvent) {
    if (!renderer) return;
    e.preventDefault();
    const camera = renderer.getCamera();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    camera.zoomAt(scaleFactor, e.offsetX, e.offsetY);
    if (currentState) renderer.render(currentState);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!renderer || !currentState) return;
    const camera = renderer.getCamera();
    const panSpeed = 20;

    switch (e.key) {
      case 'ArrowUp':    camera.pan(0, panSpeed); break;
      case 'ArrowDown':  camera.pan(0, -panSpeed); break;
      case 'ArrowLeft':  camera.pan(panSpeed, 0); break;
      case 'ArrowRight': camera.pan(-panSpeed, 0); break;
      case '+': case '=': camera.zoomAt(1.1); break;
      case '-': case '_': camera.zoomAt(0.9); break;
      default: return;
    }

    e.preventDefault();
    renderer.render(currentState);
  }

  function checkCatClick(mouseX: number, mouseY: number, camera?: ReturnType<GameRenderer['getCamera']>): Cat | null {
    if (!currentState || !camera) return null;
    const worldPos = camera.screenToWorld(mouseX, mouseY);
    for (const cat of currentState.cats) {
      const dx = worldPos.x - (cat.x + cat.visualWidth / 2);
      const dy = worldPos.y - (cat.y + cat.visualHeight / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= cat.interactionRadius) return cat;
    }
    return null;
  }
</script>

<canvas bind:this={canvas} class="game-canvas"></canvas>

<style>
  .game-canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }
</style>
