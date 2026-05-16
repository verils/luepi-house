# CatHouse 项目开发计划

## 📊 当前进度概览

**最后更新**: 2026-05-16  
**当前阶段**: Phase 1 - 核心可视化 🔄 待开始  
**下一阶段**: Phase 1.1 - 核心配置与定义（地基）

---

## 项目计划

本项目采用**功能驱动**的开发方式，按照以下优先级顺序推进：

1. **核心配置与定义** - 定下所有尺寸的"基准"，建立统一的尺度标准
2. **静态世界** - 创造猫可以行走和碰撞的静态环境
3. **动态实体** - 让猫在静态世界中动起来，遵守物理规则
4. **规则与交互** - 让世界规则生效，处理碰撞和互动
5. **视角与呈现** - 优化观看体验，实现摄像机控制

### 短期（Phase 1-2：预计 17-27 天）

当前聚焦于核心可视化和基础系统构建，工作任务拆分为可验证的细粒度功能点。

#### Phase 1: 核心可视化（简化版）- 预计 10-16 天

> **核心目标**: 建立基础画布、地图系统、猫实体和基础行为

##### Phase 1.1: 项目初始化与环境搭建（预计 1-2 天）🔄 待开始

**目标**: 搭建 SvelteKit + Svelte 5 项目框架，配置开发环境。

**任务清单**:
- [ ] 使用 pnpm 初始化项目
  ```bash
  pnpm create svelte@latest .
  pnpm install
  ```
- [ ] 安装核心依赖
  ```bash
  pnpm add matter-js
  ```
- [ ] 配置项目结构
  ```
  cat-house/
  ├── src/
  │   ├── lib/
  │   │   ├── assets/         # 静态资源
  │   │   ├── core/           # 核心逻辑（Canvas、物理、猫实体）
  │   │   ├── stores/         # Svelte Stores 状态管理
  │   │   └── utils/          # 工具函数
  │   ├── routes/             # SvelteKit 路由页面
  │   ├── app.html            # HTML 模板
  │   └── app.d.ts            # 类型声明
  ├── static/                 # 静态公共资源
  ├── package.json
  ├── svelte.config.js        # SvelteKit 配置
  ├── vite.config.ts          # Vite 配置
  ├── tsconfig.json           # TypeScript 配置
  ├── PLAN.md                # 开发计划
  └── UI.md                  # UI 设计规范
  ```
- [ ] 配置 Vite（端口、代理等）
- [ ] 设置 ESLint + Prettier（代码规范）
- [ ] 创建 Git 仓库和 .gitignore
- [ ] 编写 README.md（项目说明、启动命令）
- [ ] **阅读 UI.md**：了解像素风格、配色方案、2.5D 透视规则

**验收标准**:
- ⬜ `pnpm dev` 能正常启动开发服务器
- ⬜ 浏览器访问 localhost 显示 SvelteKit 欢迎页面
- ⬜ Git 仓库初始化完成，首次提交成功

---

##### Phase 1.2: Canvas 渲染框架搭建（预计 1-2 天）🔄 待开始

**目标**: 创建全屏 Canvas，建立渲染循环，实现响应式布局。

**任务清单**:
- [ ] 创建 GameCanvas.svelte 组件
  - 全屏 Canvas 元素
  - 监听窗口 resize 事件，动态调整 Canvas 尺寸
  - 保持 2.5D 等轴测投影比例（参考 UI.md 第 3.2 节）
- [ ] 实现渲染循环
  - 使用 `requestAnimationFrame` 创建游戏循环
  - 分离 update（逻辑更新）和 render（绘制）阶段
  - 计算 delta time（帧时间差）
- [ ] 创建渲染上下文管理
  - 封装 Canvas 2D Context
  - 提供常用的绘制方法（drawRect, drawCircle, drawImage 等）
  - 设置像素化渲染：`image-rendering: pixelated`
- [ ] 添加简单的背景绘制
  - 白色网页背景（#FFFFFF）
  - Canvas 外围阴影效果

