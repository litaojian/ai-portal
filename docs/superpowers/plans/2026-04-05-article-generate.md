# AI Article Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-powered article generation to the CMS topic detail page — single and batch generation from draft tasks, with Markdown file storage and preview.

**Architecture:** A single API endpoint (`/api/llm/article-generate`) receives task + topic context, calls LLM via Pinova Gateway, saves the result as a Markdown file under `content/articles/{task-id}.md`, and updates the task's status/contentUrl via the existing REST API. A second endpoint (`/api/articles/[id]`) reads saved articles for preview. The topic detail page gets three new Dialogs: generate, batch generate, and preview.

**Tech Stack:** Next.js 16 API Routes, GPT-4.1 via Pinova Gateway (NEW_API_URL/NEW_API_KEY), react-markdown (already installed), Node.js fs for file I/O, existing Shadcn/UI components.

**Spec:** `docs/superpowers/specs/2026-04-05-article-generate-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `content/articles/.gitkeep` | Article storage directory |
| Create | `app/api/llm/article-generate/route.ts` | LLM article generation endpoint |
| Create | `app/api/articles/[id]/route.ts` | Read saved article content for preview |
| Create | `components/cms/article-generate-dialog.tsx` | Single article generation Dialog |
| Create | `components/cms/batch-generate-dialog.tsx` | Batch generation Dialog with progress |
| Create | `components/cms/article-preview-dialog.tsx` | Markdown article preview Dialog |
| Modify | `components/cms/topic-detail-client.tsx` | Add checkboxes, generate buttons, integrate Dialogs |

---

### Task 0: Install missing Shadcn/UI component

**Files:**
- Create: `components/ui/progress.tsx` (via shadcn CLI)

- [ ] **Step 1: Add the Progress component**

```bash
npx shadcn@latest add progress
```

This creates `components/ui/progress.tsx`. It's used by the BatchGenerateDialog for the progress bar.

- [ ] **Step 2: Commit**

```bash
git add components/ui/progress.tsx
git commit -m "chore: add shadcn progress component"
```

---

### Task 1: Create article storage directory and article read API

**Files:**
- Create: `content/articles/.gitkeep`
- Create: `app/api/articles/[id]/route.ts`

- [ ] **Step 1: Create the articles directory**

```bash
mkdir -p content/articles
touch content/articles/.gitkeep
```

- [ ] **Step 2: Create the article read API**

Create `app/api/articles/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Sanitize: only allow UUID-like IDs
    if (!/^[0-9a-fA-F-]+$/.test(id)) {
        return NextResponse.json({ error: "无效的文章 ID" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "content", "articles", `${id}.md`);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const wordCount = content.replace(/\s+/g, '').length;

    return NextResponse.json({ content, wordCount });
}
```

- [ ] **Step 3: Verify the API compiles**

Run: `npx tsc --noEmit app/api/articles/[id]/route.ts` or just `pnpm build` at the end of the task.

- [ ] **Step 4: Commit**

```bash
git add content/articles/.gitkeep app/api/articles/
git commit -m "feat: add article storage directory and read API"
```

---

### Task 2: Create the article generation API endpoint

**Files:**
- Create: `app/api/llm/article-generate/route.ts`

- [ ] **Step 1: Create the article-generate route**

Create `app/api/llm/article-generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const PLATFORM_SPECS: Record<string, {
    minWords: number;
    maxWords: number;
    tone: string;
    description: string;
}> = {
    zhihu: { minWords: 800, maxWords: 1500, tone: "专业但接地气", description: "知乎专栏文章" },
    wechat_mp: { minWords: 2000, maxWords: 3000, tone: "专业深度", description: "公众号长文" },
    xiaohongshu: { minWords: 300, maxWords: 500, tone: "轻松实用", description: "小红书笔记" },
    generic: { minWords: 800, maxWords: 2000, tone: "专业", description: "通用文章" },
};

function buildSystemPrompt(topic: {
    topicName: string;
    ipPositioning: string;
    targetAudience: string;
    coreLabels: string;
    contentMatrix: string;
}, platform: string) {
    const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.generic;
    return `你是一位资深技术自媒体作者，专注于 B2B 和 AI 领域。你正在为以下专栏撰写文章：

【专栏名称】${topic.topicName}
【IP 定位】${topic.ipPositioning}
【目标客群】${topic.targetAudience}
【核心标签】${topic.coreLabels}
【内容矩阵】${topic.contentMatrix}

写作要求：
- 目标平台：${spec.description}
- 篇幅：${spec.minWords}-${spec.maxWords} 字
- 语气：${spec.tone}，避免学术化堆砌
- 输出格式：标准 Markdown，包含一级标题、二级小标题、正文段落
- 每个小节 200-300 字，逻辑清晰，有实际案例或数据支撑
- 开头要有吸引力（提出问题或引出痛点），结尾有行动号召或思考引导
- 禁止使用 AI 味过重的套话（如"在当今数字化时代"、"综上所述"等）
- 禁止虚构数据或引用不存在的来源`;
}

function buildUserPrompt(articleName: string, extraNotes?: string) {
    let prompt = `请根据以下主题撰写一篇文章：\n\n【文章主题】${articleName}`;
    if (extraNotes) {
        prompt += `\n\n补充说明：${extraNotes}`;
    }
    return prompt;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { task, topic, config } = body;

        if (!task?.id || !task?.articleName) {
            return NextResponse.json({ error: "缺少任务信息" }, { status: 400 });
        }
        if (!topic?.topicName) {
            return NextResponse.json({ error: "缺少专栏信息" }, { status: 400 });
        }

        // Sanitize task ID
        if (!/^[0-9a-fA-F-]+$/.test(task.id)) {
            return NextResponse.json({ error: "无效的任务 ID" }, { status: 400 });
        }

        const platform = config?.platform || 'zhihu';
        const model = config?.model || 'gpt-4.1';
        const extraNotes = config?.extraNotes || '';

        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl || !apiKey) {
            return NextResponse.json({ error: "服务端配置缺失：NEW_API_URL 或 NEW_API_KEY" }, { status: 500 });
        }

        const targetUrl = `${baseUrl}/v1/chat/completions`;
        const systemPrompt = buildSystemPrompt(topic, platform);
        const userPrompt = buildUserPrompt(task.articleName, extraNotes);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);

        const llmRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
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

        // Save to file
        const articlesDir = path.join(process.cwd(), "content", "articles");
        if (!fs.existsSync(articlesDir)) {
            fs.mkdirSync(articlesDir, { recursive: true });
        }
        const filePath = path.join(articlesDir, `${task.id}.md`);
        fs.writeFileSync(filePath, content, "utf-8");

        const wordCount = content.replace(/\s+/g, '').length;
        const summary = content.replace(/^#.*\n+/, '').replace(/\s+/g, ' ').trim().slice(0, 200);

        return NextResponse.json({
            success: true,
            articlePath: `content/articles/${task.id}.md`,
            title: task.articleName,
            wordCount,
            summary,
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: "LLM 调用超时（120秒），请重试" }, { status: 504 });
        }
        console.error("Article Generate Error:", error);
        return NextResponse.json({ error: "内部服务器错误" }, { status: 500 });
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/llm/article-generate/
git commit -m "feat: add AI article generation API endpoint"
```

---

### Task 3: Create ArticleGenerateDialog (single article)

**Files:**
- Create: `components/cms/article-generate-dialog.tsx`

- [ ] **Step 1: Create the dialog component**

Create `components/cms/article-generate-dialog.tsx`:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ArticleGenerateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: { id: string; articleName: string } | null;
    topic: {
        id: string;
        topicName: string;
        ipPositioning: string;
        targetAudience: string;
        coreLabels: string;
        contentMatrix: string;
    };
    onSuccess: (taskId: string, articlePath: string) => void;
}

export function ArticleGenerateDialog({ open, onOpenChange, task, topic, onSuccess }: ArticleGenerateDialogProps) {
    const [platform, setPlatform] = useState('zhihu');
    const [model, setModel] = useState('');
    const [modelOptions, setModelOptions] = useState<{ label: string; value: string }[]>([]);
    const [extraNotes, setExtraNotes] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetch('/api/data/valuelist/llm_models_cms')
            .then(res => res.json())
            .then((data: { label: string; value: string }[]) => {
                setModelOptions(data);
                if (data.length > 0 && !model) setModel(data[0].value);
            })
            .catch(() => {});
    }, []);

    const handleGenerate = async () => {
        if (!task) return;
        setGenerating(true);

        try {
            const res = await fetch('/api/llm/article-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task: { id: task.id, articleName: task.articleName },
                    topic: {
                        topicName: topic.topicName,
                        ipPositioning: topic.ipPositioning,
                        targetAudience: topic.targetAudience,
                        coreLabels: topic.coreLabels,
                        contentMatrix: topic.contentMatrix,
                    },
                    config: { platform, model, extraNotes: extraNotes || undefined },
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: '请求失败' }));
                throw new Error(err.error || '生成失败');
            }

            const data = await res.json();
            toast.success(`文章已生成（${data.wordCount} 字）`);
            onSuccess(task.id, data.articlePath);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || '生成失败，请重试');
        } finally {
            setGenerating(false);
        }
    };

    const handleClose = (openState: boolean) => {
        if (!openState && !generating) {
            setExtraNotes('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        生成文章
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">文章主题</label>
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                            {task?.articleName}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">目标平台</label>
                        <Select value={platform} onValueChange={setPlatform}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="zhihu">知乎</SelectItem>
                                <SelectItem value="wechat_mp">公众号</SelectItem>
                                <SelectItem value="xiaohongshu">小红书</SelectItem>
                                <SelectItem value="generic">通用</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">AI 模型</label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger><SelectValue placeholder="选择模型" /></SelectTrigger>
                            <SelectContent>
                                {modelOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">补充说明 <span className="text-muted-foreground font-normal">(可选)</span></label>
                        <Textarea
                            value={extraNotes}
                            onChange={e => setExtraNotes(e.target.value)}
                            placeholder="如：侧重实操案例、增加数据对比..."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={generating}>取消</Button>
                    <Button onClick={handleGenerate} disabled={generating} className="gap-1">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {generating ? '生成中...' : '开始生成'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cms/article-generate-dialog.tsx
git commit -m "feat: add single article generation dialog"
```

