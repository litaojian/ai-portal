# AI 内容规划功能设计

## 概述

在专栏列表页增加"规划"按钮，调用 GPT-5 模型为专栏自动生成内容规划文档和任务列表。用户可配置任务数量、时间范围和补充说明，预览生成结果后确认保存到专栏的 detailItems 中。

## 交互流程

点击行"规划"按钮 → 弹出 Dialog → 三阶段交互：

1. **配置阶段**：设置参数（任务数量、时间范围、补充说明）
2. **预览阶段**：调用 GPT-5 生成规划文档，Markdown 渲染预览，可重新生成
3. **保存阶段**：确认后将任务追加到专栏 detailItems，自动更新 planTasks/completedTasks

## API 设计

### POST /api/llm/topic-planning

**请求体**：

```json
{
  "topic": {
    "topicName": "技术型AI营销自动化顾问",
    "topicDesc": "帮B2B企业用AI+自动化打通内容、线索和转化流程",
    "ipPositioning": "极客风、中立冷静、前瞻性的行业观察者",
    "targetAudience": "中小企业、科技服务、咨询培训公司",
    "coreLabels": "AI, 大模型, 效率工具, 行业深度",
    "contentMatrix": "60% 深度技术分析, 30% 应用测评, 10% 行业简评"
  },
  "taskCount": 8,
  "timeRange": "本月",
  "extraNotes": "侧重 AI 工具评测"
}
```

**Prompt 构建策略**：

- System prompt 定义角色为"内容策划专家"，要求输出 JSON 格式
- User prompt 将专栏信息、任务数量、时间范围、额外补充拼装为结构化指令
- 使用 `response_format: { type: "json_object" }` 确保 JSON 输出

System prompt:

```
你是一位专业的内容策划专家。根据用户提供的专栏信息，生成一份详细的内容规划。

你必须以 JSON 格式回复，包含两个字段：
1. "planDocument": Markdown 格式的规划文档，包含每篇文章的主题、类型、摘要和发布时间安排
2. "tasks": 任务数组，每个任务包含 "articleName"（文章标题）和 "dueDate"（截止日期，YYYY-MM-DD 格式）
```

User prompt 模板:

```
请为以下专栏生成内容规划：

【专栏名称】{topicName}
【专栏描述】{topicDesc}
【IP 定位】{ipPositioning}
【目标客群】{targetAudience}
【核心标签】{coreLabels}
【内容矩阵】{contentMatrix}

要求：
- 生成 {taskCount} 篇文章的规划
- 时间范围：{timeRange}
- 补充说明：{extraNotes}
```

**调用方式**：

通过 Pinova 网关 `NEW_API_URL/v1/chat/completions`，Bearer token 认证（`NEW_API_KEY`），model 指定 `gpt-4.1`（GPT-5 系列可用模型名）。

**响应格式**（透传 GPT 返回的结构化 JSON）：

```json
{
  "planDocument": "## 内容规划\n\n### 第一周（4/7 - 4/11）\n1. **AI Agent 工具横评：AutoGPT vs CrewAI**\n   - 类型：深度技术分析\n   - 发布日期：4/10\n...",
  "tasks": [
    { "articleName": "AI Agent 工具横评：AutoGPT vs CrewAI", "dueDate": "2026-04-10" },
    { "articleName": "企业级 RAG 方案选型指南", "dueDate": "2026-04-14" }
  ]
}
```

**错误处理**：

- LLM 返回非 JSON → 解析错误，返回 500 + 错误消息
- LLM 调用超时（30s） → 返回 504
- API Key 无效 → 返回 401

## Dialog 组件设计

### TopicPlanDialog

三阶段 Dialog，`max-w-3xl` 宽度。

**Props**：

```typescript
interface TopicPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: {
    id: string;
    topicName: string;
    topicDesc: string;
    ipPositioning: string;
    targetAudience: string;
    coreLabels: string;
    contentMatrix: string;
    detailItems: DetailItem[];
    planTasks: number;
    completedTasks: number;
  };
  onSuccess: () => void;
}
```

**阶段一：配置表单**

| 字段 | 类型 | 说明 |
|---|---|---|
| taskCount | 快捷按钮组 4/8/12 + 自定义 number input | 默认 8 |
| timeRange | Select 下拉 | 选项：本周/本月/本季度，默认"本月" |
| extraNotes | Textarea | 可选，placeholder "如：侧重 AI 工具评测" |

底部按钮：[取消] [开始规划]

**阶段二：生成预览**

- 点击"开始规划"后显示 loading 状态（Skeleton + "AI 正在生成规划中..."）
- 完成后渲染 `planDocument` 为 Markdown（使用 `react-markdown` 或项目中已有的 Markdown 渲染方案）
- 预览区域 `max-h-[60vh] overflow-y-auto`

底部按钮：[重新生成] [确认并保存任务]

**阶段三：保存**

点击"确认并保存"后：
1. 将 `tasks` 数组转换为 DetailItem 格式，每条追加 `id: crypto.randomUUID()`、`status: "open"`、`contentUrl: ""`
2. 与现有 `detailItems` 合并（追加到末尾）
3. 重新计算 `planTasks` 和 `completedTasks`
4. PUT `/api/rest/cms/topics/{id}` 更新专栏
5. toast 提示"已生成 N 个任务并保存到专栏"
6. 调用 `onSuccess()` 刷新列表，关闭 Dialog

## PageBuilder 集成

### 新增 showPlanDialog action

在 PageBuilder 中新增状态和处理：

```typescript
// 状态
const [planDialogOpen, setPlanDialogOpen] = useState(false);
const [planDialogData, setPlanDialogData] = useState<Record<string, any> | null>(null);

// handleAction switch 新增
case 'showPlanDialog': {
  setPlanDialogData(data);
  setPlanDialogOpen(true);
  break;
}
```

在 JSX 中条件渲染 TopicPlanDialog：

```tsx
{planDialogOpen && planDialogData && (
  <TopicPlanDialog
    open={planDialogOpen}
    onOpenChange={setPlanDialogOpen}
    topic={planDialogData}
    onSuccess={() => { setPlanDialogOpen(false); loadListData(); }}
  />
)}
```

### 配置文件修改

`config/pages/cms/topics.json` 行操作调整：

```json
{
  "action": "showPlanDialog",
  "title": "规划"
}
```

替换原有的 `showDialog` + `dialogConfig` 配置。

## 涉及文件

| 操作 | 文件 | 职责 |
|---|---|---|
| 新建 | `app/api/llm/topic-planning/route.ts` | LLM API 路由，构建 prompt 调用 GPT-5 |
| 新建 | `components/cms/topic-plan-dialog.tsx` | 三阶段 Dialog 组件 |
| 修改 | `components/dynamic-page/page-builder.tsx` | 新增 showPlanDialog action + 状态 + 渲染 |
| 修改 | `config/pages/cms/topics.json` | 行操作改为 showPlanDialog |
