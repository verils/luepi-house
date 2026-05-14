# 🐱 CatHouse

与我的猫猫互动

## 🎨 视觉风格

- **艺术风格**：卡通像素风格 2.5D 俯视视角
- **配色方案**：基于真实猫咪（橘白猫和暹罗猫）的自然毛色
- **参考设计**：详见 [UI.md](./UI.md)

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

---

## 📄 许可证

本项目仅供学习和研究使用。

## 🙏 致谢

- [Matter.js](https://brm.io/matter-js/) - 2D 物理引擎
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vite.dev/) - 下一代前端构建工具

---

**享受与虚拟猫咪的互动时光！** 🐾
