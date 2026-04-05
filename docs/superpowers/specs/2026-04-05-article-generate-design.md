# AI 文章生成功能设计文档

> 日期: 2026-04-05
> 状态: 设计完成，待实现
> 范围: 根据专栏任务清单，AI 自动生成文章内容并保存为 Markdown 文件

## 1. 概述

### 目标

在现有 CMS 专栏管理系统的基础上，增加 AI 文章生成功能。用户可以从专栏详情页的任务清单中，选择 draft 状态的任务，单篇或批量调用 LLM 生成文章全文（Markdown 格式），保存为独立文件。

### 背景

当前系统已具备：
- 专栏管理 + 任务清单（`config/data/cms/topics.json`）
- AI 内容规划 API（`/api/llm/topic-planning`）
- 专栏详情页任务 CRUD（`topic-detail-client.tsx`）

缺少的是从规划任务到实际文章内容的生成环节。

### 范围限定

- **包含**：文章生成 API、专栏详情页交互（单篇/批量生成、预览）、Markdown 文件存储
- **不包含**：发布到知乎等外部平台（后续迭代）、Writer 页面改造、数据库表变更

---

## 2. 架构

### 数据流

```
专栏详情页（选择 draft 任务）
    ↓ 单篇 / 批量
POST /api/llm/article-generate
    ↓ 接收：任务标题 + 专栏上下文
LLM 调用（GPT-4.1 via Pinova Gateway）
    ↓ 返回：Markdown 全文
保存到 content/articles/{task-id}.md
    ↓ 更新任务状态 → reviewed，contentUrl → 文件路径
前端刷新，可预览 / 编辑
```

### 不引入的东西

- 不引入 BullMQ 队列（当前阶段不需要）
- 不引入新数据库表（复用 topics.json + 独立 Markdown 文件）
- 不修改 Writer 页面（保持独立）

### 文件存储

```
content/
  articles/
    {task-id}.md    # 以任务 ID 命名，重新生成覆盖同一文件
```

---

## 3. API 设计

### `POST /api/llm/article-generate`

**请求体：**

```typescript
{
  task: {
    id: string;           // 任务 ID，用于文件命名
    articleName: string;   // 文章标题 / 主题
  };
  topic: {
    topicName: string;        // 专栏名称
    ipPositioning: string;    // IP 定位
    targetAudience: string;   // 目标客群
    coreLabels: string;       // 核心标签
    contentMatrix: string;    // 内容矩阵配比
  };
  config?: {
    platform?: "zhihu";               // 目标平台，默认 zhihu
    length?: number;                   // 目标字数，默认 1500
    tone?: "professional" | "casual";  // 语气，默认 professional
    extraNotes?: string;               // 额外要求
  };
}
```

**响应体：**

```typescript
{
  success: true;
  articlePath: string;     // "content/articles/{task-id}.md"
  title: string;           // 生成的文章标题
  wordCount: number;       // 字数
  summary: string;         // 文章摘要（前 200 字）
}
```

**错误响应：**

```typescript
{
  error: string;   // 错误信息
}
```

### `GET /api/articles/[id]`

读取已生成的文章内容，供前端预览。

**响应体：**

```typescript
{
  content: string;    // Markdown 原文
  wordCount: number;  // 字数
}
```

---

## 4. LLM Prompt 策略

### System Prompt

根据 `platform` 参数从 `PLATFORM_SPECS` 中获取对应的篇幅和语气，动态填入 Prompt：

```
你是一位资深技术自媒体作者，专注于 B2B 和 AI 领域。你正在为以下专栏撰写文章：

【专栏名称】{topicName}
【IP 定位】{ipPositioning}
【目标客群】{targetAudience}
【核心标签】{coreLabels}
【内容矩阵】{contentMatrix}

写作要求：
- 目标平台：{PLATFORM_SPECS[platform].description}
- 篇幅：{PLATFORM_SPECS[platform].minWords}-{PLATFORM_SPECS[platform].maxWords} 字
- 语气：{PLATFORM_SPECS[platform].tone}，避免学术化堆砌
- 输出格式：标准 Markdown，包含一级标题、二级小标题、正文段落
- 每个小节 200-300 字，逻辑清晰，有实际案例或数据支撑
- 开头要有吸引力（提出问题或引出痛点），结尾有行动号召或思考引导
- 禁止使用 AI 味过重的套话（如"在当今数字化时代"、"综上所述"等）
- 禁止虚构数据或引用不存在的来源
```

### User Prompt

```
请根据以下主题撰写一篇知乎文章：

【文章主题】{articleName}

{extraNotes ? `补充说明：${extraNotes}` : ''}
```

### 配置

| 参数 | 值 |
|------|-----|
| model | gpt-4.1（通过 Pinova Gateway） |
| temperature | 0.7 |
| 超时 | 120 秒（文章比规划更长） |
| response_format | 不使用 json_object，直接返回 Markdown 文本 |

---