**验收标准**:
- ⬜ Canvas 占满全屏，窗口 resize 时自动适配
- ⬜ 渲染循环稳定运行，FPS 保持在 60
- ⬜ 背景正常绘制，无闪烁或撕裂

---

##### Phase 1.3: 地图系统（墙体、障碍物、庇护所、猫窝）（预计 2-3 天）🔄 待开始

**目标**: 绘制房屋地图，定义墙壁边界、障碍物、庇护所和猫窝，集成 Matter.js 物理引擎。

**任务清单**:
- [ ] 设计地图数据结构
  ```typescript
  // 地图配置示例
  interface MapConfig {
    width: number
    height: number
    walls: Wall[]
    obstacles: Obstacle[]
    shelters: Shelter[]
    catBeds: CatBed[]
  }
  
  interface Wall {
    x: number
    y: number
    width: number
    height: number
  }
  
  interface Obstacle {
    x: number
    y: number
    width: number
    height: number
    type: 'furniture' | 'decoration'
  }
  
  interface Shelter {
    x: number
    y: number
    width: number
    height: number
    name: string
  }
  
  interface CatBed {
    x: number
    y: number
    width: number
    height: number
    comfortLevel: number
  }
  ```
- [ ] 集成 Matter.js
  - 创建物理引擎实例（Engine, World）
  - 禁用 Matter.js 自带渲染器（使用自定义 Canvas 渲染）
  - 配置物理参数（重力=0，俯视角无重力；摩擦力、弹性等）
- [ ] 创建墙壁刚体
  - 根据地图配置生成静态刚体（Bodies.rectangle）
  - 设置墙壁为不可移动（isStatic: true）
  - 添加碰撞分类（collisionFilter）
  - 墙壁视觉：32px 高度，2.5D 立体效果（参考 UI.md 第 3.3 节）
- [ ] 创建障碍物刚体
  - 家具、装饰物等静态障碍物
  - 设置合适的碰撞体和视觉表现
- [ ] 创建庇护所区域
  - 定义庇护所的矩形区域
  - 标记为特殊区域（猫可以躲避）
  - 视觉表现：半透明遮罩或图标
- [ ] 创建猫窝区域
  - 定义猫窝的位置和舒适度等级
  - 视觉表现：猫窝图标或图案
- [ ] 绘制地面纹理
  - 实现基础地面纹理（木地板或地毯）
  - 使用 CanvasPattern 或直接绘制像素图块
- [ ] 调试工具
  - 切换显示/隐藏物理碰撞体（开发模式）
  - 显示房间边界框和特殊区域

**验收标准**:
- ⬜ 地图正常显示，墙壁、障碍物清晰可见
- ⬜ 庇护所和猫窝区域正确标记
- ⬜ 所有物体在物理引擎中正确注册
- ⬜ 可以切换显示物理碰撞体（调试用）

---

##### Phase 1.4: 猫的视觉形象与实体（预计 2-3 天）🔄 待开始

**目标**: 设计并绘制两只猫的视觉形象，创建猫实体类。

**任务清单**:
- [ ] 设计猫的数据结构
  ```typescript
  class Cat {
    id: string              // 'cat1', 'cat2'
    name: string            // '略略', '皮皮'
    color: string           // 主体颜色
    x: number               // 位置 X
    y: number               // 位置 Y
    rotation: number        // 朝向角度
    scale: number           // 缩放比例
    state: CatState         // 当前状态
    velocity: { x: number, y: number }  // 速度
    
    constructor(id: string, name: string, color: string) { ... }
    update(deltaTime: number): void { ... }
    render(ctx: CanvasRenderingContext2D): void { ... }
  }
  
  enum CatState {
    IDLE = 'IDLE',
    MOVING = 'MOVING',
    SLEEPING = 'SLEEPING',
    HIDING = 'HIDING'
  }
  ```
