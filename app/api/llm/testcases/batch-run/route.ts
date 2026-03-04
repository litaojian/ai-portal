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

async function runSingle(testcase: any, sites: any[]): Promise<{
    id: string; title: string; success: boolean; status: number; elapsed_ms: number;
    response_data: any; error?: string;
}> {
    const site = sites.find((s: any) => s.label === testcase.site_name);
    if (!site) {
        return { id: testcase.id, title: testcase.title, success: false, status: 0, elapsed_ms: 0, response_data: null, error: `Site '${testcase.site_name}' not found` };
    }

    const baseUrl = (site.value as string).replace(/\/$/, '');
    const apiToken = site.extra?.api_token ?? '';
    if (!apiToken) {
        return { id: testcase.id, title: testcase.title, success: false, status: 0, elapsed_ms: 0, response_data: null, error: 'No API token configured for this site' };
    }

    const endpointPath = testcase.endpoint_url.startsWith('/') ? testcase.endpoint_url : `/${testcase.endpoint_url}`;
    const targetUrl = `${baseUrl}${endpointPath}`;

    try {
        const startTime = Date.now();
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`,
            },
            body: JSON.stringify(testcase.request_body),
        });
        const elapsed_ms = Date.now() - startTime;

        const contentType = response.headers.get('content-type') ?? '';
        const responseData = contentType.includes('application/json')
            ? await response.json()
            : { _text: await response.text() };

        return { id: testcase.id, title: testcase.title, success: response.ok, status: response.status, elapsed_ms, response_data: responseData };
    } catch (e: any) {
        return { id: testcase.id, title: testcase.title, success: false, status: 0, elapsed_ms: 0, response_data: null, error: e.message };
    }
}

/**
 * POST /api/llm/testcases/batch-run
 * Execute multiple test cases concurrently.
 * Body: { ids: string[] }  - list of test case ids to run
 */
export async function POST(request: NextRequest) {
    try {
        const { ids } = await request.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
        }

        const [library, sites] = await Promise.all([readLibrary(), readSites()]);

        const testcases = ids
            .map(id => library.find(tc => tc.id === id))
            .filter(Boolean);

        if (testcases.length === 0) {
            return NextResponse.json({ error: 'No matching test cases found' }, { status: 404 });
        }

        // Run all concurrently
        const results = await Promise.all(testcases.map(tc => runSingle(tc, sites)));

        const succeeded = results.filter(r => r.success).length;
        const failed = results.length - succeeded;

        return NextResponse.json({ total: results.length, succeeded, failed, results });

    } catch (error: any) {
        return NextResponse.json({ error: 'Batch run failed', details: error.message }, { status: 500 });
    }
}
