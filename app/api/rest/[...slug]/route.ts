import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import { count, eq, and, like, SQL, AnyColumn } from "drizzle-orm";
import { JsonStore } from "@/lib/db/json-store";

export const dynamic = 'force-dynamic';

/**
 * Unified REST API Handler using Catch-all Routes
 * Supports:
 * - /api/rest/[model]           (List/Create)
 * - /api/rest/[model]/[id]      (Get/Update/Delete)
 * - /api/rest/[sub]/[model]     (Nested paths)
 */

async function getRequestParams(slug: string[]) {
    // Determine if the last part of the slug is an ID
    // Simple heuristic: UUID length or presence of hyphens
    const lastPart = slug[slug.length - 1];
    const isId = slug.length > 1 && (lastPart.length > 30 || /^[0-9a-fA-F-]+$/.test(lastPart));

    const modelPath = isId ? slug.slice(0, -1).join("/") : slug.join("/");
    const id = isId ? lastPart : null;

    return { modelPath, id };
}

// --- DB Helper ---
async function handleDbRequest(method: string, modelPath: string, id: string | null, request: NextRequest) {
    const table = tables[modelPath as keyof typeof tables];
    if (!table) return null; // Not a DB model

    const { searchParams } = new URL(request.url);

    try {
        if (method === "GET") {
            if (id) {
                // @ts-ignore
                const [item] = await db.select().from(table).where(eq(table.id, id)).limit(1);
                return item ? NextResponse.json(item) : NextResponse.json({ error: "Not found" }, { status: 404 });
            } else {
                const page = parseInt(searchParams.get("page") || "1");
                const pageSize = parseInt(searchParams.get("pageSize") || "10");
                const skip = (page - 1) * pageSize;

                const conditions: SQL[] = [];
                searchParams.forEach((value, key) => {
                    if (['page', 'pageSize', 'sort', 'order'].includes(key)) return;
                    if (!value || !(key in table)) return;
                    
                    const column = table[key as keyof typeof table] as unknown as AnyColumn;
                    if (['name', 'username', 'title', 'description', 'email', 'topicName'].includes(key)) {
                        conditions.push(like(column, `%${value}%`));
                    } else {
                        conditions.push(eq(column, value));
                    }
                });

                const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
                const [data, totalCount] = await Promise.all([
                    db.select().from(table).where(whereClause).limit(pageSize).offset(skip),
                    db.select({ count: count() }).from(table).where(whereClause)
                ]);

                return NextResponse.json({ data, total: totalCount[0].count, page, pageSize });
            }
        }

        if (method === "POST") {
            const body = await request.json();
            if (!body.id) body.id = crypto.randomUUID();
            // Handle dates if necessary (simplified for brevity, reuse logic if possible)
            const now = new Date();
            if (!body.createdAt) body.createdAt = now;
            if (!body.updatedAt) body.updatedAt = now;

            // @ts-ignore
            await db.insert(table).values(body);
            return NextResponse.json(body);
        }

        if (method === "PATCH" || method === "PUT") {
            if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
            const body = await request.json();
            body.updatedAt = new Date();
            // @ts-ignore
            await db.update(table).set(body).where(eq(table.id, id));
            // @ts-ignore
            const [item] = await db.select().from(table).where(eq(table.id, id)).limit(1);
            return NextResponse.json(item);
        }

        if (method === "DELETE") {
            if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
            // @ts-ignore
            await db.delete(table).where(eq(table.id, id));
            return NextResponse.json({ success: true });
        }

    } catch (error) {
        console.error(`DB ${method} Error:`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return null;
}

// --- JSON Helper ---
async function handleJsonRequest(method: string, modelPath: string, id: string | null, request: NextRequest) {
    const store = new JsonStore(modelPath);
    const { searchParams } = new URL(request.url);

    try {
        if (method === "GET") {
            if (id) {
                const item = await store.findOne(id);
                return item ? NextResponse.json(item) : NextResponse.json({ error: "Not found" }, { status: 404 });
            } else {
                const page = parseInt(searchParams.get("page") || "1");
                const pageSize = parseInt(searchParams.get("pageSize") || "10");
                const where: Record<string, string> = {};
                searchParams.forEach((v, k) => {
                    if (!['page', 'pageSize'].includes(k)) where[k] = v;
                });
                const result = await store.findMany({ page, pageSize, where });
                return NextResponse.json(result);
            }
        }

        if (method === "POST") {
            const body = await request.json();
            const item = await store.create(body);
            return NextResponse.json(item);
        }

        if (method === "PATCH" || method === "PUT") {
            if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
            const body = await request.json();
            const item = await store.update(id, body);
            return item ? NextResponse.json(item) : NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (method === "DELETE") {
            if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
            const success = await store.delete(id);
            return success ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
        }
    } catch (error) {
        console.error(`JSON ${method} Error:`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// --- Main Route Handler ---
async function handleRequest(request: NextRequest, params: Promise<{ slug: string[] }>) {
    const { slug } = await params;
    const { modelPath, id } = await getRequestParams(slug);
    const method = request.method;

    // 1. Try DB
    const dbResponse = await handleDbRequest(method, modelPath, id, request);
    if (dbResponse) return dbResponse;

    // 2. Try JSON (Fallback)
    return await handleJsonRequest(method, modelPath, id, request);
}

export const GET = (req: NextRequest, { params }: any) => handleRequest(req, params);
export const POST = (req: NextRequest, { params }: any) => handleRequest(req, params);
export const PUT = (req: NextRequest, { params }: any) => handleRequest(req, params);
export const PATCH = (req: NextRequest, { params }: any) => handleRequest(req, params);
export const DELETE = (req: NextRequest, { params }: any) => handleRequest(req, params);
