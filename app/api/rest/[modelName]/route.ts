import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import { count } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// Add global declaration here too to be safe (or move to a d.ts)
declare global {
  var mockData: Record<string, any[]> | undefined;
}

async function getMockStore(modelName: string) {
  if (!global.mockData) global.mockData = {};
  if (!global.mockData[modelName]) {
    if (modelName === 'orders') {
      const { MOCK_ORDERS } = await import('@/mocks/orders');
      global.mockData[modelName] = [...MOCK_ORDERS];
    } else {
      global.mockData[modelName] = [];
    }
  }
  return global.mockData[modelName];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string }> }
) {
  const { modelName } = await params;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const skip = (page - 1) * pageSize;

  try {
    if (process.env.NODE_ENV === "development" && modelName === 'orders') {
      const store = await getMockStore(modelName);
      const paginatedData = store.slice(skip, skip + pageSize);
      return NextResponse.json({
        data: paginatedData,
        total: store.length,
        page,
        pageSize
      });
    }

    const table = tables[modelName as keyof typeof tables];

    if (!table) {
      return NextResponse.json({ error: `Model ${modelName} not found` }, { status: 404 });
    }

    const [data, totalCount] = await Promise.all([
      db.select().from(table).limit(pageSize).offset(skip),
      db.select({ count: count() }).from(table)
    ]);

    return NextResponse.json({ data, total: totalCount[0].count, page, pageSize });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string }> }
) {
  const { modelName } = await params;
  const body = await request.json();

  try {
    if (process.env.NODE_ENV === "development" && modelName === 'orders') {
      const store = await getMockStore(modelName);
      const newItem = {
        id: String(Date.now()),
        ...body
      };
      store.unshift(newItem);
      return NextResponse.json(newItem);
    }

    const table = tables[modelName as keyof typeof tables];
    if (!table) {
      return NextResponse.json({ error: `Model ${modelName} not found` }, { status: 404 });
    }

    // Generate ID if missing (MySQL doesn't support .returning() well with Drizzle)
    if (!body.id) {
      body.id = crypto.randomUUID();
    }

    // Ensure createdAt/updatedAt defaults if not present (though DB might handle it, explicitly setting is safer for JSON return)
    const now = new Date();
    if (!body.createdAt) body.createdAt = now;
    if (!body.updatedAt) body.updatedAt = now;

    // @ts-ignore
    await db.insert(table).values(body);

    return NextResponse.json(body);
  } catch (error) {
    console.error("Create Error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
