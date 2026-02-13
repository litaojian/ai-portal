"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { registerUser } from "@/app/actions/register";

type PasswordStrength = {
    score: number;
    text: string;
    color: string;
};

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [emailValid, setEmailValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, text: "", color: "" });
    const router = useRouter();

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const checkPasswordStrength = (password: string): PasswordStrength => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score === 0) return { score: 0, text: "", color: "" };
        if (score <= 2) return { score: 1, text: "弱", color: "bg-red-500" };
        if (score <= 3) return { score: 2, text: "中等", color: "bg-yellow-500" };
        if (score <= 4) return { score: 3, text: "强", color: "bg-green-500" };
        return { score: 4, text: "非常强", color: "bg-green-600" };
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        if (value.length > 0) {
            if (validateEmail(value)) {
                setEmailError("");
                setEmailValid(true);
            } else {
                setEmailError("请输入有效的邮箱地址");
                setEmailValid(false);
            }
        } else {
            setEmailError("");
            setEmailValid(false);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordStrength(checkPasswordStrength(value));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await registerUser(formData);

            if (result.error) {
                toast.error(
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>{result.error}</span>
                    </div>
                );
            } else {
                toast.success(
                    <div className="flex flex-col gap-2">
                        <p className="font-bold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            注册成功！
                        </p>
                        <p className="text-sm">正在跳转到登录页面...</p>
                    </div>
                );
                setTimeout(() => {
                    router.push("/login");
                }, 1000);
            }
        } catch (error) {
            toast.error("服务器错误，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-[480px] border-border/50 bg-card/80 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.25)] overflow-hidden rounded-2xl relative group">
            {/* 顶部装饰条 - 渐变 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent animate-pulse" />

            <CardHeader className="space-y-5 pt-10 pb-6 text-center">
                <div className="flex justify-center">
                    <div className="relative group/icon">
                        <div className="absolute inset-0 blur-2xl bg-accent/30 rounded-full group-hover/icon:bg-accent/40 transition-all duration-300 animate-pulse-glow" />
                        <div className="relative bg-gradient-to-br from-accent via-primary to-accent p-5 rounded-2xl shadow-2xl shadow-accent/20 border border-primary-foreground/10 group-hover/icon:scale-110 transition-transform duration-300">
                            <UserPlus className="h-9 w-9 text-primary-foreground" />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        创建账号
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-muted-foreground/80">
                        填写以下信息加入我们的社区
                    </CardDescription>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-5 px-8">
                    <div className="grid gap-2.5">
                        <Label htmlFor="name" className="text-sm font-semibold ml-1 text-foreground/80">
                            用户名
                        </Label>
                        <div className="relative group/input">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="您的称呼"
                                className="h-14 pl-12 pr-4 bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary text-base transition-all rounded-xl"
                                required
                                minLength={2}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label htmlFor="email" className="text-sm font-semibold ml-1 text-foreground/80 flex items-center gap-2">
                            邮箱地址
                            {emailValid && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        </Label>
                        <div className="relative group/input">
                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                                emailValid ? 'text-green-500' : emailError ? 'text-destructive' : 'text-muted-foreground group-focus-within/input:text-primary'
                            }`} />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                className={`h-14 pl-12 pr-4 bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary text-base transition-all rounded-xl ${
                                    emailValid ? 'border-green-500/50' : emailError ? 'border-destructive/50' : ''
                                }`}
                                required
                            />
                            {emailValid && (
                                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-fade-in" />
                            )}
                        </div>
                        {emailError && (
                            <p className="text-xs text-destructive ml-1 flex items-center gap-1 animate-fade-in">
                                <AlertCircle className="h-3 w-3" />
                                {emailError}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2.5">
                        <Label htmlFor="password" className="text-sm font-semibold ml-1 text-foreground/80">
                            设置密码
                        </Label>
                        <div className="relative group/input">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="至少 6 个字符"
                                value={password}
                                onChange={handlePasswordChange}
                                className="h-14 pl-12 pr-12 bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary text-base transition-all rounded-xl"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        {/* 密码强度指示器 */}
                        {password.length > 0 && (
                            <div className="space-y-2 animate-fade-in">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                                level <= passwordStrength.score ? passwordStrength.color : 'bg-muted'
                                            }`}
                                        />
                                    ))}
                                </div>
                                {passwordStrength.text && (
                                    <p className={`text-xs ml-1 font-medium ${
                                        passwordStrength.score === 1 ? 'text-red-500' :
                                        passwordStrength.score === 2 ? 'text-yellow-500' :
                                        'text-green-500'
                                    }`}>
                                        密码强度：{passwordStrength.text}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground ml-1">
                                    提示：使用大小写字母、数字和特殊字符可提高密码强度
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-6 p-8 pt-6">
                    <Button
                        className="w-full h-14 text-base font-bold shadow-lg shadow-accent/30 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-primary-foreground transition-all active:scale-[0.98] hover:scale-[1.02] rounded-xl group relative overflow-hidden"
                        disabled={isLoading || !emailValid || passwordStrength.score < 2}
                        type="submit"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                正在创建账号...
                            </>
                        ) : (
                            <span className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                立即注册
                            </span>
                        )}
                    </Button>

                    {passwordStrength.score < 2 && password.length > 0 && (
                        <p className="text-xs text-center text-muted-foreground animate-fade-in">
                            <AlertCircle className="inline h-3 w-3 mr-1" />
                            请设置更强的密码以继续注册
                        </p>
                    )}

                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/50"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.25em] text-muted-foreground/50">
                            <span className="bg-card/80 px-3 backdrop-blur">Join Our Community</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            已有账号？{" "}
                            <a href="/login" className="text-accent font-bold hover:text-primary transition-colors underline underline-offset-4 decoration-accent/30 hover:decoration-primary/50">
                                立即登录
                            </a>
                        </p>
                    </div>

                    {/* 信任徽章 */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>免费注册</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>即刻开始</span>
                        </div>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