- [ ] 选择渲染方案：**简单几何图形**（快速原型）
  - 身体（椭圆/圆形）
  - 头部（圆形）
  - 耳朵（三角形）
  - 眼睛（两个小圆点）
  - 胡须（线条）
  - 尾巴（曲线）
  - 四肢（简单线条或小椭圆）
  
- [ ] 实现猫1「略略」的绘制（参考 UI.md 第 4.2 节）
  - 主体毛色：#E8945A（暖橘色）
  - 腹部：#FFF5E6（奶油白）
  - 眼睛：#6BCB77（翠绿色）或 #4D96FF（蓝色）
  - 配饰：红色项圈（带金色小铃铛）
  - 特征：额头 "M" 形纹路、虎斑条纹
  
- [ ] 实现猫2「皮皮」的绘制（参考 UI.md 第 4.3 节）
  - 主体毛色：#F5E6D3（暖米色）
  - 重点色：#5C3A21（深巧克力色 - 脸部/耳朵/四肢/尾巴）
  - 眼睛：#4D96FF（宝石蓝色 - 暹罗猫标志性蓝眼）
  - 配饰：深蓝色丝质蝴蝶结
  - 特征：经典的「重点色」分布、纤细修长体型
  
- [ ] 名称标签
  - 在猫头顶显示名称（像素字体，12px）
  - 半透明背景框（rgba(0,0,0,0.5)）
  - 白色文字 + 黑色描边
  - 跟随猫移动
  
- [ ] 设置初始位置
  - 猫1（略略）：(300, 300)
  - 猫2（皮皮）：(500, 300)

**验收标准**:
- ⬜ 两只猫清晰可见，颜色和外观有区分
- ⬜ 猫的形象可爱，辨识度高
- ⬜ 名称标签正确显示
- ⬜ 猫实体类结构完整，可扩展

---

##### Phase 1.5: 猫的物理实体与碰撞（预计 2-3 天）🔄 待开始

**目标**: 将猫集成到 Matter.js 物理引擎，实现碰撞检测。

**任务清单**:
- [ ] 为猫创建物理刚体
  - 使用 `Bodies.circle()` 创建圆形碰撞体（简化计算）
  - 设置猫的质量、摩擦力、弹性等物理属性
  - 关联猫的视觉位置和物理刚体位置
- [ ] 同步物理与渲染
  - 每帧从物理引擎读取猫的位置和旋转
  - 更新猫的视觉坐标（this.x, this.y, this.rotation）
  - 确保渲染与物理模拟一致
- [ ] 实现猫与墙壁的碰撞
  - Matter.js 自动处理碰撞检测
  - 测试猫无法穿越墙壁
  - 调整碰撞反弹效果（降低弹性，避免弹跳过大）
- [ ] 实现猫与障碍物的碰撞
  - 猫会绕过或停在障碍物前
  - 碰撞后自然分开（不卡顿）
- [ ] 实现猫与猫的碰撞
  - 设置猫之间的碰撞响应
  - 避免两只猫重叠
- [ ] 调试功能
  - 显示猫的碰撞体轮廓（开发模式）
  - 显示速度向量箭头

**验收标准**:
- ⬜ 猫受物理引擎控制，有惯性
- ⬜ 猫无法穿越墙壁和障碍物
- ⬜ 两只猫碰撞时不会重叠，自然分开
- ⬜ 碰撞体与视觉形象对齐

---

##### Phase 1.6: 猫的基础行为系统（预计 2-3 天）🔄 待开始

**目标**: 实现猫的基础行为：移动、静止、睡觉、躲避障碍。

**任务清单**:
- [ ] 实现状态机框架
  ```typescript
  interface BehaviorState {
    name: string
    onEnter(): void
    onUpdate(deltaTime: number): void
    onExit(): void
    canTransitionTo(state: string): boolean
  }
  
  class CatBehaviorSystem {
    currentState: BehaviorState
    states: Map<string, BehaviorState>
    
    update(deltaTime: number): void
    transitionTo(newState: string): void
  }
  ```
