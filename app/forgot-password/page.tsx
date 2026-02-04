import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary)/0.03_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary)/0.03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            <div className="z-10 w-full px-4 flex flex-col items-center">
                <ForgotPasswordForm />
            </div>
        </div>
    );
}
