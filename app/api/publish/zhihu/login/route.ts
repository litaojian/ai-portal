import { NextResponse } from "next/server";
import { loginToZhihu } from "@/lib/zhihu-publisher";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        await loginToZhihu();
        return NextResponse.json({
            success: true,
            message: "登录成功，Cookie 已保存",
        });
    } catch (error: any) {
        console.error("Zhihu Login Error:", error);
        return NextResponse.json({
            error: error.message || "登录失败",
        }, { status: 500 });
    }
}
