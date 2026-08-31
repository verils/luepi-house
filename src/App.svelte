<script lang="ts">
  import {onDestroy, onMount} from 'svelte';
  import {get} from 'svelte/store';
  import {
    Camera,
    cycleTimeSpeed,
    GameRenderer,
    getWeatherName,
    logSystemEvent,
    MAP_HEIGHT,
    MAP_WIDTH,
    resolveIntents,
    updateCatState,
    updateTime,
    updateWeather,
  } from './lib/game';
  import type {CatIntent, StateContext} from './lib/game';
  import {DragController} from './lib/game/drag-controller';
  import {FpsMeter} from './lib/game/fps-meter';
  import {getPhysicalWindowScreenSize} from './lib/game/screen';
  import {catsStore} from './lib/stores/cats';
  import {eventLogStore} from './lib/stores/eventLog';
  import {initializeGame} from './lib/stores';
  import {debugMode, deselectCat, selectCat, selectedCat, showCatInfo} from './lib/stores/selection';
  import {timeStore} from './lib/stores/time';
  import {weatherStore} from './lib/stores/weather';
  import {getWorld} from './lib/stores/world';
  import InfoPanel from './InfoPanel.svelte';

  // 画布
  let canvas: HTMLCanvasElement;

  // 游戏对象定义
  let camera: Camera;
  let renderer: GameRenderer | null = null;
  let drag: DragController;

  // 帧循环状态（rAF 驱动 / 帧计时 / FPS / UI 同步节流）
  let animationFrameId = 0;
  let lastUiSync = 0;
  let unsubDebug: (() => void) | null = null;

  // 键盘平移：记录按住的方向键，帧循环中按 dt 连续平移（短步高频、更平滑）
  const pressedKeys: Record<string, boolean> = {};
  const KEY_PAN_SPEED = 6000; // 方向键移动速度：像素/秒

  let fpsMeter: FpsMeter;
  let fps = $state(0);

  $effect(() => {
    const p = new URLSearchParams(location.search).get('debug');
    debugMode.set(p === 'true' || p === 'yes' || p === '1');
  });

  onMount(() => {
    initializeGame();

    resizeCanvas();

    camera = new Camera();
    renderer = new GameRenderer(canvas, camera, get(debugMode));

    drag = new DragController();
    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel, {passive: false});
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);

    centerCameraOnHouse();

    // debugMode 变化 -> 切渲染调试层并重绘（原由引擎订阅，现归 App 管理）
    unsubDebug = debugMode.subscribe((debug) => {
      if (!renderer) {
        return;
      }
      renderer.setDebugMode(debug);
      renderCurrentState();
    });

    // 首帧渲染
    renderCurrentState();

    // 启动帧循环
    fpsMeter = new FpsMeter();
    animationFrameId = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId);
    unsubDebug?.();
    unsubDebug = null;
    canvas?.removeEventListener('mousedown', handleMouseDown);
    canvas?.removeEventListener('mousemove', handleMouseMove);
    canvas?.removeEventListener('mouseup', handleMouseUp);
    canvas?.removeEventListener('mouseleave', handleMouseLeave);
    canvas?.removeEventListener('wheel', handleWheel);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('resize', handleResize);
    renderer?.destroy();
  });

  // --- 游戏模拟（时间 / 天气 / 猫咪 AI / 意图解算） ---
  function step(dt: number): void {
    const time = get(timeStore);
    updateTime(time, dt);

    const weather = get(weatherStore);
    const weatherChanged = updateWeather(weather, dt);
    if (weatherChanged) {
      const eventLog = get(eventLogStore);
      logSystemEvent(
        eventLog,
        'weather_change',
        `天气变为${getWeatherName(weather.current)}`,
        {weather: weather.current},
        {
          hour: time.hour,
          minute: time.minute,
          day: time.day,
        },
      );
    }

    const world = getWorld();
    const cats = get(catsStore);
    const stateCtx: StateContext = {
      shelters: world.shelters,
      catBeds: world.catBeds,
      furnitures: world.furnitures,
      toys: world.toys,
      solidObjects: world.solidObjects,
      house: world.house,
      allCats: cats,
      eventLog: get(eventLogStore),
      gameTime: {
        hour: time.hour,
        minute: time.minute,
        day: time.day,
      },
    };

    const allIntents: CatIntent[] = [];
    for (const cat of cats) {
      allIntents.push(...updateCatState(cat, stateCtx, dt));
    }
    resolveIntents(allIntents, cats);
  }

  // --- 帧循环（rAF 驱动：推进模拟 + 渲染 + 节流同步 UI） ---
  function tick(): void {
    if (!renderer) {
      animationFrameId = requestAnimationFrame(tick);
      return;
    }

    // FPS 计数：每秒结算一次（窗口内未到结算点返回 null）
    const now = performance.now();
    const measured = fpsMeter.tick(now);
    if (measured !== null) {
      fps = measured;
    }

    // 帧间隔 dt：归一化到 60fps，上限 3 防卡顿跳跃
    const dt = fpsMeter.lastTime === 0
      ? 1
      : Math.min((now - fpsMeter.lastTime) / (1000 / 60), 3);

    // 推进一帧模拟（原地修改 store 中的对象）
    step(dt);

    // 键盘平移：方向向量归一化后按 dt 连续推进（斜向不加速）
    let panX = 0;
    let panY = 0;
    if (pressedKeys['ArrowLeft']) {
      panX += 1;
    }
    if (pressedKeys['ArrowRight']) {
      panX -= 1;
    }
    if (pressedKeys['ArrowUp']) {
      panY += 1;
    }
    if (pressedKeys['ArrowDown']) {
      panY -= 1;
    }
    if (panX !== 0 || panY !== 0) {
      const len = Math.hypot(panX, panY);
      const dx = (panX / len) * KEY_PAN_SPEED / 1000 * dt;
      const dy = (panY / len) * KEY_PAN_SPEED / 1000 * dt;
      camera.pan(dx, dy);
    }

    // 渲染（用各 store 切片组装 GameState，纯引用、零拷贝）
    renderer.render({
      ...getWorld(),
      cats: get(catsStore),
      time: get(timeStore),
      weather: get(weatherStore),
      eventLog: get(eventLogStore),
    });

    // UI 同步：每 200ms 把状态推给各 store。
    // 同引用 re-set 触发订阅者刷新--InfoPanel 读的是引擎原地改的字段，
    // 不 re-set 则 Svelte 感知不到变化。删除会导致面板不刷新。
    if (now - lastUiSync >= 200) {
      lastUiSync = now;
      timeStore.set(get(timeStore));
      weatherStore.set(get(weatherStore));
      eventLogStore.set(get(eventLogStore));
      catsStore.set(get(catsStore));
      const sel = get(selectedCat);
      if (sel) {
        selectedCat.set(sel);
      }
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  // --- 输入处理（鼠标 / 键盘 / 视图） ---
  function handleMouseDown(e: MouseEvent): void {
    const worldPos = camera.screenToWorld(e.offsetX, e.offsetY);
    const cats = get(catsStore);
    for (const cat of cats) {
      const dx = worldPos.x - (cat.x + cat.visualWidth / 2);
      const dy = worldPos.y - (cat.y + cat.visualHeight / 2);
      if (Math.sqrt(dx * dx + dy * dy) <= cat.interactionRadius) {
        selectCat(cat);
        return;
      }
    }
    deselectCat();
    drag.start(e.clientX, e.clientY);
  }

  function handleMouseMove(e: MouseEvent): void {
    const result = drag.move(e.clientX, e.clientY);
    if (result.started) {
      canvas.style.cursor = 'grabbing';
      return;
    }
    if (result.panned) {
      camera.pan(result.dx, result.dy);
      renderCurrentState();
    }
  }

  function handleMouseUp(): void {
    drag.end();
    canvas.style.cursor = 'grab';
  }

  function handleMouseLeave(): void {
    canvas.style.cursor = 'grab';
  }

  function handleWheel(e: WheelEvent): void {
    e.preventDefault();
    camera.zoomAt(e.deltaY > 0 ? 0.9 : 1.1, e.offsetX, e.offsetY);
    renderCurrentState();
  }

  function handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        pressedKeys[e.key] = true;
        break;
      case '+':
      case '=':
        camera.zoomAt(1.1);
        break;
      case '-':
      case '_':
        camera.zoomAt(0.9);
        break;
      default:
        return;
    }
    e.preventDefault();
    renderCurrentState();
  }

  function handleKeyUp(e: KeyboardEvent): void {
    delete pressedKeys[e.key];
  }

  function handleBlur(): void {
    for (const key of Object.keys(pressedKeys)) {
      delete pressedKeys[key];
    }
  }

  function handleResize(): void {
    resizeCanvas();
    renderCurrentState();
  }

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
    if (renderer) {
      renderer.render({
        ...getWorld(),
        cats: get(catsStore),
        time: get(timeStore),
        weather: get(weatherStore),
        eventLog: get(eventLogStore),
      });
    }
  }

  function handleSpeedChange() {
    const time = get(timeStore);
    time.speed = cycleTimeSpeed(time.speed);
  }

  function centerCameraOnHouse() {
    const dpr = devicePixelRatio;
    const centerX = canvas.width / dpr / 2;
    const centerY = canvas.height / dpr / 2;
    camera.x = centerX - (MAP_WIDTH / 2) * camera.zoom;
    camera.y = centerY - (MAP_HEIGHT / 2) * camera.zoom;
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
        {$timeStore?.hour ?? 8} 时
      </div>
      <button class="speed-btn" onclick={handleSpeedChange}>
        {$timeStore?.speed ?? 1}x
      </button>
    </div>

    <div class="fps-counter">
      FPS: {fps}
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
