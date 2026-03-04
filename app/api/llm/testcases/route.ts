import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const LIBRARY_PATH = path.join(process.cwd(), 'config', 'data', 'testcases', 'library.json');

async function readLibrary(): Promise<any[]> {
    try {
        const content = await fs.promises.readFile(LIBRARY_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

async function writeLibrary(data: any[]): Promise<void> {
    await fs.promises.writeFile(LIBRARY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const model_name = searchParams.get('model_name') ?? '';
    const endpoint_type = searchParams.get('endpoint_type') ?? '';
    const site_name = searchParams.get('site_name') ?? '';
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

    let data = await readLibrary();

    // Filter
    if (model_name) {
        data = data.filter(tc => tc.model_name?.toLowerCase().includes(model_name.toLowerCase()));
    }
    if (endpoint_type) {
        data = data.filter(tc => tc.endpoint_type === endpoint_type);
    }
    if (site_name) {
        data = data.filter(tc => tc.site_name === site_name);
    }

    const total = data.length;

    // Client-side pagination
    const start = (page - 1) * pageSize;
    const paged = data.slice(start, start + pageSize);

    return NextResponse.json({ data: paged, total, page, pageSize });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const library = await readLibrary();

        const newItem = {
            id: `tc_${Date.now()}`,
            title: body.title ?? '',
            model_name: body.model_name ?? '',
            endpoint_type: body.endpoint_type ?? 'chat',
            endpoint_url: body.endpoint_url ?? '',
            site_name: body.site_name ?? '',
            request_body: body.request_body ?? {},
            curl_raw: body.curl_raw ?? '',
            tags: body.tags ?? '',
            created_at: new Date().toISOString(),
        };

        library.unshift(newItem);
        await writeLibrary(library);

        return NextResponse.json(newItem, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Create failed', details: error.message }, { status: 500 });
    }
}