---

### Task 4: Create BatchGenerateDialog

**Files:**
- Create: `components/cms/batch-generate-dialog.tsx`

- [ ] **Step 1: Create the batch generate dialog**

Create `components/cms/batch-generate-dialog.tsx`:

```tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TaskItem {
    id: string;
    articleName: string;
}

interface TopicContext {
    id: string;
    topicName: string;
    ipPositioning: string;
    targetAudience: string;
    coreLabels: string;
    contentMatrix: string;
}

interface BatchResult {
    taskId: string;
    articleName: string;
    success: boolean;
    articlePath?: string;
    error?: string;
}

interface BatchGenerateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tasks: TaskItem[];
    topic: TopicContext;
    onTaskComplete: (taskId: string, articlePath: string) => void;
    onAllComplete: () => void;
}

export function BatchGenerateDialog({ open, onOpenChange, tasks, topic, onTaskComplete, onAllComplete }: BatchGenerateDialogProps) {
    const [platform, setPlatform] = useState('zhihu');
    const [model, setModel] = useState('');
    const [modelOptions, setModelOptions] = useState<{ label: string; value: string }[]>([]);
    const [phase, setPhase] = useState<'config' | 'running' | 'done'>('config');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<BatchResult[]>([]);
    const abortRef = useRef(false);

    useEffect(() => {
        fetch('/api/data/valuelist/llm_models_cms')
            .then(res => res.json())
            .then((data: { label: string; value: string }[]) => {
                setModelOptions(data);
                if (data.length > 0 && !model) setModel(data[0].value);
            })
            .catch(() => {});
    }, []);

    const handleStart = async () => {
        setPhase('running');
        setCurrentIndex(0);
        setResults([]);
        abortRef.current = false;

        const batchResults: BatchResult[] = [];

        for (let i = 0; i < tasks.length; i++) {
            if (abortRef.current) break;
            setCurrentIndex(i);
            const task = tasks[i];

            try {
                const res = await fetch('/api/llm/article-generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task: { id: task.id, articleName: task.articleName },
                        topic: {
                            topicName: topic.topicName,
                            ipPositioning: topic.ipPositioning,
                            targetAudience: topic.targetAudience,
                            coreLabels: topic.coreLabels,
                            contentMatrix: topic.contentMatrix,
                        },
                        config: { platform, model },
                    }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: '请求失败' }));
                    throw new Error(err.error || '生成失败');
                }

                const data = await res.json();
                batchResults.push({ taskId: task.id, articleName: task.articleName, success: true, articlePath: data.articlePath });
                setResults([...batchResults]);
                onTaskComplete(task.id, data.articlePath);
            } catch (error: any) {
                batchResults.push({ taskId: task.id, articleName: task.articleName, success: false, error: error.message });
                setResults([...batchResults]);
            }
        }

        setPhase('done');
        const successCount = batchResults.filter(r => r.success).length;
        const failCount = batchResults.filter(r => !r.success).length;
        toast.success(`批量生成完成：成功 ${successCount} 篇${failCount > 0 ? `，失败 ${failCount} 篇` : ''}`);
        onAllComplete();
    };

    const handleClose = (openState: boolean) => {
        if (!openState && phase !== 'running') {
            setPhase('config');
            setResults([]);
            setCurrentIndex(0);
            onOpenChange(false);
        }
    };

    const handleAbort = () => {
        abortRef.current = true;
    };

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const progress = tasks.length > 0 ? (results.length / tasks.length) * 100 : 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        批量生成文章（{tasks.length} 篇）
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {phase === 'config' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">目标平台</label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="zhihu">知乎</SelectItem>
                                        <SelectItem value="wechat_mp">公众号</SelectItem>
                                        <SelectItem value="xiaohongshu">小红书</SelectItem>
                                        <SelectItem value="generic">通用</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">AI 模型</label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger><SelectValue placeholder="选择模型" /></SelectTrigger>
                                    <SelectContent>
                                        {modelOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="rounded-md border p-3 space-y-1 max-h-40 overflow-y-auto">
                                <div className="text-xs font-medium text-muted-foreground mb-2">待生成任务：</div>
                                {tasks.map((t, i) => (
                                    <div key={t.id} className="text-sm">{i + 1}. {t.articleName}</div>
                                ))}
                            </div>
                        </>
                    )}

                    {(phase === 'running' || phase === 'done') && (
                        <>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>进度：{results.length} / {tasks.length}</span>
                                    <span className="text-muted-foreground">
                                        成功 {successCount}{failCount > 0 && ` · 失败 ${failCount}`}
                                    </span>
                                </div>
                                <Progress value={progress} />
                                {phase === 'running' && currentIndex < tasks.length && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        正在生成：{tasks[currentIndex].articleName}
                                    </div>
                                )}
                            </div>
                            <div className="rounded-md border p-3 space-y-1.5 max-h-48 overflow-y-auto">
                                {results.map(r => (
                                    <div key={r.taskId} className="flex items-center gap-2 text-sm">
                                        {r.success
                                            ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                            : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                                        <span className={r.success ? '' : 'text-destructive'}>{r.articleName}</span>
                                        {r.error && <span className="text-xs text-destructive ml-auto">({r.error})</span>}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    {phase === 'config' && (
                        <>
                            <Button variant="outline" onClick={() => handleClose(false)}>取消</Button>
                            <Button onClick={handleStart} className="gap-1">
                                <Sparkles className="h-4 w-4" />
                                开始批量生成
                            </Button>
                        </>
                    )}
                    {phase === 'running' && (
                        <Button variant="outline" onClick={handleAbort}>停止</Button>
                    )}
                    {phase === 'done' && (
                        <Button onClick={() => handleClose(false)}>关闭</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cms/batch-generate-dialog.tsx
git commit -m "feat: add batch article generation dialog with progress"
```

