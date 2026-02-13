import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* 几何网格背景 - Cyberpunk 风格 */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute w-full h-full opacity-30">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary/20"
              />
            </pattern>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" className="text-primary" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* 扫描线效果 */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />

        {/* 霓虹光晕 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/50" />

      <div className="z-10 w-full px-4 flex flex-col items-center">
        {/* Logo - 添加进入动画 */}
        <div className="mb-10 flex flex-col items-center gap-3 animate-fade-in-up">
          <div className="flex items-center gap-3 font-bold text-5xl tracking-tight">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-lg animate-pulse-glow" />
              <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-3 py-1 rounded-lg shadow-2xl shadow-primary/30 border border-primary-foreground/20">
                AI
              </div>
            </div>
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-fade-in animation-delay-100">
              应用中心
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 bg-gradient-to-r from-transparent to-primary rounded-full animate-fade-in animation-delay-200" />
            <div className="h-1 w-12 bg-primary rounded-full animate-fade-in animation-delay-200" />
            <div className="h-0.5 w-8 bg-gradient-to-l from-transparent to-primary rounded-full animate-fade-in animation-delay-200" />
          </div>
        </div>

        {/* 表单 - 延迟出现 */}
        <div className="animate-fade-in-up animation-delay-300">
          <LoginForm />
        </div>

        {/* 底部文字 - 最后出现 */}
        <div className="mt-12 flex items-center gap-6 text-[10px] text-muted-foreground/50 uppercase tracking-[0.3em] font-bold animate-fade-in animation-delay-500">
          <span className="hover:text-primary transition-colors cursor-default">Security</span>
          <div className="w-1 h-1 rounded-full bg-primary/30 animate-pulse" />
          <span className="hover:text-accent transition-colors cursor-default">Privacy</span>
          <div className="w-1 h-1 rounded-full bg-accent/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <span className="hover:text-primary transition-colors cursor-default">Efficiency</span>
        </div>
      </div>
    </div>
  );
}