- [ ] 实现 IDLE（静止）状态
  - 猫停留在当前位置
  - 偶尔轻微晃动或眨眼
  - 随机时间后切换到其他状态
- [ ] 实现 MOVING（移动）状态
  - 猫向目标位置移动
  - 使用物理引擎施加力或设置速度
  - 到达目标点后切换到 IDLE
  - 猫朝向移动方向旋转
- [ ] 实现 SLEEPING（睡觉）状态
  - 猫移动到猫窝或随机位置
  - 眼睛闭合，显示 "Zzz" 气泡
  - 静止不动，偶尔翻身
  - 随机时间后醒来
- [ ] 实现 HIDING（躲避）状态
  - 猫检测到威胁或随机触发
  - 移动到最近的庇护所
  - 在庇护所内停留一段时间
  - 安全感提升后离开
- [ ] 行为触发逻辑
  - 随机行为选择（加权随机）
  - 基于环境的状态转换（如靠近猫窝时想睡觉）
  - 简单的需求驱动（精力低时想睡觉）
- [ ] 避障行为
  - 移动时检测前方障碍物
  - 使用简单的规避策略（绕行或停止）
  - 避免卡在角落

**验收标准**:
- ⬜ 猫能在不同状态间自然切换
- ⬜ 移动平滑，有合理的速度和加速度
- ⬜ 睡觉时有明显的视觉反馈
- ⬜ 能主动寻找并进入庇护所
- ⬜ 能避开障碍物，不卡住

---

##### Phase 1.7: 状态管理与代码组织（预计 1-2 天）🔄 待开始

**目标**: 使用 Svelte Stores 管理全局状态，优化代码结构。

**任务清单**:
- [ ] 创建 Svelte Store
  ```typescript
  // lib/stores/gameStore.ts
  import { writable } from 'svelte/store'
  
  export const cats = writable<Cat[]>([])
  export const mapConfig = writable<MapConfig | null>(null)
  export const isRunning = writable(false)
  ```
- [ ] 重构代码结构
  - 将猫的逻辑提取到 `lib/core/Cat.ts` 类
  - 将物理引擎封装到 `lib/core/PhysicsEngine.ts`
  - 将渲染逻辑封装到 `lib/core/Renderer.ts`
  - 将行为系统封装到 `lib/core/BehaviorSystem.ts`
- [ ] 组件通信
  - GameCanvas.svelte 负责渲染和交互
  - 通过 Svelte Stores 共享状态
- [ ] 生命周期管理
  - 组件挂载时初始化物理引擎和猫
  - 组件卸载时清理资源（停止渲染循环、销毁物理世界）
- [ ] 配置管理
  - 将猫的配置、地图配置提取到单独的文件
  - 支持从 JSON 加载配置

**验收标准**:
- ⬜ 全局状态通过 Svelte Stores 管理，组件间通信清晰
- ⬜ 代码模块化，职责分明
- ⬜ 可以轻松添加新的猫或修改地图配置
- ⬜ 组件卸载时无内存泄漏

---

##### Phase 1.8: 测试与优化（预计 1-2 天）🔄 待开始

**目标**: 测试基础功能，优化性能，修复 bug。

**任务清单**:
- [ ] 功能测试
  - 测试猫的四种行为状态
  - 测试碰撞检测是否正常
  - 测试地图元素是否正确显示
- [ ] 性能优化
  - 使用 Chrome DevTools Performance 面板分析
  - 优化渲染调用（减少不必要的绘制）
  - 确保 FPS 稳定在 60
  - 监控内存使用（无明显泄漏）
- [ ] 边界情况测试
  - 猫卡在墙角的情况
  - 两只猫挤压在一起
  - 多个猫同时移动
- [ ] Bug 修复
  - 修复发现的任何问题
  - 添加错误处理和边界检查
- [ ] 代码清理
  - 删除调试代码和 console.log
  - 添加必要的注释
  - 格式化代码（Prettier）

