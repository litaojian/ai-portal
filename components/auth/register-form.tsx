"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { registerUser } from "@/app/actions/register";

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await registerUser(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("注册成功！请登录");
                router.push("/login");
            }
        } catch (error) {
            toast.error("发生了一些错误");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-[440px] border-border/50 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.15)] overflow-hidden rounded-2xl">
            {/* Top decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />

            <CardHeader className="space-y-4 pt-10 pb-6 text-center">
                <div className="flex justify-center">
                    <div className="relative group">
                        <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full group-hover:bg-primary/30 transition-colors" />
                        <div className="relative bg-primary p-4 rounded-2xl shadow-xl shadow-primary/10 border border-primary-foreground/10">
                            <UserPlus className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                        创建账号
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-muted-foreground/70">
                        填写以下信息加入我们
                    </CardDescription>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-6 px-8">
                    <div className="grid gap-2.5">
                        <Label htmlFor="name" className="text-sm font-semibold ml-1 text-foreground/70">
                            用户名
                        </Label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="您的称呼"
                                className="h-13 pl-12 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base transition-all rounded-xl"
                                required
                            />
                        </div>
                    </div>

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

                    <div className="grid gap-2.5">
                        <Label htmlFor="password" className="text-sm font-semibold ml-1 text-foreground/70">
                            设置密码
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="h-13 pl-12 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base transition-all rounded-xl"
                                required
                                minLength={6}
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
                                正在注册...
                            </>
                        ) : (
                            "立即注册"
                        )}
                    </Button>

                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/50"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 bg-transparent">
                            <span className="bg-card px-2">Join Us</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            已有账号？{" "}
                            <a href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                                立即登录
                            </a>
                        </p>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
