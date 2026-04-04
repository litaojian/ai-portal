# CMS 专栏管理页面重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 CMS 专栏管理页面，首页显示专栏列表（6列），点击详情跳转独立页面展示专栏信息和计划任务列表（支持 CRUD）。

**Architecture:** 列表页复用现有动态页面配置系统（config/pages/cms/topics.json + PageBuilder）。详情页新建独立路由（app/portal/cms/topics/[id]/page.tsx）+ 自定义 Client Component（components/cms/topic-detail-client.tsx）。任务 CRUD 通过修改专栏的 detailItems 数组并 PATCH 更新实现。

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Shadcn/UI, TanStack Table, Tailwind CSS v4

---

## File Structure

| 操作 | 文件 | 职责 |
|---|---|---|
| 修改 | `data/cms/topics.json` | 修正数据：articeName→articleName，补充 id/contentUrl/detailItems |
| 修改 | `config/pages/cms/topics.json` | 列表页配置：6列 + navigate action |
| 修改 | `components/dynamic-page/page-builder.tsx` | 新增 navigate action 处理 |
| 新建 | `app/portal/cms/topics/[id]/page.tsx` | 详情页 Server Component（布局、session、面包屑） |
| 新建 | `components/cms/topic-detail-client.tsx` | 详情页 Client Component（专栏信息 + 任务 CRUD） |
| 删除 | `config/pages/cms/planDialog.json` | 不再需要的旧 Dialog 配置 |

---

### Task 1: 修正数据文件

**Files:**
- Modify: `data/cms/topics.json`

- [ ] **Step 1: 更新 topics.json 数据**

将 `data/cms/topics.json` 替换为以下内容：

```json
[
    {
        "id": "t1",
        "topicName": "AI 探索家",
        "topicDesc": "一个专注于深度分析 AI 技术演进与真实应用的专栏",
        "ipPositioning": "极客风、中立冷静、前瞻性的行业观察者",
        "targetAudience": "科技爱好者, AI 开发者, 企业技术决策者",
        "coreLabels": "AI, 大模型, 效率工具, 行业深度",
        "contentMatrix": "60% 深度技术分析, 30% 应用测评, 10% 行业简评",
        "status": "open",
        "planTasks": 2,
        "completedTasks": 2,
        "detailItems": [
            {
                "id": "d1-1",
                "articleName": "文章1",
                "dueDate": "2026-04-03",
                "status": "closed",
                "contentUrl": ""
            },
            {
                "id": "d1-2",
                "articleName": "文章2",
                "dueDate": "2026-04-03",
                "status": "closed",
                "contentUrl": ""
            }
        ]
    },
    {
        "id": "t2",
        "topicName": "职场效率手册",
        "topicDesc": "利用 AI 构建下一代办公流程，告别由于低效带来的焦虑",
        "ipPositioning": "亲和力十足、实战驱动的效率教练",
        "targetAudience": "白领, 自由职业者, 管理层",
        "coreLabels": "效率, 自动化, 职场成长, AI 实践",
        "contentMatrix": "50% 教程实操, 30% 案例分享, 20% 工具推荐",
        "status": "open",
        "planTasks": 0,
        "completedTasks": 0,
        "detailItems": []
    }
]
```

关键变更：
- `articeName` → `articleName`（修正拼写）
- 为每条任务添加 `id` 和 `contentUrl` 字段
- `planTasks`/`completedTasks` 与 `detailItems` 实际数量对齐
- 第二个专栏补充空 `detailItems` 数组

- [ ] **Step 2: Commit**

```bash
git add data/cms/topics.json
git commit -m "fix: correct topics.json data structure - rename articeName, add id/contentUrl fields"
```

---

### Task 2: 修改专栏列表页配置

**Files:**
- Modify: `config/pages/cms/topics.json`
- Delete: `config/pages/cms/planDialog.json`

- [ ] **Step 1: 更新 topics.json 页面配置**

将 `config/pages/cms/topics.json` 替换为：