**验收标准**:
- ⬜ 所有基础功能正常运行
- ⬜ FPS 稳定在 60，无明显卡顿
- ⬜ 无明显 bug 或崩溃
- ⬜ 代码整洁，有适当注释

---

#### Phase 2: 时间系统与情绪状态 - 预计 7-11 天

> **核心目标**: 添加昼夜时间系统、行为事件记录和猫的情绪状态管理

##### Phase 2.1: 时间系统（昼夜循环）（预计 2-3 天）🔄 待开始

**目标**: 实现游戏内的时间系统，区分白天和夜晚，影响猫的行为和环境。

**任务清单**:
- [ ] 设计时间系统数据结构
  ```typescript
  interface TimeSystem {
    currentTime: number      // 当前时间（0-24小时）
    daySpeed: number         // 时间流逝速度（倍率）
    isDaytime: boolean       // 是否为白天
    
    update(deltaTime: number): void
    getDayPhase(): 'morning' | 'afternoon' | 'evening' | 'night'
  }
  ```
- [ ] 实现时间流逝逻辑
  - 基于真实时间的加速流逝（如 1 分钟 = 1 游戏小时）
  - 可配置的时间速度
  - 时间循环（24 小时后重置）
- [ ] 昼夜视觉变化
  - 白天：正常光照，明亮色调
  - 夜晚：暗色调，添加月光/灯光效果
  - 过渡效果：黄昏和黎明的渐变
- [ ] 时间对行为的影响
  - 白天：猫更活跃，更多移动和玩耍
  - 夜晚：猫更倾向于睡觉或安静休息
  - 特定时间段触发特定行为（如傍晚进食）
- [ ] UI 显示
  - 在界面显示当前时间
  - 显示白天/夜晚图标
  - 可选：时间进度条

**验收标准**:
- ⬜ 时间系统正常运行，能区分昼夜
- ⬜ 视觉效果随时间变化
- ⬜ 猫的行为受时间影响
- ⬜ UI 正确显示当前时间

---

##### Phase 2.2: 行为事件记录系统（预计 2-3 天）🔄 待开始

**目标**: 记录猫的行为事件，形成日志系统，便于观察和分析。

**任务清单**:
- [ ] 设计事件数据结构
  ```typescript
  interface BehaviorEvent {
    id: string
    timestamp: number        // 发生时间
    catId: string            // 哪只猫
    eventType: EventType     // 事件类型
    details: Record<string, any>  // 详细信息
    duration?: number        // 持续时间（秒）
  }
  
  enum EventType {
    STATE_CHANGE = 'STATE_CHANGE',    // 状态改变
    MOVEMENT = 'MOVEMENT',            // 移动
    SLEEP = 'SLEEP',                  // 睡觉
    HIDE = 'HIDE',                    // 躲避
    INTERACTION = 'INTERACTION',      // 互动
    EAT = 'EAT',                      // 进食
    PLAY = 'PLAY'                     // 玩耍
  }
  ```
- [ ] 实现事件记录器
  - 在猫状态改变时记录事件
  - 记录重要行为（开始睡觉、进入庇护所等）
  - 存储到内存数组或 IndexedDB
- [ ] 事件过滤和查询
  - 按猫筛选事件
  - 按时间范围筛选
  - 按事件类型筛选
- [ ] 事件日志 UI
  - 显示最近的事件列表
  - 时间戳和事件描述
  - 可滚动查看历史记录
- [ ] 数据统计（可选）
  - 统计每只猫的活动时长
  - 统计睡眠时间占比
  - 生成简单的行为报告

**验收标准**:
- ⬜ 能正确记录猫的行为事件
- ⬜ 事件包含完整的时间戳和详细信息
- ⬜ 可以通过 UI 查看事件日志
- ⬜ 支持按条件筛选事件

---

##### Phase 2.3: 猫的情绪状态系统（预计 2-3 天）🔄 待开始

