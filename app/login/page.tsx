import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,oklch(0.6_0.2_240/0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,oklch(0.6_0.2_240/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="z-10 w-full px-4 flex flex-col items-center">
        <div className="mb-8 flex items-center gap-2 font-bold text-2xl tracking-tight">
          <span className="text-primary">AI</span> 应用中心
        </div>
        <LoginForm />
        <div className="mt-8 text-xs text-muted-foreground/40 uppercase tracking-widest">
          Secure Infrastructure · Enterprise Ready
        </div>
      </div>
    </div>
  );
}
