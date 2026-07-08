# CatHouse 项目开发计划

## 📊 当前进度概览

**最后更新**: 2026-07-08
**当前阶段**: 任务 6 待开始
**已完成**: 任务 1-5（基础系统、测试优化）

---

## 项目计划

本项目采用**功能驱动**的开发方式，已完成前 5 个阶段：

1. ✅ 核心配置与定义
2. ✅ 动态实体（核心）
3. ✅ 静态世界
4. ✅ 规则与交互
5. ✅ 测试与优化
6. **独立 AI 架构** - 状态机解耦，事件驱动的意图系统

---

### 任务 6: 状态机解耦 — 独立 AI 架构 🔄 待开始

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

- [ ] 引入 `CatIntent` 类型（`types.ts`）
- [ ] `updateCatState` 返回 `CatIntent[]`
- [ ] `startChasing` / `reverseChase` / `enterPlayFightingState` 改为返回 intent
- [ ] 游戏循环：先独立更新，再 `resolveIntents()` 统一处理
- [ ] `StateContext.allCats` 改为 `readonly Cat[]`
- [ ] 碰撞解析独立化（游戏循环中单独调用）
- [ ] 补充测试：意图收集、意图解析、独立更新

**验收标准**:
- ⬜ 每只猫只修改自己的状态
- ⬜ `updateCatState` 不直接写入 other 的字段
- ⬜ 追逐/打闹通过意图系统协调
- ⬜ 猫大部分时间独立行动
- ⬜ 现有测试全部通过

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
