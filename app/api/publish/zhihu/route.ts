import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { publishToZhihu, NeedLoginError } from "@/lib/zhihu-publisher";

export const dynamic = 'force-dynamic';

// Simple mutex to prevent concurrent publish operations
let isPublishing = false;

export async function POST(request: NextRequest) {
    if (isPublishing) {
        return NextResponse.json({ error: "另一个发布操作正在进行中，请稍后重试" }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { taskId, articleName } = body;

        if (!taskId || !articleName) {
            return NextResponse.json({ error: "缺少 taskId 或 articleName" }, { status: 400 });
        }

        // Sanitize task ID
        if (!/^[0-9a-fA-F-]+$/.test(taskId)) {
            return NextResponse.json({ error: "无效的任务 ID" }, { status: 400 });
        }

        // Read article content
        const filePath = path.join(process.cwd(), "content", "articles", `${taskId}.md`);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "文章文件不存在，请先生成文章" }, { status: 400 });
        }

        const markdownContent = fs.readFileSync(filePath, "utf-8");

        // Extract title from first markdown heading (more reliable than request param which may have encoding issues)
        const headingMatch = markdownContent.match(/^#\s+(.+)/);
        const title = headingMatch ? headingMatch[1].trim() : articleName;

        // Strip the first markdown heading from content
        const content = markdownContent.replace(/^#\s+.+\n+/, '');

        isPublishing = true;
        const result = await publishToZhihu(title, content);

        return NextResponse.json({
            success: true,
            zhihuUrl: result.zhihuUrl,
        });
    } catch (error: any) {
        if (error instanceof NeedLoginError) {
            return NextResponse.json({
                success: false,
                needLogin: true,
                message: "请先登录知乎",
            }, { status: 401 });
        }
        console.error("Zhihu Publish Error:", error);
        return NextResponse.json({ error: error.message || "发布失败" }, { status: 500 });
    } finally {
        isPublishing = false;
    }
}