---

### Task 5: Create ArticlePreviewDialog

**Files:**
- Create: `components/cms/article-preview-dialog.tsx`

- [ ] **Step 1: Create the preview dialog**

Create `components/cms/article-preview-dialog.tsx`:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, RotateCcw } from 'lucide-react';

interface ArticlePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string | null;
    articleName: string;
    onRegenerate: () => void;
}

export function ArticlePreviewDialog({ open, onOpenChange, taskId, articleName, onRegenerate }: ArticlePreviewDialogProps) {
    const [content, setContent] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && taskId) {
            setLoading(true);
            fetch(`/api/articles/${taskId}`)
                .then(res => {
                    if (!res.ok) throw new Error('加载失败');
                    return res.json();
                })
                .then(data => {
                    setContent(data.content);
                    setWordCount(data.wordCount);
                })
                .catch(() => {
                    setContent('文章加载失败');
                })
                .finally(() => setLoading(false));
        }
    }, [open, taskId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0" style={{ maxWidth: '48rem' }}>
                <DialogHeader className="px-6 pt-6 pb-3 border-b">
                    <DialogTitle className="text-base">
                        {articleName}
                        {wordCount > 0 && <span className="text-xs text-muted-foreground font-normal ml-2">({wordCount} 字)</span>}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 8rem)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}
                </div>
                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onRegenerate} className="gap-1">
                        <RotateCcw className="h-4 w-4" />
                        重新生成
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>关闭</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cms/article-preview-dialog.tsx
git commit -m "feat: add article preview dialog with markdown rendering"
```

---

### Task 6: Integrate all dialogs into topic-detail-client.tsx

**Files:**
- Modify: `components/cms/topic-detail-client.tsx`

This is the main integration task. We modify the existing topic detail page to add:
1. Checkbox column for batch selection (draft tasks only)
2. "生成" button per draft task row
3. "批量生成" button in toolbar
4. Preview link for generated articles
5. Import and wire up all three dialogs

- [ ] **Step 1: Add imports for the three new dialogs**

At the top of `components/cms/topic-detail-client.tsx`, after the existing imports (line 31), add:

```typescript
import { Sparkles } from 'lucide-react';
import { ArticleGenerateDialog } from '@/components/cms/article-generate-dialog';
import { BatchGenerateDialog } from '@/components/cms/batch-generate-dialog';
import { ArticlePreviewDialog } from '@/components/cms/article-preview-dialog';
import { Checkbox } from '@/components/ui/checkbox';
```

- [ ] **Step 2: Add new state variables**

Inside the `TopicDetailClient` component, after the existing state declarations (after line 80), add:

```typescript
// Article generation state
const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
const [generateTask, setGenerateTask] = useState<{ id: string; articleName: string } | null>(null);
const [batchDialogOpen, setBatchDialogOpen] = useState(false);
const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
const [previewArticleName, setPreviewArticleName] = useState('');
```

- [ ] **Step 3: Add handler functions**

After the existing `handleDeleteTask` function (after line 198), add:

```typescript
// --- Article generation handlers ---
const draftTasks = topic?.detailItems.filter(i => i.status === 'draft') || [];

