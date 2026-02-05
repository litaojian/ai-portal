"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initializeSystem } from "@/app/actions/initialize-system";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        adminName: "",
        adminEmail: "",
        adminPassword: "",
        confirmPassword: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
            setError("请填写所有必填项");
            return;
        }

        if (formData.adminPassword !== formData.confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        if (formData.adminPassword.length < 6) {
            setError("密码长度至少为 6 位");
            return;
        }

        setLoading(true);
        setError("");

        const result = await initializeSystem({
            adminName: formData.adminName,
            adminEmail: formData.adminEmail,
            adminPassword: formData.adminPassword
        });

        setLoading(false);

        if (result.success) {
            setStep(3); // Success step
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } else {
            setError(result.error || "初始化失败");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        {step === 1 && "欢迎使用 AI Portal"}
                        {step === 2 && "创建管理员账户"}
                        {step === 3 && "初始化完成"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 1 && "系统首次启动，需要进行初始化设置"}
                        {step === 2 && "请设置初始管理员账户信息"}
                        {step === 3 && "系统初始化成功！"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                                <p className="text-sm text-blue-900">
                                    系统将引导您完成数据库初始化和管理员账户创建
                                </p>
                            </div>
                            <Button
                                onClick={() => setStep(2)}
                                className="w-full"
                            >
                                开始设置
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="adminName">
                                    管理员姓名 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="adminName"
                                    name="adminName"
                                    value={formData.adminName}
                                    onChange={handleInputChange}
                                    placeholder="请输入管理员姓名"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adminEmail">
                                    管理员邮箱 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="adminEmail"
                                    name="adminEmail"
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={handleInputChange}
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adminPassword">
                                    密码 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="adminPassword"
                                    name="adminPassword"
                                    type="password"
                                    value={formData.adminPassword}
                                    onChange={handleInputChange}
                                    placeholder="至少 6 位字符"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    确认密码 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="再次输入密码"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <p className="text-sm text-red-900">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    上一步
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            初始化中...
                                        </>
                                    ) : (
                                        "完成初始化"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 text-center">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-600" />
                            </div>
                            <p className="text-lg font-medium">初始化成功！</p>
                            <p className="text-sm text-muted-foreground">
                                正在跳转到登录页面...
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
