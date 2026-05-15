# CatHouse

一个基于 SvelteKit 的虚拟猫咪互动应用。

## 🚀 快速开始

### 环境要求

- **Node.js**: v22.x 或更高版本
- **pnpm**: v9.x 或更高版本

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

应用将在 http://localhost:5173 启动

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 🧪 测试

```bash
pnpm test           # 运行测试（watch 模式）
pnpm test:run       # 运行测试一次
pnpm test:coverage  # 生成覆盖率报告
```

## 📁 项目结构

```
cat-house/
├── src/
│   ├── lib/          # 共享库代码
│   ├── routes/       # SvelteKit 路由页面
│   ├── components/   # 可复用组件
│   └── assets/       # 静态资源
├── static/           # 公共静态文件
├── tests/            # 测试文件
└── ...
```

## 🛠️ 技术栈

- **框架**: SvelteKit + Svelte 5 (Runes)
- **语言**: TypeScript
- **构建工具**: Vite
- **包管理器**: pnpm
- **测试框架**: Vitest + Testing Library
- **渲染**: HTML5 Canvas API
- **物理引擎**: Matter.js

## 📖 相关文档

- [AI Agent 指南](AGENTS.md) - 技术架构和开发指导
- [开发计划](PLAN.md) - 项目路线图和进度跟踪
- [UI 设计规范](UI.md) - 视觉设计和交互规范
