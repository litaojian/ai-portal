import { NextRequest, NextResponse } from "next/server";
import { getPageConfig } from "@/lib/page-config-loader";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string }> }
) {
  const { modelName } = await params;
  const config = await getPageConfig(modelName);

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  // TODO: Implement actual database query using Drizzle
  // For now, return mock data if configured
  if (process.env.USE_MOCK_DATA === "true") {
    if (modelName === "orders") {
       return NextResponse.json({
        data: [
          { id: "1", orderNo: "ORD-20231001", customerName: "Acme Corp", amount: 1200.50, status: "paid", orderDate: "2023-10-01T10:00:00Z" },
          { id: "2", orderNo: "ORD-20231002", customerName: "Globex", amount: 850.00, status: "pending", orderDate: "2023-10-02T14:30:00Z" },
          { id: "3", orderNo: "ORD-20231005", customerName: "Soylent Corp", amount: 2300.00, status: "shipped", orderDate: "2023-10-05T09:15:00Z" },
        ],
        total: 3,
        page: 1,
        pageSize: 10
      });
    }
  }

  return NextResponse.json({ data: [], total: 0 });
}
