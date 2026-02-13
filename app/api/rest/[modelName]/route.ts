import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import { count, eq, and, like, SQL, AnyColumn } from "drizzle-orm";

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

    const conditions: SQL[] = [];
    searchParams.forEach((value, key) => {
      if (['page', 'pageSize', 'sort', 'order'].includes(key)) return;
      if (!value) return;

      if (key in table) {
        // Cast to AnyColumn to satisfy Drizzle types
        const column = table[key as keyof typeof table] as unknown as AnyColumn;
        if (column) {
          // Simple heuristic for partial match on name-like fields
          if (['name', 'username', 'title', 'description', 'email'].includes(key)) {
            conditions.push(like(column, `%${value}%`));
          } else {
            conditions.push(eq(column, value));
          }
        }
      }
    });

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalCount] = await Promise.all([
      db.select().from(table).where(whereClause).limit(pageSize).offset(skip),
      db.select({ count: count() }).from(table).where(whereClause)
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

    // Process body values to match schema types (specifically Dates)
    Object.keys(body).forEach(key => {
      // Check if the key exists in the table definition
      if (key in table) {
        // @ts-ignore - Accessing internal column properties can be tricky with types
        const column = table[key];
        // Check if column is a timestamp/date and value is a string
        // Drizzle columns usually have dataType or similar. 
        // For MySqlTimestamp/MySqlDate, we want to convert strings to Dates if the mode is 'date' (which is default for some or explicitly set)
        // A safer check is: if it looks like a date string and the column expects a date.

        // We handle createdAt and updatedAt explicitly below, but for others:
        if (body[key] && typeof body[key] === 'string') {
          // Try to detect if column is date-like. 
          // Note: internal properties like 'dataType' might be available.
          // Simple heuristic: if the column name implies date? No, risky.

          // Inspecting Drizzle column object structure at runtime:
          // It typically has `dataType` property.
          // timestamp -> 'date' or 'string' (driver level). 
          // schema.ts uses `mode: "date"`.

          // Safer approach: explicitly handle known date fields for now + createdAt/updatedAt
          if (['createdAt', 'updatedAt', 'emailVerified', 'expires', 'expiresAt', 'consumedAt'].includes(key)) {
            body[key] = new Date(body[key]);
          }
        }
      }
    });

    // Ensure createdAt/updatedAt defaults if not present
    const now = new Date();
    if (!body.createdAt) {
      body.createdAt = now;
    } else if (typeof body.createdAt === 'string') {
      body.createdAt = new Date(body.createdAt);
    }

    if (!body.updatedAt) {
      body.updatedAt = now;
    } else if (typeof body.updatedAt === 'string') {
      body.updatedAt = new Date(body.updatedAt);
    }

    // @ts-ignore
    await db.insert(table).values(body);

    return NextResponse.json(body);
  } catch (error) {
    console.error("Create Error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
