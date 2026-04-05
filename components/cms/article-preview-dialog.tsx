'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, RotateCcw, Upload } from 'lucide-react';

interface ArticlePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string | null;
    articleName: string;
    taskStatus?: string;
    onRegenerate: () => void;
    onPublish?: () => void;
}

export function ArticlePreviewDialog({ open, onOpenChange, taskId, articleName, taskStatus, onRegenerate, onPublish }: ArticlePreviewDialogProps) {
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
                    {taskStatus === 'reviewed' && onPublish && (
                        <Button variant="outline" onClick={onPublish} className="gap-1">
                            <Upload className="h-4 w-4" />
                            发布到知乎
                        </Button>
                    )}
                    <Button onClick={() => onOpenChange(false)}>关闭</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