```json
{
    "$schema": "https://ai-portal.com/schemas/page-config.json",
    "meta": {
        "key": "cms/topics",
        "title": "新开专栏",
        "description": "专栏管理与配置中心",
        "icon": "Shield",
        "api": "/api/rest/cms/topics",
        "defaultView": "list"
    },
    "model": {
        "fields": {
            "id": { "label": "ID", "type": "text", "hidden": true, "primaryKey": true },
            "topicName": { "label": "专栏名称", "type": "text", "validation": { "required": true } },
            "ipPositioning": { "label": "定位", "type": "textarea", "validation": { "required": true } },
            "targetAudience": { "label": "目标客群", "type": "textarea", "validation": { "required": true } },
            "coreLabels": { "label": "核心标签", "type": "text" },
            "contentMatrix": { "label": "内容矩阵", "type": "textarea" },
            "remark": { "label": "备注", "type": "textarea" },
            "planTasks": { "label": "计划任务数", "type": "number" },
            "completedTasks": { "label": "已完成", "type": "number" },
            "status": {
                "label": "状态",
                "type": "select",
                "options": [
                    { "label": "进行中", "value": "open", "color": "green" },
                    { "label": "草稿", "value": "draft", "color": "gray" },
                    { "label": "已关闭", "value": "closed", "color": "red" }
                ]
            }
        }
    },
    "views": {
        "search": {
            "fields": [
                { "key": "topicName", "placeholder": "专栏名称" }
            ]
        },
        "table": {
            "size": "small",
            "rownum": true,
            "columns": [
                { "key": "topicName", "width": 150 },
                { "key": "ipPositioning", "width": 200 },
                { "key": "targetAudience", "width": 150 },
                { "key": "status", "width": 100, "component": "badge" },
                { "key": "planTasks", "width": 100 },
                { "key": "completedTasks", "width": 100 }
            ],
            "actions": {
                "row": [
                    {
                        "action": "navigate",
                        "title": "详情",
                        "url": "/portal/cms/topics/{id}"
                    },
                    {
                        "action": "delete",
                        "title": "删除",
                        "conditions": {
                            "status": "draft"
                        }
                    }
                ],
                "toolbar": [
                    {
                        "action": "create",
                        "title": "新专栏"
                    }
                ]
            },
            "pagination": {
                "enabled": true,
                "pageSize": 10,
                "mode": "client"
            }
        },
        "form": {
            "layout": "grid",
            "columns": 1,
            "sections": [
                {
                    "title": "基础定位",
                    "fields": ["topicName", "ipPositioning", "targetAudience"]
                },
                {
                    "title": "内容策略",
                    "fields": ["coreLabels", "contentMatrix", "remark"]
                }
            ]
        }
    }
}
```

关键变更：
- `status` 字段 type 改为 `select`，添加 options 带颜色
- 表格列：移除 `coreLabels`，新增 `ipPositioning` 和 `targetAudience`
- `status` 列添加 `"component": "badge"` 渲染方式
- 行操作：`showDialog` → `navigate`，添加 `url` 属性

- [ ] **Step 2: 删除 planDialog.json**

```bash
rm config/pages/cms/planDialog.json
```

- [ ] **Step 3: Commit**

```bash
git add config/pages/cms/topics.json
git rm config/pages/cms/planDialog.json
git commit -m "refactor: update topics list config - 6 columns, navigate action, remove planDialog"
```

---

### Task 3: PageBuilder 新增 navigate action

**Files:**
- Modify: `components/dynamic-page/page-builder.tsx`

- [ ] **Step 1: 添加 useRouter import**

在 `page-builder.tsx` 文件顶部已有的 import 区域，在 `import React, { useEffect, useState, useRef } from 'react';` 之后添加：

```typescript
import { useRouter } from 'next/navigation';
```

- [ ] **Step 2: 在组件内初始化 router**

在 `PageBuilder` 函数体内、`const [config, setConfig]` 那行之前添加：

```typescript
const router = useRouter();
```

- [ ] **Step 3: 在 handleAction switch 中添加 navigate case**

在 `handleAction` 函数的 `switch (action)` 中，`case 'edit':` 块之后、`case 'showDialog':` 块之前，添加：

```typescript
        case 'navigate': {
          let url = actionDef?.url as string | undefined;
          if (url && data) {
            url = url.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(data[key] ?? '')));
            router.push(url);
          }
          break;
        }
```

- [ ] **Step 4: 验证构建**

```bash
pnpm build
```

Expected: 构建成功，无 TypeScript 错误。

