# CatHouse 项目架构文档

## 📐 整体架构

CatHouse 采用分层架构设计，将渲染、物理、状态管理分离，确保代码的可维护性和可扩展性。

```
┌─────────────────────────────────────────┐
│          Vue 3 UI Layer                 │
│  (Components + Pinia State Management)  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Game Logic Layer                │
│  (Game Loop + Entity Management)        │
└──┬────────────┬──────────────┬──────────┘
   │            │              │
┌──▼──────┐ ┌──▼────────┐ ┌──▼──────────┐
│Renderer │ │ Physics   │ │  Entities   │
│ (Canvas)│ │(Matter.js)│ │  (Cat, etc) │
└─────────┘ └───────────┘ └─────────────┘
```

## 📁 目录结构详解

### 1. src/ - 源代码根目录

#### 1.1 components/ - Vue 组件
存放所有 Vue 组件文件

- **GameCanvas.vue** - 主游戏画布组件
  - 负责 Canvas 初始化和事件监听
  - 管理游戏循环（game loop）
  - 处理用户交互（点击、拖拽）
  - 集成控制面板 UI

#### 1.2 core/ - 核心逻辑层
独立于框架的核心游戏逻辑

- **Cat.js** - 猫实体类
  - 管理猫的视觉属性（位置、旋转、缩放）
  - 管理猫的状态（IDLE, WALKING, SLEEPING）
  - 处理动画逻辑（帧更新、眨眼）
  - 同步物理刚体和视觉位置
  
- **PhysicsEngine.js** - 物理引擎封装
  - 封装 Matter.js API
  - 创建和管理刚体（墙壁、猫）
  - 处理碰撞检测事件
  - 提供力的施加和速度控制
  
- **Renderer.js** - 渲染器
  - 封装 Canvas 2D API
  - 绘制背景、房间、墙壁
  - 绘制猫的形象（几何图形）
  - 绘制 UI 元素（名称标签、FPS）
  - 处理特效（粒子、气泡）

#### 1.3 stores/ - 状态管理
Pinia 全局状态管理

- **gameStore.js** - 游戏状态存储
  - 管理猫的列表和状态
  - 管理地图配置
  - 管理选中状态
  - 提供状态更新方法

#### 1.4 config/ - 配置文件
游戏配置数据

- **mapConfig.js** - 地图和猫的配置
  - 默认地图布局（房间、墙壁）
  - 猫的初始位置和配色
  - 可外部化为 JSON 文件

#### 1.5 assets/ - 静态资源（待扩展）
- sprites/ - 精灵图（Phase 2+）
- textures/ - 纹理贴图
- sounds/ - 音效文件

#### 1.6 utils/ - 工具函数（待扩展）
- 数学工具函数
- 颜色处理函数
- 路径查找算法（Phase 2+）

### 2. public/ - 公共资源
存放不需要构建的静态文件

### 3. 根目录配置文件

- **index.html** - HTML 入口模板
- **vite.config.js** - Vite 构建配置
- **package.json** - 项目依赖和脚本
- **.gitignore** - Git 忽略规则

## 🔄 数据流

### 1. 初始化流程

```
main.js
  ↓ 创建 Vue App
  ↓ 安装 Pinia
App.vue
  ↓ 渲染
GameCanvas.vue
  ↓ onMounted
  ├→ 创建 PhysicsEngine
  ├→ 创建 Renderer
  ├→ 加载地图配置
  ├→ 创建墙壁刚体
  ├→ 创建猫实体和刚体
  └→ 启动游戏循环
```

### 2. 游戏循环流程

```
requestAnimationFrame(gameLoop)
  ↓
计算 deltaTime
  ↓
更新物理引擎 (physicsEngine.update)
  ↓
更新猫的状态 (cat.update)
  ├→ 同步物理位置
  ├→ 更新动画帧
  └→ 处理移动逻辑
  ↓
渲染场景 (render)
  ├→ 清空画布
  ├→ 绘制背景
  ├→ 绘制房间
  ├→ 绘制墙壁
  ├→ 绘制猫
  └→ 绘制 UI
  ↓
下一帧
```

### 3. 用户交互流程

#### 点击移动
```
用户点击空白区域
  ↓
handleMouseDown 事件
  ↓
检测是否点击到猫
  ↓ 否
获取选中猫
  ↓
cat.moveTo(targetX, targetY)
  ↓
游戏循环中更新猫位置
  ↓
物理引擎施加力
  ↓
猫移动到目标点
```

#### 拖拽猫
```
用户按下猫
  ↓
handleMouseDown 事件
  ↓
检测到猫 → isDragging = true
  ↓
handleMouseMove 事件
  ↓
physicsEngine.setPosition()
  ↓
直接设置刚体位置
  ↓
用户释放鼠标
  ↓
handleMouseUp 事件
  ↓
isDragging = false
```

## 🎯 核心类关系

