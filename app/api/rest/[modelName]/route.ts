import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Add global declaration here too to be safe (or move to a d.ts)
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
    if (process.env.NODE_ENV === "development") {
      const store = await getMockStore(modelName);
      const paginatedData = store.slice(skip, skip + pageSize);
      return NextResponse.json({
          data: paginatedData,
          total: store.length,
          page,
          pageSize
      });
    }

    const delegateName = getPrismaModelName(modelName);
    // @ts-ignore
    const delegate = prisma[delegateName];
    
    if (!delegate) {
        return NextResponse.json({ error: `Model ${modelName} not found` }, { status: 404 });
    }

    const [data, total] = await Promise.all([
        delegate.findMany({ skip, take: pageSize }),
        delegate.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });

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
    if (process.env.NODE_ENV === "development") {
        const store = await getMockStore(modelName);
        const newItem = {
            id: String(Date.now()), 
            ...body
        };
        store.unshift(newItem); 
        return NextResponse.json(newItem);
    }

    const delegateName = getPrismaModelName(modelName);
    // @ts-ignore
    const delegate = prisma[delegateName];
    const newItem = await delegate.create({ data: body });
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Create Error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
