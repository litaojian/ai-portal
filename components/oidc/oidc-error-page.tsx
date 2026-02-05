import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function OidcErrorPage({ error, details }: { error: string, details?: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md border-red-100 dark:border-red-900">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-400">认证错误</CardTitle>
                    <CardDescription className="text-red-600/80 dark:text-red-400/80">
                        OIDC 流程遇到不可恢复的错误
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
                        <p className="font-semibold text-red-800 dark:text-red-400">{error}</p>
                        {details && (
                            <pre className="mt-2 text-xs text-red-700 dark:text-red-400/70 overflow-x-auto whitespace-pre-wrap">
                                {details}
                            </pre>
                        )}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        请尝试重新启动身份认证流程或联系系统管理员。
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/">
                        <Button variant="outline">返回主页</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
