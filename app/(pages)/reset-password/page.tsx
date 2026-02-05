"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "@/app/actions/password-reset";

function ResetPasswordContent() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    if (!token) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Card>
                    <CardHeader><CardTitle>无效链接</CardTitle></CardHeader>
                    <CardContent>缺少重置令牌，无法继续。</CardContent>
                    <CardFooter><a href="/login">返回登录</a></CardFooter>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            // Append token to formData for the server action
            formData.append("token", token);

            const result = await resetPassword(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("密码重置成功，请使用新密码登录");
                router.push("/login");
            }
        } catch (error) {
            toast.error("重置失败");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
            {/* Background (Simplified) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary)/0.03_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary)/0.03_1px,transparent_1px)] bg-[size:40px_40px]" />

            <Card className="z-10 w-full max-w-[440px] border-border/50 bg-card/50 backdrop-blur-xl shadow-lg">
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
                    <CardTitle className="text-3xl font-bold">设置新密码</CardTitle>
                    <CardDescription>请输入您的新密码</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-6 px-8">
                        <div className="grid gap-2.5">
                            <Label htmlFor="password" className="text-sm font-semibold ml-1 text-foreground/70">
                                新密码
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
                            className="w-full h-13 text-base font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-xl"
                            disabled={isLoading}
                            type="submit"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    重置中...
                                </>
                            ) : (
                                "确认重置"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
