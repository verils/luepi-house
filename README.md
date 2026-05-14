# 🐱 CatHouse - 虚实结合的猫咪交互系统

一个全屏"猫猫棋盘"项目，模拟房屋环境，两只虚拟猫在其中活动。同时接入物理世界的传感器，让真实猫的行为触发游戏内事件。

## 🎨 视觉风格

- **艺术风格**：卡通像素风格 2.5D 俯视视角
- **配色方案**：基于真实猫咪（橘白猫和暹罗猫）的自然毛色
- **参考设计**：详见 [UI.md](./UI.md)

## 📋 开发计划

详细的开发计划和阶段目标请查看 [PLAN.md](./PLAN.md)

### 当前进度：Phase 1 - 核心可视化 ✅

已完成功能：
- ✅ Vue 3 + Vite 项目框架
- ✅ 全屏 Canvas 渲染系统
- ✅ Matter.js 物理引擎集成
- ✅ 地图边界和房间系统
- ✅ 两只猫的视觉形象（略略-橘白猫、皮皮-暹罗猫）
- ✅ 猫的物理实体和碰撞检测
- ✅ 点击移动和拖拽交互
- ✅ Pinia 状态管理

## 🚀 快速开始

### 环境要求

- Node.js v22.x
- pnpm

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

浏览器会自动打开 http://localhost:5173

### 构建生产版本

```bash
pnpm build
```

## 📁 项目结构

```
cat-house/
├── src/
│   ├── components/         # Vue 组件
│   │   └── GameCanvas.vue  # 主游戏画布组件
│   ├── core/               # 核心逻辑
│   │   ├── Cat.js          # 猫实体类
│   │   ├── PhysicsEngine.js # 物理引擎封装
│   │   └── Renderer.js     # 渲染器
│   ├── stores/             # Pinia 状态管理
│   │   └── gameStore.js    # 游戏状态
│   ├── config/             # 配置文件
│   │   └── mapConfig.js    # 地图和猫的配置
│   ├── App.vue             # 根组件
│   ├── main.js             # 入口文件
│   └── style.css           # 全局样式
├── public/                 # 公共资源
├── index.html              # HTML 模板
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── PLAN.md                 # 开发计划
└── UI.md                   # UI 设计规范
```

## 🎮 操作说明

### 鼠标操作

- **点击空白区域**：选中的猫移动到目标位置
- **点击猫**：选中该猫
- **拖拽猫**：直接拖动猫到任意位置

### 控制面板

右上角显示控制面板：
- ⏸️/▶️ 暂停/播放游戏
- 🔍 显示/隐藏调试信息
- 显示每只猫的当前状态

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

## 📝 下一步计划

### Phase 2: 行为系统与编辑器（中期目标）
- 实现猫的行为状态机（空闲、行走、睡觉等）
- 添加情绪/需求系统
- 开发地图编辑器
- 实现寻路系统
- 猫间互动行为

### Phase 3-5: 传感器与数据系统（长期目标）
- 事件日志系统（IndexedDB）
- WebSocket 服务器
- 传感器数据接入（ESP32 + MQTT）
- 性能优化与硬件集成

## 📄 许可证

本项目仅供学习和研究使用。

## 🙏 致谢

- [Matter.js](https://brm.io/matter-js/) - 2D 物理引擎
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vite.dev/) - 下一代前端构建工具

---

**享受与虚拟猫咪的互动时光！** 🐾
