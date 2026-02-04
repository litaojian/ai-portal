"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/app/actions/password-reset";

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await requestPasswordReset(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                setIsSuccess(true);
                toast.success(result.message || "链接已发送");
            }
        } catch (error) {
            toast.error("请求失败");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="w-full max-w-[440px] border-border/50 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.15)] overflow-hidden rounded-2xl">
                <CardHeader className="space-y-4 pt-10 pb-6 text-center">
                    <div className="flex justify-center">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">检查您的邮箱</CardTitle>
                    <CardDescription>
                        如果该账号存在，我们已将重置链接发送至您的邮箱（开发环境下请查看控制台）。
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center p-8 pt-0">
                    <Button variant="outline" onClick={() => setIsSuccess(false)}>返回修改邮箱</Button>
                    <Button className="ml-2" asChild>
                        <a href="/login">返回登录</a>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-[440px] border-border/50 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.15)] overflow-hidden rounded-2xl">
            {/* Top decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />

            <CardHeader className="space-y-4 pt-10 pb-6 text-center">
                <div className="flex justify-center">
                    <div className="relative group">
                        <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full group-hover:bg-primary/30 transition-colors" />
                        <div className="relative bg-primary p-4 rounded-2xl shadow-xl shadow-primary/10 border border-primary-foreground/10">
                            <KeyRound className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                        找回密码
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-muted-foreground/70">
                        请输入您注册时的邮箱地址
                    </CardDescription>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-6 px-8">
                    <div className="grid gap-2.5">
                        <Label htmlFor="email" className="text-sm font-semibold ml-1 text-foreground/70">
                            邮箱地址
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                className="h-13 pl-12 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base transition-all rounded-xl"
                                required
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-6 p-8 pt-6">
                    <Button
                        className="w-full h-13 text-base font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.98] rounded-xl"
                        disabled={isLoading}
                        type="submit"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                正在发送...
                            </>
                        ) : (
                            "发送重置链接"
                        )}
                    </Button>

                    <div className="text-center">
                        <a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            返回登录
                        </a>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
