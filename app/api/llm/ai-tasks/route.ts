import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiTasks } from "@/lib/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const model = searchParams.get('model');
        const status = searchParams.get('status');

        let conditions = [eq(aiTasks.userId, userId)];

        if (model) conditions.push(like(aiTasks.model, `%${model}%`));
        if (status) conditions.push(eq(aiTasks.status, status));

        const whereObj = and(...conditions);

        // Fetch paginated data
        const data = await db.select()
            .from(aiTasks)
            .where(whereObj)
            .orderBy(desc(aiTasks.createdAt))
            .limit(pageSize)
            .offset((page - 1) * pageSize);

        // Fetch total count (a naive way, in production we might use sql`count(*)`)
        const allData = await db.select({ id: aiTasks.id })
            .from(aiTasks)
            .where(whereObj);

        return NextResponse.json({
            data,
            total: allData.length,
            page,
            pageSize
        });
    } catch (error: any) {
        console.error("AI Tasks GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // 1. First, send the request to new-api
        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl) {
            return NextResponse.json({ error: 'Config missing: NEW_API_URL' }, { status: 500 });
        }

        const targetUrl = `${baseUrl}/v1/video/generations`;
        const proxyRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: body.model,
                prompt: body.prompt,
                size: body.size,
                duration: parseInt(body.duration, 10),
            })
        });

        const rawData = await proxyRes.json();
        if (!proxyRes.ok) {
            return NextResponse.json({ error: rawData.error?.message || rawData.error || rawData.message || "Upstream generation failed" }, { status: proxyRes.status });
        }

        // Extract taskId
        const newTaskId = rawData.data?.task_id || rawData.task_id || rawData.data?.data?.id || rawData.data?.id || rawData.id;

        if (!newTaskId) {
            return NextResponse.json({ error: "Upstream returned Success but no valid Task ID could be parsed.", details: rawData }, { status: 500 });
        }

        // 2. Save it to our database, initialized as queued
        await db.insert(aiTasks).values({
            taskId: newTaskId,
            userId: userId,
            model: body.model,
            prompt: body.prompt,
            size: body.size,
            duration: parseInt(body.duration, 10),
            status: "queued",
            progress: 0
        });

        return NextResponse.json({ success: true, taskId: newTaskId });
    } catch (error: any) {
        console.error("AI Tasks POST Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
