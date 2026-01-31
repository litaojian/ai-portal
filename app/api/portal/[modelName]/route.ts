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

  return NextResponse.json(config);
}
