# CatHouse 项目开发计划

## 📊 当前进度概览

**最后更新**: 2026-07-18
**当前阶段**: 任务 1-6 已完成；store 响应式与 deltaTime 已修复；问题已重排（A→D），待按序执行
**已完成**: 任务 1-6（基础系统、测试优化、独立AI架构）；修复：store 响应式、deltaTime 时间驱动、moodTimer 更新

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

## 问题处理计划表（2026-07-18 重排）

> 已完成的修复（store 响应式 + UI 同步节流、deltaTime 时间驱动、moodTimer 更新）不再保留在表中。
> 状态图例：⬜ 待处理 / 🔵 进行中 / ✅ 完成。执行顺序：A1 → A2 → A3(含B3) → B1-B2 → C1-C5 → D1-D4。

| 标号 | 问题 | 影响程度 | 处理难度 | 状态 |
|------|------|:---:|:---:|:---:|
| A1 | 碰撞解析统一（去重复解析，交互状态不再跳过固体碰撞） | 高 | 低 | ✅ |
| A2 | 实时感知互动 AI（感知-反应层，帧级动作切换） | 高 | 高 | ⬜ |
| A3 | 移动目的地偏好系统（POI，含 B3 瞬移修复） | 高 | 中 | ⬜ |
| B1 | GameCanvas 事件监听器泄漏 | 中 | 低 | ⬜ |
| B2 | App.svelte 挂载时序依赖 | 中 | 低 | ⬜ |
| C1 | debugMode 运行时切换不生效 | 低 | 低 | ⬜ |
| C2 | 点击空白处误触发拖拽 | 低 | 低 | ⬜ |
| C3 | 天气误报变化事件 + 背景色过渡未实现 | 低 | 低 | ⬜ |
| C4 | applyWeatherEffect 空实现（天气无视觉表现） | 低 | 低 | ⬜ |
| C5 | 测试缺口（tile-map / renderer / 组件） | 中 | 中 | ⬜ |
| D1 | darkenPattern 缓存 key 冲突（潜伏） | 低 | 低 | ⬜ |
| D2 | 调试层未处理 DPR | 低 | 低 | ⬜ |
| D3 | index.html title、README 与实际对齐 | 低 | 低 | ⬜ |
| D4 | 类型内联 import、init.ts as any、lint curly 清理 | 低 | 低 | ⬜ |

### A1. 碰撞解析统一（A2 的前置）

- **问题**：moveToward 内（cat-state-machine.ts:531）与 updateCatState 末尾（:100）重复解析固体碰撞；追逐/逃跑/打闹状态整体跳过碰撞（:98），猫会穿模、卡进家具
- **方案**：移除 moveToward 内固体碰撞，统一在 updateCatState 末尾执行一次；固体碰撞对所有状态生效；猫间分离仅非交互状态（追逐/打闹需要贴身）
- **理由**：重复解析导致推离力度不稳定；交互状态穿模会直接破坏 A2 实时互动的观感

### A2. 实时感知互动 AI（新需求）

- **价值**：当前猫是秒级决策的随机状态机（idle 结束才决策，互动权重 ≈1.7%，决策不看对方位置状态）。本任务把它升级为帧级感知-反应的双独立 AI，是"观察两只猫互动"这一核心玩法的质变，并为中期更复杂行为打底
- **设计（草案，实施前定稿）**：不推翻状态机，叠加感知-反应层
  - 每帧 `perceive(cat, ctx)` 纯函数：圆形视野 VIEW_RADIUS=200px，产出视野内另一只猫的距离/action/是否在接近（用两帧距离差估算）
  - `evaluateReaction(cat, perception)` 纯函数：对方进入关注距离 ≈120px 且接近 → 按个性分支（sociability/playfulness 高→want_chase；bravery 低→短促 fleeing；否则→watching 1-2 秒）；对方在视野内打闹 → watching 围观
  - 打断白名单：可打断 idle/moving/grooming/watching/exploring；不可打断 sleeping/hiding/playFighting/eating/drinking；REACTION_COOLDOWN=60-120 帧防抖动
  - 真正实现 watching 状态（当前被映射到 grooming）；自身反应直接切状态，追逐走现有 intent 系统