### Cat 类
```javascript
Cat {
  // 属性
  - id, name, colorConfig
  - x, y, rotation, scale
  - state, animationFrame
  - body (Matter.Body)
  - targetX, targetY
  
  // 方法
  + update(deltaTime)
  + moveTo(x, y)
  + stop()
  + syncFromBody()
}
```

### PhysicsEngine 类
```javascript
PhysicsEngine {
  // 属性
  - engine (Matter.Engine)
  - world (Matter.World)
  - collisionCallbacks[]
  
  // 方法
  + update(deltaTime)
  + createWall(x, y, w, h)
  + createCatBody(x, y, radius)
  + applyForce(body, fx, fy)
  + setPosition(body, x, y)
  + onCollision(callback)
}
```

### Renderer 类
```javascript
Renderer {
  // 属性
  - canvas
  - ctx (CanvasRenderingContext2D)
  - width, height
  - fps
  
  // 方法
  + resize(w, h)
  + clear()
  + drawBackground()
  + drawRoom(room)
  + drawWall(x, y, w, h)
  + drawCat(cat, isSelected)
  + drawFPS()
}
```

## 📊 状态管理

### Pinia Store 结构

```javascript
gameStore {
  // State
  - cats: Cat[]
  - mapConfig: Object
  - isRunning: boolean
  - selectedCatId: string | null
  - isEditing: boolean
  - showDebug: boolean
  
  // Getters
  + selectedCat: Cat
  
  // Actions
  + addCat(cat)
  + removeCat(catId)
  + updateCatPosition(catId, x, y)
  + selectCat(catId)
  + toggleRunning()
  + toggleDebug()
}
```

## 🎨 渲染架构

### 渲染层次（从后到前）

1. **背景层** - 白色背景
2. **地面层** - 房间地面纹理
3. **装饰层** - 家具、道具（Phase 2+）
4. **角色层** - 猫（按 Y 坐标排序实现深度）
5. **UI 层** - 名称标签、状态气泡
6. **调试层** - FPS、碰撞体（可选）

### 深度排序

```javascript
// 按 Y 坐标排序，Y 越大越靠前（后渲染）
const sortedCats = [...cats].sort((a, b) => a.y - b.y)
sortedCats.forEach(cat => renderer.drawCat(cat))
```

## ⚙️ 物理系统配置

### Matter.js 参数

```javascript
// 引擎配置
engine.gravity.x = 0  // 俯视角无重力
engine.gravity.y = 0

// 墙壁刚体
{
  isStatic: true,      // 静态不可移动
  friction: 0.5,       // 摩擦力
  restitution: 0       // 无反弹
}

// 猫刚体
{
  friction: 0.3,       // 摩擦力
  frictionAir: 0.05,   // 空气阻力
  restitution: 0.2,    // 轻微反弹
  density: 0.001       // 密度
}
```

## 🎮 交互系统

### 事件处理

- **mousedown** - 检测点击目标
- **mousemove** - 拖拽时更新位置
- **mouseup** - 结束拖拽
- **resize** - 窗口尺寸变化

### 点击检测

```javascript
// 距离检测（圆形碰撞体）
const dx = mouseX - cat.x
const dy = mouseY - cat.y
const distance = Math.sqrt(dx * dx + dy * dy)

if (distance < 30) {
  // 点击到猫
}
```

## 🚀 性能优化策略

### 1. 渲染优化
- 使用 `requestAnimationFrame` 确保 60 FPS
- 离屏 Canvas 预渲染静态元素（待实现）
- 精灵表合并动画帧（待实现）
- 减少不必要的 Canvas 状态保存/恢复

### 2. 物理优化
- 使用圆形碰撞体简化计算
- 限制刚体数量
- 合理设置碰撞检测频率

### 3. 内存管理
- 组件卸载时清理资源
- 取消动画帧
- 销毁物理引擎实例

## 📈 扩展方向

### Phase 2: 行为系统
- 添加行为状态机
- 实现寻路算法（A*）
- 情绪/需求系统
- 地图编辑器

### Phase 3: 传感器集成
- WebSocket 通信
- MQTT 消息订阅
- 事件日志系统（IndexedDB）

### Phase 4: 高级功能
- 多用户模式
- 云同步
- AR 叠加
- 机器学习行为分析

## 🔧 开发工具

### 推荐 VS Code 插件
- Vue Language Features (Volar)
- ESLint
- Prettier
- GitLens

### 调试技巧
- Chrome DevTools Performance 面板分析 FPS
- Console 打印碰撞事件
- 启用调试模式显示碰撞体

## 📝 编码规范

### 命名约定
- 类名：PascalCase（如 `PhysicsEngine`）
- 变量/函数：camelCase（如 `updateCatPosition`）
- 常量：UPPER_SNAKE_CASE（如 `defaultMapConfig`）
- 私有属性：下划线前缀（如 `_internalState`）

### 注释规范
- 每个类添加 JSDoc 注释
- 公共方法说明参数和返回值
- 复杂逻辑添加行内注释

---

**最后更新**: 2026-05-13
**版本**: v1.0 (Phase 1 完成)
