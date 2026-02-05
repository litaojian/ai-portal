"use client";

import { useState } from "react";
import { submitLogin, verifyCredentials } from "@/app/actions/oidc-interaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
        throw new Error("Login failed: Missing return URL from OIDC interaction.");
      }

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
            <Label className="flex items-center">
              Email
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center">
              Password
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Any password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
