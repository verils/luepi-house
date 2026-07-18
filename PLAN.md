# CatHouse 项目开发计划

## 📊 当前进度概览

**最后更新**: 2026-07-18
**当前阶段**: 任务 1-6 已完成；代码审查已完成，修复方案已记录待执行
**已完成**: 任务 1-6（基础系统、测试优化、独立AI架构）

---

## 项目计划

本项目采用**功能驱动**的开发方式，已完成前 5 个阶段：

1. ✅ 核心配置与定义
2. ✅ 动态实体（核心）
3. ✅ 静态世界
4. ✅ 规则与交互
5. ✅ 测试与优化
6. ✅ **独立 AI 架构** - 状态机解耦，事件驱动的意图系统

---

### 任务 6: 状态机解耦 — 独立 AI 架构 ✅ 已完成

**目标**: 将两只猫的状态机从"共享上下文、直接互改"改为"独立 AI、事件驱动"。每只猫是独立的 agent，只修改自己的状态，通过事件系统感知对方。

**设计原则**: 两只猫，两个 AI，思维和意图独立，受外界事件影响。

#### 当前耦合问题

| 函数 | 问题 |
|------|------|
| `startChasing(cat, ctx)` | 直接设置 `target.action = 'fleeing'` |
| `reverseChase(cat, target)` | 同时设置两只猫的 action |
| `enterPlayFightingState(cat, target)` | 同时设置两只猫的 action 和 target |
| `updatePlayFightingState` | 结束时重置 partner 的状态 |
| `resolveCatCollision` | 遍历 allCats 做推离 |
| App.svelte 游戏循环 | 顺序遍历，后面的猫看到被前面猫改过的状态 |

#### 设计方案：意图事件系统

**核心思路**:
1. 每只猫只修改自己 — `updateCatState` 不允许写入 `other.action` 等
2. 事件总线 — 猫发出意图事件（"想追逐"、"想打闹"），由调度层统一处理
3. 感知而非操控 — 猫通过只读方式感知对方（位置、状态），但不能修改

**新增类型**:
```ts
type CatIntent =
  | { type: 'want_chase'; targetId: string }
  | { type: 'want_play_fight'; targetId: string }
  | { type: 'want_reverse_chase'; targetId: string };
```

**调度流程**:
```
1. 猫 A 更新 → 返回 [want_chase target=B]
2. 猫 B 更新 → 返回 []
3. resolveIntents([want_chase]) → 检查 B 是否空闲 → 生效
```

#### 任务清单

- [x] 引入 `CatIntent` 类型（`types.ts`）
- [x] `updateCatState` 返回 `CatIntent[]`
- [x] `startChasing` / `reverseChase` / `enterPlayFightingState` 改为返回 intent
- [x] 游戏循环：先独立更新，再 `resolveIntents()` 统一处理
- [x] `StateContext.allCats` 改为 `readonly Cat[]`
- [x] 碰撞解析独立化（游戏循环中单独调用）
- [x] 补充测试：意图收集、意图解析、独立更新

**验收标准**:
- ✅ 每只猫只修改自己的状态
- ✅ `updateCatState` 不直接写入 other 的字段
- ✅ 追逐/打闹通过意图系统协调
- ✅ 猫大部分时间独立行动
- ✅ 现有测试全部通过

---

## 待修复问题分析与优化方案（2026-07-18 代码审查）

> 本章节记录一次全量代码审查的结论。审查时状态：`pnpm test:run` 110 通过、`pnpm check` 0 错误、`pnpm lint` 20 条警告。每个问题按"问题描述 / 优化方向 / 解决方案 / 理由"四要素记录，**尚未实施**，经确认后按优先级分批执行。

### 一、状态响应式失效（高优先级）

#### 1. gameLoop 不刷新 store，UI 静态

