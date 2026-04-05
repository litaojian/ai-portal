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
