import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* 装饰性背景：统一使用色调中的蓝色 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* 网格背景：调淡颜色 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary)/0.03_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary)/0.03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="z-10 w-full px-4 flex flex-col items-center">
        <div className="mb-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 font-bold text-4xl tracking-tight text-foreground">
            <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-lg shadow-lg shadow-primary/20">AI</div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">应用中心</span>
          </div>
          <div className="h-1 w-10 bg-primary/40 rounded-full mt-1" />
        </div>
        
        <LoginForm />
        
        <div className="mt-12 flex items-center gap-6 text-[10px] text-muted-foreground/40 uppercase tracking-[0.3em] font-bold">
          <span>Security</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
          <span>Privacy</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
          <span>Efficiency</span>
        </div>
      </div>
    </div>
  );
}
