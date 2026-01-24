import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, ShieldCheck, LayoutGrid, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/10">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="font-semibold text-lg flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>AI 应用中心</span>
          </div>
          <nav>
            {/* <Link href="/dashboard">
              <Button variant="ghost" size="sm">进入控制台</Button>
            </Link> */}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative p-6">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full bg-primary/20 opacity-30 blur-[80px]"></div>
        </div>
        
        {/* Hero Content */}
        <div className="text-center space-y-8 max-w-2xl mx-auto z-10 mt-[-5vh]">
          <Badge variant="outline" className="px-3 py-1 font-normal text-muted-foreground border-primary/20 bg-primary/5">
            v1.0 Public Beta
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            AI 应用中心
          </h1>
          
          <p className="text-xl text-muted-foreground font-light tracking-wide">
            统一身份 · 聚合应用 · 智能监控
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-11 px-8 rounded-full shadow-lg shadow-primary/20 gap-2 text-base">
                开始使用 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-11 px-8 rounded-full text-base">
              文档说明
            </Button>
          </div>

          {/* Minimal Feature List */}
          <div className="pt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> <span>安全认证</span>
            </div>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> <span>应用聚合</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> <span>实时审计</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-4 w-full text-center text-xs text-muted-foreground/40">
        © 2026 AI Application Center
      </footer>
    </div>
  );
}