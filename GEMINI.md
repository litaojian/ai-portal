# AI 门户 (Dashboard v1) 项目背景

## 1. 项目概览
**项目名称：** dashboard-v1 (AI Portal)
**愿景：** 一个集中的用户门户和管理后台，旨在作为未来应用统一入口（"1+N"模式）。它提供身份验证、导航和管理能力。
**当前状态：** 早期开发阶段。目前是一个独立的 Next.js 应用程序，已实现基础 UI 结构、身份认证和部分业务模块。

## 2. 技术栈
- **框架：** [Next.js 16](https://nextjs.org/) (App Router)
- **语言：** TypeScript
- **样式：**
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Shadcn/UI](https://ui.shadcn.com/) (New York 风格, Neutral 色调)
- **图标：** `lucide-react`, `@tabler/icons-react`
- **数据展示：** `@tanstack/react-table` (表格), `recharts` (图表)
- **验证：** `zod`
- **ORM/数据库：** Prisma + SQLite (开发环境)
- **包管理器：** pnpm

## 3. 项目结构
```text
D:\ai_works\ai-portal\
├── app/                 # Next.js App Router 页面和布局
│   ├── dashboard/       # 主仪表盘视图
│   ├── globals.css      # 全局样式和 Tailwind 变量
│   ├── layout.tsx       # 根布局
│   └── page.tsx         # 落地页 (Landing page)
├── components/          # React 组件
│   ├── ui/              # Shadcn/UI 基础组件 (除非必要请勿手动修改)
│   └── ...              # 业务特定组件 (如 app-sidebar, nav-*)
├── docs/                # 文档和需求 (按模块组织)
├── lib/                 # 工具函数 (utils.ts, prisma.ts, schemas.ts)
├── public/              # 静态资源
└── components.json      # Shadcn/UI 配置
```

## 4. 开发与使用

### 4.1. 安装与运行
项目使用 `pnpm`。

- **安装依赖：**
  ```bash
  pnpm install
  ```
- **启动开发服务器：**
  ```bash
  # 运行在 http://localhost:3000
  pnpm dev
  ```
- **构建生产版本：**
  ```bash
  pnpm build
  ```
- **代码检查：**
  ```bash
  pnpm lint
  ```

### 4.2. 关键开发规范
*开发过程中请严格遵守以下规则：*

- **语言规范：**
  - **UI/前端：** 所有面向用户的文本默认使用 **简体中文**。
  - **沟通：** 使用简体中文进行推理、计划和用户交互。
- **UI 组件：**
  - 优先使用 `components/ui` 中的 **Shadcn/UI** 组件。
  - 新增 UI 元素前，先检查是否有现成的 Shadcn 组件可用。
- **数据表格：**
  - 展示数据列表时，**必须** 实现分页。
  - 显示记录总数和当前页码信息。
- **代码质量：**
  - 批量修改后，务必验证无语法错误。
  - 确保项目能成功编译（建议在进行关键更改后运行 `pnpm build` 检查）。
- **开发流程：**
  - **严格工作流：** 开发新功能时，必须严格遵循：**需求分析 -> 页面设计 -> 代码开发 -> 功能测试**。
  - **用户确认：** 每个步骤完成后，必须经用户确认方可进行下一步。
  - **文档管理：** 将所有文档（需求、数据库设计、UI设计）保存至 `/docs/<模块名称>/` 目录，按业务功能模块组织文件夹。
  - **文档同步：** 如果需求变更，及时更新 `GEMINI.md` 或 `docs/` 下的文档。
  - **测试：** 适用时生成 E2E 测试用例。

## 5. 需求 vs 当前状态
*参考自 `docs/项目需求.md`:*
- **目标架构：** Monorepo (Turborepo + pnpm workspaces) 并集成 Prisma & Auth.js。
- **当前状态：** 单体 Next.js 应用。已集成 Prisma (SQLite) 和 NextAuth (Credentials)。
- **近期重点：** 完善 Dashboard UI/UX，侧边栏导航，以及构建核心管理功能（如项目管理）。

## 6. 最近开发任务：项目管理功能
- **状态：** 已完成 (v1.0)
- **文档路径：** `/docs/项目管理/`
- **实现细节：**
  - 数据模型：`Project` (包含 `leader`, `budget` 字段)。
  - 交互模式：使用 **Sheet (侧边抽屉)** 进行 CRUD 操作。
  - 前端路径：`/projects`。