- **风险**：频繁打断导致行为神经质 → cooldown + 白名单约束；测试复杂化 → 感知/反应全部纯函数化
- **验收**：一只猫接近时另一只在 1 秒内产生可见反应（注视/逃离/反追）；无打断死循环；现有测试全过 + 感知/反应纯函数测试

### A3. 移动目的地偏好系统（含 B3）

- **价值**：与 A2 并列的"生命感"另一支柱——A2 解决"猫对猫"的反应，A3 解决"猫对环境"的目的性。当前 `enterMovingState`（cat-state-machine.ts:446）全图纯随机选点，sleeping 固定去第一个猫窝、hiding 去最近庇护所且均瞬移（原 B3），猫从不在沙发/茶几/猫爬架停留
- **设计（草案，实施前定稿）**：
  - **POI 系统**：从 furnitures/catBeds/shelters 派生 `{ id, type: 'rest'|'observe'|'eat'|'hide', x, y }`，不新增配置。映射：sofa/猫窝/软垫→rest；猫爬架/茶几→observe；食盆→eat；纸箱→hide
  - **目的地选择**：约 70% 选 POI、30% 纯随机（保留探索感）；POI 权重个性驱动（energy→observe、patience/cleanliness→rest、appetite→eat、bravery 低→hide）；情绪修正（depressed→rest/hide 加权）
  - **到达后行为（吸收 B3）**：Cat 增加 `nextAction?: CatActionState`；updateMovingState 到达后检查并切换。rest 点→sleeping/长 idle；observe 点→watching/idle；eat 点→eating；hide 点→hiding。enterSleepingState/enterHidingState 改为选 POI + action='moving' + nextAction，不再瞬移
- **验收**：猫明显在家具/猫窝/纸箱附近停留瞌睡；不再瞬移；两只猫因个性差异呈现不同常驻点；测试全过 + POI 选择纯函数测试

### B1. GameCanvas 事件监听器泄漏

- **问题**：canvas 的 mousedown/mousemove/mouseup/mouseleave/wheel 五个监听器（GameCanvas.svelte:56-60）在 onDestroy 中未移除
- **方案**：onDestroy 补全五个 removeEventListener

### B2. App.svelte 挂载时序依赖

- **问题**：onMount 中 `gameRenderer!.getCamera()`（App.svelte:37 附近）依赖子组件先挂载的隐式时序
- **方案**：onMount 只做 initializeGame()；相机初始化与 gameLoop 启动移入 `$effect`，监听 gameRenderer 非 null 后执行一次（标志位防重入）

### C1-C5（中优先级，方案从简）

- **C1**：GameRenderer 增加 setDebugMode()，GameCanvas 用 $effect 随 isDebug 调用
- **C2**：handleMouseDown 记录按下位置，累计位移 >4px 才 pan
- **C3**：updateWeather 天气未变时返回 false；getWeatherBackgroundColor 保存 previous 天气并插值（复用 time-system 的 interpolateColor）
- **C4**：applyWeatherEffect 轻量实现：按天气类型全屏轻色调叠加（opacity ≤ 0.1）
- **C5**：优先补 tile-map.test.ts（getWallRects 合并、getFloorBounds、isWalkable、序列化往返）

### D1-D4（低优先级，方案从简）

- **D1**：darkenPattern 缓存 key 改为 `${patternKey}_${factor}`
- **D2**：renderDebugLayers 宽高除以 devicePixelRatio
- **D3**：index.html title 改 CatHouse；README 的 static→public、pnpm 版本以 package.json 为准
- **D4**：types.ts 内联 import 改显式 type import；init.ts as any 改 ?? FloorType.WOOD；pnpm lint --fix

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
