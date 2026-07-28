# LuePi House 项目开发计划

**最后更新**: 2026-07-22

## 当前状态

基础系统、独立 AI 架构（意图事件系统）、碰撞解析统一、实时感知-反应层、体力系统（驱力 MVP）、饱腹系统（第二驱力）、POI 目的地偏好（含瞬移修复）、猫行为深化（玩具玩耍/社交跟随/探索路径记忆）、UI 层修复（监听器泄漏/挂载时序/debugMode 切换/点击拖拽消歧）、天气系统修复（事件误报/色彩过渡/视觉叠加）、tile-map 测试补齐（9 用例）、渲染正确性修复（darkenPattern 缓存 key 冲突/调试层 DPR）、文档对齐（title/README/更名 LuePi House）与代码清理（类型内联 import/as any/curly）已完成；测试 219/219 全过，lint 0 错误、check 0 告警。短期任务表 A-Q 全部完成，下一阶段从中期方向中选取。

## 任务总表

> 问题、需求、优化统一视为任务，按执行顺序以字母编号，不分类。
> 状态图例：⬜ 待处理 / 🔵 进行中 / ✅ 完成 / 🟡 待评估。

| 标号 | 任务 | 影响 | 难度 | 状态 |
|------|------|:---:|:---:|:---:|
| A | 体力系统（驱力 MVP） | 高 | 中 | ✅ |
| B | POI 移动目的地偏好（含睡觉/躲藏瞬移修复） | 高 | 中 | ✅ |
| C | GameCanvas 事件监听器泄漏 | 中 | 低 | ✅ |
| D | App.svelte 挂载时序依赖 | 中 | 低 | ✅ |
| E | debugMode 运行时切换不生效 | 低 | 低 | ✅ |
| F | 点击空白处误触发拖拽 | 低 | 低 | ✅ |
| G | 天气误报变化事件 + 背景色过渡未实现 | 低 | 低 | ✅ |
| H | applyWeatherEffect 空实现（天气无视觉表现） | 低 | 低 | ✅ |
| I | 测试缺口（tile-map / renderer / 组件） | 中 | 中 | ✅ |
| J | darkenPattern 缓存 key 冲突（潜伏） | 低 | 低 | ✅ |
| K | 调试层未处理 DPR | 低 | 低 | ✅ |
| L | index.html title、README 与实际对齐 | 低 | 低 | ✅ |
| M | 类型内联 import、init.ts as any、lint curly 清理 | 低 | 低 | ✅ |
| N | 第二驱力维度（饥饿/饱腹） | 中 | 中 | ✅ |
| O | 玩具道具 + playing 玩耍行为 | 中 | 中 | ✅ |
| P | 社交跟随 following 行为 | 中 | 中 | ✅ |
| Q | 探索路径记忆 | 低 | 低 | ✅ |

## 任务详情

### A. 体力系统（驱力 MVP）

- **背景**：当前互动过密的根源是反应层纯几何触发（120px 内接近即反应）、冷却仅 1.5s、无行为记忆，形成"追→逃→再相遇→再追"紧密循环。纯时钟方案（长/短间隔）两难，频率应由内部状态决定
- **方案**：新模块 `cat-energy.ts`（纯函数，仿 mood-system 模式）。`Cat.energy` 0-100，初始 70+随机 20；恢复 sleeping +0.5 / hiding +0.25 / eat,drink +0.15 / idle,watching +0.12 / grooming +0.08（每帧，dt 缩放）；消耗 moving,exploring -0.06 / climbing -0.15 / fleeing -0.35 / chasing -0.45 / playFighting -0.6。门控：chase≥30、playFight≥25、flee≥10、力竭≤10。接入：updateCatState 每帧更新；反应层 chase/flee 需体力，不足降级 watch；idle 决策 chasing/socializing 权重 × 体力因子（<30 归零）；playFight 发起前检查；chasing/fleeing/playFighting 力竭主动回 idle；InfoPanel 加体力行
- **理由**：互动过密的本质是"行为零成本"——追逐打闹没有任何内生代价，时钟冷却只能固定节奏、无法感知猫的状态。让高成本行为消耗体力，频率自然由"赚得起才玩"决定；打闹后休静期是体力消耗的涌现效果，无需单设冷却计时器（单设计时器是两个系统管同一件事，调参会打架）。只做单维度：每加一个驱力维度，权重组合与调参复杂度乘法增长，且体力一个维度已能覆盖当前痛点（多维评估见 N）
- **验收**：低体力猫不发起互动、力竭猫追累了会放弃；一次互动后双方进入可观察的低体力行为期；测试全过 + 能量纯函数/集成测试

