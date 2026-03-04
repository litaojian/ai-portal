import { NextRequest, NextResponse } from "next/server";
import { parseCurl } from "@/lib/curl-parser";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const SITES_PATH = path.join(process.cwd(), 'config', 'data', 'valuelist', 'sites.json');

async function readSites(): Promise<any[]> {
    try {
        const content = await fs.promises.readFile(SITES_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

/**
 * POST /api/llm/testcases/parse-curl
 * Parse a cURL command and return extracted fields.
 * Also matches the base URL against known sites.
 */
export async function POST(request: NextRequest) {
    try {
        const { curl_raw } = await request.json();

        if (!curl_raw?.trim()) {
            return NextResponse.json({ error: 'curl_raw is required' }, { status: 400 });
        }

        const parsed = parseCurl(curl_raw);
        const sites = await readSites();

        // Match base_url against sites.json
        let site_name = '';
        let site_matched = false;
        if (parsed.base_url) {
            const matched = sites.find((s: any) => {
                const siteBase = (s.value ?? '').replace(/\/$/, '');
                const parsedBase = parsed.base_url.replace(/\/$/, '');
                return siteBase === parsedBase;
            });
            if (matched) {
                site_name = matched.label;
                site_matched = true;
            }
        }

        return NextResponse.json({
            ...parsed,
            site_name,
            site_matched,
            // Don't include the token in the response for security
            api_token: parsed.api_token ? '***' : '',
            _api_token: parsed.api_token, // frontend can use for pre-fill only
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Parse failed', details: error.message }, { status: 500 });
    }
}
