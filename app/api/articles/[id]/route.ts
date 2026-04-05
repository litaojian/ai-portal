import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Sanitize: only allow UUID-like IDs
    if (!/^[0-9a-fA-F-]+$/.test(id)) {
        return NextResponse.json({ error: "无效的文章 ID" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "content", "articles", `${id}.md`);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const wordCount = content.replace(/\s+/g, '').length;

    return NextResponse.json({ content, wordCount });
}