### B. POI 移动目的地偏好（含瞬移修复）

- **价值**：与体力系统互补——体力决定"做什么"，POI 决定"去哪做"。当前 `enterMovingState` 全图纯随机选点，sleeping 固定去第一个猫窝、hiding 去最近庇护所且均瞬移（原 B3），猫从不在沙发/茶几/猫爬架停留
- **方案（草案，实施前定稿）**：
  - **POI 系统**：从 furnitures/catBeds/shelters 派生 `{ id, type: 'rest'|'observe'|'eat'|'hide', x, y }`，不新增配置。映射：sofa/猫窝/软垫→rest；猫爬架/茶几→observe；食盆→eat；纸箱→hide
  - **目的地选择**：约 70% 选 POI、30% 纯随机（保留探索感）；POI 权重个性驱动 + 体力接入（低体力→rest 加权）；情绪修正（depressed→rest/hide 加权）
  - **到达后行为（吸收瞬移修复）**：Cat 增加 `nextAction?: CatActionState`；updateMovingState 到达后检查并切换。rest→sleeping/长 idle；observe→watching/idle；eat→eating；hide→hiding。enterSleepingState/enterHidingState 改为选 POI + action='moving' + nextAction，不再瞬移
- **理由**：派生而非新增 POI 配置——家具数据已含类型和位置，单一数据源避免两处维护不同步。70/30 而非全 POI——全 POI 会让猫像钉死在家具上，丧失探索游走和偶然相遇的趣味；30% 随机是"生活感"的来源。nextAction 而非新增移动子状态——复用现有 moving 的移动/碰撞/到达检测逻辑，最小侵入；睡觉/躲藏改为"走过去再触发"，瞬移修复作为副产物自然落地，不需单独任务
- **验收**：猫明显在家具/猫窝/纸箱附近停留瞌睡；不再瞬移；两只猫因个性差异呈现不同常驻点；测试全过 + POI 选择纯函数测试

### C. GameCanvas 事件监听器泄漏

- **问题**：canvas 的 mousedown/mousemove/mouseup/mouseleave/wheel 五个监听器（GameCanvas.svelte:56-60）在 onDestroy 中未移除（onDestroy 只清理了 window resize 和 document keydown，GameCanvas.svelte:68-71）
- **方案**：onDestroy 补全五个 removeEventListener
- **理由**：canvas 元素随组件销毁后其上监听器通常能被 GC，但这是依赖隐式行为——HMR 热更新、组件未来改为可显隐切换（不销毁重建）等场景下会累积重复绑定，且与其他两个监听器的显式清理风格不一致。显式移除是确定性的资源管理，五行代码成本极低，无替代方案可言

### D. App.svelte 挂载时序依赖

- **问题**：onMount 中 `gameRenderer!.getCamera()`（App.svelte:40-44）依赖"子组件 onMount 先于父组件执行"的隐式时序——目前能跑只是因为 Svelte 恰好这个顺序
- **方案**：onMount 只做 initializeGame()；相机初始化与 gameLoop 启动移入 `$effect`，监听 gameRenderer 非 null 后执行一次（标志位防重入）
- **理由**：非空断言 `!` 掩盖了 renderer 可能为 null 的真实类型，组件结构稍变（如 GameCanvas 外再包一层条件渲染）就会运行时空引用崩溃。改 `$effect` 把隐式时序约定变成显式响应式依赖：renderer 何时就绪何时启动，顺序由数据流保证而非生命周期巧合

### E. debugMode 运行时切换不生效

- **问题**：isDebug 只在 onMount 构造时传入一次（`new GameRenderer(canvas, isDebug)`，GameCanvas.svelte:54），之后 debugMode store 变化只更新组件局部变量，渲染器永远停留在初始值
- **方案**：GameRenderer 增加 setDebugMode()，GameCanvas 用 $effect 随 isDebug 调用
- **理由**：构造注入只发生一次，而 debugMode 是运行期可变状态，两者生命周期不匹配。加 setter 而非改构造器重造渲染器：渲染器持有 pattern 缓存等资源，重建代价大且无必要；$effect 订阅是 Svelte 5 响应式同步外部系统的标准做法

### F. 点击空白处误触发拖拽

- **问题**：handleMouseDown 在空白处立即 `isDragging = true`（GameCanvas.svelte:86），之后 handleMouseMove 对任意微小位移都执行 pan——用户"点击空白取消选中"时手抖 1-2px 就变成视图平移
- **方案**：handleMouseDown 记录按下位置，累计位移 >4px 才进入 pan
- **理由**：这是经典的 click/drag 消歧问题，业界标准解就是位移阈值（常见 3-5px）。4px 内牺牲的微小平移不可感知，换来点击语义的确定性；不改事件模型、不加计时器，复杂度最低

