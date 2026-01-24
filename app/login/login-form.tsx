"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
        toast.error("登录失败，请检查邮箱和密码");
      } else {
        toast.success("登录成功");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("发生了一些错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[440px] border-border/50 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.15)] overflow-hidden rounded-2xl">
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
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            欢迎回来
          </CardTitle>
          <CardDescription className="text-base font-medium text-muted-foreground/70">
            请输入您的凭证以访问应用中心
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
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-13 pl-12 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base transition-all rounded-xl"
                required
              />
            </div>
          </div>
          
          <div className="grid gap-2.5">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/70">
                登录密码
              </Label>
              <a href="#" className="text-xs font-medium text-primary hover:opacity-80 transition-opacity">
                忘记密码？
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                正在验证身份...
              </>
            ) : (
              "安全登录"
            )}
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
            <p className="text-sm text-muted-foreground">
              还没有账号？{" "}
              <a href="#" className="text-primary font-bold hover:underline underline-offset-4">
                联系管理员
              </a>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
