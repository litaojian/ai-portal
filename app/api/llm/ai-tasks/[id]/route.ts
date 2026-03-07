import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(
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

        if (!task) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("AI Task GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
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
        await db.delete(aiTasks).where(and(eq(aiTasks.id, id), eq(aiTasks.userId, userId)));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("AI Task DELETE Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