## 5. 平台规格常量

```typescript
const PLATFORM_SPECS: Record<string, {
  minWords: number;
  maxWords: number;
  tone: string;
  description: string;
}> = {
  zhihu: {
    minWords: 800,
    maxWords: 1500,
    tone: "专业但接地气",
    description: "知乎专栏文章"
  },
  wechat_mp: {
    minWords: 2000,
    maxWords: 3000,
    tone: "专业深度",
    description: "公众号长文"
  },
  xiaohongshu: {
    minWords: 300,
    maxWords: 500,
    tone: "轻松实用",
    description: "小红书笔记"
  },
  generic: {
    minWords: 800,
    maxWords: 2000,
    tone: "专业",
    description: "通用文章"
  }
};
```

当前默认 `zhihu`，后续扩展其他平台时复用同一 API，仅切换 platform 参数。

---

## 6. 前端交互设计

所有交互在现有 `topic-detail-client.tsx`（专栏详情页）上完成。

### 6.1 单篇生成

- 每个 **draft** 状态的任务行，操作列增加 **「✨ 生成」按钮**（与编辑/删除并列）
- 点击弹出 **ArticleGenerateDialog**：
  - 显示文章标题（只读）
  - 可选平台（默认知乎，下拉选择）
  - 附加说明输入框（可选）
  - 「生成」/「取消」按钮
- 确认后调用 API，按钮变为加载态
- 成功：任务状态更新为 `reviewed`，contentUrl 填入文件路径，toast 成功提示
- 失败：toast 错误提示，保持 draft 状态

### 6.2 批量生成

- 任务表格增加 **复选框列**（仅 draft 状态任务可勾选）
- 工具栏「新任务」按钮旁增加 **「批量生成」按钮**（勾选 ≥ 1 个时启用）
- 点击弹出 **BatchGenerateDialog**：
  - 显示已选任务列表
  - 平台选择（统一应用）
  - 进度条 + 当前处理的文章名
  - 完成统计（成功 N / 失败 M）
- **串行**逐篇调用 API（避免 LLM 并发限制），每完成一篇实时更新进度和表格行状态

### 6.3 文章预览

- 已生成的任务（contentUrl 不为空），「内容链接」列点击弹出 **ArticlePreviewDialog**
- 调用 `GET /api/articles/{task-id}` 获取 Markdown 内容
- 用 `react-markdown` 渲染预览（复用 topic-plan-dialog 中已有的依赖）
- 预览 Dialog 提供「重新生成」按钮

### 6.4 状态徽章扩展

当前 STATUS_CONFIG 增加 `reviewed` 状态：

```typescript
const STATUS_CONFIG = {
  draft: { label: '草稿', variant: 'outline' },
  reviewed: { label: '已审核', variant: 'default' },
  published: { label: '已发布', variant: 'secondary' },
};
```

已生成的文章标记为 `reviewed`（对应「已审核」），用户手动确认发布后变为 `published`。

---

## 7. 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `app/api/llm/article-generate/route.ts` | 文章生成 API 端点 |
| `app/api/articles/[id]/route.ts` | 读取已生成文章内容的 API |
| `components/cms/article-generate-dialog.tsx` | 单篇生成确认 Dialog |
| `components/cms/batch-generate-dialog.tsx` | 批量生成 Dialog（进度条） |
| `components/cms/article-preview-dialog.tsx` | Markdown 文章预览 Dialog |
| `content/articles/.gitkeep` | 文章存储目录占位 |

### 修改文件

| 文件 | 变更内容 |
|------|---------|
| `components/cms/topic-detail-client.tsx` | 添加复选框列、生成按钮、批量按钮、预览链接、集成三个 Dialog |

### 不修改

- `components/cms/writer-client.tsx` — 保持独立
- `components/cms/topic-plan-dialog.tsx` — 规划功能不变
- `lib/db/schema.ts` — 不新增数据库表

---

## 8. 技术约束

| 约束 | 说明 |
|------|------|
| LLM 网关 | 复用 `NEW_API_URL` / `NEW_API_KEY` 环境变量 |
| 超时 | 120 秒（AbortController） |
| Markdown 渲染 | `react-markdown`（已安装） |
| 文件命名 | 以 task ID 命名，重新生成覆盖同一文件（幂等） |
| 批量并发 | 串行逐篇调用，避免 LLM 并发限制 |
| 数据持久化 | 通过 `PUT /api/rest/cms/topics/{id}` 更新任务状态和 contentUrl |

---

## 9. 后续迭代

本次不实现，后续可扩展：

- **知乎自动发布**：通过 Playwright 浏览器自动化或逆向 API 实现
- **多平台生成**：复用同一 API，切换 platform 参数生成不同平台适配内容
- **Writer 页面接入**：将 Writer 的 mock 替换为真实 AI 调用
- **内容编辑器**：内置 Markdown 编辑器，生成后直接编辑
- **效果追踪**：发布后手动录入阅读/点赞数据