const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
    });
};

const toggleAllDrafts = () => {
    if (selectedTaskIds.size === draftTasks.length) {
        setSelectedTaskIds(new Set());
    } else {
        setSelectedTaskIds(new Set(draftTasks.map(t => t.id)));
    }
};

const openGenerateDialog = (task: DetailItem) => {
    setGenerateTask({ id: task.id, articleName: task.articleName });
    setGenerateDialogOpen(true);
};

const openPreviewDialog = (task: DetailItem) => {
    setPreviewTaskId(task.id);
    setPreviewArticleName(task.articleName);
    setPreviewDialogOpen(true);
};

const handleGenerateSuccess = async (taskId: string, articlePath: string) => {
    if (!topic) return;
    const updatedItems = topic.detailItems.map(item =>
        item.id === taskId
            ? { ...item, status: 'reviewed', contentUrl: articlePath }
            : item
    );
    await saveTopic(updatedItems);
};

const handleBatchTaskComplete = async (taskId: string, articlePath: string) => {
    if (!topic) return;
    const updatedItems = topic.detailItems.map(item =>
        item.id === taskId
            ? { ...item, status: 'reviewed', contentUrl: articlePath }
            : item
    );
    await saveTopic(updatedItems);
};

const handleBatchAllComplete = () => {
    setSelectedTaskIds(new Set());
    fetchTopic();
};

