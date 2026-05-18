<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { initGameState, GameRenderer } from './lib/game';
  import { HOUSE_SIZE, WALL_THICKNESS } from './lib/game';

  let canvas: HTMLCanvasElement;
  let gameState = $state<any>(null);
  let renderer = $state<GameRenderer | null>(null);
  let camera = $state<any>(null);

  // 鼠标拖动相关变量
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  
  // 选中的猫咪
  let selectedCat = $state<any>(null);
  let showCatInfo = $state(false);

  // resize 监听器引用
  let resizeObserver: ResizeObserver | null = null;

  onMount(() => {
    // 检查 URL 参数是否启用调试模式
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const debugMode = debugParam === 'true' || debugParam === 'yes' || debugParam === '1';

    // 初始化游戏状态
    gameState = initGameState();

    // 初始化渲染器（传入调试模式）
    renderer = new GameRenderer(canvas, debugMode);
    camera = renderer.getCamera();

    // 设置 Canvas 尺寸为视口大小
    resizeCanvas();

    // 计算初始摄影机位置，使房屋居中
    centerCameraOnHouse();

    // 首次渲染
    renderer.render(gameState);

    // 添加事件监听器
    setupEventListeners();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    // 清理事件监听器（仅在客户端执行）
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    }
  });

  function resizeCanvas() {
    if (!canvas || !renderer) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 设置 Canvas 的实际像素尺寸
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // 设置 CSS 尺寸
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // 缩放上下文以匹配设备像素比
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }

  function handleResize() {
    resizeCanvas();
    if (renderer && gameState) {
      renderer.render(gameState);
    }
  }

  function centerCameraOnHouse() {
    if (!camera || !renderer) return;

    // 获取视口中心
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    // 计算房屋中心在世界坐标中的位置
    const houseCenterX = (HOUSE_SIZE + WALL_THICKNESS * 2) / 2;
    const houseCenterY = (HOUSE_SIZE + WALL_THICKNESS * 2) / 2;

    // 设置摄影机位置，使房屋居中（考虑缩放比例）
    camera.x = viewportCenterX - houseCenterX * camera.zoom;
    camera.y = viewportCenterY - houseCenterY * camera.zoom;
  }

  function setupEventListeners() {
    if (!canvas) return;

    // 鼠标按下事件 - 开始拖动或选择猫咪
    canvas.addEventListener('mousedown', (e) => {
      // 检查是否点击了猫咪
      const clickedCat = checkCatClick(e.offsetX, e.offsetY);
      if (clickedCat) {
        selectedCat = clickedCat;
        showCatInfo = true;
        // 不开始拖动，而是显示信息
        return;
      } else {
        // 没有点击到猫咪，开始拖动
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        // 隐藏猫咪信息
        showCatInfo = false;
        selectedCat = null;
      }
    });

    // 鼠标移动事件 - 拖动摄影机
    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging || !camera) return;

      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;

      camera.pan(deltaX, deltaY);

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      // 重新渲染
      if (renderer && gameState) {
        renderer.render(gameState);
      }
    });

    // 鼠标释放事件 - 停止拖动
    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    // 滚轮缩放事件
    canvas.addEventListener('wheel', (e) => {
      if (!camera) return;

      e.preventDefault();

      // 根据滚轮方向确定缩放因子
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1; // 向下滚动缩小，向上滚动放大

      // 以鼠标位置为中心进行缩放
      camera.zoomAt(scaleFactor, e.offsetX, e.offsetY);

      // 重新渲染
      if (renderer && gameState) {
        renderer.render(gameState);
      }
    }, { passive: false });

    // 键盘事件 - 使用方向键控制摄影机移动
    document.addEventListener('keydown', handleKeyDown);

    // 设置初始光标样式
    canvas.style.cursor = 'grab';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!camera || !renderer || !gameState) return;

    const panSpeed = 20; // 每次移动的像素数

    switch(e.key) {
      case 'ArrowUp':
        camera.pan(0, panSpeed);
        break;
      case 'ArrowDown':
        camera.pan(0, -panSpeed);
        break;
      case 'ArrowLeft':
        camera.pan(panSpeed, 0);
        break;
      case 'ArrowRight':
        camera.pan(-panSpeed, 0);
        break;
      case '+':
      case '=':
        camera.zoomAt(1.1); // 放大
        break;
      case '-':
      case '_':
        camera.zoomAt(0.9); // 缩小
        break;
      case 'Escape':
        // 按ESC键隐藏猫咪信息
        showCatInfo = false;
        selectedCat = null;
        break;
      default:
        return; // 不处理其他按键
    }

    e.preventDefault();
    renderer.render(gameState);
  }
  
  /**
   * 检查是否点击了猫咪
   */
  function checkCatClick(mouseX: number, mouseY: number): any {
    if (!gameState || !camera) return null;
    
    // 将屏幕坐标转换为世界坐标
    const worldPos = camera.screenToWorld(mouseX, mouseY);
    
    // 检查每只猫
    for (const cat of gameState.cats) {
      const dx = worldPos.x - (cat.x + cat.visualWidth / 2);
      const dy = worldPos.y - (cat.y + cat.visualHeight / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 使用交互半径进行检测
      if (distance <= cat.interactionRadius) {
        return cat;
      }
    }
    
    return null;
  }

  // 控制函数
  function resetCamera() {
    if (!camera || !renderer || !gameState) return;

    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1;

    // 重新居中摄影机
    centerCameraOnHouse();

    renderer.render(gameState);
  }

  function zoomIn() {
    if (!camera || !renderer || !gameState) return;

    camera.zoomAt(1.2); // 放大20%
    renderer.render(gameState);
  }

  function zoomOut() {
    if (!camera || !renderer || !gameState) return;

    camera.zoomAt(0.8); // 缩小20%
    renderer.render(gameState);
  }
</script>

<div class="game-container">
  <canvas
    bind:this={canvas}
    class="game-canvas"
  ></canvas>

  <!-- 浮动的 UI 层 -->
  <div class="ui-overlay">
    <h1 class="title">Cat House</h1>

    <!-- 猫咪信息面板 -->
    {#if showCatInfo && selectedCat}
      <div class="cat-info-panel">
        <div class="cat-info-header">
          <span class="cat-name">{selectedCat.name}</span>
          <button class="close-btn" onclick={() => { showCatInfo = false; selectedCat = null; }}>×</button>
        </div>
        <div class="cat-info-content">
          <p><strong>ID:</strong> {selectedCat.id}</p>
          <p><strong>颜色:</strong> <span style="color: {selectedCat.color};">●</span> {selectedCat.color}</p>
          <p><strong>速度:</strong> {selectedCat.speed} px/帧</p>
          <p><strong>位置:</strong> ({Math.round(selectedCat.x)}, {Math.round(selectedCat.y)})</p>
          <p><strong>碰撞半径:</strong> {selectedCat.collisionRadius}px</p>
          <p><strong>交互半径:</strong> {selectedCat.interactionRadius}px</p>
        </div>
      </div>
    {/if}

    <div class="controls">
      <button class="control-btn" onclick={() => resetCamera()}>重置视图</button>
      <button class="control-btn" onclick={() => zoomIn()}>放大</button>
      <button class="control-btn" onclick={() => zoomOut()}>缩小</button>
    </div>

    <div class="instructions">
      <p>🖱️ 鼠标拖动：平移视图 | 🖱️ 滚轮：缩放视图 | ⌨️ 方向键：移动视图 | ⌨️ +/-：缩放视图 | 🖱️ 点击猫咪：查看信息</p>
    </div>
  </div>
</div>

<style>
  /* 全局样式重置 */
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

  /* UI 覆盖层 */
  .ui-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* 让鼠标事件穿透到 Canvas */
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
    pointer-events: auto; /* 恢复标题的交互 */
    align-self: flex-start;
  }

  .controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    pointer-events: auto; /* 恢复按钮的点击事件 */
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
  
  /* 猫咪信息面板 */
  .cat-info-panel {
    position: absolute;
    top: 80px;
    right: 20px;
    background-color: rgba(255, 255, 255, 0.95);
    border: 2px solid #424242;
    border-radius: 12px;
    padding: 16px;
    min-width: 250px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    backdrop-filter: blur(10px);
  }
  
  .cat-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .cat-name {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  
  .close-btn:hover {
    background-color: #f0f0f0;
    color: #333;
  }
  
  .cat-info-content {
    font-size: 14px;
    color: #555;
  }
  
  .cat-info-content p {
    margin: 6px 0;
    line-height: 1.4;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .title {
      font-size: 18px;
    }

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
