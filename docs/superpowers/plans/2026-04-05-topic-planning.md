# AI 内容规划功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在专栏列表页增加"规划"按钮，调用 GPT-5 生成内容规划文档和任务列表，预览确认后保存到专栏的 detailItems 中。

**Architecture:** 新建 `/api/llm/topic-planning` API 路由调用 Pinova 网关的 GPT 模型，返回结构化 JSON（规划文档 + 任务列表）。新建 `TopicPlanDialog` 客户端组件实现三阶段交互（配置→预览→保存）。在 PageBuilder 中新增 `showPlanDialog` action 触发该组件。

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Shadcn/UI, Tailwind CSS v4, react-markdown (新依赖)

---

## File Structure

| 操作 | 文件 | 职责 |
|---|---|---|
| 新建 | `app/api/llm/topic-planning/route.ts` | LLM API 路由，构建 prompt，调用 Pinova 网关 GPT 模型 |
| 新建 | `components/cms/topic-plan-dialog.tsx` | 三阶段 Dialog 组件（配置→预览→保存） |
| 修改 | `components/dynamic-page/page-builder.tsx` | 新增 showPlanDialog action + 状态 + 渲染 TopicPlanDialog |
| 修改 | `config/pages/cms/topics.json` | 行操作从 showDialog 改为 showPlanDialog |

---

### Task 1: 安装 react-markdown 依赖

**Files:** 无代码文件

- [ ] **Step 1: 安装 react-markdown**

```bash
pnpm add react-markdown
```

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-markdown dependency for plan preview rendering"
```

---

### Task 2: 创建 LLM API 路由

**Files:**
- Create: `app/api/llm/topic-planning/route.ts`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p app/api/llm/topic-planning
```

- [ ] **Step 2: 创建 route.ts**

创建 `app/api/llm/topic-planning/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `你是一位专业的内容策划专家。根据用户提供的专栏信息，生成一份详细的内容规划。

你必须以 JSON 格式回复，包含两个字段：
1. "planDocument": Markdown 格式的规划文档，包含每篇文章的主题、类型、摘要和发布时间安排
2. "tasks": 任务数组，每个任务包含 "articleName"（文章标题）和 "dueDate"（截止日期，YYYY-MM-DD 格式）`;

function buildUserPrompt(params: {
    topic: {
        topicName: string;
        topicDesc: string;
        ipPositioning: string;
        targetAudience: string;
        coreLabels: string;
        contentMatrix: string;
    };
    taskCount: number;
    timeRange: string;
    extraNotes: string;
}) {
    const { topic, taskCount, timeRange, extraNotes } = params;
    let prompt = `请为以下专栏生成内容规划：

【专栏名称】${topic.topicName}
【专栏描述】${topic.topicDesc}
【IP 定位】${topic.ipPositioning}
【目标客群】${topic.targetAudience}
【核心标签】${topic.coreLabels}
【内容矩阵】${topic.contentMatrix}

要求：
- 生成 ${taskCount} 篇文章的规划
- 时间范围：${timeRange}`;

    if (extraNotes) {
        prompt += `\n- 补充说明：${extraNotes}`;
    }

    return prompt;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { topic, taskCount, timeRange, extraNotes } = body;

        if (!topic?.topicName) {
            return NextResponse.json({ error: "缺少专栏信息" }, { status: 400 });
        }

        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl || !apiKey) {
            return NextResponse.json({ error: "服务端配置缺失：NEW_API_URL 或 NEW_API_KEY" }, { status: 500 });
        }

        const targetUrl = `${baseUrl}/v1/chat/completions`;

        const userPrompt = buildUserPrompt({
            topic,
            taskCount: taskCount || 8,
            timeRange: timeRange || '本月',
            extraNotes: extraNotes || '',
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const llmRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!llmRes.ok) {
            const errorData = await llmRes.json().catch(() => null);
            const errorMsg = errorData?.error?.message || errorData?.error || '调用 LLM 失败';
            return NextResponse.json({ error: errorMsg }, { status: llmRes.status });
        }

        const llmData = await llmRes.json();
        const content = llmData.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ error: "LLM 返回内容为空" }, { status: 500 });
        }

        const parsed = JSON.parse(content);

        if (!parsed.planDocument || !Array.isArray(parsed.tasks)) {
            return NextResponse.json({ error: "LLM 返回格式不符合预期" }, { status: 500 });
        }

        return NextResponse.json(parsed);
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: "LLM 调用超时，请重试" }, { status: 504 });
        }
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "LLM 返回了无效的 JSON 格式" }, { status: 500 });
        }
        console.error("Topic Planning Error:", error);
        return NextResponse.json({ error: "内部服务器错误" }, { status: 500 });
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/llm/topic-planning/route.ts
git commit -m "feat: add /api/llm/topic-planning route for GPT-powered content planning"
```

---

### Task 3: 创建 TopicPlanDialog 组件

**Files:**
- Create: `components/cms/topic-plan-dialog.tsx`

- [ ] **Step 1: 创建 topic-plan-dialog.tsx**

创建 `components/cms/topic-plan-dialog.tsx`：

