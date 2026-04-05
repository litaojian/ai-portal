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
