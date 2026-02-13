"use client";

import { useState } from "react";
import { submitLogin, verifyCredentials } from "@/app/actions/oidc-interaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap, Mail, Lock } from "lucide-react";

export function OidcLogin({ uid }: { uid: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !password) {
        toast.error("请输入账号密码");
        setLoading(false);
        return;
      }

      // 1. 验证用户名密码
      const result = await verifyCredentials(email, password);

      // 2. 提交到 OIDC
      const returnUrl = await submitLogin(uid, result.accountId);

      if (!returnUrl) {
        throw new Error("登录失败：OIDC 交互未返回 URL。");
      }

      window.location.href = returnUrl; // 跳转回 OIDC 流程
    } catch (err: any) {
      toast.error(err.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[640px] border-border/50 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.15)] overflow-hidden rounded-2xl relative">
      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />

      <CardHeader className="space-y-4 pt-10 pb-6 text-center">
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full group-hover:bg-primary/30 transition-colors" />
            <div className="relative bg-primary p-4 rounded-2xl shadow-xl shadow-primary/10 border border-primary-foreground/10">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">身份验证</CardTitle>
          <CardDescription className="text-base font-medium text-muted-foreground/70">请登录以继续访问应用</CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="grid gap-6 px-8">
          <div className="grid gap-2.5">
            <Label htmlFor="email" className="text-sm font-semibold ml-1 text-foreground/70">
              电子邮箱地址
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
              <Input
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="h-13 pl-12 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base transition-all rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-2.5">
            <Label htmlFor="password" className="text-sm font-semibold ml-1 text-foreground/70">
              登录密码
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入您的密码"
                required
                className="h-13 pl-12 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base transition-all rounded-xl"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 p-8 pt-6">
          <Button
            type="submit"
            className="w-full h-13 text-base font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.98] rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在验证身份...
              </>
            ) : "立即登录"}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 bg-transparent">
              <span className="bg-card px-2">Next-Generation AI</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-wider">
              © 2026 AI 应用中心 · 统一身份认证
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