### G. 天气误报变化事件 + 背景色过渡未实现

- **问题**：updateWeather 在 duration 到期时，即使抽中的新天气与当前相同也 `return true`（weather-system.ts:44-51），App.svelte 据此记录"天气变为X"，产生与当前天气相同的假事件；getWeatherBackgroundColor 直接返回目标色（weather-system.ts:93-100），transitionProgress 未参与颜色插值
- **方案**：updateWeather 天气未变时返回 false；getWeatherBackgroundColor 保存 previous 天气并插值（复用 time-system 的 interpolateColor）
- **理由**：误报根因是"时长到期"与"天气变化"两个事件被混为一个返回值，拆开即修复，无需改事件结构。插值复用 time-system 已有的颜色数学而非新写一套，保持单一实现；transitionProgress 已是现成字段，只是没被用上

### H. applyWeatherEffect 空实现（天气无视觉表现）

- **问题**：applyWeatherEffect 是空函数（renderer.ts:186-188），天气对游戏画面毫无影响——配合 G，天气系统存在但完全不可见
- **方案**：轻量实现：按天气类型全屏轻色调叠加（opacity ≤ 0.1）
- **理由**：目标是"最小可见实现"而非完整天气特效。色调叠加一次 fillRect 即可让雨天/阴天可感知，opacity 上限 0.1 保证不干扰猫的辨识度；雨雪粒子、闪电等属于中长期渲染升级，现在做性价比低且会放大每帧渲染成本

### I. 测试缺口（tile-map / renderer / 组件）

- **问题**：tile-map.ts、renderer.ts、Svelte 组件均无测试
- **方案**：优先补 tile-map.test.ts（getWallRects 合并、getFloorBounds、isWalkable、序列化往返）
- **理由**：tile-map 承载墙体合并、可走性判定等核心几何逻辑，任务 A/B（体力恢复点、POI 选点、碰撞）都建立在它之上，无测试则后续改动没有安全网；且它是纯数据逻辑，断言稳定、性价比最高。renderer 直接操作 Canvas 像素、组件依赖 DOM 生命周期，这两类测试断言脆弱、维护成本高，暂缓是投入产出权衡，不是遗漏

### J. darkenPattern 缓存 key 冲突（潜伏）

- **问题**：darkenPattern 缓存 key 只有 `${factor}`（renderer.ts:403），不同源 pattern（木地板/地毯/瓷砖纹理）共享同一 key——第二种纹理请求相同 factor 时会错误命中第一种纹理的缓存。目前仅墙体以一种 factor 调用所以尚未爆发
- **方案**：缓存 key 改为 `${patternKey}_${factor}`（调用处传入纹理标识）
- **理由**：这是正确性 bug 而非性能问题，只是调用点单一才潜伏。修复只需让 key 包含纹理身份，不改变缓存结构；留着不修则下一个使用 darkenPattern 的特性（如 H 的天气叠加若复用）会踩出难以排查的渲染错误

### K. 调试层未处理 DPR

- **问题**：renderDebugLayers 用 `this.canvas.width`（物理像素）计算可视区域（renderer.ts:195-196），但 ctx 已被 `setTransform(dpr, ...)` 缩放，逻辑坐标下可视宽应为 canvas.width / dpr——dpr=2 的屏幕上调试框是真实视口的两倍大
- **方案**：renderDebugLayers 宽高除以 devicePixelRatio
- **理由**：canvas.width 是设备像素、camera 坐标系是 CSS 逻辑像素，两者混用必然错位，修复只是补上单位换算。仅影响调试层，不影响正式渲染路径

### L. index.html title、README 与实际对齐

- **问题**：index.html title 仍是脚手架默认值 "learn-svelte"（index.html:7）；README 写 `static/` 目录（实际为 `public/`）、pnpm v9（package.json engines 要求 >=9，AGENTS.md 记 v11）
- **方案**：index.html title 改 CatHouse；README 的 static→public、pnpm 版本以 package.json 为准
- **理由**：title 是用户可见的品牌信息；README 是人和 AI agent 的入口文档，目录名/版本写错会直接误导环境搭建和文件查找。以 package.json 为版本唯一事实源，文档引用而非复制具体版本号，避免再次漂移

### M. 类型内联 import、init.ts as any、lint curly 清理

