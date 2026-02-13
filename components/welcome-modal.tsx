"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, ArrowRight, X } from "lucide-react";

interface WelcomeModalProps {
  userName?: string;
}

export function WelcomeModal({ userName }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // 检查是否是首次登录
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      // 延迟显示，让页面先加载
      setTimeout(() => setOpen(true), 500);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
  };

  const features = [
    {
      icon: "🚀",
      title: "快速上手",
      description: "直观的界面设计，让您立即开始使用"
    },
    {
      icon: "🔒",
      title: "安全可靠",
      description: "企业级安全保护，确保您的数据安全"
    },
    {
      icon: "⚡",
      title: "高效协作",
      description: "强大的团队协作功能，提升工作效率"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] border-border/50 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden p-0">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {/* 内容 */}
        <div className="relative">
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors z-10"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <DialogHeader className="pt-12 pb-6 px-8 text-center">
            {/* 动画图标 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse-glow" />
                <div className="relative bg-gradient-to-br from-primary via-accent to-primary p-6 rounded-3xl shadow-2xl shadow-primary/30 border border-primary-foreground/10 animate-fade-in">
                  <Sparkles className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
            </div>

            <DialogTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-fade-in animation-delay-100">
              欢迎加入，{userName || "探索者"}！🎉
            </DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground/80 mt-3 animate-fade-in animation-delay-200">
              感谢选择 AI 应用中心，让我们快速了解一下您的新工作台
            </DialogDescription>
          </DialogHeader>

          {/* 特性展示 */}
          <div className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* 统计数据 */}
            <div className="flex items-center justify-center gap-8 mb-8 p-4 rounded-xl bg-muted/30 border border-border/30 animate-fade-in animation-delay-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1,234+</div>
                <div className="text-xs text-muted-foreground mt-1">活跃用户</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-xs text-muted-foreground mt-1">在线支持</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-xs text-muted-foreground mt-1">运行时间</div>
              </div>
            </div>

            {/* 行动按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in animation-delay-500">
              <Button
                onClick={handleClose}
                className="flex-1 h-12 text-base font-bold shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground transition-all hover:scale-[1.02] group"
              >
                <span className="flex items-center gap-2">
                  开始探索
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="sm:w-auto h-12 text-base border-border/50 hover:bg-muted/50"
              >
                稍后查看
              </Button>
            </div>

            {/* 底部提示 */}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground animate-fade-in animation-delay-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span>您的账户已成功激活并准备就绪</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
