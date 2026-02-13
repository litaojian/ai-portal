"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Loader2, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              登录失败
            </p>
            <p className="text-sm">邮箱或密码错误，请重试</p>
            <button
              onClick={() => router.push('/forgot-password')}
              className="text-xs text-primary underline text-left hover:text-primary/80 transition-colors"
            >
              忘记密码？立即重置 →
            </button>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-bold">登录成功！</span>
          </div>
        );
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("服务器错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={{ minWidth: 450 }} className="w-full max-w-[640px] border-border/50 bg-card/80 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.25)] overflow-hidden rounded-2xl relative group">
      {/* 顶部装饰条 - 渐变 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />

      <CardHeader className="space-y-5 pt-10 pb-6 text-center">
        <div className="flex justify-center">
          <div className="relative group/icon">
            <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full group-hover/icon:bg-primary/40 transition-all duration-300 animate-pulse-glow" />
            <div className="relative bg-gradient-to-br from-primary via-primary to-accent p-5 rounded-2xl shadow-2xl shadow-primary/20 border border-primary-foreground/10 group-hover/icon:scale-110 transition-transform duration-300">
              <Zap className="h-9 w-9 text-primary-foreground" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            欢迎回来
          </CardTitle>
          <CardDescription className="text-base font-medium text-muted-foreground/80">
            请输入您的凭证以访问应用中心
          </CardDescription>
        </div>

        {/* 社会认同 - 用户头像 */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Avatar key={i} className="border-2 border-card w-8 h-8 hover:scale-110 transition-transform">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                <AvatarFallback className="text-xs">U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/70">
            <strong className="text-primary font-bold">1,234+</strong> 位用户正在使用
          </p>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6 px-8">
          <div className="grid gap-2.5">
            <Label htmlFor="email" className="text-sm font-semibold ml-1 text-foreground/80 flex items-center gap-2">
              邮箱地址
              {emailValid && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
            </Label>
            <div className="relative group/input">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${emailValid ? 'text-green-500' : emailError ? 'text-destructive' : 'text-muted-foreground group-focus-within/input:text-primary'
                }`} />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={handleEmailChange}
                className={`h-14 pl-12 pr-4 bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary text-base transition-all rounded-xl ${emailValid ? 'border-green-500/50' : emailError ? 'border-destructive/50' : ''
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
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">
                登录密码
              </Label>
              <a href="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors underline underline-offset-2">
                忘记密码？
              </a>
            </div>
            <div className="relative group/input">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 pl-12 pr-4 bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary text-base transition-all rounded-xl"
                required
                minLength={6}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 p-8 pt-6">
          <Button
            className="w-full h-14 text-base font-bold shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground transition-all active:scale-[0.98] hover:scale-[1.02] rounded-xl group relative overflow-hidden"
            disabled={isLoading || !emailValid}
            type="submit"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在验证身份...
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                安全登录
              </span>
            )}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.25em] text-muted-foreground/50">
              <span className="bg-card/80 px-3 backdrop-blur">Next-Generation AI</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              还没有账号？{" "}
              <a href="/register" className="text-primary font-bold hover:text-accent transition-colors underline underline-offset-4 decoration-primary/30 hover:decoration-accent/50">
                立即注册
              </a>
            </p>
          </div>

          {/* 信任徽章 */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span>安全加密</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span>隐私保护</span>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
