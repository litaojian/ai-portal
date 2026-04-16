# AI 获客系统设计文档 v2

> 日期: 2026-04-04
> 状态: 设计完成，待实现
> 变更: 从 Outbound 冷触达转向 Inbound 内容获客 + 企微私域

## 1. 概述

### 目标

打造一个 AI 驱动的 B2B 内容获客 + 私域转化平台，帮助企业：

1. **内容获客** — AI 批量生成多平台优质内容，持续获取精准线索
2. **私域培育** — 通过企微自动化培育，建立信任，降低获客成本
3. **提高转化** — AI 销售助手辅助决策，提升销售效率

### 核心公式

```
优质内容（公域曝光）→ 私域沉淀（企微）→ AI 培育（建立信任）→ 销售转化
```

### 核心决策

| 维度 | 决策 |
|------|------|
| 目标客户 | B2B 企业服务（SaaS、企业软件、咨询等） |
| 获客策略 | Inbound 内容获客 + 企微私域（非 Outbound 冷触达） |
| AI 角色 | AI 辅助 + 人工决策 |
| 技术栈 | TypeScript 全栈 |
| 架构 | Next.js 单体 + BullMQ 队列 |

### 四大核心引擎

| 引擎 | 职责 | 优先级 |
|------|------|--------|
| **AI 内容引擎** | 批量生成多平台内容，内容日历，效果追踪 | Phase 1 |
| **私域运营引擎** | 企微触达、培育序列、社群运营 | Phase 2 |
| **AI 销售助手** | 线索评分、跟进建议、话术推荐 | Phase 3 |
| **线索引擎** | Inbound 线索接入、企微回调、行为追踪 | Phase 2 |

---

## 2. 系统架构

```
+-------------------------------------------------------+
|                   CRM Bot 全栈应用                       |
|                                                         |
|  +----------+  +----------+  +----------+  +--------+  |
|  | Dashboard |  | 内容中心  |  | 私域中心  |  |线索管理 |  |
|  +-----+----+  +-----+----+  +-----+----+  +---+----+  |
|        |              |              |           |       |
|  ------+--------------+--------------+-----------+----  |
|                        API Routes                        |
|  ------+--------------+--------------+-----------+----  |
|        |              |              |           |       |
|  +-----+----+  +-----+----+  +-----+----+  +---+----+  |
|  | AI内容引擎|  | 私域运营   |  | AI销售    |  |线索引擎 |  |
|  |          |  | 引擎      |  | 助手      |  |        |  |
|  +-----+----+  +-----+----+  +-----+----+  +---+----+  |
|        +---------------+--------------+----------+       |
|                        |                                 |
|                +-------+-------+                         |
|                |   BullMQ 队列  |                         |
|                +-------+-------+                         |
|        +---------------+---------------+                 |
|   +----+-----+  +-----+-----+  +-----+-----+           |
|   | 内容生成  |  | 企微消息   |  | 线索处理   |           |
|   | & 分发   |  | & 同步    |  | & 评分    |           |
|   +----------+  +-----------+  +-----------+            |
+-------------------------------------------------------+
         |              |              |
    +----+----+   +----+----+   +----+----+
    |PostgreSQL|   |  Redis  |   | 企微 API |
    +---------+   +---------+   +---------+
```

---

## 3. 数据模型

### Auth 模型

User, Account, Session, VerificationToken — NextAuth 标准模型。

### 业务模型

