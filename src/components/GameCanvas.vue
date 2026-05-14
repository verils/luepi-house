<template>
  <div class="game-container">
    <canvas ref="canvasRef"></canvas>
    <div class="control-panel" v-if="showControls">
      <h3>🐱 CatHouse</h3>
      <button @click="togglePause">{{ isRunning ? '⏸️ 暂停' : '▶️ 播放' }}</button>
      <button @click="toggleDebug">{{ showDebug ? '🔍 隐藏调试' : '🔍 显示调试' }}</button>
      <div class="cat-status">
        <div v-for="cat in cats" :key="cat.id" class="cat-info">
          <span>{{ cat.name }}: {{ getStatusText(cat.state) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { PhysicsEngine } from '../core/PhysicsEngine'
import { Renderer } from '../core/Renderer'
import { Cat } from '../core/Cat'
import { defaultMapConfig, initialCats } from '../config/mapConfig'

// Store
const gameStore = useGameStore()
const { cats, isRunning, showDebug } = gameStore

// Refs
const canvasRef = ref(null)
const showControls = ref(true)

// 核心对象
let physicsEngine = null
let renderer = null
let animationId = null
let lastTime = 0

// 拖拽状态
let isDragging = false
let draggedCat = null

/**
 * 初始化游戏
 */
function initGame() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  // 设置画布尺寸
  resizeCanvas()
  
  // 创建物理引擎
  physicsEngine = new PhysicsEngine()
  
  // 创建渲染器
  renderer = new Renderer(canvas)
  
  // 加载地图配置
  gameStore.setMapConfig(defaultMapConfig)
  
  // 创建墙壁
  createWalls()
  
  // 创建猫
  createCats()
  
  // 启动游戏循环
  isRunning.value = true
  lastTime = performance.now()
  gameLoop(lastTime)
}

/**
 * 调整画布尺寸
 */
function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const width = window.innerWidth
  const height = window.innerHeight
  
  canvas.width = width
  canvas.height = height
  
  if (renderer) {
    renderer.resize(width, height)
  }
}

/**
 * 创建墙壁
 */
function createWalls() {
  const { walls } = defaultMapConfig
  
  walls.forEach(wall => {
    physicsEngine.createWall(wall.x, wall.y, wall.width, wall.height)
  })
}

/**
 * 创建猫
 */
function createCats() {
  initialCats.forEach(catConfig => {
    const cat = new Cat(
      catConfig.id,
      catConfig.name,
      catConfig.colorConfig
    )
    
    // 设置初始位置
    cat.x = catConfig.x
    cat.y = catConfig.y
    
    // 创建物理刚体
    const body = physicsEngine.createCatBody(catConfig.x, catConfig.y, 20)
    cat.body = body
    
    // 添加到 store
    gameStore.addCat(cat)
  })
}

/**
 * 游戏主循环
 */
function gameLoop(timestamp) {
  if (!isRunning.value) {
    animationId = requestAnimationFrame(gameLoop)
    return
  }
  
  // 计算帧时间差
  const deltaTime = (timestamp - lastTime) / 1000
  lastTime = timestamp
  
  // 更新 FPS
  renderer.updateFPS(timestamp)
  
  // 更新物理引擎
  physicsEngine.update(deltaTime)
  
  // 更新猫的状态
  cats.forEach(cat => {
    cat.syncFromBody()
    cat.update(deltaTime)
  })
  
  // 渲染
  render()
  
  // 下一帧
  animationId = requestAnimationFrame(gameLoop)
}

/**
 * 渲染场景
 */
function render() {
  // 清空画布
  renderer.clear()
  
  // 绘制背景
  renderer.drawBackground()
  
  // 绘制房间
  defaultMapConfig.rooms.forEach(room => {
    renderer.drawRoom(room)
  })
  
  // 绘制墙壁
  defaultMapConfig.walls.forEach(wall => {
    renderer.drawWall(
      wall.x - wall.width / 2,
      wall.y - wall.height / 2,
      wall.width,
      wall.height
    )
  })
  
  // 绘制猫（按 Y 坐标排序，实现深度效果）
  const sortedCats = [...cats].sort((a, b) => a.y - b.y)
  sortedCats.forEach(cat => {
    const isSelected = gameStore.selectedCatId === cat.id
    renderer.drawCat(cat, isSelected)
  })
  
  // 绘制调试信息
  if (showDebug.value) {
    renderer.drawDebugInfo(cats)
  }
  
  // 绘制 FPS
  renderer.drawFPS()
}

/**
 * 处理鼠标点击
 */
function handleMouseDown(event) {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  // 检查是否点击到猫
  let clickedCat = null
  let minDistance = Infinity
  
  cats.forEach(cat => {
    const dx = mouseX - cat.x
    const dy = mouseY - cat.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 30 && distance < minDistance) {
      minDistance = distance
      clickedCat = cat
    }
  })
  
  if (clickedCat) {
    // 选中猫并开始拖拽
    gameStore.selectCat(clickedCat.id)
    isDragging = true
    draggedCat = clickedCat
  } else {
    // 点击空白区域，移动选中的猫
    if (gameStore.selectedCatId) {
      const selectedCat = cats.find(c => c.id === gameStore.selectedCatId)
      if (selectedCat) {
        selectedCat.moveTo(mouseX, mouseY)
      }
    }
  }
}

/**
 * 处理鼠标移动
 */
function handleMouseMove(event) {
  if (!isDragging || !draggedCat) return
  
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  // 直接设置猫的位置（拖拽时暂时禁用物理）
  physicsEngine.setPosition(draggedCat.body, mouseX, mouseY)
}

/**
 * 处理鼠标释放
 */
function handleMouseUp() {
  isDragging = false
  draggedCat = null
}

/**
 * 切换暂停/播放
 */
function togglePause() {
  gameStore.toggleRunning()
}

/**
 * 切换调试模式
 */
function toggleDebug() {
  gameStore.toggleDebug()
}

/**
 * 获取状态文本
 */
function getStatusText(state) {
  const statusMap = {
    IDLE: '😺 空闲',
    WALKING: '🚶 行走',
    SLEEPING: '😴 睡觉',
    PLAYING: '🎮 玩耍'
  }
  return statusMap[state] || state
}

// 生命周期钩子
onMounted(() => {
  initGame()
  
  // 监听窗口尺寸变化
  window.addEventListener('resize', resizeCanvas)
  
  // 监听鼠标事件
  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
  }
})

onUnmounted(() => {
  // 清理资源
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  if (physicsEngine) {
    physicsEngine.destroy()
  }
  
  window.removeEventListener('resize', resizeCanvas)
  
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('mousedown', handleMouseDown)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mouseup', handleMouseUp)
    canvas.removeEventListener('mouseleave', handleMouseUp)
  }
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

.control-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #424242;
}

.control-panel button {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #FF6B6B, #FFA500);
  color: white;
  border: 2px solid #424242;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: transform 0.1s;
}

.control-panel button:active {
  transform: translateY(2px);
}

.cat-status {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E0E0E0;
}

.cat-info {
  margin-bottom: 4px;
  font-size: 12px;
  color: #424242;
}
</style>
