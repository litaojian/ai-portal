# AI 门户 (Dashboard v1) 项目背景

## 1. 项目概览
**项目名称：** AI-Portal-v1 (AI Portal)
**愿景：** 一个集中的用户门户和管理后台，旨在作为未来应用统一入口（"1+N"模式）。
**当前状态：** 早期开发阶段。已是一个功能相对完整的 Next.js 应用程序，实现了基础 UI 结构、身份认证、**项目管理**、**应用管理** 以及 **OIDC 身份提供商 (Provider)** 服务。

## 2. 关键规范索引
*为保持文档清晰，详细规范已拆分为独立文件，请点击链接查看：*

- 📅 **[开发流程规范](docs/specs/1_开发流程规范.md)**
  - 涵盖：工作流、Next.js 16 异步参数、URL 状态同步、Server Action 写法、构建检查。
- 📝 **[需求文档规范](docs/specs/2_需求文档规范.md)**
  - 涵盖：文档结构、用户故事、字段定义、验收标准。
- 🎨 **[功能设计规范](docs/specs/3_功能设计规范.md)**
  - 涵盖：UX/UI 交互标准、反馈机制、分页/筛选行为、异常处理。
- 🛠️ **[技术栈与组件规范](docs/specs/4_技术栈与组件规范.md)**
  - 涵盖：Next.js, Shadcn/UI, Zod/React Hook Form 使用准则 (特别是类型安全)。
- 🗄️ **[数据库设计规范](docs/specs/5_数据库设计规范.md)**
  - 涵盖：Prisma 模型命名、字段规范、安全操作。

## 3. 技术栈
- **框架:** Next.js 16.1.4 (App Router)
- **语言:** TypeScript
- **样式:** Tailwind CSS v4, Shadcn/UI
- **数据:** Drizzle + SQLite + MySQL
- **认证:** NextAuth.js v4, OIDC Provider
- **包管理:** pnpm

## 4. 项目结构
```text
D:\ai_works\ai-portal\
├── app/                 # Next.js App Router 页面和布局
│   ├── dashboard/       # 主仪表盘
│   ├── apps/            # 应用管理
│   ├── projects/        # 项目管理
│   ├── oidc/            # OIDC 服务
│   └── api/             # API 路由
├── components/          # React 组件 (ui/ 为 Shadcn)
├── docs/                # 项目文档
│   ├── specs/           # >>> 开发规范与标准 <<<
│   ├── 项目管理/        # 业务模块文档
│   ├── 应用管理/
│   └── OIDC服务/
├── lib/                 # 工具函数与配置
└── prisma/              # 数据库 Schema
```

## 5. 快速开始
- **安装依赖：** `pnpm install`
- **开发服务：** `pnpm dev`
- **构建检查：** `pnpm build` (提交前必跑)

## 6. 最近开发任务
- **项目管理 (v1.0)**: 已完成。
- **身份认证与导航**: 已完成。
- **应用管理 (v1.0)**: 已完成。
- **OIDC 服务 (v1.0)**: 已完成。
