import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const filePath = path.join(process.cwd(), 'config', 'data', 'valuelist', `${name}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Valuelist '${name}' not found` }, { status: 404 });
    }
    const content = await fs.promises.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[Valuelist] Failed to read ${name}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