**目标**: 为猫添加情绪和需求状态，影响行为选择。

**任务清单**:
- [ ] 设计情绪状态数据结构
  ```typescript
  interface CatMood {
    energy: number        // 精力值（0-100）
    happiness: number     // 快乐值（0-100）
    hunger: number        // 饥饿值（0-100）
    stress: number        // 压力值（0-100）
    social: number        // 社交需求（0-100）
    
    update(deltaTime: number): void
    getDominantNeed(): string  // 获取最迫切的需求
  }
  ```
- [ ] 实现情绪值变化逻辑
  - 精力随时间自然恢复（睡觉时更快）
  - 饥饿随时间增加
  - 快乐值受活动和环境影响
  - 压力值在拥挤或危险时增加
  - 社交需求独处时增加
- [ ] 情绪对行为的影响
  - 饥饿高时寻找食物（未来扩展）
  - 精力低时寻找猫窝睡觉
  - 压力高时寻找庇护所躲避
  - 社交需求高时靠近另一只猫
- [ ] 情绪视觉反馈
  - 不同情绪状态下猫的表现略有不同
  - 可选：显示情绪图标或数值
  - 快乐时尾巴摇摆更快，压力大时蜷缩
- [ ] 情绪平衡机制
  - 各项数值有上下限
  - 自然恢复和消耗达到平衡
  - 避免极端值导致异常行为

**验收标准**:
- ⬜ 情绪系统正常运行，数值合理变化
- ⬜ 情绪影响猫的行为选择
- ⬜ 有视觉或 UI 反馈显示情绪状态
- ⬜ 情绪值不会超出合理范围

---

##### Phase 2.4: 综合测试与优化（预计 1-2 天）🔄 待开始

**目标**: 测试 Phase 2 的所有新功能，确保系统稳定运行。

**任务清单**:
- [ ] 时间系统测试
  - 测试昼夜切换是否正常
  - 测试时间加速/减速
  - 测试视觉效果过渡
- [ ] 事件记录测试
  - 验证事件是否正确记录
  - 测试事件筛选功能
  - 检查数据存储和读取
- [ ] 情绪系统测试
  - 测试情绪值变化是否合理
  - 测试情绪对行为的影响
  - 边界值测试（0 和 100）
- [ ] 性能优化
  - 监控长时间运行的内存使用
  - 优化事件存储（避免无限增长）
  - 确保 FPS 稳定
- [ ] Bug 修复
  - 修复发现的问题
  - 完善错误处理

**验收标准**:
- ⬜ Phase 2 所有功能正常运行
- ⬜ 系统稳定，无明显 bug
- ⬜ 性能良好，无内存泄漏
- ⬜ 用户体验流畅

---

### 中期（Phase 3-4：后续规划）

列出短期任务完成后的下一步计划。紧急程度稍低，待 Phase 1-2 完成后详细规划。

**可能的方向**:
- 更复杂的猫行为系统（玩耍、社交、探索）
- 用户交互功能（点击、拖拽、喂食等）
- 更多房间和场景
- 音效和背景音乐
- 成就系统和数据统计

### 长期（Phase 5+：远景规划）

记录想法、需求，以及难度高，短期难以实现的任务。

**可能的方向**:
- 硬件整合（摄像头识别真实猫咪、真实物理世界空间感知）
- 引入后端和数据库
- 多人在线功能
- AI 驱动的更智能行为

---

## 里程碑

| Phase | 预计时长 | 关键交付物 | 状态 |
|-------|---------|-----------|------|
| Phase 1 | 10-16 天 | 画布、地图系统、两只猫实体、基础行为（移动/静止/睡觉/躲避） | 🔄 待开始 |
| Phase 2 | 7-11 天 | 昼夜时间系统、行为事件记录、猫的情绪状态系统 | 🔄 待开始 |
| **总计** | **17-27 天** | **完整的 CatHouse 基础系统** | **准备开始 Phase 1** |