- [ ] **Step 5: Commit**

```bash
git add components/dynamic-page/page-builder.tsx
git commit -m "feat: add navigate action type to PageBuilder for row-level page navigation"
```

---

### Task 4: 创建专栏详情页 Server Component

**Files:**
- Create: `app/portal/cms/topics/[id]/page.tsx`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p app/portal/cms/topics/\[id\]
```

- [ ] **Step 2: 创建 page.tsx**

创建 `app/portal/cms/topics/[id]/page.tsx`：

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopicDetailClient } from "@/components/cms/topic-detail-client";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TopicDetailPage({ params }: PageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const breadcrumbs = [
        { label: "首页", href: "/" },
        { label: "工作台", href: "#" },
        { label: "新开专栏", href: "/portal/cms/topics" },
        { label: "专栏详情", href: "#" },
    ];

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader
                    user={session?.user}
                    breadcrumbs={breadcrumbs}
                />
                <div className="flex flex-1 flex-col gap-4 p-2 md:p-4">
                    <TopicDetailClient topicId={id} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/portal/cms/topics/\[id\]/page.tsx
git commit -m "feat: add topic detail page server component with layout and breadcrumbs"
```

---

### Task 5: 创建专栏详情 Client Component

**Files:**
- Create: `components/cms/topic-detail-client.tsx`

- [ ] **Step 1: 创建 topic-detail-client.tsx**

创建 `components/cms/topic-detail-client.tsx`：