- **问题描述**：`src/App.svelte` 的 `gameLoop` 每帧直接修改 gameState 内部对象属性（时间、猫位置、事件日志），但从不调用 `gameState.set(state)`。Svelte store 只在 set 时通知订阅者，因此模板中 `$gameState?.time?.hour`（App.svelte:204）、速度按钮、InfoPanel 中的猫属性自初始化后不再更新；事件日志、天气变化同样无法反映到 UI。
- **优化方向**：游戏状态的每帧变化能正确驱动 Svelte UI 刷新。
- **解决方案**：在 `gameLoop` 末尾调用 `gameState.set(state)`；同时用 `get(gameState)` 抽一个 `getGameState()` 辅助函数，替换 `resetCamera`/`zoomIn`/`zoomOut`/`handleSpeedChange` 中四处重复的 subscribe+unsub 写法。
- **理由**：writable 的 `set` 对同引用对象也会通知订阅者；当前订阅者仅 GameCanvas（引用赋值）和模板两处，每帧 set 的成本可忽略。备选方案是把 gameState 改为 `$state` rune 或把 UI 字段拆成独立 store——前者要重写 store 层，后者要维护字段清单，对本项目都属于过度设计。

### 二、帧率驱动（高优先级）

#### 2. 全部逻辑按帧推进，无 deltaTime

- **问题描述**：主循环用 `requestAnimationFrame`（App.svelte:41），时间系统写死 `BASE_TICK_RATE = 2 / 60`（time-system.ts:16），猫速单位为"像素/帧"（cats.ts），天气 duration、idleTimer/actionTimer/blinkTimer 均为帧数倒计时。结果：144Hz 屏幕上游戏速度约 2.4 倍，30FPS 时减半。
- **优化方向**：游戏速度（时间流速、猫移动、计时器衰减）与帧率解耦，30/60/144Hz 体验一致。
- **解决方案**：采用归一化 deltaTime——`dt = 真实毫秒差 / (1000/60)`，clamp 上限 3；`updateTime`/`updateWeather`/`updateCatState`/`updateMood` 增加 `dt` 参数（默认 `= 1`），内部所有推进量乘 dt；`moveToward` 位移乘 dt。
- **理由**：选时间驱动而非固定时间步长——项目是观察型电子宠物，无精确物理、无联机，固定步长 + 渲染插值的复杂度收益不成比例。`dt = 1` 等价 60fps 一帧，现有全部数值常数（speed、timer 帧数、BASE_TICK_RATE）语义不变；默认参数使现有测试零改动通过，只需补 dt 用例。

### 三、组件生命周期（高优先级）

#### 3. GameCanvas 事件监听器泄漏

- **问题描述**：`GameCanvas.svelte:56-60` 在 onMount 中为 canvas 绑定了 mousedown/mousemove/mouseup/mouseleave/wheel，但两个 onDestroy（:29、:68）只移除了 resize 和 keydown，canvas 五个监听器从未移除。组件重建后监听器叠加。
- **优化方向**：组件销毁时清理全部绑定。
- **解决方案**：在 onDestroy 中补全五个 `canvas.removeEventListener`。

#### 4. App.svelte 依赖子组件挂载时序

- **问题描述**：`App.svelte:37` 在 onMount 中用 `gameRenderer!.getCamera()` 非空断言。`gameRenderer` 由 GameCanvas 的 `bind:renderer` 在其 onMount 中回传，依赖"子组件 onMount 先于父组件"这一隐式时序，脆弱且不可静态保证。
- **优化方向**：消除时序假设，renderer 就绪后再初始化相机与循环。
- **解决方案**：onMount 只调用 `initializeGame()`；相机初始化和 gameLoop 启动移入 `$effect`，监听 `gameRenderer` 非 null 后执行一次（加标志位防重入）。

#### 5. debugMode 切换不生效

