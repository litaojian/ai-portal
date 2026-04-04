# AI 内容创作页面重构设计

## 概述

重构 CMS 专栏管理页面，将首页改为专栏列表，点击详情跳转到独立的专栏详情页，展示专栏信息和计划任务列表（支持 CRUD）。

## 数据模型

### 专栏（Topic）

沿用 `data/cms/topics.json`，字段不变：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一标识 |
| topicName | string | 专栏名称 |
| topicDesc | string | 专栏描述 |
| ipPositioning | string | IP 定位 |
| targetAudience | string | 目标客群 |
| coreLabels | string | 核心标签 |
| contentMatrix | string | 内容矩阵 |
| status | string | 状态（open/draft/closed） |
| planTasks | number | 计划任务数（由 detailItems 自动计算） |
| completedTasks | number | 已完成任务数（由 detailItems 自动计算） |
| detailItems | array | 计划任务列表 |

### 计划任务（DetailItem）

`detailItems` 数组中每条记录：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 任务唯一标识（UUID） |
| articleName | string | 任务名称（修正原 `articeName` 拼写错误） |
| dueDate | string | 截止日期（YYYY-MM-DD） |
| status | string | 状态（open/closed） |
| contentUrl | string | 文章内容 URL |

### 自动计算规则

每次保存专栏时：
- `planTasks` = `detailItems.length`
- `completedTasks` = `detailItems.filter(i => i.status === 'closed').length`

## API

复用现有 REST API，无需新增端点：

- `GET /api/rest/cms/topics` — 专栏列表
- `GET /api/rest/cms/topics/{id}` — 单个专栏详情（含 detailItems）
- `POST /api/rest/cms/topics` — 创建专栏
- `PATCH /api/rest/cms/topics/{id}` — 更新专栏（含 detailItems 整体更新）
- `DELETE /api/rest/cms/topics/{id}` — 删除专栏

任务的增删改通过 PATCH 专栏对象的 `detailItems` 字段实现。

## 页面设计

### 1. 专栏列表页

**路由**：`/portal/cms/topics`（现有路由不变）

**配置文件**：`config/pages/cms/topics.json`

**表格列**：

| 列 | 字段 | 宽度 | 渲染方式 |
|---|---|---|---|
| 专栏名称 | topicName | 150 | 文本 |
| 定位 | ipPositioning | 200 | 文本 |
| 目标客群 | targetAudience | 150 | 文本 |
| 状态 | status | 100 | badge（open=绿, draft=灰, closed=红） |
| 计划任务数 | planTasks | 100 | 数字 |
| 已完成任务数 | completedTasks | 100 | 数字 |

**行操作**：
- "详情" — 跳转 `/portal/cms/topics/{id}`，所有状态可见
- "删除" — 仅 draft 状态显示

**工具栏**：
- "新专栏" — 创建按钮

**搜索**：按 topicName 模糊搜索

### 2. 专栏详情页

**路由**：`/portal/cms/topics/[id]/page.tsx`（新增）

**布局**：

```
┌─────────────────────────────────────────────┐
│ ← 返回   专栏详情                             │
├─────────────────────────────────────────────┤
│ 专栏信息卡片（只读）                           │
│ ┌─────────────┬──────────────────────────┐  │
│ │ 专栏名称     │ AI 探索家                 │  │
│ │ 定位         │ 极客风、中立冷静...        │  │
│ │ 目标客群     │ 科技爱好者, AI 开发者...   │  │
│ │ 状态         │ ● open                   │  │
│ └─────────────┴──────────────────────────┘  │
├─────────────────────────────────────────────┤
│ 计划任务列表                     [+ 新任务]  │
│ ┌───┬──────────┬──────────┬──────┬────┬───┐ │
│ │ # │ 任务名称  │ 截止日期  │ 状态 │URL │操作│ │
│ ├───┼──────────┼──────────┼──────┼────┼───┤ │
│ │ 1 │ 文章1    │2026-04-03│closed│ 🔗 │✏️🗑│ │
│ │ 2 │ 文章2    │2026-04-03│closed│ 🔗 │✏️🗑│ │
│ └───┴──────────┴──────────┴──────┴────┴───┘ │
│                          共 2 条  1/1 页     │
└─────────────────────────────────────────────┘
```

**专栏信息区**：只读展示 topicName、ipPositioning、targetAudience、status

**任务列表**：
- 使用 DynamicTable 渲染
- 工具栏："新任务"按钮
- 行操作："编辑"、"删除"
- contentUrl 列渲染为可点击链接（新窗口打开）

**任务表单**（Dialog 弹出）：
- articleName — 文本输入，必填
- dueDate — 日期选择器，必填
- status — 下拉选择（open/closed）
- contentUrl — 文本输入

## 实现要点

### 1. 新增 navigate action

在 PageBuilder 的 `handleAction` 中新增 `navigate` action 类型：

```typescript
case 'navigate': {
  const url = actionDef?.url?.replace('{id}', data.id);
  if (url) router.push(url);
  break;
}
```

配置示例：
```json
{
  "action": "navigate",
  "title": "详情",
  "url": "/portal/cms/topics/{id}"
}
```

### 2. 详情页组件

新建 `app/portal/cms/topics/[id]/page.tsx`：
- Server Component，获取 session 和 params
- 提供面包屑：首页 > 工作台 > 新开专栏 > 专栏详情
- 渲染专栏信息卡片 + 任务列表

新建 `components/cms/topic-detail-client.tsx`：
- Client Component，接收 topicId
- 调用 API 获取专栏数据
- 上半部分：Card 展示专栏只读信息
- 下半部分：任务列表表格 + 增删改 Dialog
- 任务保存逻辑：修改 detailItems 数组 → 重新计算 planTasks/completedTasks → PATCH 更新专栏

### 3. 配置文件修改

修改 `config/pages/cms/topics.json`：
- 表格列调整为 6 列（topicName、ipPositioning、targetAudience、status、planTasks、completedTasks）
- status 字段添加 options 定义（颜色映射）
- 行操作：showDialog → navigate
- 移除 coreLabels 列

删除 `config/pages/cms/planDialog.json`（不再需要 Dialog 详情）

### 4. 数据修正

修正 `data/cms/topics.json`：
- `articeName` → `articleName`
- 为所有任务添加 `id` 和 `contentUrl` 字段
- 为第二个专栏添加 `detailItems` 数组

## 涉及文件

| 操作 | 文件 |
|---|---|
| 修改 | `config/pages/cms/topics.json` |
| 修改 | `data/cms/topics.json` |
| 修改 | `components/dynamic-page/page-builder.tsx`（新增 navigate action） |
| 新建 | `app/portal/cms/topics/[id]/page.tsx` |
| 新建 | `components/cms/topic-detail-client.tsx` |
| 删除 | `config/pages/cms/planDialog.json` |