const selectedBatchTasks = topic?.detailItems
    .filter(i => selectedTaskIds.has(i.id))
    .map(i => ({ id: i.id, articleName: i.articleName })) || [];
```

- [ ] **Step 4: Update the toolbar to add batch generate button**

Replace the existing toolbar div (the `<div className="flex items-center justify-between px-6 py-3 border-b">` block around lines 249-255) with:

```tsx
<div className="flex items-center justify-between px-6 py-3 border-b">
    <div className="flex items-center gap-3">
        <div className="font-medium">计划任务列表</div>
        {selectedTaskIds.size > 0 && (
            <span className="text-xs text-muted-foreground">
                已选 {selectedTaskIds.size} 项
            </span>
        )}
    </div>
    <div className="flex items-center gap-2">
        {selectedTaskIds.size > 0 && (
            <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => setBatchDialogOpen(true)}
            >
                <Sparkles className="h-3.5 w-3.5" />
                批量生成（{selectedTaskIds.size}）
            </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={openCreateDialog}>
            <Plus className="h-3.5 w-3.5" />
            新任务
        </Button>
    </div>
</div>
```

- [ ] **Step 5: Update the table header to add checkbox column**

Replace the existing `<TableHeader>` block (around lines 259-266) with:

```tsx
<TableHeader className="bg-muted/50">
    <TableRow>
        <TableHead className="w-[40px] text-center">
            {draftTasks.length > 0 && (
                <Checkbox
                    checked={selectedTaskIds.size === draftTasks.length && draftTasks.length > 0}
                    onCheckedChange={toggleAllDrafts}
                />
            )}
        </TableHead>
        <TableHead className="w-[50px] text-center">序号</TableHead>
        <TableHead className="w-[200px]">任务名称</TableHead>
        <TableHead className="w-[120px]">截止日期</TableHead>
        <TableHead className="w-[100px]">状态</TableHead>
        <TableHead className="w-[100px]">内容链接</TableHead>
        <TableHead className="w-[120px] text-right">操作</TableHead>
    </TableRow>
</TableHeader>
```

- [ ] **Step 6: Update table rows — add checkbox, generate button, preview link**

Replace the existing table row rendering (the `topic.detailItems.map(...)` block, around lines 270-316) with:

```tsx
{topic.detailItems.length > 0 ? (
    topic.detailItems.map((item, index) => (
        <TableRow key={item.id}>
            <TableCell className="text-center">
                {item.status === 'draft' && (
                    <Checkbox
                        checked={selectedTaskIds.has(item.id)}
                        onCheckedChange={() => toggleTaskSelection(item.id)}
                    />
                )}
            </TableCell>
            <TableCell className="text-center text-xs">{index + 1}</TableCell>
            <TableCell className="text-sm">{item.articleName}</TableCell>
            <TableCell className="text-sm">{item.dueDate}</TableCell>
            <TableCell>
                <Badge variant={STATUS_CONFIG[item.status]?.variant ?? 'outline'}>
                    {STATUS_CONFIG[item.status]?.label ?? item.status}
                </Badge>
            </TableCell>
            <TableCell>
                {item.contentUrl ? (
                    <button
                        onClick={() => openPreviewDialog(item)}
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm cursor-pointer"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        预览
                    </button>
                ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                )}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    {item.status === 'draft' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title="生成文章"
                            onClick={() => openGenerateDialog(item)}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => openEditDialog(item)}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteTask(item.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    ))
) : (
    <TableRow>
        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
            暂无任务，点击"新任务"添加
        </TableCell>
    </TableRow>
)}
```

Note: `colSpan` changed from 6 to 7 because we added the checkbox column.

- [ ] **Step 7: Add the three dialog components at the end of the JSX**

Before the closing `</div>` of the root element (just after the existing Task Create/Edit Dialog closing `</Dialog>`, around line 381), add:

```tsx
{/* Article Generate Dialog */}
{topic && (
    <ArticleGenerateDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        task={generateTask}
        topic={topic}
        onSuccess={handleGenerateSuccess}
    />
)}

{/* Batch Generate Dialog */}
{topic && (
    <BatchGenerateDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        tasks={selectedBatchTasks}
        topic={topic}
        onTaskComplete={handleBatchTaskComplete}
        onAllComplete={handleBatchAllComplete}
    />
)}

{/* Article Preview Dialog */}
<ArticlePreviewDialog
    open={previewDialogOpen}
    onOpenChange={setPreviewDialogOpen}
    taskId={previewTaskId}
    articleName={previewArticleName}
    onRegenerate={() => {
        setPreviewDialogOpen(false);
        if (previewTaskId) {
            const task = topic?.detailItems.find(i => i.id === previewTaskId);
            if (task) openGenerateDialog(task);
        }
    }}
/>
```

- [ ] **Step 8: Build verification**

Run: `pnpm build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add components/cms/topic-detail-client.tsx
git commit -m "feat: integrate article generation, batch generation, and preview into topic detail page"
```

---

### Task 7: Build verification and manual testing

- [ ] **Step 1: Run full build**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Manual testing checklist**

Start the dev server (`pnpm dev`) and verify:

1. Navigate to a topic detail page (e.g., `/portal/cms/topics/a1b2c3d4-e5f6-7890-abcd-ef1234567801`)
2. Verify the checkbox column appears for draft tasks
3. Click the ✨ (Sparkles) button on a draft task → ArticleGenerateDialog opens with correct title
4. Select platform and model, click "开始生成" → wait for LLM response → task status updates to "已审核"
5. Verify `content/articles/{task-id}.md` file was created
6. Click "预览" link on the generated task → ArticlePreviewDialog shows rendered Markdown
7. Select multiple draft tasks via checkboxes → "批量生成" button appears in toolbar
8. Click "批量生成" → BatchGenerateDialog shows progress → tasks update one by one
9. Click "重新生成" in preview dialog → opens generate dialog for that task

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