```typescript
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface DetailItem {
    id: string;
    articleName: string;
    dueDate: string;
    status: string;
    contentUrl: string;
}

interface Topic {
    id: string;
    topicName: string;
    topicDesc: string;
    ipPositioning: string;
    targetAudience: string;
    coreLabels: string;
    contentMatrix: string;
    status: string;
    planTasks: number;
    completedTasks: number;
    detailItems: DetailItem[];
}

interface TopicDetailClientProps {
    topicId: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    open: { label: '进行中', variant: 'default' },
    closed: { label: '已完成', variant: 'secondary' },
};

export function TopicDetailClient({ topicId }: TopicDetailClientProps) {
    const router = useRouter();
    const [topic, setTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);

    // Task dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [editingTask, setEditingTask] = useState<DetailItem | null>(null);

    // Task form state
    const [formArticleName, setFormArticleName] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formStatus, setFormStatus] = useState('open');
    const [formContentUrl, setFormContentUrl] = useState('');

    const fetchTopic = useCallback(async () => {
        try {
            const res = await fetch(`/api/rest/cms/topics/${topicId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTopic(data);
        } catch {
            toast.error('加载专栏数据失败');
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    useEffect(() => {
        fetchTopic();
    }, [fetchTopic]);

    const saveTopic = async (updatedItems: DetailItem[]) => {
        if (!topic) return;
        const planTasks = updatedItems.length;
        const completedTasks = updatedItems.filter(i => i.status === 'closed').length;

        const res = await fetch(`/api/rest/cms/topics/${topicId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...topic,
                detailItems: updatedItems,
                planTasks,
                completedTasks,
            }),
        });

        if (!res.ok) throw new Error('Failed to save');
        const updated = await res.json();
        setTopic(updated);
    };

    const openCreateDialog = () => {
        setDialogMode('create');
        setEditingTask(null);
        setFormArticleName('');
        setFormDueDate('');
        setFormStatus('open');
        setFormContentUrl('');
        setDialogOpen(true);
    };

    const openEditDialog = (task: DetailItem) => {
        setDialogMode('edit');
        setEditingTask(task);
        setFormArticleName(task.articleName);
        setFormDueDate(task.dueDate);
        setFormStatus(task.status);
        setFormContentUrl(task.contentUrl);
        setDialogOpen(true);
    };

    const handleSubmitTask = async () => {
        if (!topic) return;
        if (!formArticleName.trim()) {
            toast.error('任务名称不能为空');
            return;
        }
        if (!formDueDate) {
            toast.error('截止日期不能为空');
            return;
        }

        try {
            let updatedItems: DetailItem[];

            if (dialogMode === 'create') {
                const newItem: DetailItem = {
                    id: crypto.randomUUID(),
                    articleName: formArticleName.trim(),
                    dueDate: formDueDate,
                    status: formStatus,
                    contentUrl: formContentUrl.trim(),
                };
                updatedItems = [...topic.detailItems, newItem];
            } else {
                updatedItems = topic.detailItems.map(item =>
                    item.id === editingTask?.id
                        ? {
                            ...item,
                            articleName: formArticleName.trim(),
                            dueDate: formDueDate,
                            status: formStatus,
                            contentUrl: formContentUrl.trim(),
                        }
                        : item
                );
            }

            await saveTopic(updatedItems);
            setDialogOpen(false);
            toast.success(dialogMode === 'create' ? '任务已创建' : '任务已更新');
        } catch {
            toast.error('保存失败');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!topic) return;
        if (!confirm('确定要删除该任务吗？')) return;

        try {
            const updatedItems = topic.detailItems.filter(item => item.id !== taskId);
            await saveTopic(updatedItems);
            toast.success('任务已删除');
        } catch {
            toast.error('删除失败');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">加载中...</div>;
    if (!topic) return <div className="p-8 text-center text-muted-foreground">专栏不存在</div>;

    return (
        <div className="space-y-4">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => router.push('/portal/cms/topics')}
            >
                <ArrowLeft className="h-4 w-4" />
                返回专栏列表
            </Button>

            {/* Topic info card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{topic.topicName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-20 shrink-0">定位</span>
                            <span>{topic.ipPositioning}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-20 shrink-0">目标客群</span>
                            <span>{topic.targetAudience}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-20 shrink-0">状态</span>
                            <Badge variant={topic.status === 'open' ? 'default' : 'secondary'}>
                                {topic.status === 'open' ? '进行中' : topic.status === 'closed' ? '已关闭' : '草稿'}
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-20 shrink-0">任务进度</span>
                            <span>{topic.completedTasks} / {topic.planTasks}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Task list */}
            <Card className="shadow-sm">
                <CardContent className="p-0">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-6 py-3 border-b">
                        <div className="font-medium">计划任务列表</div>
                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={openCreateDialog}>
                            <Plus className="h-3.5 w-3.5" />
                            新任务
                        </Button>
                    </div>

                    {/* Table */}
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[60px] text-center">序号</TableHead>
                                <TableHead className="w-[200px]">任务名称</TableHead>
                                <TableHead className="w-[120px]">截止日期</TableHead>
                                <TableHead className="w-[100px]">状态</TableHead>
                                <TableHead className="w-[100px]">内容链接</TableHead>
                                <TableHead className="w-[100px] text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topic.detailItems.length > 0 ? (
                                topic.detailItems.map((item, index) => (
                                    <TableRow key={item.id}>
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
                                                <a
                                                    href={item.contentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    链接
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
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
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        暂无任务，点击"新任务"添加
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Task Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{dialogMode === 'create' ? '新建任务' : '编辑任务'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">任务名称 <span className="text-destructive">*</span></label>
                            <Input
                                value={formArticleName}
                                onChange={e => setFormArticleName(e.target.value)}
                                placeholder="请输入任务名称"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">截止日期 <span className="text-destructive">*</span></label>
                            <Input
                                type="date"
                                value={formDueDate}
                                onChange={e => setFormDueDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">状态</label>
                            <Select value={formStatus} onValueChange={setFormStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">进行中</SelectItem>
                                    <SelectItem value="closed">已完成</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">内容链接</label>
                            <Input
                                value={formContentUrl}
                                onChange={e => setFormContentUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSubmitTask}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cms/topic-detail-client.tsx
git commit -m "feat: add TopicDetailClient component with topic info display and task CRUD"
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
1. 访问 `/portal/cms/topics` → 显示专栏列表，6 列正确展示
2. 点击"新专栏" → 弹出创建表单
3. 点击行"详情" → 跳转到 `/portal/cms/topics/{id}`
4. 详情页：上方展示专栏信息卡片，下方展示任务列表
5. 点击"新任务" → 弹出表单，填写后保存成功
6. 点击编辑图标 → 弹出预填表单，修改后保存成功
7. 点击删除图标 → 确认后删除成功
8. 返回按钮 → 回到专栏列表

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete CMS topics page refactor - list with 6 columns and detail page with task CRUD"
```
