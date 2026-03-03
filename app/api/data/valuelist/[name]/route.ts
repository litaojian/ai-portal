import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const filePath = path.join(process.cwd(), 'config', 'data', 'valuelist', `${name}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Valuelist '${name}' not found` }, { status: 404 });
    }
    const content = await fs.promises.readFile(filePath, 'utf8');
    let data = JSON.parse(content);

    // Extract search parameters from the URL
    const { searchParams } = new URL(request.url);

    // Filter the array data if any query parameters exist
    if (Array.isArray(data) && Array.from(searchParams.keys()).length > 0) {
      const filters = Array.from(searchParams.entries()).filter(([k]) => !k.startsWith('_'));

      if (filters.length > 0) {
        data = data.filter((item: any) => {
          return filters.every(([key, val]) => {
            // First try matching top level object property
            if (item[key] !== undefined) {
              return String(item[key]) === val;
            }
            // Fallback: Check if it exists within the 'extra' object
            if (item.extra && item.extra[key] !== undefined) {
              return String(item.extra[key]) === val;
            }
            return false;
          });
        });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`[Valuelist] Failed to read ${name}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