```typescript
'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DetailItem {
    id: string;
    articleName: string;
    dueDate: string;
    status: string;
    contentUrl: string;
}

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
        detailItems?: DetailItem[];
        planTasks?: number;
        completedTasks?: number;
        [key: string]: any;
    };
    onSuccess: () => void;
}

type Phase = 'config' | 'loading' | 'preview' | 'saving';

const TASK_COUNT_OPTIONS = [4, 8, 12];

export function TopicPlanDialog({ open, onOpenChange, topic, onSuccess }: TopicPlanDialogProps) {
    // Config form state
    const [taskCount, setTaskCount] = useState(8);
    const [customCount, setCustomCount] = useState('');
    const [useCustomCount, setUseCustomCount] = useState(false);
    const [timeRange, setTimeRange] = useState('本月');
    const [extraNotes, setExtraNotes] = useState('');

    // Phase state
    const [phase, setPhase] = useState<Phase>('config');

    // Result state
    const [planDocument, setPlanDocument] = useState('');
    const [tasks, setTasks] = useState<{ articleName: string; dueDate: string }[]>([]);

    const effectiveTaskCount = useCustomCount ? (parseInt(customCount) || 8) : taskCount;

    const handleGenerate = async () => {
        setPhase('loading');

        try {
            const res = await fetch('/api/llm/topic-planning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: {
                        topicName: topic.topicName,
                        topicDesc: topic.topicDesc,
                        ipPositioning: topic.ipPositioning,
                        targetAudience: topic.targetAudience,
                        coreLabels: topic.coreLabels,
                        contentMatrix: topic.contentMatrix,
                    },
                    taskCount: effectiveTaskCount,
                    timeRange,
                    extraNotes,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: '请求失败' }));
                throw new Error(err.error || '生成规划失败');
            }

            const data = await res.json();
            setPlanDocument(data.planDocument);
            setTasks(data.tasks);
            setPhase('preview');
        } catch (error: any) {
            toast.error(error.message || '生成规划失败，请重试');
            setPhase('config');
        }
    };

    const handleRegenerate = () => {
        setPlanDocument('');
        setTasks([]);
        handleGenerate();
    };

    const handleSave = async () => {
        setPhase('saving');

        try {
            const existingItems: DetailItem[] = topic.detailItems || [];

            const newItems: DetailItem[] = tasks.map(t => ({
                id: crypto.randomUUID(),
                articleName: t.articleName,
                dueDate: t.dueDate,
                status: 'open',
                contentUrl: '',
            }));

            const mergedItems = [...existingItems, ...newItems];
            const planTasks = mergedItems.length;
            const completedTasks = mergedItems.filter(i => i.status === 'closed').length;

            const res = await fetch(`/api/rest/cms/topics/${topic.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...topic,
                    detailItems: mergedItems,
                    planTasks,
                    completedTasks,
                }),
            });

            if (!res.ok) throw new Error('保存失败');

            toast.success(`已生成 ${newItems.length} 个任务并保存到专栏`);
            onSuccess();
        } catch {
            toast.error('保存失败，请重试');
            setPhase('preview');
        }
    };

    const handleClose = (openState: boolean) => {
        if (!openState && phase !== 'loading' && phase !== 'saving') {
            // Reset state on close
            setPhase('config');
            setPlanDocument('');
            setTasks([]);
            setExtraNotes('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="p-0" style={{ maxWidth: '48rem' }}>
                <DialogHeader className="px-6 pt-6 pb-3 pr-12 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI 内容规划 — {topic.topicName}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 8rem)' }}>
                    {/* Phase: Config */}
                    {phase === 'config' && (
                        <div className="space-y-5">
                            {/* Task count */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">任务数量</label>
                                <div className="flex items-center gap-2">
                                    {TASK_COUNT_OPTIONS.map(n => (
                                        <Button
                                            key={n}
                                            variant={!useCustomCount && taskCount === n ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => { setTaskCount(n); setUseCustomCount(false); }}
                                        >
                                            {n} 篇
                                        </Button>
                                    ))}
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={30}
                                            placeholder="自定义"
                                            className={cn("w-24 h-8 text-sm", useCustomCount && "ring-2 ring-primary")}
                                            value={customCount}
                                            onChange={e => { setCustomCount(e.target.value); setUseCustomCount(true); }}
                                            onFocus={() => setUseCustomCount(true)}
                                        />
                                        <span className="text-sm text-muted-foreground">篇</span>
                                    </div>
                                </div>
                            </div>

                            {/* Time range */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">时间范围</label>
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="本周">本周</SelectItem>
                                        <SelectItem value="本月">本月</SelectItem>
                                        <SelectItem value="本季度">本季度</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Extra notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">补充说明 <span className="text-muted-foreground font-normal">(可选)</span></label>
                                <Textarea
                                    value={extraNotes}
                                    onChange={e => setExtraNotes(e.target.value)}
                                    placeholder="如：侧重 AI 工具评测、优先覆盖热点话题..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {/* Phase: Loading */}
                    {phase === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">AI 正在生成规划中...</p>
                            <p className="text-xs text-muted-foreground">预计需要 10-30 秒</p>
                        </div>
                    )}

                    {/* Phase: Preview */}
                    {phase === 'preview' && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{planDocument}</ReactMarkdown>
                        </div>
                    )}

                    {/* Phase: Saving */}
                    {phase === 'saving' && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">正在保存任务...</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    {phase === 'config' && (
                        <>
                            <Button variant="outline" onClick={() => handleClose(false)}>取消</Button>
                            <Button onClick={handleGenerate} className="gap-1">
                                <Sparkles className="h-4 w-4" />
                                开始规划
                            </Button>
                        </>
                    )}

                    {phase === 'preview' && (
                        <>
                            <Button variant="outline" onClick={handleRegenerate} className="gap-1">
                                <RotateCcw className="h-4 w-4" />
                                重新生成
                            </Button>
                            <Button onClick={handleSave} className="gap-1">
                                <Check className="h-4 w-4" />
                                确认并保存任务（{tasks.length} 个）
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cms/topic-plan-dialog.tsx
git commit -m "feat: add TopicPlanDialog component with 3-phase AI planning workflow"
```

---

### Task 4: PageBuilder 集成 showPlanDialog action

**Files:**
- Modify: `components/dynamic-page/page-builder.tsx`

- [ ] **Step 1: 添加 TopicPlanDialog import**

在 `page-builder.tsx` 顶部 import 区，在 `import { DynamicDialog } from './dynamic-dialog';` 之后添加：

```typescript
import { TopicPlanDialog } from '@/components/cms/topic-plan-dialog';
```

- [ ] **Step 2: 添加 planDialog 状态**

在 PageBuilder 函数体内，找到 `const [actionDialogConfig, setActionDialogConfig]` 那行之后，添加两个新状态：

```typescript
  // Plan Dialog State
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDialogData, setPlanDialogData] = useState<Record<string, any> | null>(null);
```

- [ ] **Step 3: 在 handleAction 中添加 showPlanDialog case**

在 `handleAction` 函数的 `switch (action)` 中，在 `case 'navigate':` 块之后、`case 'showDialog':` 块之前，添加：

```typescript
        case 'showPlanDialog': {
          setPlanDialogData(data);
          setPlanDialogOpen(true);
          break;
        }
```

同时在 `handleAction` 顶部的 instant actions 判断中，将 `'showPlanDialog'` 加入数组：

将这行：
```typescript
    if (['create', 'edit', 'showDialog'].includes(action)) {
```
改为：
```typescript
    if (['create', 'edit', 'showDialog', 'showPlanDialog'].includes(action)) {
```

- [ ] **Step 4: 在 JSX 末尾添加 TopicPlanDialog 渲染**

在 PageBuilder 返回的 JSX 中，找到最后一个 `</Dialog>` 标签（即 "Dialog for View/Detail" 的结束标签）之后、`</div>` 之前，添加：

```tsx
      {/* Dialog for Plan */}
      {planDialogOpen && planDialogData && (
        <TopicPlanDialog
          open={planDialogOpen}
          onOpenChange={setPlanDialogOpen}
          topic={planDialogData as any}
          onSuccess={() => {
            setPlanDialogOpen(false);
            if (config!.views.table.pagination?.mode === 'client') {
              loadFullData();
            } else {
              loadListData();
            }
          }}
        />
      )}
```

- [ ] **Step 5: Commit**

```bash
git add components/dynamic-page/page-builder.tsx
git commit -m "feat: integrate TopicPlanDialog into PageBuilder with showPlanDialog action"
```

---

### Task 5: 修改列表页配置

**Files:**
- Modify: `config/pages/cms/topics.json`

- [ ] **Step 1: 修改行操作配置**

在 `config/pages/cms/topics.json` 中，将"规划"行操作从：

```json
                    {
                        "action": "showDialog",
                        "title": "规划",
                        "dialogConfig": "cms/topicPlanDialog"
                    },
```

改为：

```json
                    {
                        "action": "showPlanDialog",
                        "title": "规划"
                    },
```

- [ ] **Step 2: Commit**

```bash
git add config/pages/cms/topics.json
git commit -m "refactor: change plan action from showDialog to showPlanDialog in topics config"
```

---

### Task 6: 验证构建与手动测试

**Files:** 无新文件

- [ ] **Step 1: 运行构建**

```bash
pnpm build
```

Expected: 构建成功，无 TypeScript 错误。

- [ ] **Step 2: 启动开发服务器手动验证**

```bash
pnpm dev
```

验证清单：
1. 访问 `/portal/cms/topics` → 列表中每行显示"规划"按钮
2. 点击"规划" → 弹出 Dialog，显示配置表单（任务数量、时间范围、补充说明）
3. 任务数量：点击 4/8/12 快捷按钮切换高亮，自定义输入框可用
4. 点击"开始规划" → 显示 loading 状态
5. 生成完成 → 显示 Markdown 规划文档预览
6. 点击"重新生成" → 重新调用 API 生成
7. 点击"确认并保存" → 保存成功 toast + Dialog 关闭 + 列表刷新
8. 进入专栏详情页 → 确认新任务已追加到列表

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete AI content planning feature - GPT-powered task generation with preview"
```
