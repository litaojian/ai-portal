import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const LIBRARY_PATH = path.join(process.cwd(), 'config', 'data', 'testcases', 'library.json');
const SITES_PATH = path.join(process.cwd(), 'config', 'data', 'valuelist', 'sites.json');

async function readLibrary(): Promise<any[]> {
    try {
        const content = await fs.promises.readFile(LIBRARY_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

async function readSites(): Promise<any[]> {
    try {
        const content = await fs.promises.readFile(SITES_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

/**
 * POST /api/llm/testcases/run
 * Execute a single test case.
 * Body: { id, api_token?, request_body? }
 *   - id: test case id from library
 *   - api_token: optional override (if empty, use site's token from sites.json)
 *   - request_body: optional override for the request body
 */
export async function POST(request: NextRequest) {
    try {
        const { id, api_token: tokenOverride, request_body: bodyOverride } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const library = await readLibrary();
        const testcase = library.find(tc => tc.id === id);
        if (!testcase) {
            return NextResponse.json({ error: `Test case '${id}' not found` }, { status: 404 });
        }

        // Resolve site base URL and token
        const sites = await readSites();
        const site = sites.find((s: any) => s.label === testcase.site_name);
        if (!site) {
            return NextResponse.json({ error: `Site '${testcase.site_name}' not found in sites.json` }, { status: 400 });
        }

        const baseUrl = (site.value as string).replace(/\/$/, '');
        const apiToken = tokenOverride || site.extra?.api_token || '';

        if (!apiToken) {
            return NextResponse.json({ error: 'No API token available. Please configure a token for this site.' }, { status: 400 });
        }

        const endpointPath = testcase.endpoint_url.startsWith('/') ? testcase.endpoint_url : `/${testcase.endpoint_url}`;
        const targetUrl = `${baseUrl}${endpointPath}`;

        // Use override body or stored body; parse string if needed
        let payload = bodyOverride ?? testcase.request_body;
        if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch { /* send as-is */ }
        }

        const startTime = Date.now();
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`,
            },
            body: JSON.stringify(payload),
        });

        const elapsed = Date.now() - startTime;
        let responseData: any;
        const contentType = response.headers.get('content-type') ?? '';

        if (contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = { _text: await response.text() };
        }

        return NextResponse.json({
            id,
            success: response.ok,
            status: response.status,
            elapsed_ms: elapsed,
            response_data: responseData,
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Execution failed', details: error.message }, { status: 500 });
    }
}
