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
            if (!data.detailItems) data.detailItems = [];
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
        if (!updated.detailItems) updated.detailItems = [];
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