- **问题描述**：GameCanvas 订阅了 `debugMode`，但只在 onMount 创建 `GameRenderer(canvas, isDebug)` 时读取一次；URL 参数变化（App.svelte:29-32 的 `$effect`）更新 store 后，已创建的 renderer 不会响应。
- **优化方向**：debug 模式可运行时切换。
- **解决方案**：`GameRenderer` 增加 `setDebugMode(debug: boolean)`；GameCanvas 用 `$effect` 在 isDebug 变化时调用 `renderer?.setDebugMode(...)`。

#### 6. 点击空白处误触发拖拽

- **问题描述**：`handleMouseDown` 未点中猫时立即 `isDragging = true`，`handleMouseMove` 无阈值直接 pan——用户只想点击取消选择，也会产生微小视图位移。
- **优化方向**：点击与拖拽可区分。
- **解决方案**：记录按下位置，累计位移超过阈值（约 4px）才开始 pan。

### 四、游戏逻辑缺陷（中优先级）

#### 7. 固体碰撞重复解析，交互状态完全跳过碰撞

- **问题描述**：`moveToward` 内部（cat-state-machine.ts:530-534）与 `updateCatState` 末尾（:100）都会执行 `resolveSolidCollisions`，同一帧可能推离两次、力度不稳定；而追逐/逃跑/打闹状态整体跳过碰撞（:98），这些状态下的猫可能重叠或卡进家具。
- **优化方向**：碰撞解析每帧每猫恰好一次；任何状态都不穿墙、不卡家具。
- **解决方案**：移除 `moveToward` 内的固体碰撞，统一在 `updateCatState` 末尾执行；固体碰撞对所有状态生效，猫间分离仍仅限非交互状态（追逐/打闹需要贴身）。
- **理由**：追逐/打闹中猫需要接触，猫间分离跳过是行为设计；但穿墙/卡家具在任何状态下都是 bug，固体碰撞必须无条件应用。

#### 8. 睡觉/躲藏瞬移到目标点

- **问题描述**：`enterSleepingState`（:474）/`enterHidingState`（:487）直接把 target 设为床/庇护所中心并立即切换 action，猫从原地消失、出现在床上，没有走过去的动画过程。
- **优化方向**：猫先移动到目标点，再进入睡觉/躲藏状态。
- **解决方案**：`Cat` 增加可选字段 `nextAction?: CatActionState`；两个 enter 函数改为设置 target + `action = 'moving'` + `nextAction`；`updateMovingState` 到达后切换。

#### 9. moodTimer 从不更新，兴奋特效静止

- **问题描述**：`renderExcitementSparkles`（cat-renderer.ts:325）用 `cat.moodTimer * 0.1` 驱动旋转动画，但 moodTimer 在创建时设 0 后无任何更新代码，特效永远停在初始相位。
- **优化方向**：特效正常播放。
- **解决方案**：`updateCatState` 中 `moodTimer += dt`（随时间驱动改造一并完成）。

#### 10. 天气系统误报与未实现的过渡

- **问题描述**：`updateWeather`（weather-system.ts:41）duration 耗尽时即使新天气与当前相同也返回 true，App.svelte:83 据此记录"天气变为X"日志，产生误报；`getWeatherBackgroundColor`（:93）声明了 `transitionProgress` 却直接返回目标色，过渡未实现。
- **优化方向**：天气事件只在真实变化时记录；背景色平滑过渡。
- **解决方案**：天气未变时仅重置 duration 并返回 false；保存 previous 天气并在两色间按 transitionProgress 插值（可把 time-system 的私有 `interpolateColor` 导出复用）。

### 五、渲染细节（低优先级）

#### 11. darkenPattern 缓存 key 冲突

- **问题描述**：`renderer.ts:402` 的缓存 key 只有 `factor`，不同 pattern 相同 factor 会命中第一个 pattern 的变暗结果。当前只有墙壁一处调用所以未暴露，属于潜伏 bug。
- **解决方案**：key 改为 `${patternKey}_${factor}`，调用处传入 pattern 名。

