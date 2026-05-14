# CatHouse Agent 指南

本文档包含项目的技术架构、快速启动指南和项目总结，供 AI Agent 参考。

---

## 📋 文档维护规则

**重要约束**：项目只维护以下 4 个核心文档，除非用户明确告知，否则不要创建其他文档文件。

### 文档职责分工

1. **README.md** - 项目介绍文档（面向人类开发者）
   - 项目概述和视觉风格
   - 快速开始指南（环境要求、安装、运行）
   - 项目结构说明
   - 技术栈介绍
   - **不包含**：详细的开发计划、面向 AI 工具的开发指导说明

2. **AGENTS.md** - AI Agent 技术参考（本文档）
    - 完整的技术架构说明
    - 数据流和类关系
    - 快速启动和操作指南
    - 项目总结和代码统计
    - 性能优化和扩展方向

3. **PLAN.md** - 开发计划文档
   - 所有开发阶段和任务清单
   - 进度跟踪和里程碑
   - 技术风险和应对策略
   - 版本历史和参考资源

4. **UI.md** - UI/UX 设计规范
   - 视觉风格和配色方案
   - 角色设计和动画规范
   - 界面组件设计
   - 响应式和特效规范

### 文档更新原则

- **README.md** 专注于向人类开发者介绍项目，保持简洁清晰
- **AGENTS.md** 包含所有 AI Agent 需要的稳定技术细节和上下文，不包括开发进度等频繁变更的内容
- **PLAN.md** 统一维护所有开发计划和进度信息
- 不要在已有文档或其他位置重复文档的内容
- 除非用户明确要求，否则不要创建新的文档文件

---

## 📐 项目架构

### 整体架构

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

### 数据流

#### 1. 初始化流程

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

#### 2. 游戏循环流程

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

#### 3. 用户交互流程

##### 点击移动
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

##### 拖拽猫
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

### 核心类关系

#### Cat 类
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

#### PhysicsEngine 类
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

#### Renderer 类
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

### 状态管理

#### Pinia Store 结构

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

### 渲染架构

#### 渲染层次（从后到前）

1. **背景层** - 白色背景
2. **地面层** - 房间地面纹理
3. **装饰层** - 家具、道具（Phase 2+）
4. **角色层** - 猫（按 Y 坐标排序实现深度）
5. **UI 层** - 名称标签、状态气泡
6. **调试层** - FPS、碰撞体（可选）

#### 深度排序

```javascript
// 按 Y 坐标排序，Y 越大越靠前（后渲染）
const sortedCats = [...cats].sort((a, b) => a.y - b.y)
sortedCats.forEach(cat => renderer.drawCat(cat))
```

### 物理系统配置

#### Matter.js 参数

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

### 交互系统

#### 事件处理

- **mousedown** - 检测点击目标
- **mousemove** - 拖拽时更新位置
- **mouseup** - 结束拖拽
- **resize** - 窗口尺寸变化

#### 点击检测

```javascript
// 距离检测（圆形碰撞体）
const dx = mouseX - cat.x
const dy = mouseY - cat.y
const distance = Math.sqrt(dx * dx + dy * dy)

if (distance < 30) {
  // 点击到猫
}
```

### 性能优化策略

#### 1. 渲染优化
- 使用 `requestAnimationFrame` 确保 60 FPS
- 离屏 Canvas 预渲染静态元素（待实现）
- 精灵表合并动画帧（待实现）
- 减少不必要的 Canvas 状态保存/恢复

#### 2. 物理优化
- 使用圆形碰撞体简化计算
- 限制刚体数量
- 合理设置碰撞检测频率

#### 3. 内存管理
- 组件卸载时清理资源
- 取消动画帧
- 销毁物理引擎实例

### 扩展方向

#### Phase 2: 行为系统
- 添加行为状态机
- 实现寻路算法（A*）
- 情绪/需求系统
- 地图编辑器

#### Phase 3: 传感器集成
- WebSocket 通信
- MQTT 消息订阅
- 事件日志系统（IndexedDB）

#### Phase 4: 高级功能
- 多用户模式
- 云同步
- AR 叠加
- 机器学习行为分析

### 开发工具

#### 推荐 VS Code 插件
- Vue Language Features (Volar)
- ESLint
- Prettier
- GitLens

#### 调试技巧
- Chrome DevTools Performance 面板分析 FPS
- Console 打印碰撞事件
- 启用调试模式显示碰撞体

### 编码规范

#### 命名约定
- 类名：PascalCase（如 `PhysicsEngine`）
- 变量/函数：camelCase（如 `updateCatPosition`）
- 常量：UPPER_SNAKE_CASE（如 `defaultMapConfig`）
- 私有属性：下划线前缀（如 `_internalState`）

#### 注释规范
- 每个类添加 JSDoc 注释
- 公共方法说明参数和返回值
- 复杂逻辑添加行内注释

---

## 🛠️ 技术栈

### 核心工具
- **包管理器**: pnpm
- **Node.js**: v22.x
- **构建工具**: Vite

### 前端框架
- **UI 框架**: Vue 3 (Composition API)
- **状态管理**: Pinia

### 渲染与物理
- **2D 渲染**: HTML5 Canvas API
- **物理引擎**: Matter.js
- **行为系统**: 自定义状态机

---

## 🚀 快速启动指南
