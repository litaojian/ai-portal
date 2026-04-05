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
