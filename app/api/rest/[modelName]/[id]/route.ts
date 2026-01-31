import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let globalMockStore: Record<string, any[]> = {};

// Helper to access the shared mock store (simulated)
// In a real app this sharing between files is fragile in serverless/edge, 
// but works for long-running Node dev server usually.
// Re-importing to ensure we get the same reference if possible, 
// though separate route files might have separate contexts in Next.js.
// For robust mock, we might rely on the file import again but it's read-only.
// Let's implement a simple localized read/write for dev demo.
async function getMockStore(modelName: string) {
    // This is a hack for demo persistence across routes in dev
    // In reality, use a real DB (sqlite) even for dev.
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

// Add to global definition to avoid TS error
declare global {
    var mockData: Record<string, any[]> | undefined;
}

function getPrismaModelName(modelName: string) {
    let delegateName = modelName;
    if (modelName.endsWith('s')) {
        delegateName = modelName.slice(0, -1);
    }
    return delegateName;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string; id: string }> }
) {
  const { modelName, id } = await params;

  try {
    if (process.env.NODE_ENV === "development") {
        const store = await getMockStore(modelName);
        const item = store.find((i: any) => i.id === id);
        if (item) return NextResponse.json(item);
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const delegateName = getPrismaModelName(modelName);
    // @ts-ignore
    const delegate = prisma[delegateName];
    const item = await delegate.findUnique({ where: { id } });
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
    if (process.env.NODE_ENV === "development") {
        const store = await getMockStore(modelName);
        const index = store.findIndex((i: any) => i.id === id);
        if (index > -1) {
            store[index] = { ...store[index], ...body };
            return NextResponse.json(store[index]);
        }
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const delegateName = getPrismaModelName(modelName);
    // @ts-ignore
    const delegate = prisma[delegateName];
    const item = await delegate.update({ where: { id }, data: body });
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
    if (process.env.NODE_ENV === "development") {
        const store = await getMockStore(modelName);
        const index = store.findIndex((i: any) => i.id === id);
        if (index > -1) {
            const deleted = store.splice(index, 1);
            return NextResponse.json(deleted[0]);
        }
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const delegateName = getPrismaModelName(modelName);
    // @ts-ignore
    const delegate = prisma[delegateName];
    await delegate.delete({ where: { id } });
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
