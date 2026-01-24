"use client";

import { useState } from "react";
import { submitLogin } from "@/app/actions/oidc-interaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { signIn } from "next-auth/react"; // 实际上 OIDC 登录和 NextAuth 登录是分离的，但可以共享账号体系

export function OidcLogin({ uid }: { uid: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 验证用户名密码 (这里简化，实际上应调用 Server Action 查库验证)
      // 在这里我们假设只要输入了东西就验证通过，实际项目必须查 User 表
      // 为了演示，如果 email 是 admin@example.com，我们就通过
      
      // 注意：这里应该是一个 Server Action 来 verifyCredentials(email, password)
      // 为了演示，直接跳过验证步骤，或者您可以实现一个 verifyUser action。
      // 假设我们直接用 email 作为 accountId
      
      if (!email || !password) {
        toast.error("请输入账号密码");
        setLoading(false);
        return;
      }

      // 提交到 OIDC
      const returnUrl = await submitLogin(uid, email); 
      window.location.href = returnUrl; // 跳转回 OIDC 流程
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Sign In to Continue</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Any password" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
