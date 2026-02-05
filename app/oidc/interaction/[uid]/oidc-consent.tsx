"use client";

import { submitConsent, abortInteraction } from "@/app/actions/oidc-interaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Check, X } from "lucide-react";

export function OidcConsent({ uid, client, scopes }: { uid: string, client: string, scopes: string }) {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const url = await submitConsent(uid);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || "授权失败");
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    setLoading(true);
    try {
      const url = await abortInteraction(uid);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || "取消操作失败");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[440px] border-border/50 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(var(--primary)/0.15)] overflow-hidden rounded-2xl relative">
      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />

      <CardHeader className="space-y-4 pt-10 pb-6 text-center">
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full group-hover:bg-primary/30 transition-colors" />
            <div className="relative bg-primary p-4 rounded-2xl shadow-xl shadow-primary/10 border border-primary-foreground/10">
              <ShieldCheck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">应用授权</CardTitle>
          <CardDescription className="text-base font-medium text-muted-foreground/70">
            应用 <span className="text-primary font-bold">“{client}”</span> 申请访问您的账户。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-8">
        <div className="p-5 rounded-2xl bg-background/50 border border-border/60 space-y-4 shadow-inner">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">申请访问权限</p>
          <ul className="space-y-3">
            {scopes.split(' ').filter(Boolean).map(s => (
              <li key={s} className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>{s === 'openid' ? '基础身份标识 (OpenID)' :
                  s === 'profile' ? '个人公开信息 (Profile)' :
                    s === 'email' ? '电子邮件地址 (Email)' : s}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-muted-foreground/50 text-center leading-relaxed font-medium">
          点击“授权”即表示您同意分享上述信息。您可以随时在应用设置中撤销此授权。
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-6 p-8 pt-6">
        <div className="flex justify-between gap-3 w-full">
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={loading}
            className="flex-1 h-12 text-sm font-bold border-border/60 hover:bg-accent rounded-xl transition-all"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            拒绝
          </Button>
          <Button
            onClick={handleAllow}
            disabled={loading}
            className="flex-2 h-12 px-8 text-sm font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            确认授权
          </Button>
        </div>

        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 bg-transparent">
            <span className="bg-card px-2">Secure Authentication</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
