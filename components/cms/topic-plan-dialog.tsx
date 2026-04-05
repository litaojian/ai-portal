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

const FREQUENCY_OPTIONS = [
    { value: '1', label: '每周 1 篇' },
    { value: '2', label: '每周 2 篇' },
    { value: '3', label: '每周 3 篇' },
    { value: '5', label: '每周 5 篇' },
];

const MODEL_OPTIONS = [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
    { value: 'o4-mini', label: 'o4-mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
];

function today() {
    return new Date().toISOString().slice(0, 10);
}

function daysFromNow(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export function TopicPlanDialog({ open, onOpenChange, topic, onSuccess }: TopicPlanDialogProps) {
    // Config form state
    const [startDate, setStartDate] = useState(today());
    const [endDate, setEndDate] = useState(daysFromNow(30));
    const [frequency, setFrequency] = useState('2');
    const [model, setModel] = useState('gpt-4.1');
    const [clearPending, setClearPending] = useState(false);
    const [extraNotes, setExtraNotes] = useState('');

    // Phase state
    const [phase, setPhase] = useState<Phase>('config');

    // Result state
    const [planDocument, setPlanDocument] = useState('');
    const [tasks, setTasks] = useState<{ articleName: string; dueDate: string }[]>([]);

    // Collect existing task info
    const existingItems: DetailItem[] = topic.detailItems || [];
    const completedArticles = existingItems
        .filter(i => i.status === 'closed')
        .map(i => i.articleName);
    const pendingItems = existingItems.filter(i => i.status !== 'closed');

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            toast.error('请选择开始和结束日期');
            return;
        }
        if (startDate >= endDate) {
            toast.error('结束日期必须晚于开始日期');
            return;
        }

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
                    startDate,
                    endDate,
                    frequency: parseInt(frequency),
                    model,
                    completedArticles,
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
            const newItems: DetailItem[] = tasks.map(t => ({
                id: crypto.randomUUID(),
                articleName: t.articleName,
                dueDate: t.dueDate,
                status: 'open',
                contentUrl: '',
            }));

            // Keep completed items always; only keep pending items if clearPending is off
            const keptItems = clearPending
                ? existingItems.filter(i => i.status === 'closed')
                : existingItems;

            const mergedItems = [...keptItems, ...newItems];
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
            setPhase('config');
            setPlanDocument('');
            setTasks([]);
            setExtraNotes('');
            setClearPending(false);
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
                            {/* Date range */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">规划时间范围</label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-40 h-8 text-sm"
                                    />
                                    <span className="text-sm text-muted-foreground">至</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-40 h-8 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Frequency */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">发布频率</label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FREQUENCY_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Model */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">AI 模型</label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger className="w-52">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MODEL_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear pending tasks option */}
                            {pendingItems.length > 0 && (
                                <div className="flex items-start gap-2 rounded-md border p-3">
                                    <input
                                        type="checkbox"
                                        id="clearPending"
                                        checked={clearPending}
                                        onChange={e => setClearPending(e.target.checked)}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <label htmlFor="clearPending" className="text-sm cursor-pointer">
                                        删除上次未完成的 <span className="font-medium text-destructive">{pendingItems.length}</span> 个任务
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                            勾选后，保存新规划时将移除所有状态为"进行中"的旧任务
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Existing completed articles hint */}
                            {completedArticles.length > 0 && (
                                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                                    <div className="font-medium text-foreground">已完成 {completedArticles.length} 篇文章（AI 将避免重复）：</div>
                                    <ul className="list-disc list-inside">
                                        {completedArticles.slice(0, 5).map((name, i) => (
                                            <li key={i}>{name}</li>
                                        ))}
                                        {completedArticles.length > 5 && <li>...等共 {completedArticles.length} 篇</li>}
                                    </ul>
                                </div>
                            )}

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
