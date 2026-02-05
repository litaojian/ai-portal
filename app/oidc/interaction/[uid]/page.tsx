"use client";

import { useEffect, useState } from "react";
import { getInteractionDetails } from "@/app/actions/oidc-interaction";
import { OidcLogin } from "./oidc-login";
import { OidcConsent } from "./oidc-consent";
import { Loader2, AlertCircle, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ uid: string }>;
}

export default function InteractionPage({ params }: PageProps) {
  const [uid, setUid] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => {
      setUid(p.uid);
      getInteractionDetails(p.uid)
        .then(setInteraction)
        .catch(e => setError("交互已过期或无效。"))
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !interaction) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <Card className="w-full max-w-[420px] bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-white">访问错误</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-0 pb-8">
            <p className="text-slate-400 mb-6">{error || "无法加载认证信息"}</p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const prompt = interaction.prompt.name;
  const client = interaction.params.client_id;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* 装饰性背景：与登录页统一 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* 网格背景：与登录页统一 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary)/0.03_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary)/0.03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="z-10 w-full px-4 flex flex-col items-center">
        {/* Logo 区域：与登录页统一 */}
        <div className="mb-10 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center gap-3 font-bold text-4xl tracking-tight text-foreground">
            <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-lg shadow-lg shadow-primary/20">AI</div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">应用中心</span>
          </div>
          <div className="h-1 w-10 bg-primary/40 rounded-full mt-1" />
        </div>

        {/* Main Content */}
        <div className="w-full flex justify-center animate-in zoom-in-95 duration-500">
          {prompt === "login" && <OidcLogin uid={uid!} />}
          {prompt === "consent" && <OidcConsent uid={uid!} client={client} scopes={interaction.params.scope} />}
          {prompt !== "login" && prompt !== "consent" && (
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardContent className="p-8 text-foreground">
                未知提示类型: {prompt}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer: 与登录页统一 */}
        <div className="mt-12 flex items-center gap-6 text-[10px] text-muted-foreground/40 uppercase tracking-[0.3em] font-bold">
          <span>Security</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
          <span>Privacy</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
          <span>Identity</span>
        </div>
      </div>
    </div>
  );
}