- **问题**：types.ts 用内联 `import('./x')` 引用 5 处类型（types.ts:184/207/213-215）；init.ts:58 用 `as any` 强转 floorType；全仓 20 处 curly 风格告警
- **方案**：types.ts 内联 import 改显式 `import type`；init.ts `as any` 改 `?? FloorType.WOOD` 兜底；`pnpm lint --fix`
- **理由**：内联 import() 当初是为了绕开循环依赖，但 `import type` 在编译期擦除、不产生运行时依赖，天然免疫循环依赖，是正规做法且可读性更好。`as any` 关闭了类型检查并掩盖"配置可能缺 floorType"这一真实状态，`?? FloorType.WOOD` 既兜底又保持类型安全。curly 属风格统一，`--fix` 机械修复零风险

### N. 第二驱力维度（饥饿/饱腹）

- **方案**：新模块 `cat-satiety.ts`（纯函数，仿 cat-energy 模式）。`Cat.satiety` 0-100（语义与体力一致：100 饱足、0 极饿），初始 60+随机 20；消耗 idle/watching/grooming -0.04 / sleeping,hiding -0.02 / moving,exploring,socializing -0.06 / climbing -0.08 / chasing,fleeing -0.1 / playFighting -0.12（每帧，dt 缩放）；补充 eating +1.5 / drinking +0.2。接入：updateCatState 每帧更新；idle 决策 eating 权重 × `getEatUrgency`（饱足 0.1、阈值 40 处 1、极饿升至 3）；eat POI 权重同样乘紧迫因子（越饿越走向食盆）；InfoPanel 加饱腹行（饱足/微饿/饥饿/极饿）
- **理由**：双驱力分工——体力决定"玩不玩得起"，饥饿决定"什么时候必须吃"。紧迫因子用连续函数而非阈值开关，避免饥饿猫在食盆前突然"开关式"行为跳变；不新增打断逻辑，仅靠权重倾斜让进食自然浮现，调参面最小
- **验收**：饥饿随时间累积、进食后回落；饥饿猫显著更频繁前往食盆；测试全过 + 饥饿纯函数/集成测试

### O. 玩具道具 + playing 玩耍行为

- **方案**：新增 `Toy` 接口（无碰撞小物件）与 `createDefaultToys()`（毛线球/玩具老鼠，各 1×1 格）；POI 新增 `play` 类型（玩具派生，非实体，`derivePOIs` 第 4 参数可选保证向后兼容）；新 action `playing`：idle 决策权重 = 6 × playfulness 因子 × 体力因子，选中后走向玩具、到达进入 playing（90-180 帧），到达时触发情绪事件 `play`（+8，playfulness 放大）；体力 -0.25 / 饱腹 -0.08；渲染器静态层绘制玩具（粉色圆点 + 名称）
- **理由**：玩具复用 POI 派生机制而非独立目的地系统——单一选点入口，个性/驱力修正自动生效；playing 设为可打断状态（与 grooming 同级），被追逐反应覆盖时不显突兀
- **验收**：猫主动走向玩具玩耍，调皮猫更频繁；玩耍后情绪上升、体力下降；测试全过 + play POI/状态测试

### P. 社交跟随 following 行为

- **方案**：新 action `following`：idle 决策权重 = 6 × sociability 因子（仅多猫时），随机挑一只醒着未躲藏的猫以正常速度跟随（区别于追逐的 1.05× 与逃跑的 1.2×）；靠近（<2×分离距离）转为 watching 陪伴并触发 `socialize` 情绪事件；目标睡着/躲藏或超时（300-600 帧）自动放弃；体力/饱腹 -0.06（低成本）
- **理由**：跟随只修改自身状态、不走意图系统——它不需要对方配合，与追逐（需要对方进入 fleeing）本质不同；复用 `chaseTargetId` 字段承载跟随目标，避免新增平行字段
- **验收**：社交性高的猫会跟随同伴并停下陪伴；目标不可跟随时自然放弃；测试全过 + 跟随移动/靠近/放弃/超时测试

### Q. 探索路径记忆

- **方案**：`Cat.visitedPoints` 记录最近 6 个到达点（`rememberVisit`，到达时记录）；随机探索选点时拒绝距访问点 96px（3 格）内的候选（`isNearRecentVisit`，重试上限 5→8）
- **理由**：纯随机选点会在小区域内反复打转，短期记忆让探索自然铺开；只作用于随机回退路径（30%），POI 选点（70%）不受影响——去食盆/猫窝不应被"最近去过"阻止
- **验收**：猫探索覆盖更均匀；测试全过 + 记忆容量/半径判定/到达记录测试

---

## 中长期规划

### 中期方向（后续迭代）

#### 渲染系统升级：从 Canvas 到 Sprite Sheet（可选）
**时机**: 当基础功能稳定后，如需提升视觉效果时考虑
**优势**: 更精美的艺术表现；更好的动画效果（帧动画）；GPU 加速渲染性能

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
