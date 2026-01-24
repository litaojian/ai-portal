"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2 } from "lucide-react";
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
    <Card className="w-full max-w-md border-primary/20 bg-background/60 backdrop-blur-xl shadow-2xl shadow-primary/10">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-2xl ring-1 ring-primary/20">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">欢迎回来</CardTitle>
        <CardDescription>
          请输入您的账号信息以访问应用中心
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50 border-primary/10 focus-visible:ring-primary/30"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50 border-primary/10 focus-visible:ring-primary/30"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20" 
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              "立即登录"
            )}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            没有账号？{" "}
            <a href="#" className="text-primary hover:underline underline-offset-4">
              联系管理员开通
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
