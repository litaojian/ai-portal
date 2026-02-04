import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

let globalMockStore: Record<string, any[]> = {};

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

declare global {
  var mockData: Record<string, any[]> | undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string; id: string }> }
) {
  const { modelName, id } = await params;

  try {
    if (process.env.NODE_ENV === "development" && modelName === 'orders') {
      const store = await getMockStore(modelName);
      const item = store.find((i: any) => i.id === id);
      if (item) return NextResponse.json(item);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const table = tables[modelName as keyof typeof tables];
    if (!table) {
      return NextResponse.json({ error: `Model ${modelName} not found` }, { status: 404 });
    }

    // @ts-ignore
    const [item] = await db.select().from(table).where(eq(table.id, id)).limit(1);

    if (item) return NextResponse.json(item);
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string; id: string }> }
) {
  const { modelName, id } = await params;
  const body = await request.json();

  try {
    if (process.env.NODE_ENV === "development" && modelName === 'orders') {
      const store = await getMockStore(modelName);
      const index = store.findIndex((i: any) => i.id === id);
      if (index > -1) {
        store[index] = { ...store[index], ...body };
        return NextResponse.json(store[index]);
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const table = tables[modelName as keyof typeof tables];
    if (!table) {
      return NextResponse.json({ error: `Model ${modelName} not found` }, { status: 404 });
    }

    // @ts-ignore
    const [item] = await db.update(table).set(body).where(eq(table.id, id)).returning();
    return NextResponse.json(item);

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string; id: string }> }
) {
  const { modelName, id } = await params;

  try {
    if (process.env.NODE_ENV === "development" && modelName === 'orders') {
      const store = await getMockStore(modelName);
      const index = store.findIndex((i: any) => i.id === id);
      if (index > -1) {
        const deleted = store.splice(index, 1);
        return NextResponse.json(deleted[0]);
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const table = tables[modelName as keyof typeof tables];
    if (!table) {
      return NextResponse.json({ error: `Model ${modelName} not found` }, { status: 404 });
    }

    // @ts-ignore
    await db.delete(table).where(eq(table.id, id));
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