#### 12. 调试层未处理 DPR

- **问题描述**：`renderDebugLayers`（renderer.ts:195-196）用 `canvas.width / zoom` 计算视野宽高，但 canvas.width 是物理像素（CSS 像素 × devicePixelRatio），高清屏（DPR≥2）上调试框比实际视野大一倍以上。
- **解决方案**：宽高再除以 `devicePixelRatio`。

#### 13. applyWeatherEffect 空实现

- **问题描述**：`renderer.ts:186` 是空函数，天气系统对画面零影响（地图中 EMPTY 格也已被 map.ts 第 4 步全部填为 WALL，无"窗外"区域可见）。
- **解决方案**：先做轻量实现——按天气类型全屏轻色调叠加（雨天偏蓝灰、雪天偏白，opacity ≤ 0.1），不影响静态层缓存结构；未来若有窗外区域再改为局部绘制。

### 六、文档与代码风格（低优先级）

#### 14. index.html 标题与项目不符

- **问题描述**：title 仍是模板默认值 `learn-svelte`。
- **解决方案**：改为 `CatHouse`。

#### 15. README 与实际不符

- **问题描述**：项目结构写 `static/`（实际是 `public/`）；pnpm 要求写 `v9.x`，AGENTS.md 写 `v11`，package.json 写 `>=9.0.0`，三处不一致。
- **解决方案**：目录名改 `public/`；pnpm 版本以 package.json 的 `>=9.0.0` 为准统一。

#### 16. 类型与 lint 清理

- **问题描述**：types.ts 中 `Cat.mood`、`GameState.time/weather/eventLog` 使用内联 `import('./x').Type`；init.ts:58 `defaultFloor` 用 `as any`；ESLint 有 20 条 curly 警告（GameCanvas.svelte、map.ts、tile-map.ts）。
- **解决方案**：内联 import 改为顶部显式 `import type`；`as any` 改为 `?? FloorType.WOOD`；`pnpm lint --fix` 自动修复 curly。

### 七、测试缺口（低优先级）

#### 17. 核心模块无测试

- **问题描述**：tile-map（墙壁合并、边界计算、序列化）、renderer、texture-manager 无单元测试；三个 Svelte 组件无测试。现有 110 个测试集中在纯逻辑模块。
- **优化方向**：地图/碰撞基础数据结构有回归保护。
- **解决方案**：优先补 `tile-map.test.ts`（getWallRects 合并正确性、getFloorBounds、isWalkable、toJSON/fromJSON 往返）；渲染器与组件测试待修复实施稳定后再补。

---

## 中长期规划

### 中期方向（后续迭代）

#### 渲染系统升级：从 Canvas 到 Sprite Sheet（可选）
**时机**: 当基础功能稳定后，如需提升视觉效果时考虑
**优势**: 
- 更精美的艺术表现
- 更好的动画效果（帧动画）
- GPU 加速渲染性能

**实施步骤**:
1. 设计并制作猫的 PNG 精灵图集（每只猫 4 个动作 × 8 帧）
2. 实现 SpriteManager 资源管理器
3. 重构 renderCats 方法支持 Sprite 渲染
4. 保留 Canvas 绘制作为 fallback 方案

**注意**: 此升级为可选项，如 Canvas 绘制效果满意可暂不执行

#### 其他中期任务
从以下方向中选取优先级最高的任务进入下一轮短期目标：
- 更复杂的猫行为系统（玩耍、社交、探索）
- 用户交互功能（点击、拖拽、喂食等）
- 更多房间和场景
- 音效和背景音乐
- 成就系统和数据统计

### 长期远景（未来展望）

记录想法、需求，以及难度高，短期难以实现的任务：
- 硬件整合（摄像头识别真实猫咪、真实物理世界空间感知）
- 引入后端和数据库
- 多人在线功能
- AI 驱动的更智能行为
