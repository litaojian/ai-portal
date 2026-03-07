import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const task = await db.query.aiTasks.findFirst({
            where: and(eq(aiTasks.id, id), eq(aiTasks.userId, userId))
        });

        if (!task || !task.taskId) {
            return NextResponse.json({ error: "Task not found or has no upstream ID" }, { status: 404 });
        }

        // Fetch from upstream
        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl) {
            return NextResponse.json({ error: 'Config missing: NEW_API_URL' }, { status: 500 });
        }

        const pollRes = await fetch(`${baseUrl}/v1/video/generations/${task.taskId}?_t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });

        if (!pollRes.ok) {
            const errStr = await pollRes.text();
            return new NextResponse(errStr, { status: pollRes.status });
        }

        const rawData = await pollRes.json();
        const rootData = rawData.data || rawData;
        const innerData = rootData.data || rootData;

        let currentStatus = innerData.status || rootData.status || task.status;
        if (currentStatus === "SUCCESS" || currentStatus === "SUCCESS") currentStatus = "completed";
        if (currentStatus === "FAIL" || currentStatus === "FAILURE") currentStatus = "failed";

        currentStatus = currentStatus.toLowerCase();

        let currentProgress = innerData.progress ?? rootData.progress;
        if (typeof currentProgress === 'string') {
            currentProgress = parseInt(currentProgress.replace('%', ''), 10);
        }
        if (currentProgress === undefined || isNaN(currentProgress)) {
            currentProgress = task.progress;
        }

        let resultUrl = rootData.result_url || innerData.result_url || task.resultUrl;
        let failReason = innerData.error?.message || innerData.fail_reason || rootData.fail_reason || task.failReason;

        // Update DB
        await db.update(aiTasks)
            .set({
                status: currentStatus,
                progress: currentProgress,
                resultUrl: resultUrl,
                failReason: failReason,
                updatedAt: new Date()
            })
            .where(eq(aiTasks.id, id));

        return NextResponse.json({ success: true, status: currentStatus, progress: currentProgress });
    } catch (error: any) {
        console.error("AI Task SYNC Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