| 实体 | 关键字段 | 说明 |
|------|---------|------|
| **Company** | name, domain, industry, size, location, enrichedData | 企业画像 |
| **Contact** | name, title, email, phone, wecomId, source | 联系人，wecomId 关联企微 |
| **Lead** | companyId, contactId, status, source, channel, tags | 线索主体 |
| **LeadScore** | leadId, total, factors, reasoning, recommendation | AI 评分 |
| **LeadEvent** | leadId, type, metadata | 行为事件（内容阅读、表单提交、企微互动等） |
| **Content** | title, type, topic, targetAudience, keywords, selectedPlan, status | 内容主题 |
| **ContentVariant** | contentId, platform, title, body, conversionHook, metrics | 各平台适配版本 |
| **CalendarItem** | contentId, variantId, scheduledDate, platform, status | 内容排期 |
| **NurtureSequence** | name, channel, triggerCondition, status | 私域培育序列 |
| **NurtureStep** | sequenceId, stepOrder, delayDays, channel, contentPrompt | 序列步骤 |
| **NurtureLog** | stepId, leadId, status, sentAt, response | 执行记录 |
| **WeComUser** | externalUserId, unionId, name, avatar, contactId | 企微客户映射 |
| **WeComMessage** | wecomUserId, direction, msgType, content, analyzedIntent | 聊天记录 |
| **PromptTemplate** | name, role, template, variables, outputSchema, version | Prompt 模板 |

### 线索来源渠道

```
wechat_article | zhihu | xiaohongshu | douyin | seo | whitepaper | webinar | referral | wecom_add | manual
```

### 线索状态流转

```
New -> Subscribed -> Engaged -> MQL -> SQL -> Opportunity -> Won
                                                      \-> Lost
```

---

## 4. AI 内容引擎（Phase 1 重点）

### 核心流程

```
用户提交 Brief → AI 选题策划(3个方案) → 用户选择 → AI 多平台内容生成 → 人工审核 → 转化钩子注入 → 排期发布 → 效果追踪
```

### 内容类型

- pain_point: 痛点分析
- case_study: 客户案例
- industry_trend: 行业趋势
- how_to: 实操指南
- comparison: 对比评测

### 平台规格

| 平台 | 篇幅 | 语气 | 模型 |
|------|------|------|------|
| 公众号 (wechat_mp) | 2000-3000字 | 专业深度 | Claude Sonnet |
| 知乎 (zhihu) | 800-1500字 | 专业但接地气 | Claude Sonnet |
| 小红书 (xiaohongshu) | 300-500字 | 轻松实用 | Claude Haiku |
| 短视频脚本 (douyin_script) | 150-250字 | 口语化 | v1.1 |
| SEO博客 (seo_blog) | 1500-2000字 | 信息全面 | v1.1 |

### AI 调用链路

1. **选题策划** — Claude Sonnet，输入 Brief，输出 3 个方案（角度+大纲+标题）
2. **内容生成** — BullMQ 并行，每个平台一个任务，平台 Spec + 大纲 → 完整内容
3. **后处理** — 转化钩子注入、格式化、质量检查（字数/关键词/敏感词）

### 转化钩子

每条内容自动嵌入引流组件：
- 公众号文末 → 企微活码 + 资料领取
- 知乎 → 引导私信/官网
- 小红书 → 评论区互动引导
- 所有链接带 UTM 追踪参数

### 内容日历

- 周/月视图
- AI 建议最佳发布时间和频率
- 拖拽排期
- 状态追踪（草稿/生成中/待审/已发布）

### 效果追踪

MVP 手动录入指标：views, likes, shares, comments, leads, wecomAdds
v1.1 自动采集

### 成本

一个主题全平台（3个平台）约 $0.08，月均 $3-5。

### 前端页面

| 页面 | 功能 |
|------|------|
| 内容工作台 | 创建 Brief → 选择选题 → 触发生成 |
| 内容库 | 列表/筛选/搜索 |
| 内容编辑器 | 编辑变体，富文本，多平台预览 |
| 内容日历 | 排期管理 |
| 效果分析 | 指标展示，转化归因 |

### 项目结构

