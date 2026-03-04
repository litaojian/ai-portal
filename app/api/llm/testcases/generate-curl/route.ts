import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const SITES_PATH = path.join(process.cwd(), 'config', 'data', 'valuelist', 'sites.json');

async function readSites(): Promise<{ label: string; value: string; extra?: { api_token?: string } }[]> {
    try {
        const content = await fs.promises.readFile(SITES_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

/**
 * POST /api/llm/testcases/generate-curl
 * Build a cURL command from a test case's stored fields.
 * Body: { site_name, endpoint_url, api_token?, request_body? }
 * Returns: { curl: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { site_name, endpoint_url, api_token, request_body } = await request.json();

        if (!site_name?.trim()) {
            return NextResponse.json({ error: 'site_name is required' }, { status: 400 });
        }

        const sites = await readSites();
        const site = sites.find(s => s.label === site_name);
        const baseUrl = (site?.value ?? site_name).replace(/\/$/, '');

        const epPath = String(endpoint_url ?? '');
        const fullUrl = `${baseUrl}${epPath.startsWith('/') ? epPath : `/${epPath}`}`;

        const token = api_token ?? site?.extra?.api_token ?? '';

        const bodyStr = request_body == null
            ? ''
            : typeof request_body === 'string'
                ? request_body
                : JSON.stringify(request_body, null, 2);

        const parts = [`curl -X POST "${fullUrl}"`, `  -H "Content-Type: application/json"`];
        if (token) parts.push(`  -H "Authorization: Bearer ${token}"`);
        if (bodyStr) parts.push(`  -d '${bodyStr.replace(/'/g, `'\\''`)}'`);

        return NextResponse.json({ curl: parts.join(' \\\n') });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Generate failed', details: msg }, { status: 500 });
    }
}
