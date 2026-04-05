'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

interface ZhihuLoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoginSuccess: () => void;
}

export function ZhihuLoginDialog({ open, onOpenChange, onLoginSuccess }: ZhihuLoginDialogProps) {
    const [logging, setLogging] = useState(false);

    const handleLogin = async () => {
        setLogging(true);
        try {
            const res = await fetch('/api/publish/zhihu/login', { method: 'POST' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: '登录失败' }));
                throw new Error(err.error || '登录失败');
            }
            toast.success('知乎登录成功');
            onOpenChange(false);
            onLoginSuccess();
        } catch (error: any) {
            toast.error(error.message || '登录失败，请重试');
        } finally {
            setLogging(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!logging) onOpenChange(v); }}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        登录知乎
                    </DialogTitle>
                    <DialogDescription>
                        发布文章需要知乎登录态。点击下方按钮将打开浏览器窗口，请在窗口中完成知乎登录。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={logging}>取消</Button>
                    <Button onClick={handleLogin} disabled={logging} className="gap-1">
                        {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                        {logging ? '等待登录中...' : '打开登录窗口'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