```
src/
├── app/(dashboard)/content/
│   ├── page.tsx                # 内容工作台
│   ├── [id]/page.tsx           # 内容详情
│   ├── [id]/edit/page.tsx      # 编辑变体
│   ├── calendar/page.tsx       # 内容日历
│   └── analytics/page.tsx      # 效果分析
├── app/api/content/
│   ├── route.ts                # CRUD
│   ├── [id]/route.ts
│   ├── [id]/generate/route.ts  # 触发 AI 生成
│   ├── [id]/variants/route.ts
│   └── calendar/route.ts
├── lib/content/
│   ├── topic-planner.ts        # 选题策划
│   ├── content-generator.ts    # 内容生成
│   ├── platform-specs.ts       # 平台规格
│   ├── post-processor.ts       # 后处理
│   └── content-service.ts      # 业务逻辑
├── lib/ai/
│   ├── client.ts               # Claude API 客户端
│   └── prompts/
│       ├── topic-planner.ts
│       └── content-writer.ts
├── workers/
│   └── content-gen.worker.ts
└── components/content/
    ├── brief-form.tsx
    ├── topic-picker.tsx
    ├── content-editor.tsx
    ├── platform-preview.tsx
    ├── content-list.tsx
    ├── content-calendar.tsx
    └── metrics-card.tsx
```

---

## 5. 私域运营引擎（Phase 2）

### 企微触达路径

v1.1: 集成第三方 SCRM（微伴/尘锋），CRM Bot 通过 API 推送线索，SCRM 处理企微触达。
v1.3: 直接对接企微 API（活码、消息推送、回调事件、客户标签、会话存档）。

### 培育序列

类似邮件序列，但走企微消息通道：
- 欢迎语 → 资料分享 → 案例分享 → 行业报告 → 轻问需求
- 基于行为事件自动触发
- AI 分析回复意图，高意向自动转人工

---

## 6. AI 销售助手（Phase 3）

- 基于行为事件的线索评分（非公开数据推断）
- 跟进时机和话术推荐
- 个性化方案/报价初稿
- 商机预测

---

## 7. 技术栈

| 层 | 选型 |
|----|------|
| 运行时 | Node.js 20 LTS |
| 框架 | Next.js 14 App Router |
| 语言 | TypeScript 5 |
| ORM | Prisma 5 |
| 数据库 | PostgreSQL 16 |
| 缓存/队列 | Redis 7 + BullMQ 5 |
| AI | Claude API (@anthropic-ai/sdk) |
| 认证 | NextAuth.js 5 |
| UI | shadcn/ui + Tailwind CSS |
| 图表 | Recharts |
| 表格 | TanStack Table |
| 表单 | React Hook Form + Zod |
| 部署 | Docker Compose / Railway |

---

## 8. MVP 里程碑

### Phase 1: 基础骨架 + AI 内容引擎

**基础骨架：**
- 项目初始化、数据库模型、认证、基础布局、Docker 环境

**AI 内容引擎：**
- 内容 Brief 输入
- AI 选题策划（3个方案）
- 多平台内容生成（公众号、知乎、小红书）
- 内容编辑与审核
- 内容日历（基础排期）
- 效果指标手动录入

### Phase 2: 线索引擎 + 私域运营

- Inbound 线索接入（表单/Webhook）
- 企微集成（第三方 SCRM）
- 线索行为事件追踪
- AI 培育序列
- 线索池管理

### Phase 3: AI 销售助手 + Dashboard

- AI 线索评分（基于行为数据）
- 销售跟进建议
- 仪表盘指标
- 获客漏斗分析

### 后续迭代

| 功能 | 优先级 | 阶段 |
|------|--------|------|
| 短视频脚本生成 | P1 | v1.1 |
| SEO 文章生成 | P1 | v1.1 |
| 效果自动采集 | P1 | v1.1 |
| AI 选题优化（基于数据反馈） | P2 | v1.2 |
| 企微 API 直连 | P2 | v1.3 |
| 小红书浏览器插件采集 | P2 | v1.1 |
| AI 电话外呼 | P3 | v2.0 |
| 多用户/团队协作 | P1 | v1.1 |
